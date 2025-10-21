"""
YawDD (Yawn Detection Dataset) Processor
Processes YawDD dataset for drowsiness detection
Maps: Yawn -> DROWSY, No Yawn -> ALERT
"""

import cv2
import json
import logging
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass
import shutil

from ai_components.utils.config import YawDDConfig
from ai_components.utils.helpers import ensure_dir, save_json

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class YawDDProcessor:
    """Process YawDD dataset with yawn detection annotations"""
    
    config: YawDDConfig
    
    def __post_init__(self):
        self.output_dir = Path(self.config.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.stats = {
            'total_videos': 0,
            'total_frames_extracted': 0,
            'class_distribution': {'alert': 0, 'drowsy': 0},
            'errors': []
        }
    
    def process(self):
        """Main processing method"""
        logger.info("Starting YawDD dataset processing...")
        
        raw_root = Path(self.config.raw_data_path)
        
        # Process both Dash and Mirror camera views
        camera_views = ['Dash', 'Mirror']
        
        for view in camera_views:
            logger.info(f"Processing {view} camera view...")
            self._process_camera_view(raw_root / view, view)
        
        # Save metadata
        self._save_metadata()
        
        logger.info(f"YawDD processing complete!")
        logger.info(f"Total videos processed: {self.stats['total_videos']}")
        logger.info(f"Total frames extracted: {self.stats['total_frames_extracted']}")
        logger.info(f"Class distribution: {self.stats['class_distribution']}")
        
        return self.stats
    
    def _process_camera_view(self, view_path: Path, view_name: str):
        """Process videos from a camera view"""
        
        # YawDD structure: Dash/Dash/Male, Dash/Dash/Female, etc.
        view_subpath = view_path / view_name
        
        if not view_subpath.exists():
            logger.warning(f"Path not found: {view_subpath}")
            return
        
        # Process all subdirectories (Male, Female, etc.)
        for gender_dir in view_subpath.iterdir():
            if not gender_dir.is_dir():
                continue
            
            logger.info(f"Processing {gender_dir.name}...")
            
            # Process all .avi videos
            video_files = list(gender_dir.glob('*.avi'))
            logger.info(f"Found {len(video_files)} videos in {gender_dir.name}")
            
            for video_path in video_files:
                try:
                    self._process_video(video_path, view_name, gender_dir.name)
                except Exception as e:
                    error_msg = f"Error processing {video_path}: {str(e)}"
                    logger.error(error_msg)
                    self.stats['errors'].append(error_msg)
    
    def _process_video(self, video_path: Path, view: str, gender: str):
        """Process a single video file"""
        
        # YawDD naming: {subject_id}_{yawn/normal}.avi
        filename = video_path.stem
        
        # Determine label from filename
        if 'yawn' in filename.lower():
            driver_state = 'drowsy'
        else:
            driver_state = 'alert'
        
        # Create output directory
        output_class_dir = self.output_dir / driver_state / f"{view}_{gender}"
        output_class_dir.mkdir(parents=True, exist_ok=True)
        
        # Open video
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Sample frames at configured rate
        frame_interval = max(1, int(fps / self.config.target_fps))
        
        frame_idx = 0
        extracted_count = 0
        
        logger.info(f"Processing {video_path.name}: {total_frames} frames at {fps} fps")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Sample frame
            if frame_idx % frame_interval == 0:
                # Save frame
                frame_filename = f"{filename}_frame_{frame_idx:06d}.jpg"
                frame_path = output_class_dir / frame_filename
                
                cv2.imwrite(str(frame_path), frame)
                extracted_count += 1
            
            frame_idx += 1
        
        cap.release()
        
        # Update stats
        self.stats['total_videos'] += 1
        self.stats['total_frames_extracted'] += extracted_count
        self.stats['class_distribution'][driver_state] += extracted_count
        
        logger.info(f"Extracted {extracted_count} frames from {video_path.name} -> {driver_state}")
    
    def _save_metadata(self):
        """Save processing metadata"""
        metadata = {
            'dataset': 'YawDD',
            'description': 'Yawn Detection Dataset for Drowsiness Detection',
            'camera_views': ['Dash', 'Mirror'],
            'classes': {
                'alert': 'Normal driving (no yawn)',
                'drowsy': 'Yawning detected'
            },
            'stats': self.stats,
            'config': {
                'target_fps': self.config.target_fps,
                'image_size': self.config.image_size
            }
        }
        
        metadata_path = self.output_dir / 'metadata.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Metadata saved to {metadata_path}")


def main():
    """Run YawDD processor"""
    config = YawDDConfig()
    processor = YawDDProcessor(config)
    processor.process()


if __name__ == "__main__":
    main()
