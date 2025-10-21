"""
UTA-RLDD (UTA Real-Life Drowsiness Dataset) Processor
Processes UTA-RLDD dataset for drowsiness detection
Maps: active -> ALERT, fatigue -> DROWSY
"""

import cv2
import json
import logging
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass
import shutil

from ai_components.utils.config import UTARLDDConfig
from ai_components.utils.helpers import ensure_dir, save_json

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class UTARLDDProcessor:
    """Process UTA-RLDD dataset with train/val/test splits"""
    
    config: UTARLDDConfig
    
    def __post_init__(self):
        self.output_dir = Path(self.config.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.stats = {
            'total_images': 0,
            'splits': {
                'train': {'alert': 0, 'drowsy': 0},
                'val': {'alert': 0, 'drowsy': 0},
                'test': {'alert': 0, 'drowsy': 0}
            },
            'class_distribution': {'alert': 0, 'drowsy': 0},
            'errors': []
        }
    
    def process(self):
        """Main processing method"""
        logger.info("Starting UTA-RLDD dataset processing...")
        
        raw_root = Path(self.config.raw_data_path)
        
        if not raw_root.exists():
            raise FileNotFoundError(f"UTA-RLDD not found at {raw_root}")
        
        # Process each split
        for split in ['train', 'val', 'test']:
            logger.info(f"Processing {split} split...")
            self._process_split(raw_root / split, split)
        
        # Save metadata
        self._save_metadata()
        
        logger.info(f"UTA-RLDD processing complete!")
        logger.info(f"Total images processed: {self.stats['total_images']}")
        logger.info(f"Class distribution: {self.stats['class_distribution']}")
        logger.info(f"Split distribution: {self.stats['splits']}")
        
        return self.stats
    
    def _process_split(self, split_path: Path, split_name: str):
        """Process a dataset split (train/val/test)"""
        
        if not split_path.exists():
            logger.warning(f"Split path not found: {split_path}")
            return
        
        # Process active (alert) images
        active_dir = split_path / 'active'
        self._process_class(active_dir, 'alert', split_name)
        
        # Process fatigue (drowsy) images
        fatigue_dir = split_path / 'fatigue'
        self._process_class(fatigue_dir, 'drowsy', split_name)
    
    def _process_class(self, source_dir: Path, driver_state: str, split: str):
        """Process all images in a class folder"""
        
        if not source_dir.exists():
            logger.warning(f"Directory not found: {source_dir}")
            return
        
        # Create output directory
        # Structure: output/split/class/
        output_dir = self.output_dir / split / driver_state
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Get all image files
        image_files = list(source_dir.glob('*.jpg'))
        logger.info(f"Processing {len(image_files)} images from {split}/{source_dir.name} -> {driver_state}")
        
        processed_count = 0
        
        for img_path in image_files:
            try:
                # Read and optionally resize image
                img = cv2.imread(str(img_path))
                
                if img is None:
                    raise ValueError(f"Cannot read image: {img_path}")
                
                # Resize if configured
                if self.config.resize_images and self.config.image_size:
                    img = cv2.resize(img, self.config.image_size)
                
                # Save to output directory with original filename
                output_path = output_dir / img_path.name
                cv2.imwrite(str(output_path), img)
                
                processed_count += 1
                
                if processed_count % 500 == 0:
                    logger.info(f"Processed {processed_count}/{len(image_files)} images...")
                
            except Exception as e:
                error_msg = f"Error processing {img_path}: {str(e)}"
                logger.error(error_msg)
                self.stats['errors'].append(error_msg)
        
        # Update stats
        self.stats['total_images'] += processed_count
        self.stats['class_distribution'][driver_state] += processed_count
        self.stats['splits'][split][driver_state] += processed_count
        
        logger.info(f"Completed {split}/{driver_state}: {processed_count} images")
    
    def _save_metadata(self):
        """Save processing metadata"""
        metadata = {
            'dataset': 'UTA-RLDD',
            'description': 'UTA Real-Life Drowsiness Dataset',
            'source': 'University of Texas Arlington',
            'splits': ['train', 'val', 'test'],
            'classes': {
                'alert': 'Active/alert driving',
                'drowsy': 'Fatigued/drowsy driving'
            },
            'stats': self.stats,
            'config': {
                'resize_images': self.config.resize_images,
                'image_size': self.config.image_size,
                'preserve_splits': self.config.preserve_splits
            }
        }
        
        metadata_path = self.output_dir / 'metadata.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Metadata saved to {metadata_path}")


def main():
    """Run UTA-RLDD processor"""
    config = UTARLDDConfig()
    processor = UTARLDDProcessor(config)
    processor.process()


if __name__ == "__main__":
    main()
