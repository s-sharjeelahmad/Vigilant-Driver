"""Vicomtech Drowsiness Dataset Processor"""
import cv2
import json
import logging
from pathlib import Path
from dataclasses import dataclass
from ..utils.config import get_config

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@dataclass
class VicomtechDrowsyConfig:
    raw_dir: Path = Path("datasets/raw/vicomtech/dmd-dataset-drowsiness-gA-1/dmd")
    output_dir: Path = Path("datasets/processed/vicomtech_drowsy")
    target_fps: int = 2  # Extract 2 frames per second
    resize: tuple = (640, 480)


class VicomtechDrowsyProcessor:
    def __init__(self, config=None):
        self.config = config or VicomtechDrowsyConfig()
        self.logger = logging.getLogger(__name__)
        self.stats = {'alert': 0, 'drowsy': 0}
        
    def process(self):
        """Process Vicomtech drowsiness dataset"""
        self.logger.info("Processing Vicomtech Drowsiness Dataset...")
        
        # Create output directories
        for cls in ['alert', 'drowsy']:
            (self.config.output_dir / cls).mkdir(parents=True, exist_ok=True)
        
        # Find all annotation files
        ann_files = list(self.config.raw_dir.rglob("*_ann_drowsiness.json"))
        self.logger.info(f"Found {len(ann_files)} sessions")
        
        for ann_file in ann_files:
            self._process_session(ann_file)
        
        # Save metadata
        metadata = {
            'dataset': 'vicomtech_drowsiness',
            'total_samples': sum(self.stats.values()),
            'class_distribution': self.stats,
            'source': 'DMD Dataset - Vicomtech'
        }
        
        with open(self.config.output_dir / 'metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        self.logger.info(f"Processing complete! Total: {sum(self.stats.values())}")
        self.logger.info(f"Distribution: {self.stats}")
        
    def _process_session(self, ann_file):
        """Process one session"""
        self.logger.info(f"Processing {ann_file.name}")
        
        # Load annotations
        with open(ann_file, 'r') as f:
            data = json.load(f)
        
        # Check if data is wrapped in 'openlabel'
        if 'openlabel' in data:
            data = data['openlabel']
        
        # Get video path (use face camera)
        video_filename = ann_file.name.replace('_ann_drowsiness.json', '_face.mp4')
        video_path = ann_file.parent / video_filename
        
        if not video_path.exists():
            self.logger.warning(f"Video not found: {video_path}")
            return
        
        # Extract frame intervals for drowsy states
        actions = data.get('actions', {})
        drowsy_intervals = []
        alert_intervals = []
        
        # Action 1 = eyes closed, 5/6 = yawning → DROWSY
        for action_id in ['1', '5', '6']:
            if action_id in actions:
                drowsy_intervals.extend(actions[action_id]['frame_intervals'])
        
        # Action 0 = eyes open → ALERT  
        if '0' in actions:
            alert_intervals = actions['0']['frame_intervals']
        
        # Process video
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            self.logger.error(f"Cannot open video: {video_path}")
            return
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = max(1, int(fps / self.config.target_fps))
        
        frame_count = 0
        session_id = ann_file.stem.replace('_rgb_ann_drowsiness', '')
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Sample at target FPS
            if frame_count % frame_interval == 0:
                label = self._get_label(frame_count, drowsy_intervals, alert_intervals)
                
                if label:
                    # Resize and save
                    frame = cv2.resize(frame, self.config.resize)
                    filename = f"{session_id}_frame_{frame_count:06d}.jpg"
                    output_path = self.config.output_dir / label / filename
                    cv2.imwrite(str(output_path), frame)
                    self.stats[label] += 1
                    
                    if (self.stats['alert'] + self.stats['drowsy']) % 500 == 0:
                        self.logger.info(f"Processed {sum(self.stats.values())} frames...")
            
            frame_count += 1
        
        cap.release()
        self.logger.info(f"Session complete: {session_id}")
    
    def _get_label(self, frame_num, drowsy_intervals, alert_intervals):
        """Determine label for a frame"""
        # Check if frame is in drowsy intervals
        for interval in drowsy_intervals:
            if interval['frame_start'] <= frame_num <= interval['frame_end']:
                return 'drowsy'
        
        # Check if frame is in alert intervals
        for interval in alert_intervals:
            if interval['frame_start'] <= frame_num <= interval['frame_end']:
                return 'alert'
        
        return None  # Skip ambiguous frames


def main():
    processor = VicomtechDrowsyProcessor()
    processor.process()


if __name__ == "__main__":
    main()
