"""
Crop Faces For Training
=======================

Standalone script to crop primary faces from a full-frame dataset using
MediaPipe Face Detection and save results with mirrored folder structure.

Default input:
    datasets/processed/merged_final

Default output:
    datasets/processed/merged_final_cropped

Behavior:
- Detect the primary face per image (largest detected face).
- Add 20% padding on all sides and clip to image boundaries.
- Preserve the exact relative folder structure under output root.
- Skip unreadable images and no-face images with warnings.
- Show a single progress bar over all images.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

import cv2
import mediapipe as mp
import numpy as np
from tqdm import tqdm
from mediapipe.python.solutions import face_detection as mp_face_detection


CLASS_NAMES: Tuple[str, ...] = ("ALERT", "DROWSY", "DISTRACTED")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


@dataclass
class CropResult:
    cropped_image: Optional[np.ndarray]
    reason: Optional[str] = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Crop primary faces from merged dataset for CNN training."
    )
    parser.add_argument(
        "--input-dir",
        type=str,
        default="datasets/processed/merged_final",
        help="Input dataset root (default: datasets/processed/merged_final)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="datasets/processed/merged_final_cropped",
        help="Output dataset root (default: datasets/processed/merged_final_cropped)",
    )
    parser.add_argument(
        "--padding-ratio",
        type=float,
        default=0.20,
        help="Padding added to each side of detected face bbox (default: 0.20)",
    )
    parser.add_argument(
        "--min-confidence",
        type=float,
        default=0.50,
        help="Minimum face detection confidence (default: 0.50)",
    )
    return parser.parse_args()


def infer_class_from_path(path: Path, class_names: Sequence[str]) -> Optional[str]:
    class_set = {name.upper() for name in class_names}
    for part in reversed(path.parts):
        upper_part = part.upper()
        if upper_part in class_set:
            return upper_part
    return None


def discover_images(input_dir: Path, class_names: Sequence[str]) -> List[Path]:
    images: List[Path] = []
    for path in input_dir.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        if infer_class_from_path(path, class_names) is None:
            continue
        images.append(path)
    images.sort()
    return images


def select_primary_detection(
    detections: Sequence[Any],
) -> Optional[Any]:
    best_detection = None
    best_metric = -1.0

    for detection in detections:
        rel_bbox = detection.location_data.relative_bounding_box
        width = max(0.0, float(rel_bbox.width))
        height = max(0.0, float(rel_bbox.height))
        area = width * height
        score = float(detection.score[0]) if detection.score else 0.0

        # Prioritize largest face, then confidence as tiny tie-breaker.
        metric = area + (score * 1e-6)

        if metric > best_metric:
            best_metric = metric
            best_detection = detection

    return best_detection


def compute_padded_bbox(
    rel_bbox: Any,
    image_width: int,
    image_height: int,
    padding_ratio: float,
) -> Optional[Tuple[int, int, int, int]]:
    x = rel_bbox.xmin * image_width
    y = rel_bbox.ymin * image_height
    w = rel_bbox.width * image_width
    h = rel_bbox.height * image_height

    if w <= 0 or h <= 0:
        return None

    pad_x = w * padding_ratio
    pad_y = h * padding_ratio

    x1 = int(np.floor(x - pad_x))
    y1 = int(np.floor(y - pad_y))
    x2 = int(np.ceil(x + w + pad_x))
    y2 = int(np.ceil(y + h + pad_y))

    x1 = max(0, min(image_width, x1))
    y1 = max(0, min(image_height, y1))
    x2 = max(0, min(image_width, x2))
    y2 = max(0, min(image_height, y2))

    if x2 <= x1 or y2 <= y1:
        return None

    return x1, y1, x2, y2


def crop_primary_face(
    image_bgr: np.ndarray,
    detector: Any,
    padding_ratio: float,
) -> CropResult:
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    results = detector.process(rgb)

    if not results.detections:
        return CropResult(cropped_image=None, reason="no-face")

    primary = select_primary_detection(results.detections)
    if primary is None:
        return CropResult(cropped_image=None, reason="no-face")

    h, w = image_bgr.shape[:2]
    bbox = compute_padded_bbox(
        rel_bbox=primary.location_data.relative_bounding_box,
        image_width=w,
        image_height=h,
        padding_ratio=padding_ratio,
    )

    if bbox is None:
        return CropResult(cropped_image=None, reason="invalid-bbox")

    x1, y1, x2, y2 = bbox
    cropped = image_bgr[y1:y2, x1:x2]

    if cropped.size == 0:
        return CropResult(cropped_image=None, reason="empty-crop")

    return CropResult(cropped_image=cropped, reason=None)


def init_stats() -> Dict[str, Any]:
    per_class = {
        class_name: {
            "processed": 0,
            "saved": 0,
            "skipped_no_face": 0,
            "skipped_unreadable": 0,
            "skipped_invalid_crop": 0,
            "skipped_write_error": 0,
        }
        for class_name in CLASS_NAMES
    }

    return {
        "processed": 0,
        "saved": 0,
        "skipped_no_face": 0,
        "skipped_unreadable": 0,
        "skipped_invalid_crop": 0,
        "skipped_write_error": 0,
        "per_class": per_class,
    }


def process_dataset(
    input_dir: Path,
    output_dir: Path,
    padding_ratio: float,
    min_confidence: float,
) -> Dict[str, Any]:
    image_paths = discover_images(input_dir=input_dir, class_names=CLASS_NAMES)
    stats = init_stats()
    stats["images_found"] = len(image_paths)

    if not image_paths:
        print(f"Warning: no images found under {input_dir}")
        return stats

    with mp_face_detection.FaceDetection(
        model_selection=0,
        min_detection_confidence=min_confidence,
    ) as detector:
        for image_path in tqdm(image_paths, desc="Cropping faces", unit="img"):
            class_name = infer_class_from_path(image_path, CLASS_NAMES)
            if class_name is None:
                # Should not happen due to filtering, but keep this guard.
                continue

            class_stats = stats["per_class"][class_name]
            stats["processed"] += 1
            class_stats["processed"] += 1

            image = cv2.imread(str(image_path))
            if image is None:
                print(f"Warning: unreadable image, skipping: {image_path}")
                stats["skipped_unreadable"] += 1
                class_stats["skipped_unreadable"] += 1
                continue

            crop_result = crop_primary_face(
                image_bgr=image,
                detector=detector,
                padding_ratio=padding_ratio,
            )

            if crop_result.cropped_image is None:
                reason = crop_result.reason or "unknown"
                if reason == "no-face":
                    stats["skipped_no_face"] += 1
                    class_stats["skipped_no_face"] += 1
                else:
                    stats["skipped_invalid_crop"] += 1
                    class_stats["skipped_invalid_crop"] += 1

                print(
                    f"Warning: no valid face crop ({reason}), skipping: {image_path}"
                )
                continue

            output_path = output_dir / image_path.relative_to(input_dir)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            write_ok = cv2.imwrite(str(output_path), crop_result.cropped_image)
            if not write_ok:
                print(f"Warning: failed to write cropped image: {output_path}")
                stats["skipped_write_error"] += 1
                class_stats["skipped_write_error"] += 1
                continue

            stats["saved"] += 1
            class_stats["saved"] += 1

    return stats


def save_metadata(
    output_dir: Path,
    input_dir: Path,
    padding_ratio: float,
    min_confidence: float,
    stats: Dict[str, Any],
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    metadata_path = output_dir / "crop_metadata.json"

    processed = int(stats.get("processed", 0))
    saved = int(stats.get("saved", 0))
    save_rate = (saved / processed * 100.0) if processed > 0 else 0.0

    metadata = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "input_dir": str(input_dir),
        "output_dir": str(output_dir),
        "class_names": list(CLASS_NAMES),
        "padding_ratio": padding_ratio,
        "min_confidence": min_confidence,
        "save_rate_percent": round(save_rate, 4),
        "stats": stats,
    }

    with metadata_path.open("w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return metadata_path


def print_summary(stats: Dict[str, Any], metadata_path: Path, output_dir: Path) -> None:
    processed = int(stats.get("processed", 0))
    saved = int(stats.get("saved", 0))
    no_face = int(stats.get("skipped_no_face", 0))
    unreadable = int(stats.get("skipped_unreadable", 0))
    invalid_crop = int(stats.get("skipped_invalid_crop", 0))
    write_error = int(stats.get("skipped_write_error", 0))
    save_rate = (saved / processed * 100.0) if processed > 0 else 0.0

    print("\n" + "=" * 72)
    print("FACE CROPPING COMPLETE")
    print("=" * 72)
    print(f"Processed images:      {processed:,}")
    print(f"Saved crops:           {saved:,}")
    print(f"Skipped (no face):     {no_face:,}")
    print(f"Skipped (unreadable):  {unreadable:,}")
    print(f"Skipped (invalid box): {invalid_crop:,}")
    print(f"Skipped (write error): {write_error:,}")
    print(f"Save rate:             {save_rate:.2f}%")
    print(f"Output directory:      {output_dir}")
    print(f"Metadata:              {metadata_path}")


def main() -> int:
    args = parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)

    if not input_dir.exists():
        print(f"Error: input directory does not exist: {input_dir}")
        return 1

    if args.padding_ratio < 0:
        print("Error: --padding-ratio must be >= 0")
        return 1

    if not (0.0 <= args.min_confidence <= 1.0):
        print("Error: --min-confidence must be between 0 and 1")
        return 1

    print("=" * 72)
    print("CROP FACES FOR TRAINING")
    print("=" * 72)
    print(f"Input directory:       {input_dir}")
    print(f"Output directory:      {output_dir}")
    print(f"Padding ratio:         {args.padding_ratio}")
    print(f"Min confidence:        {args.min_confidence}")
    print(f"Target classes:        {', '.join(CLASS_NAMES)}")

    stats = process_dataset(
        input_dir=input_dir,
        output_dir=output_dir,
        padding_ratio=args.padding_ratio,
        min_confidence=args.min_confidence,
    )

    metadata_path = save_metadata(
        output_dir=output_dir,
        input_dir=input_dir,
        padding_ratio=args.padding_ratio,
        min_confidence=args.min_confidence,
        stats=stats,
    )

    print_summary(stats=stats, metadata_path=metadata_path, output_dir=output_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
