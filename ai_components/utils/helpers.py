"""
Helper Functions
================
Utility functions for common operations.
"""

import os
import json
import logging
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional, Union
from datetime import datetime
import cv2


def setup_logging(
    log_level: str = "INFO",
    log_file: Optional[str] = None,
    log_format: str = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
) -> logging.Logger:
    """
    Setup logging configuration.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional path to log file
        log_format: Log message format
        
    Returns:
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger('vigilant_driver')
    # Handle case where log_level is actually a module name (like __main__)
    if hasattr(logging, log_level.upper()) and not log_level.startswith('__'):
        logger.setLevel(getattr(logging, log_level.upper()))
    else:
        logger.setLevel(logging.INFO)
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Create formatter
    formatter = logging.Formatter(log_format)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        ensure_dir(os.path.dirname(log_file))
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


def ensure_dir(directory: Union[str, Path]) -> Path:
    """
    Ensure directory exists, create if it doesn't.
    
    Args:
        directory: Directory path
        
    Returns:
        Path object
    """
    path = Path(directory)
    path.mkdir(parents=True, exist_ok=True)
    return path


def load_json(file_path: Union[str, Path]) -> Dict[str, Any]:
    """
    Load JSON file.
    
    Args:
        file_path: Path to JSON file
        
    Returns:
        Dictionary containing JSON data
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(data: Dict[str, Any], file_path: Union[str, Path], indent: int = 2):
    """
    Save data to JSON file.
    
    Args:
        data: Dictionary to save
        file_path: Output file path
        indent: JSON indentation level
    """
    ensure_dir(os.path.dirname(file_path))
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)


def calculate_distance(point1: np.ndarray, point2: np.ndarray) -> float:
    """
    Calculate Euclidean distance between two points.
    
    Args:
        point1: First point (x, y) or (x, y, z)
        point2: Second point (x, y) or (x, y, z)
        
    Returns:
        Euclidean distance
    """
    return float(np.linalg.norm(point1 - point2))


def calculate_angle(
    point1: np.ndarray,
    point2: np.ndarray,
    point3: np.ndarray
) -> float:
    """
    Calculate angle formed by three points (in degrees).
    
    Args:
        point1: First point
        point2: Vertex point
        point3: Third point
        
    Returns:
        Angle in degrees
    """
    vector1 = point1 - point2
    vector2 = point3 - point2
    
    cos_angle = np.dot(vector1, vector2) / (
        np.linalg.norm(vector1) * np.linalg.norm(vector2) + 1e-6
    )
    cos_angle = np.clip(cos_angle, -1.0, 1.0)
    angle = np.arccos(cos_angle)
    
    return float(np.degrees(angle))


def calculate_ear(eye_landmarks: np.ndarray) -> float:
    """
    Calculate Eye Aspect Ratio (EAR).
    
    Formula: EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    
    Args:
        eye_landmarks: Array of 6 eye landmarks [outer, inner, top1, top2, bottom1, bottom2]
        
    Returns:
        Eye Aspect Ratio value
    """
    # Vertical distances
    vertical1 = calculate_distance(eye_landmarks[2], eye_landmarks[4])
    vertical2 = calculate_distance(eye_landmarks[3], eye_landmarks[5])
    
    # Horizontal distance
    horizontal = calculate_distance(eye_landmarks[0], eye_landmarks[1])
    
    # EAR calculation
    ear = (vertical1 + vertical2) / (2.0 * horizontal + 1e-6)
    
    return float(ear)


def calculate_mar(mouth_landmarks: np.ndarray) -> float:
    """
    Calculate Mouth Aspect Ratio (MAR).
    
    Formula: MAR = ||p2-p8|| / ||p1-p5||
    
    Args:
        mouth_landmarks: Array of mouth landmarks
        
    Returns:
        Mouth Aspect Ratio value
    """
    # Vertical distance (top to bottom)
    vertical = calculate_distance(mouth_landmarks[0], mouth_landmarks[1])
    
    # Horizontal distance (left to right)
    horizontal = calculate_distance(mouth_landmarks[2], mouth_landmarks[3])
    
    # MAR calculation
    mar = vertical / (horizontal + 1e-6)
    
    return float(mar)


def resize_image(
    image: np.ndarray,
    target_size: Tuple[int, int],
    maintain_aspect: bool = True
) -> np.ndarray:
    """
    Resize image to target size.
    
    Args:
        image: Input image
        target_size: Target (width, height)
        maintain_aspect: Whether to maintain aspect ratio
        
    Returns:
        Resized image
    """
    if maintain_aspect:
        h, w = image.shape[:2]
        target_w, target_h = target_size
        
        # Calculate scaling factor
        scale = min(target_w / w, target_h / h)
        new_w, new_h = int(w * scale), int(h * scale)
        
        # Resize
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        # Create canvas and center image
        canvas = np.zeros((target_h, target_w, 3), dtype=np.uint8)
        y_offset = (target_h - new_h) // 2
        x_offset = (target_w - new_w) // 2
        canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized
        
        return canvas
    else:
        return cv2.resize(image, target_size, interpolation=cv2.INTER_AREA)


