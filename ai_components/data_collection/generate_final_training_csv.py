"""
Generate Final Training Features CSV
====================================

Creates a definitive training_features.csv for the hybrid fusion model by
extracting geometric features from the cropped dataset and enforcing strict
image-to-row parity. Any image that fails feature extraction is deleted.

Output schema:
    image_path, class_label, split, EAR, MAR, pitch, yaw, roll,
    PERCLOS, pitch_velocity, yaw_velocity
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

import cv2
import mediapipe as mp
import numpy as np
from scipy.spatial import distance
from tqdm import tqdm

try:
    from ai_components.utils.constants import EAR_THRESHOLD, PERCLOS_WINDOW_SECONDS
except ImportError:
    EAR_THRESHOLD = 0.25
    PERCLOS_WINDOW_SECONDS = 60


CLASS_MAPPING = {"ALERT": 0, "DISTRACTED": 1, "DROWSY": 2}
CLASS_NAMES = tuple(CLASS_MAPPING.keys())
SPLIT_NAMES = ("train", "val", "test")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# MediaPipe landmark indices (same as feature_extractor.py)
LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
MOUTH_INDICES = [61, 39, 0, 269, 291, 405, 17, 181, 84, 314, 78, 308]

# Key landmarks for head pose (same as feature_extractor.py)
NOSE_TIP = 1
CHIN = 152
LEFT_EYE_CORNER = 33
RIGHT_EYE_CORNER = 263
LEFT_MOUTH = 61
RIGHT_MOUTH = 291


@dataclass
class ImageRecord:
    image_path: Path
    split: str
    class_name: str
    class_label: int
    ear: float
    mar: float
    pitch: float
    yaw: float
    roll: float
    seq_key: str
    seq_index: int
    perclos: float = 0.0
    pitch_velocity: float = 0.0
    yaw_velocity: float = 0.0
    perclos_fallback: bool = False


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate definitive training_features.csv with strict parity."
    )
    parser.add_argument(
        "--input-dir",
        type=str,
        default="datasets/processed/merged_final_cropped",
        help="Input cropped dataset root",
    )
    parser.add_argument(
        "--output-csv",
        type=str,
        default="datasets/processed/merged_final_cropped/training_features.csv",
        help="Output CSV path",
    )
    parser.add_argument(
        "--deletion-log",
        type=str,
        default="datasets/processed/merged_final_cropped/deletion_log.json",
        help="Deletion log JSON path",
    )
    parser.add_argument(
        "--parity-report",
        type=str,
        default="datasets/processed/merged_final_cropped/parity_report.json",
        help="Parity report JSON path",
    )
    parser.add_argument(
        "--ear-threshold",
        type=float,
        default=EAR_THRESHOLD,
        help="EAR threshold for PERCLOS closure",
    )
    parser.add_argument(
        "--perclos-window",
        type=int,
        default=30,
        help="PERCLOS rolling window size in frames",
    )
    parser.add_argument(
        "--assumed-fps",
        type=float,
        default=5.0,
        help="Assumed FPS for velocity calculation (deg/sec)",
    )
    parser.add_argument(
        "--min-detection-confidence",
        type=float,
        default=0.5,
        help="FaceMesh minimum detection confidence",
    )
    parser.add_argument(
        "--min-tracking-confidence",
        type=float,
        default=0.5,
        help="FaceMesh minimum tracking confidence",
    )
    return parser.parse_args()


def infer_split(path: Path) -> Optional[str]:
    for part in path.parts:
        lower = part.lower()
        if lower in SPLIT_NAMES:
            return lower
    return None


def infer_class(path: Path) -> Optional[str]:
    for part in reversed(path.parts):
        upper = part.upper()
        if upper in CLASS_MAPPING:
            return upper
    return None


def discover_images(input_dir: Path) -> List[Path]:
    images: List[Path] = []
    for path in input_dir.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        if infer_class(path) is None:
            continue
        if infer_split(path) is None:
            continue
        images.append(path)
    images.sort()
    return images


def normalize_image_path(path: Path, root_dir: Path) -> str:
    try:
        rel = path.relative_to(root_dir)
        return rel.as_posix()
    except ValueError:
        return path.as_posix()


def parse_sequence_key(path: Path) -> Tuple[str, int]:
    stem = path.stem
    match = re.match(r"^(.*?)(?:[_-]?(\d+))$", stem)
    if match:
        prefix = match.group(1) or stem
        index = int(match.group(2))
        return prefix, index
    return stem, 0


def calculate_ear(eye_landmarks: np.ndarray) -> Optional[float]:
    a = distance.euclidean(eye_landmarks[1], eye_landmarks[5])
    b = distance.euclidean(eye_landmarks[2], eye_landmarks[4])
    c = distance.euclidean(eye_landmarks[0], eye_landmarks[3])
    if c == 0:
        return None
    return float((a + b) / (2.0 * c))


def calculate_mar(mouth_landmarks: np.ndarray) -> Optional[float]:
    a = distance.euclidean(mouth_landmarks[2], mouth_landmarks[10])
    b = distance.euclidean(mouth_landmarks[4], mouth_landmarks[8])
    c = distance.euclidean(mouth_landmarks[3], mouth_landmarks[9])
    d = distance.euclidean(mouth_landmarks[0], mouth_landmarks[6])
    if d == 0:
        return None
    return float((a + b + c) / (3.0 * d))


def calculate_head_pose(landmarks: np.ndarray, image_shape: Tuple[int, int, int]) -> Optional[Tuple[float, float, float]]:
    h, w = image_shape[:2]

    model_points = np.array(
        [
            (0.0, 0.0, 0.0),
            (0.0, -330.0, -65.0),
            (-225.0, 170.0, -135.0),
            (225.0, 170.0, -135.0),
            (-150.0, -150.0, -125.0),
            (150.0, -150.0, -125.0),
        ],
        dtype=np.float64,
    )

    image_points = np.array(
        [
            (landmarks[NOSE_TIP][0], landmarks[NOSE_TIP][1]),
            (landmarks[CHIN][0], landmarks[CHIN][1]),
            (landmarks[LEFT_EYE_CORNER][0], landmarks[LEFT_EYE_CORNER][1]),
            (landmarks[RIGHT_EYE_CORNER][0], landmarks[RIGHT_EYE_CORNER][1]),
            (landmarks[LEFT_MOUTH][0], landmarks[LEFT_MOUTH][1]),
            (landmarks[RIGHT_MOUTH][0], landmarks[RIGHT_MOUTH][1]),
        ],
        dtype=np.float64,
    )

    focal_length = w
    center = (w / 2, h / 2)
    camera_matrix = np.array(
        [
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1],
        ],
        dtype=np.float64,
    )

    dist_coeffs = np.zeros((4, 1))

    success, rotation_vector, translation_vector = cv2.solvePnP(
        model_points,
        image_points,
        camera_matrix,
        dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE,
    )

    if not success:
        return None

    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    pose_mat = cv2.hconcat((rotation_matrix, translation_vector))
    _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_mat)

    pitch = float(euler_angles[0][0])
    yaw = float(euler_angles[1][0])
    roll = float(euler_angles[2][0])

    if not all(np.isfinite([pitch, yaw, roll])):
        return None

    return pitch, yaw, roll


def extract_features(
    image_path: Path,
    face_mesh: mp.solutions.face_mesh.FaceMesh,
) -> Optional[Tuple[float, float, float, float, float]]:
    image = cv2.imread(str(image_path))
    if image is None:
        return None

    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_image)

    if not results.multi_face_landmarks:
        return None

    h, w = image.shape[:2]
    face_landmarks = results.multi_face_landmarks[0]
    landmarks = np.array(
        [[lm.x * w, lm.y * h, lm.z * w] for lm in face_landmarks.landmark]
    )

    left_eye = landmarks[LEFT_EYE_INDICES]
    right_eye = landmarks[RIGHT_EYE_INDICES]
    ear_left = calculate_ear(left_eye)
    ear_right = calculate_ear(right_eye)

    if ear_left is None or ear_right is None:
        return None

    ear = float((ear_left + ear_right) / 2.0)

    mouth = landmarks[MOUTH_INDICES]
    mar = calculate_mar(mouth)
    if mar is None:
        return None

    pose = calculate_head_pose(landmarks, image.shape)
    if pose is None:
        return None

    pitch, yaw, roll = pose
    return ear, mar, pitch, yaw, roll


def delete_image(path: Path, deletion_log: Dict[str, Any], reason: str) -> None:
    try:
        path.unlink()
    except Exception as exc:
        reason = f"delete_failed:{reason}:{type(exc).__name__}"

    deletion_log["total_deleted"] += 1
    deletion_log["deleted_by_reason"][reason] = deletion_log["deleted_by_reason"].get(reason, 0) + 1
    deletion_log["deleted_files"].append(
        {
            "path": path.as_posix(),
            "reason": reason,
            "timestamp": datetime.now().isoformat(timespec="seconds"),
        }
    )


def init_deletion_log() -> Dict[str, Any]:
    return {"total_deleted": 0, "deleted_by_reason": {}, "deleted_files": []}


def compute_temporal_features(
    records: List[ImageRecord],
    ear_threshold: float,
    perclos_window: int,
    assumed_fps: float,
) -> Dict[str, int]:
    perclos_fallback_count = 0
    velocity_zero_count = 0

    grouped: Dict[str, List[ImageRecord]] = {}
    for rec in records:
        grouped.setdefault(rec.seq_key, []).append(rec)

    for seq_key, seq_records in grouped.items():
        seq_records.sort(key=lambda r: r.seq_index)

        if len(seq_records) < 2:
            for rec in seq_records:
                rec.perclos = 1.0 if rec.ear < ear_threshold else 0.0
                rec.perclos_fallback = True
                rec.pitch_velocity = 0.0
                rec.yaw_velocity = 0.0
                perclos_fallback_count += 1
                velocity_zero_count += 1
            continue

        ear_closed = [1 if r.ear < ear_threshold else 0 for r in seq_records]
        for idx, rec in enumerate(seq_records):
            window_start = max(0, idx - perclos_window + 1)
            window_slice = ear_closed[window_start : idx + 1]
            rec.perclos = float(sum(window_slice) / len(window_slice))

            if idx == 0:
                rec.pitch_velocity = 0.0
                rec.yaw_velocity = 0.0
                velocity_zero_count += 1
            else:
                prev = seq_records[idx - 1]
                rec.pitch_velocity = (rec.pitch - prev.pitch) * assumed_fps
                rec.yaw_velocity = (rec.yaw - prev.yaw) * assumed_fps

    return {
        "perclos_fallback_count": perclos_fallback_count,
        "velocity_zero_count": velocity_zero_count,
    }


def count_images(input_dir: Path) -> int:
    total = 0
    for ext in IMAGE_EXTENSIONS:
        total += len(list(input_dir.rglob(f"*{ext}")))
    return total


def write_csv(output_csv: Path, records: List[ImageRecord], root_dir: Path) -> None:
    output_csv.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "image_path",
        "class_label",
        "split",
        "EAR",
        "MAR",
        "pitch",
        "yaw",
        "roll",
        "PERCLOS",
        "pitch_velocity",
        "yaw_velocity",
    ]

    with output_csv.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for rec in records:
            writer.writerow(
                {
                    "image_path": normalize_image_path(rec.image_path, root_dir),
                    "class_label": rec.class_label,
                    "split": rec.split,
                    "EAR": rec.ear,
                    "MAR": rec.mar,
                    "pitch": rec.pitch,
                    "yaw": rec.yaw,
                    "roll": rec.roll,
                    "PERCLOS": rec.perclos,
                    "pitch_velocity": rec.pitch_velocity,
                    "yaw_velocity": rec.yaw_velocity,
                }
            )


def main() -> int:
    args = parse_args()

    input_dir = Path(args.input_dir)
    output_csv = Path(args.output_csv)
    deletion_log_path = Path(args.deletion_log)
    parity_report_path = Path(args.parity_report)

    if not input_dir.exists():
        print(f"Error: input directory does not exist: {input_dir}")
        return 1

    if args.perclos_window <= 0:
        print("Error: --perclos-window must be positive")
        return 1

    if args.assumed_fps <= 0:
        print("Error: --assumed-fps must be positive")
        return 1

    print("=" * 72)
    print("GENERATE FINAL TRAINING FEATURES CSV")
    print("=" * 72)
    print(f"Input directory:       {input_dir}")
    print(f"Output CSV:            {output_csv}")
    print(f"Deletion log:          {deletion_log_path}")
    print(f"Parity report:         {parity_report_path}")
    print(f"EAR threshold:         {args.ear_threshold}")
    print(f"PERCLOS window (frames): {args.perclos_window}")
    print(f"Assumed FPS:           {args.assumed_fps}")
    print(f"Class mapping:         {CLASS_MAPPING}")

    images = discover_images(input_dir)
    deletion_log = init_deletion_log()
    records: List[ImageRecord] = []

    with mp.solutions.face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=args.min_detection_confidence,
        min_tracking_confidence=args.min_tracking_confidence,
    ) as face_mesh:
        for image_path in tqdm(images, desc="Extracting features", unit="img"):
            split = infer_split(image_path)
            class_name = infer_class(image_path)

            if split is None or class_name is None:
                delete_image(image_path, deletion_log, "missing_split_or_class")
                print(f"Warning: missing split/class, deleted: {image_path}")
                continue

            features = extract_features(image_path, face_mesh)
            if features is None:
                delete_image(image_path, deletion_log, "feature_extraction_failed")
                print(f"Warning: feature extraction failed, deleted: {image_path}")
                continue

            ear, mar, pitch, yaw, roll = features

            seq_prefix, seq_index = parse_sequence_key(image_path)
            seq_key = f"{split}|{class_name}|{seq_prefix}"

            records.append(
                ImageRecord(
                    image_path=image_path,
                    split=split,
                    class_name=class_name,
                    class_label=CLASS_MAPPING[class_name],
                    ear=ear,
                    mar=mar,
                    pitch=pitch,
                    yaw=yaw,
                    roll=roll,
                    seq_key=seq_key,
                    seq_index=seq_index,
                )
            )

    temporal_stats = compute_temporal_features(
        records=records,
        ear_threshold=args.ear_threshold,
        perclos_window=args.perclos_window,
        assumed_fps=args.assumed_fps,
    )

    write_csv(output_csv, records, input_dir)

    remaining_images = count_images(input_dir)
    csv_rows = len(records)
    parity_ok = remaining_images == csv_rows

    if not parity_ok:
        print(
            f"Error: parity mismatch - remaining images: {remaining_images}, csv rows: {csv_rows}"
        )

    for rec in records:
        if not rec.image_path.exists():
            print(f"Error: CSV path does not exist on disk: {rec.image_path}")
            parity_ok = False
            break

    deletion_log_path.parent.mkdir(parents=True, exist_ok=True)
    with deletion_log_path.open("w", encoding="utf-8") as f:
        json.dump(deletion_log, f, indent=2)

    parity_report = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "input_dir": str(input_dir),
        "output_csv": str(output_csv),
        "images_before": len(images),
        "images_deleted": deletion_log["total_deleted"],
        "images_remaining": remaining_images,
        "csv_rows": csv_rows,
        "parity_ok": parity_ok,
        "perclos_fallback_count": temporal_stats["perclos_fallback_count"],
        "velocity_zero_count": temporal_stats["velocity_zero_count"],
    }

    parity_report_path.parent.mkdir(parents=True, exist_ok=True)
    with parity_report_path.open("w", encoding="utf-8") as f:
        json.dump(parity_report, f, indent=2)

    print("\n" + "=" * 72)
    print("FINAL TRAINING CSV COMPLETE")
    print("=" * 72)
    print(f"Images before:         {len(images):,}")
    print(f"Images deleted:        {deletion_log['total_deleted']:,}")
    print(f"Images remaining:      {remaining_images:,}")
    print(f"CSV rows:              {csv_rows:,}")
    print(f"Parity ok:             {parity_ok}")
    print(f"Output CSV:            {output_csv}")
    print(f"Deletion log:          {deletion_log_path}")
    print(f"Parity report:         {parity_report_path}")

    return 0 if parity_ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
