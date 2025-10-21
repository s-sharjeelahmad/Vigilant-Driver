"""
Configuration Management
========================
Centralized configuration for the Vigilant Driver system.
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class PathConfig:
    """Path configuration for datasets and outputs."""
    root_dir: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent)
    datasets_dir: Path = field(init=False)
    raw_data_dir: Path = field(init=False)
    processed_data_dir: Path = field(init=False)
    features_dir: Path = field(init=False)
    verified_images_dir: Path = field(init=False)
    models_dir: Path = field(init=False)
    logs_dir: Path = field(init=False)
    
    # Dataset-specific paths
    vicomtech_raw_dir: Path = field(init=False)
    dmd_raw_dir: Path = field(init=False)  # Alias for vicomtech_raw_dir
    state_farm_raw_dir: Path = field(init=False)
    custom_raw_dir: Path = field(init=False)
    
    def __post_init__(self):
        self.datasets_dir = self.root_dir / "datasets"
        self.raw_data_dir = self.datasets_dir / "raw"
        self.processed_data_dir = self.datasets_dir / "processed"
        self.features_dir = self.processed_data_dir / "features"
        self.verified_images_dir = self.datasets_dir / "verified_images"
        self.models_dir = self.root_dir / "models"
        self.logs_dir = self.root_dir / "logs"
        
        # Dataset paths (matching your actual structure)
        self.vicomtech_raw_dir = self.raw_data_dir / "vicomtech"
        self.dmd_raw_dir = self.vicomtech_raw_dir  # Alias for backward compatibility
        self.state_farm_raw_dir = self.raw_data_dir / "state-farm-distracted-driver-detection"
        self.custom_raw_dir = self.raw_data_dir / "custom"


@dataclass
class DataProcessingConfig:
    """Configuration for data processing."""
    # Image processing
    target_image_size: tuple = (224, 224)
    frame_extraction_fps: int = 5
    augmentation_enabled: bool = True
    
    # Feature extraction
    ear_threshold: float = 0.25
    mar_threshold: float = 0.6
    perclos_window_size: int = 30  # frames
    head_pose_threshold: float = 15.0  # degrees
    
    # Occlusion detection
    occlusion_confidence_threshold: float = 0.7
    
    # Data split
    train_split: float = 0.7
    val_split: float = 0.15
    test_split: float = 0.15


@dataclass
class ModelConfig:
    """Configuration for model training."""
    # Model architecture
    model_type: str = "resnet50"  # resnet50, efficientnet, mobilenet
    input_shape: tuple = (224, 224, 3)
    num_classes: int = 3  # Alert, Drowsy, Distracted
    
    # Training parameters
    batch_size: int = 32
    epochs: int = 50
    learning_rate: float = 0.001
    optimizer: str = "adam"
    early_stopping_patience: int = 10
    
    # Device
    use_gpu: bool = True
    mixed_precision: bool = True


@dataclass
class DMDConfig:
    """Configuration for Vicomtech DMD dataset processing."""
    annotation_format: str = "openlabel"
    groups: list = field(default_factory=lambda: ["gA", "gB"])
    sessions: list = field(default_factory=lambda: ["s1", "s2"])
    
    # Class mapping: DMD activities -> Our classes
    # Based on DMD OpenLABEL action types (distraction annotations)
    class_mapping: Dict[str, str] = field(default_factory=lambda: {
        # Alert states - driver_actions level
        "driver_actions/safe_drive": "alert",
        "driver_actions/standstill_or_waiting": "alert",
        "driver_actions/change_gear": "alert",  # Normal driving activity
        "gaze_on_road/looking_road": "alert",
        "normal_driving": "alert",
        "safe_drive": "alert",
        
        # Drowsy states (may appear in drowsiness-annotated files)
        "drowsiness": "drowsy",
        "yawning": "drowsy",
        "eyes_closed": "drowsy",
        "driver_actions/drowsy": "drowsy",
        
        # Distracted states - driver_actions level
        "driver_actions/reach_side": "distracted",
        "driver_actions/reach_backseat": "distracted",
        "driver_actions/drinking": "distracted",
        "driver_actions/eating": "distracted",
        "driver_actions/texting": "distracted",
        "driver_actions/phonecall_right": "distracted",
        "driver_actions/phonecall_left": "distracted",
        "driver_actions/talking_phone": "distracted",
        "driver_actions/adjusting_radio": "distracted",
        "driver_actions/hair_makeup": "distracted",
        "gaze_on_road/not_looking_road": "distracted",
        
        # Generic mappings for backward compatibility
        "talking_on_phone": "distracted",
        "texting": "distracted",
        "reaching_behind": "distracted",
        "eating": "distracted",
        "drinking": "distracted",
        "adjusting_radio": "distracted",
        "hair_and_makeup": "distracted",
        "talking_to_passenger": "distracted"
    })


@dataclass
class StateFarmConfig:
    """Configuration for State Farm dataset processing."""
    classes: list = field(default_factory=lambda: [
        "c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9"
    ])
    
    # Class mapping: State Farm classes -> Our classes
    class_mapping: Dict[str, str] = field(default_factory=lambda: {
        "c0": "alert",      # Safe driving
        "c1": "distracted", # Texting - right
        "c2": "distracted", # Talking on phone - right
        "c3": "distracted", # Texting - left
        "c4": "distracted", # Talking on phone - left
        "c5": "distracted", # Operating radio
        "c6": "distracted", # Drinking
        "c7": "distracted", # Reaching behind
        "c8": "distracted", # Hair and makeup
        "c9": "distracted"  # Talking to passenger
    })


@dataclass
class Config:
    """Main configuration class."""
    paths: PathConfig = field(default_factory=PathConfig)
    data_processing: DataProcessingConfig = field(default_factory=DataProcessingConfig)
    model: ModelConfig = field(default_factory=ModelConfig)
    dmd: DMDConfig = field(default_factory=DMDConfig)
    state_farm: StateFarmConfig = field(default_factory=StateFarmConfig)
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # System
    random_seed: int = 42
    num_workers: int = 4
    
    @classmethod
    def from_yaml(cls, config_path: str) -> 'Config':
        """Load configuration from YAML file."""
        with open(config_path, 'r') as f:
            config_dict = yaml.safe_load(f)
        return cls(**config_dict)
    
    def to_yaml(self, output_path: str):
        """Save configuration to YAML file."""
        config_dict = self._to_dict()
        with open(output_path, 'w') as f:
            yaml.dump(config_dict, f, default_flow_style=False)
    
    def _to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary."""
        return {
            'paths': {
                'root_dir': str(self.paths.root_dir),
            },
            'data_processing': {
                'target_image_size': self.data_processing.target_image_size,
                'frame_extraction_fps': self.data_processing.frame_extraction_fps,
                'augmentation_enabled': self.data_processing.augmentation_enabled,
                'ear_threshold': self.data_processing.ear_threshold,
                'mar_threshold': self.data_processing.mar_threshold,
                'perclos_window_size': self.data_processing.perclos_window_size,
                'head_pose_threshold': self.data_processing.head_pose_threshold,
                'train_split': self.data_processing.train_split,
                'val_split': self.data_processing.val_split,
                'test_split': self.data_processing.test_split,
            },
            'model': {
                'model_type': self.model.model_type,
                'batch_size': self.model.batch_size,
                'epochs': self.model.epochs,
                'learning_rate': self.model.learning_rate,
            },
            'log_level': self.log_level,
            'random_seed': self.random_seed,
        }
    
    def create_directories(self):
        """Create all necessary directories."""
        directories = [
            self.paths.datasets_dir,
            self.paths.raw_data_dir,
            self.paths.processed_data_dir,
            self.paths.features_dir,
            self.paths.verified_images_dir,
            self.paths.models_dir,
            self.paths.logs_dir,
            self.paths.vicomtech_raw_dir,
            self.paths.state_farm_raw_dir,
            self.paths.custom_raw_dir,
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)


