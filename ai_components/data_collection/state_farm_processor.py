"""
State Farm Distracted Driver Detection Dataset Processor
=========================================================
Processes State Farm dataset for distracted driver detection.

Dataset Structure:
    state_farm/
    ├── train/
    │   ├── c0/  # Safe driving
    │   ├── c1/  # Texting - right
    │   ├── c2/  # Talking on phone - right
    │   ├── ...
    │   └── c9/  # Talking to passenger
    └── test/
        └── *.jpg
"""

import os
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import cv2
import numpy as np
from tqdm import tqdm
import shutil

from ..utils.config import get_config
from ..utils.constants import DriverState, STATE_FARM_CLASSES
from ..utils.helpers import (
    ensure_dir,
    save_json,
    resize_image,
    setup_logging,
    count_files_by_extension
)


@dataclass
class StateFarmSample:
    """Data structure for a State Farm sample."""
    image_path: str
    class_id: str
    driver_state: str
    split: str  # train, test
    subject_id: Optional[str] = None
    preprocessed_path: Optional[str] = None


class StateFarmProcessor:
    """
    Processor for State Farm Distracted Driver Detection dataset.
    
    Features:
        - Parse State Farm folder structure
        - Map c0-c9 classes to driver states
        - Preprocess and resize images
        - Extract subject IDs from filenames
    """
    
    def __init__(self, config=None):
        """
        Initialize State Farm processor.
        
        Args:
            config: Configuration object (uses default if None)
        """
        self.config = config or get_config()
        self.logger = setup_logging(
            log_level=self.config.log_level,
            log_file=str(self.config.paths.logs_dir / 'state_farm_processor.log')
        )
        
        self.state_farm_dir = self.config.paths.state_farm_raw_dir
        self.output_dir = self.config.paths.processed_data_dir / 'state_farm'
        ensure_dir(self.output_dir)
        
        self.class_mapping = self.config.state_farm.class_mapping
        self.classes = self.config.state_farm.classes
        
        self.samples: List[StateFarmSample] = []
        
    def process_dataset(self, preprocess_images: bool = True) -> Dict[str, Any]:
        """
        Process entire State Farm dataset.
        
        Args:
            preprocess_images: Whether to preprocess and save images
            
        Returns:
            Processing statistics
        """
        self.logger.info("Starting State Farm dataset processing...")
        
        stats = {
            'total_samples': 0,
            'train_samples': 0,
            'test_samples': 0,
            'preprocessed_images': 0,
            'class_distribution': {},
            'state_distribution': {},
            'errors': []
        }
        
        # Check if dataset exists
        if not self.state_farm_dir.exists():
            self.logger.error(f"State Farm dataset directory not found: {self.state_farm_dir}")
            return stats
        
        # Process training set (check for imgs subdirectory first)
        train_dir = self.state_farm_dir / 'imgs' / 'train'
        if not train_dir.exists():
            train_dir = self.state_farm_dir / 'train'  # Fallback to root/train
        
        if train_dir.exists():
            self.logger.info(f"Processing training data from: {train_dir}")
            train_stats = self._process_split('train', preprocess_images)
            stats['train_samples'] = train_stats['samples']
            stats['preprocessed_images'] += train_stats['preprocessed']
            
            for class_id, count in train_stats['class_dist'].items():
                stats['class_distribution'][class_id] = \
                    stats['class_distribution'].get(class_id, 0) + count
            
            for state, count in train_stats['state_dist'].items():
                stats['state_distribution'][state] = \
                    stats['state_distribution'].get(state, 0) + count
        else:
            self.logger.warning(f"Training directory not found")
        
        # Process test set (if available, check imgs subdirectory first)
        test_dir = self.state_farm_dir / 'imgs' / 'test'
        if not test_dir.exists():
            test_dir = self.state_farm_dir / 'test'  # Fallback
        
        if test_dir.exists():
            test_stats = self._process_test_split(preprocess_images)
            stats['test_samples'] = test_stats['samples']
            stats['preprocessed_images'] += test_stats['preprocessed']
        
        stats['total_samples'] = stats['train_samples'] + stats['test_samples']
        
        # Save metadata
        self._save_metadata(stats)
        
        self.logger.info(f"State Farm processing complete. Total samples: {stats['total_samples']}")
        return stats
    
    def _process_split(self, split: str, preprocess: bool) -> Dict[str, Any]:
        """
        Process a dataset split (train/val).
        
        Args:
            split: Split name ('train' or 'val')
            preprocess: Whether to preprocess images
            
        Returns:
            Split statistics
        """
        self.logger.info(f"Processing {split} split...")
        
        # Check for imgs subdirectory first
        split_dir = self.state_farm_dir / 'imgs' / split
        if not split_dir.exists():
            split_dir = self.state_farm_dir / split  # Fallback
        
        stats = {
            'samples': 0,
            'preprocessed': 0,
            'class_dist': {},
            'state_dist': {}
        }
        
        # Process each class folder
        for class_id in self.classes:
            class_dir = split_dir / class_id
            
            if not class_dir.exists():
                self.logger.warning(f"Class directory not found: {class_dir}")
                continue
            
            # Get all images in class
            image_files = list(class_dir.glob('*.jpg')) + list(class_dir.glob('*.png'))
            
            self.logger.info(f"Processing {class_id}: {len(image_files)} images")
            
            for image_path in tqdm(image_files, desc=f"{split}/{class_id}"):
                try:
                    # Map class to driver state
                    driver_state = self.class_mapping.get(class_id, DriverState.UNKNOWN.value)
                    
                    # Extract subject ID from filename (format: img_XXXX.jpg)
                    subject_id = self._extract_subject_id(image_path.name)
                    
                    sample = StateFarmSample(
                        image_path=str(image_path),
                        class_id=class_id,
                        driver_state=driver_state,
                        split=split,
                        subject_id=subject_id
                    )
                    
                    # Preprocess image
                    if preprocess:
                        preprocessed_path = self._preprocess_image(
                            image_path, class_id, split, driver_state
                        )
                        sample.preprocessed_path = preprocessed_path
                        stats['preprocessed'] += 1
                    
                    self.samples.append(sample)
                    stats['samples'] += 1
                    stats['class_dist'][class_id] = stats['class_dist'].get(class_id, 0) + 1
                    stats['state_dist'][driver_state] = stats['state_dist'].get(driver_state, 0) + 1
                    
                except Exception as e:
                    self.logger.error(f"Error processing {image_path}: {e}")
        
        return stats
    
    def _process_test_split(self, preprocess: bool) -> Dict[str, Any]:
        """
        Process test split (unlabeled images).
        
        Args:
            preprocess: Whether to preprocess images
            
        Returns:
            Test split statistics
        """
        self.logger.info("Processing test split...")
        
        # Check for imgs subdirectory first
        test_dir = self.state_farm_dir / 'imgs' / 'test'
        if not test_dir.exists():
            test_dir = self.state_farm_dir / 'test'  # Fallback
        
        stats = {
            'samples': 0,
            'preprocessed': 0
        }
        
        # Get all test images
        image_files = list(test_dir.glob('*.jpg')) + list(test_dir.glob('*.png'))
        
        for image_path in tqdm(image_files, desc="test"):
            try:
                sample = StateFarmSample(
                    image_path=str(image_path),
                    class_id='unknown',
                    driver_state=DriverState.UNKNOWN.value,
                    split='test'
                )
                
                if preprocess:
                    preprocessed_path = self._preprocess_image(
                        image_path, 'test', 'test', 'unknown'
                    )
                    sample.preprocessed_path = preprocessed_path
                    stats['preprocessed'] += 1
                
                self.samples.append(sample)
                stats['samples'] += 1
                
            except Exception as e:
                self.logger.error(f"Error processing {image_path}: {e}")
        
        return stats
    
    def _extract_subject_id(self, filename: str) -> Optional[str]:
        """
        Extract subject ID from filename.
        
        Args:
            filename: Image filename (e.g., 'img_12345.jpg')
            
        Returns:
            Subject ID or None
        """
        # State Farm filenames format: img_XXXX.jpg
        try:
            # Remove extension and prefix
            name = filename.replace('.jpg', '').replace('.png', '')
            if name.startswith('img_'):
                subject_id = name.split('_')[1]
                return subject_id
        except:
            pass
        
        return None
    
    def _preprocess_image(
        self,
        image_path: Path,
        class_id: str,
        split: str,
        driver_state: str
    ) -> str:
        """
        Preprocess and save image.
        
        Args:
            image_path: Path to input image
            class_id: Class identifier
            split: Dataset split
            driver_state: Driver state label
            
        Returns:
            Path to preprocessed image
        """
        # Read image
        image = cv2.imread(str(image_path))
        
        if image is None:
            raise ValueError(f"Failed to read image: {image_path}")
        
        # Resize
        target_size = self.config.data_processing.target_image_size
        preprocessed = resize_image(image, target_size, maintain_aspect=False)
        
        # Create output directory
        output_dir = self.output_dir / split / driver_state
        ensure_dir(output_dir)
        
        # Save preprocessed image
        output_path = output_dir / f"{class_id}_{image_path.name}"
        cv2.imwrite(str(output_path), preprocessed)
        
        return str(output_path)
    
    def _save_metadata(self, stats: Dict[str, Any]):
        """
        Save processing metadata.
        
        Args:
            stats: Processing statistics
        """
        metadata = {
            'dataset': 'State Farm',
            'stats': stats,
            'class_mapping': self.class_mapping,
            'samples': [
                {
                    'image_path': s.image_path,
                    'class_id': s.class_id,
                    'driver_state': s.driver_state,
                    'split': s.split,
                    'subject_id': s.subject_id,
                    'preprocessed_path': s.preprocessed_path
                }
                for s in self.samples
            ]
        }
        
        metadata_path = self.output_dir / 'metadata.json'
        save_json(metadata, metadata_path)
        self.logger.info(f"Metadata saved to {metadata_path}")
    
    def get_samples_by_state(self, state: str, split: Optional[str] = None) -> List[StateFarmSample]:
        """
        Get samples for a specific driver state.
        
        Args:
            state: Driver state
            split: Optional split filter
            
        Returns:
            List of samples
        """
        samples = [s for s in self.samples if s.driver_state == state]
        if split:
            samples = [s for s in samples if s.split == split]
        return samples
    
    def get_class_distribution(self, split: Optional[str] = None) -> Dict[str, int]:
        """
        Get class distribution.
        
        Args:
            split: Optional split filter
            
        Returns:
            Dictionary of class: count
        """
        samples = self.samples if not split else [s for s in self.samples if s.split == split]
        
        distribution = {}
        for sample in samples:
            class_id = sample.class_id
            distribution[class_id] = distribution.get(class_id, 0) + 1
        
        return distribution
    
    def get_state_distribution(self, split: Optional[str] = None) -> Dict[str, int]:
        """
        Get driver state distribution.
        
        Args:
            split: Optional split filter
            
        Returns:
            Dictionary of state: count
        """
        samples = self.samples if not split else [s for s in self.samples if s.split == split]
        
        distribution = {}
        for sample in samples:
            state = sample.driver_state
            distribution[state] = distribution.get(state, 0) + 1
        
        return distribution


if __name__ == "__main__":
    # Test State Farm processor
    processor = StateFarmProcessor()
    stats = processor.process_dataset(preprocess_images=True)
    
    print("\n=== State Farm Processing Results ===")
    print(f"Total samples: {stats['total_samples']}")
    print(f"Train samples: {stats['train_samples']}")
    print(f"Test samples: {stats['test_samples']}")
    print(f"Preprocessed images: {stats['preprocessed_images']}")
    print("\nClass distribution:")
    for class_id, count in stats['class_distribution'].items():
        print(f"  {class_id}: {count}")
    print("\nState distribution:")
    for state, count in stats['state_distribution'].items():
        print(f"  {state}: {count}")
