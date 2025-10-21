"""
Constants and Enumerations
===========================
Constant values used throughout the AI components.
"""

from enum import Enum
from typing import List, Tuple


class DriverState(Enum):
    """Driver state classifications."""
    ALERT = "alert"
    DROWSY = "drowsy"
    DISTRACTED = "distracted"
    UNKNOWN = "unknown"
    
    @classmethod
    def from_string(cls, state: str) -> 'DriverState':
        """Convert string to DriverState enum."""
        state_lower = state.lower()
        for member in cls:
            if member.value == state_lower:
                return member
        return cls.UNKNOWN
    
    @classmethod
    def get_all_states(cls) -> List[str]:
        """Get all valid driver states (excluding UNKNOWN)."""
        return [state.value for state in cls if state != cls.UNKNOWN]


class OcclusionType(Enum):
    """Types of occlusions that can be detected."""
    NONE = "none"
    SUNGLASSES = "sunglasses"
    GLASSES = "glasses"
    HAND_ON_FACE = "hand_on_face"
    SHAWL = "shawl"
    MASK = "mask"
    HAIR = "hair"
    OTHER = "other"


class DatasetType(Enum):
    """Dataset sources."""
    DMD = "dmd"  # Vicomtech DMD
    STATE_FARM = "state_farm"
    CUSTOM = "custom"
    MERGED = "merged"


# MediaPipe Face Mesh Landmarks
# Total 468 landmarks in MediaPipe Face Mesh
MEDIAPIPE_LANDMARKS = {
    'face_oval': [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
        397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
        172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
    ],
    'lips': [
        61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291,
        185, 40, 39, 37, 0, 267, 269, 270, 409,
        78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
        191, 80, 81, 82, 13, 312, 311, 310, 415
    ],
    'left_eye': [
        33, 7, 163, 144, 145, 153, 154, 155, 133,
        246, 161, 160, 159, 158, 157, 173
    ],
    'right_eye': [
        362, 382, 381, 380, 374, 373, 390, 249,
        263, 466, 388, 387, 386, 385, 384, 398
    ],
    'left_iris': [469, 470, 471, 472],
    'right_iris': [474, 475, 476, 477],
    'nose': [
        1, 2, 98, 327, 326, 2, 97, 98, 99, 100, 101, 102,
        48, 115, 220, 45, 4, 275, 440, 344, 278
    ]
}

# Eye landmarks for EAR calculation
EYE_LANDMARKS = {
    'left_eye': {
        'outer': 33,
        'inner': 133,
        'top_1': 159,
        'top_2': 158,
        'bottom_1': 145,
        'bottom_2': 153
    },
    'right_eye': {
        'outer': 362,
        'inner': 263,
        'top_1': 386,
        'top_2': 385,
        'bottom_1': 374,
        'bottom_2': 380
    }
}

# Mouth landmarks for MAR calculation
MOUTH_LANDMARKS = {
    'outer_top': 13,
    'outer_bottom': 14,
    'left_corner': 78,
    'right_corner': 308,
    'inner_top_1': 12,
    'inner_top_2': 11,
    'inner_bottom_1': 15,
    'inner_bottom_2': 16
}

# Head pose landmarks (nose, chin, left eye, right eye, left mouth, right mouth)
HEAD_POSE_LANDMARKS = [1, 152, 33, 263, 61, 291]

# Thresholds
EAR_THRESHOLD = 0.25  # Eye Aspect Ratio threshold for drowsiness
MAR_THRESHOLD = 0.6   # Mouth Aspect Ratio threshold for yawning
PERCLOS_THRESHOLD = 0.8  # Percentage of Eye Closure threshold
PERCLOS_WINDOW_SECONDS = 60  # PERCLOS calculation window

# Head pose angle thresholds (degrees)
HEAD_POSE_THRESHOLDS = {
    'pitch': 15.0,  # Looking up/down
    'yaw': 20.0,    # Looking left/right
    'roll': 15.0    # Tilting head
}

# Frame processing
DEFAULT_FRAME_WIDTH = 640
DEFAULT_FRAME_HEIGHT = 480
DEFAULT_FPS = 30

# Model input
MODEL_INPUT_SIZE = (224, 224)
MODEL_INPUT_CHANNELS = 3

# Data augmentation parameters
AUGMENTATION_PARAMS = {
    'rotation_range': 10,
    'width_shift_range': 0.1,
    'height_shift_range': 0.1,
    'zoom_range': 0.1,
    'horizontal_flip': True,
    'brightness_range': [0.8, 1.2]
}

# Alert thresholds
ALERT_THRESHOLDS = {
    'drowsy_frames': 10,      # Consecutive frames to trigger drowsy alert
    'distracted_frames': 15,   # Consecutive frames to trigger distracted alert
    'perclos_alert': 0.7,      # PERCLOS percentage to trigger alert
    'confidence_threshold': 0.75  # Minimum confidence for classification
}

# File extensions
SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.bmp']
SUPPORTED_VIDEO_FORMATS = ['.mp4', '.avi', '.mov', '.mkv']
ANNOTATION_FORMAT = '.json'

# DMD Dataset specific
DMD_GROUPS = ['gA', 'gB']
DMD_SESSIONS = ['s1', 's2']
DMD_ANNOTATION_FORMAT = 'openlabel'  # OpenLABEL format

# State Farm Dataset specific
STATE_FARM_CLASSES = [f'c{i}' for i in range(10)]

# Logging
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

# Database
DB_BATCH_SIZE = 100

# API
API_VERSION = "v1"
MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10 MB

# Real-time processing
FRAME_BUFFER_SIZE = 30
CLASSIFICATION_WINDOW = 5  # Number of frames to average for stable classification