# Global config instance
_config: Optional[Config] = None


def get_config(config_path: Optional[str] = None) -> Config:
    """
    Get the global configuration instance.
    
    Args:
        config_path: Optional path to YAML config file
        
    Returns:
        Config instance
    """
    global _config
    
    if _config is None:
        if config_path and os.path.exists(config_path):
            _config = Config.from_yaml(config_path)
        else:
            _config = Config()
        
        # Create necessary directories
        _config.create_directories()
    
    return _config


def reset_config():
    """Reset the global configuration instance."""
    global _config
    _config = None


# Dataset-specific configurations
@dataclass
class YawDDConfig:
    """Configuration for YawDD dataset processing."""
    raw_data_path: str = "datasets/raw/yawDD"
    output_dir: str = "datasets/processed/yawdd"
    target_fps: int = 5  # Sample frames at 5 fps
    image_size: tuple = (224, 224)
    
    # Class mapping
    class_mapping: Dict[str, str] = field(default_factory=lambda: {
        'yawn': 'drowsy',
        'normal': 'alert',
        'no_yawn': 'alert'
    })


@dataclass
class NTHUDDDConfig:
    """Configuration for NTHUDDD dataset processing."""
    raw_data_path: str = "datasets/raw/NTHUDDD"
    output_dir: str = "datasets/processed/nthuddd"
    resize_images: bool = True
    image_size: tuple = (224, 224)
    
    # Class mapping
    class_mapping: Dict[str, str] = field(default_factory=lambda: {
        'drowsy': 'drowsy',
        'notdrowsy': 'alert'
    })


@dataclass
class UTARLDDConfig:
    """Configuration for UTA-RLDD dataset processing."""
    raw_data_path: str = "datasets/raw/UTA-RLDD"
    output_dir: str = "datasets/processed/uta_rldd"
    resize_images: bool = True
    image_size: tuple = (224, 224)
    preserve_splits: bool = True  # Keep train/val/test splits
    
    # Class mapping
    class_mapping: Dict[str, str] = field(default_factory=lambda: {
        'active': 'alert',
        'fatigue': 'drowsy'
    })