def normalize_landmarks(
    landmarks: np.ndarray,
    image_shape: Tuple[int, int]
) -> np.ndarray:
    """
    Normalize landmarks to [0, 1] range.
    
    Args:
        landmarks: Landmarks array (N, 2) or (N, 3)
        image_shape: Image (height, width)
        
    Returns:
        Normalized landmarks
    """
    h, w = image_shape[:2]
    normalized = landmarks.copy()
    normalized[:, 0] /= w
    normalized[:, 1] /= h
    
    return normalized


def denormalize_landmarks(
    landmarks: np.ndarray,
    image_shape: Tuple[int, int]
) -> np.ndarray:
    """
    Denormalize landmarks from [0, 1] to pixel coordinates.
    
    Args:
        landmarks: Normalized landmarks array (N, 2) or (N, 3)
        image_shape: Image (height, width)
        
    Returns:
        Denormalized landmarks
    """
    h, w = image_shape[:2]
    denormalized = landmarks.copy()
    denormalized[:, 0] *= w
    denormalized[:, 1] *= h
    
    return denormalized


def get_timestamp() -> str:
    """
    Get current timestamp string.
    
    Returns:
        Timestamp in format YYYY-MM-DD_HH-MM-SS
    """
    return datetime.now().strftime("%Y-%m-%d_%H-%M-%S")


def split_data(
    data: List[Any],
    train_split: float = 0.7,
    val_split: float = 0.15,
    test_split: float = 0.15,
    shuffle: bool = True,
    random_seed: int = 42
) -> Tuple[List[Any], List[Any], List[Any]]:
    """
    Split data into train, validation, and test sets.
    
    Args:
        data: List of data items
        train_split: Training set proportion
        val_split: Validation set proportion
        test_split: Test set proportion
        shuffle: Whether to shuffle data before splitting
        random_seed: Random seed for reproducibility
        
    Returns:
        Tuple of (train_data, val_data, test_data)
    """
    assert abs(train_split + val_split + test_split - 1.0) < 1e-6, \
        "Splits must sum to 1.0"
    
    data_copy = data.copy()
    
    if shuffle:
        np.random.seed(random_seed)
        np.random.shuffle(data_copy)
    
    n = len(data_copy)
    train_end = int(n * train_split)
    val_end = train_end + int(n * val_split)
    
    train_data = data_copy[:train_end]
    val_data = data_copy[train_end:val_end]
    test_data = data_copy[val_end:]
    
    return train_data, val_data, test_data


def count_files_by_extension(
    directory: Union[str, Path],
    extensions: Optional[List[str]] = None
) -> Dict[str, int]:
    """
    Count files by extension in directory.
    
    Args:
        directory: Directory to search
        extensions: List of extensions to count (e.g., ['.jpg', '.png'])
        
    Returns:
        Dictionary of extension: count
    """
    directory = Path(directory)
    counts = {}
    
    if extensions:
        for ext in extensions:
            count = len(list(directory.rglob(f'*{ext}')))
            counts[ext] = count
    else:
        for file_path in directory.rglob('*'):
            if file_path.is_file():
                ext = file_path.suffix.lower()
                counts[ext] = counts.get(ext, 0) + 1
    
    return counts


def get_video_info(video_path: Union[str, Path]) -> Dict[str, Any]:
    """
    Get video file information.
    
    Args:
        video_path: Path to video file
        
    Returns:
        Dictionary with video information
    """
    cap = cv2.VideoCapture(str(video_path))
    
    info = {
        'frame_count': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
        'fps': cap.get(cv2.CAP_PROP_FPS),
        'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        'duration': 0.0
    }
    
    if info['fps'] > 0:
        info['duration'] = info['frame_count'] / info['fps']
    
    cap.release()
    
    return info


def create_class_weight(class_counts: Dict[str, int]) -> Dict[str, float]:
    """
    Calculate class weights for imbalanced datasets.
    
    Args:
        class_counts: Dictionary of class: count
        
    Returns:
        Dictionary of class: weight
    """
    total = sum(class_counts.values())
    n_classes = len(class_counts)
    
    weights = {}
    for class_name, count in class_counts.items():
        weights[class_name] = total / (n_classes * count)
    
    return weights


def format_duration(seconds: float) -> str:
    """
    Format duration in seconds to human-readable string.
    
    Args:
        seconds: Duration in seconds
        
    Returns:
        Formatted string (e.g., "2h 30m 15s")
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    parts = []
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    if secs > 0 or not parts:
        parts.append(f"{secs}s")
    
    return " ".join(parts)
