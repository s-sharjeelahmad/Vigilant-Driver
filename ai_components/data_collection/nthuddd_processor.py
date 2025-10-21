"""
NTHUDDD (National Taiwan University Drowsy Driver Dataset) Processor
Processes NTHUDDD dataset for drowsiness detection
Already contains extracted images in drowsy/notdrowsy folders
"""

import cv2
import json
import logging
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass
import shutil

from ai_components.utils.config import NTHUDDDConfig
from ai_components.utils.helpers import ensure_dir, save_json

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class NTHUDDDProcessor:
    """Process NTHUDDD dataset with drowsiness annotations"""
    
    config: NTHUDDDConfig
    
    def __post_init__(self):
        self.output_dir = Path(self.config.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.stats = {
            'total_images': 0,
            'class_distribution': {'alert': 0, 'drowsy': 0},
            'errors': []
        }
    
    def process(self):
        """Main processing method"""
        logger.info("Starting NTHUDDD dataset processing...")
        
        raw_root = Path(self.config.raw_data_path) / 'train_data'
        
        if not raw_root.exists():
            raise FileNotFoundError(f"NTHUDDD train_data not found at {raw_root}")
        
        # Process drowsy images
        drowsy_dir = raw_root / 'drowsy'
        self._process_class(drowsy_dir, 'drowsy')
        
        # Process not drowsy images (map to alert)
        notdrowsy_dir = raw_root / 'notdrowsy'
        self._process_class(notdrowsy_dir, 'alert')
        
        # Save metadata
        self._save_metadata()
        
        logger.info(f"NTHUDDD processing complete!")
        logger.info(f"Total images processed: {self.stats['total_images']}")
        logger.info(f"Class distribution: {self.stats['class_distribution']}")
        
        return self.stats
    
    def _process_class(self, source_dir: Path, driver_state: str):
        """Process all images in a class folder"""
        
        if not source_dir.exists():
            logger.warning(f"Directory not found: {source_dir}")
            return
        
        # Create output directory
        output_dir = self.output_dir / driver_state
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Get all image files
        image_files = list(source_dir.glob('*.jpg'))
        logger.info(f"Processing {len(image_files)} images from {source_dir.name} -> {driver_state}")
        
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
                
                # Save to output directory
                output_path = output_dir / img_path.name
                cv2.imwrite(str(output_path), img)
                
                processed_count += 1
                
                if processed_count % 1000 == 0:
                    logger.info(f"Processed {processed_count}/{len(image_files)} images...")
                
            except Exception as e:
                error_msg = f"Error processing {img_path}: {str(e)}"
                logger.error(error_msg)
                self.stats['errors'].append(error_msg)
        
        # Update stats
        self.stats['total_images'] += processed_count
        self.stats['class_distribution'][driver_state] += processed_count
        
        logger.info(f"Completed {driver_state}: {processed_count} images")
    
    def _save_metadata(self):
        """Save processing metadata"""
        metadata = {
            'dataset': 'NTHUDDD',
            'description': 'National Taiwan University Drowsy Driver Dataset',
            'source': 'Pre-extracted images from video sequences',
            'classes': {
                'alert': 'Not drowsy (normal driving)',
                'drowsy': 'Drowsy (sleepy, yawning, eye closure)'
            },
            'stats': self.stats,
            'config': {
                'resize_images': self.config.resize_images,
                'image_size': self.config.image_size
            }
        }
        
        metadata_path = self.output_dir / 'metadata.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Metadata saved to {metadata_path}")


def main():
    """Run NTHUDDD processor"""
    config = NTHUDDDConfig()
    processor = NTHUDDDProcessor(config)
    processor.process()


if __name__ == "__main__":
    main()
