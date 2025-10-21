"""
Training Data Collector
========================
Collects and manages training data from various sources.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging
from dataclasses import dataclass
import json

from ..utils.config import get_config
from ..utils.constants import DriverState
from ..utils.helpers import setup_logging, ensure_dir, save_json, get_timestamp


@dataclass
class CollectedSample:
    """Data structure for a collected sample."""
    image_path: str
    label: str
    timestamp: str
    source: str  # camera, video, import
    metadata: Dict[str, Any]


class TrainingDataCollector:
    """
    Collects training data from multiple sources.
    
    Sources:
        - Live camera feed
        - Video files
        - Imported datasets
    """
    
    def __init__(self, config=None):
        """
        Initialize training data collector.
        
        Args:
            config: Configuration object
        """
        self.config = config or get_config()
        self.logger = setup_logging(
            log_level=self.config.log_level,
            log_file=str(self.config.paths.logs_dir / 'data_collector.log')
        )
        
        self.custom_data_dir = self.config.paths.custom_raw_dir
        ensure_dir(self.custom_data_dir)
        
        self.samples: List[CollectedSample] = []
        self.current_session_dir = None
    
    def start_collection_session(self, session_name: Optional[str] = None) -> str:
        """
        Start a new data collection session.
        
        Args:
            session_name: Optional session name
            
        Returns:
            Session directory path
        """
        if session_name is None:
            session_name = f"session_{get_timestamp()}"
        
        self.current_session_dir = self.custom_data_dir / session_name
        ensure_dir(self.current_session_dir)
        
        # Create subdirectories for each state
        for state in DriverState.get_all_states():
            ensure_dir(self.current_session_dir / state)
        
        self.logger.info(f"Started collection session: {session_name}")
        return str(self.current_session_dir)
    
    def collect_from_camera(
        self,
        camera_id: int = 0,
        duration_seconds: Optional[int] = None,
        fps: int = 5
    ) -> Dict[str, Any]:
        """
        Collect data from live camera feed.
        
        Args:
            camera_id: Camera device ID
            duration_seconds: Collection duration (None for manual stop)
            fps: Frames per second to capture
            
        Returns:
            Collection statistics
        """
        if self.current_session_dir is None:
            self.start_collection_session()
        
        self.logger.info(f"Starting camera collection (camera {camera_id}, {fps} fps)")
        
        cap = cv2.VideoCapture(camera_id)
        
        if not cap.isOpened():
            self.logger.error(f"Failed to open camera {camera_id}")
            return {'error': 'Failed to open camera'}
        
        stats = {
            'frames_captured': 0,
            'samples_saved': 0,
            'start_time': datetime.now().isoformat()
        }
        
        frame_interval = max(1, int(cap.get(cv2.CAP_PROP_FPS) / fps))
        frame_count = 0
        paused = False
        auto_capture = False
        current_label = None
        
        # Print instructions
        print("\n" + "="*70)
        print("DATA COLLECTION CONTROLS:")
        print("="*70)
        print("SPACE   - Pause/Resume")
        print("1       - Set label to ALERT (then press C to capture)")
        print("2       - Set label to DROWSY (then press C to capture)")
        print("3       - Set label to DISTRACTED (then press C to capture)")
        print("C       - Capture single frame with current label")
        print("A       - Toggle auto-capture mode (captures continuously)")
        print("S       - Show current statistics")
        print("Q       - Quit and save session")
        print("="*70)
        print("TIP: Press SPACE to pause, change your pose/condition, then resume!")
        print("="*70 + "\n")
        
        try:
            while True:
                if not paused:
                    ret, frame = cap.read()
                    
                    if not ret:
                        break
                    
                    frame_count += 1
                else:
                    # When paused, just wait for input
                    key = cv2.waitKey(100) & 0xFF
                    if key == ord(' '):
                        paused = False
                        print("▶ RESUMED - Camera active")
                    elif key == ord('q'):
                        break
                    elif key == ord('s'):
                        self._print_stats(stats)
                    continue
                
                # Capture at specified FPS
                if frame_count % frame_interval == 0:
                    # Create status overlay
                    display_frame = frame.copy()
                    status_text = []
                    
                    if paused:
                        status_text.append("⏸ PAUSED")
                        cv2.putText(display_frame, "PAUSED", (10, 30), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                    else:
                        status_text.append("▶ RECORDING")
                    
                    if current_label:
                        status_text.append(f"Label: {current_label}")
                        cv2.putText(display_frame, f"Label: {current_label}", (10, 70), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    
                    if auto_capture and current_label:
                        status_text.append("AUTO-CAPTURE ON")
                        cv2.putText(display_frame, "AUTO-CAPTURE", (10, 110), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
                    
                    cv2.putText(display_frame, f"Saved: {stats['samples_saved']}", (10, 150), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
                    
                    # Display frame
                    cv2.imshow('Data Collection - Press SPACE to pause, Q to quit', display_frame)
                    
                    stats['frames_captured'] += 1
                    
                    # Check for keyboard input
                    key = cv2.waitKey(1) & 0xFF
                    
                    if key == ord('q'):
                        print("\n✓ Quitting data collection...")
                        break
                    elif key == ord(' '):
                        paused = not paused
                        if paused:
                            print("⏸ PAUSED - Change your pose/condition, then press SPACE to resume")
                        else:
                            print("▶ RESUMED - Camera active")
                    elif key == ord('1'):
                        current_label = DriverState.ALERT.value
                        print(f"✓ Label set to: {current_label}")
                    elif key == ord('2'):
                        current_label = DriverState.DROWSY.value
                        print(f"✓ Label set to: {current_label}")
                    elif key == ord('3'):
                        current_label = DriverState.DISTRACTED.value
                        print(f"✓ Label set to: {current_label}")
                    elif key == ord('c'):
                        if current_label:
                            self._save_sample(frame, current_label, 'camera')
                            stats['samples_saved'] += 1
                            print(f"✓ Captured frame as {current_label} (Total: {stats['samples_saved']})")
                        else:
                            print("⚠ Please set a label first (press 1, 2, or 3)")
                    elif key == ord('a'):
                        auto_capture = not auto_capture
                        if auto_capture:
                            if current_label:
                                print(f"✓ AUTO-CAPTURE ON - Capturing {current_label} continuously")
                            else:
                                print("⚠ Set a label first (press 1, 2, or 3)")
                                auto_capture = False
                        else:
                            print("✓ AUTO-CAPTURE OFF")
                    elif key == ord('s'):
                        self._print_stats(stats)
                    
                    # Auto-capture if enabled
                    if auto_capture and current_label:
                        self._save_sample(frame, current_label, 'camera')
                        stats['samples_saved'] += 1
                
                # Check duration
                if duration_seconds and frame_count >= duration_seconds * cap.get(cv2.CAP_PROP_FPS):
                    break
        
        finally:
            cap.release()
            cv2.destroyAllWindows()
        
        stats['end_time'] = datetime.now().isoformat()
        self.logger.info(f"Camera collection complete: {stats['samples_saved']} samples saved")
        
        return stats
    
    def collect_from_video(
        self,
        video_path: str,
        label: str,
        fps: int = 5
    ) -> Dict[str, Any]:
        """
        Collect data from video file.
        
        Args:
            video_path: Path to video file
            label: Driver state label for all frames
            fps: Frames per second to extract
            
        Returns:
            Collection statistics
        """
        if self.current_session_dir is None:
            self.start_collection_session()
        
        self.logger.info(f"Collecting from video: {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            self.logger.error(f"Failed to open video: {video_path}")
            return {'error': 'Failed to open video'}
        
        stats = {
            'frames_extracted': 0,
            'samples_saved': 0
        }
        
        video_fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = max(1, int(video_fps / fps))
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            frame_count += 1
            
            # Extract at specified FPS
            if frame_count % frame_interval == 0:
                self._save_sample(frame, label, 'video', {'source_video': video_path})
                stats['frames_extracted'] += 1
                stats['samples_saved'] += 1
        
        cap.release()
        
        self.logger.info(f"Video collection complete: {stats['samples_saved']} samples saved")
        return stats
    
    def import_images(
        self,
        image_dir: str,
        label: str,
        recursive: bool = True
    ) -> Dict[str, Any]:
        """
        Import images from directory.
        
        Args:
            image_dir: Directory containing images
            label: Driver state label
            recursive: Whether to search recursively
            
        Returns:
            Import statistics
        """
        if self.current_session_dir is None:
            self.start_collection_session()
        
        self.logger.info(f"Importing images from: {image_dir}")
        
        image_dir = Path(image_dir)
        stats = {
            'images_found': 0,
            'images_imported': 0,
            'errors': 0
        }
        
        # Get image files
        if recursive:
            image_files = list(image_dir.rglob('*.jpg')) + \
                         list(image_dir.rglob('*.jpeg')) + \
                         list(image_dir.rglob('*.png'))
        else:
            image_files = list(image_dir.glob('*.jpg')) + \
                         list(image_dir.glob('*.jpeg')) + \
                         list(image_dir.glob('*.png'))
        
        stats['images_found'] = len(image_files)
        
        for image_path in image_files:
            try:
                image = cv2.imread(str(image_path))
                if image is not None:
                    self._save_sample(
                        image, label, 'import',
                        {'source_path': str(image_path)}
                    )
                    stats['images_imported'] += 1
                else:
                    stats['errors'] += 1
            except Exception as e:
                self.logger.error(f"Error importing {image_path}: {e}")
                stats['errors'] += 1
        
        self.logger.info(f"Import complete: {stats['images_imported']} images imported")
        return stats
    
    def _save_sample(
        self,
        image: np.ndarray,
        label: str,
        source: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Save a collected sample.
        
        Args:
            image: Image data
            label: Driver state label
            source: Source type
            metadata: Additional metadata
        """
        if self.current_session_dir is None:
            self.start_collection_session()
        
        # Create filename
        timestamp = get_timestamp()
        filename = f"{label}_{timestamp}_{len(self.samples)}.jpg"
        
        # Save image
        output_dir = self.current_session_dir / label
        output_path = output_dir / filename
        cv2.imwrite(str(output_path), image)
        
        # Create sample record
        sample = CollectedSample(
            image_path=str(output_path),
            label=label,
            timestamp=timestamp,
            source=source,
            metadata=metadata or {}
        )
        
        self.samples.append(sample)
    
    def _print_stats(self, stats: Dict[str, Any]):
        """Print current collection statistics."""
        print("\n" + "="*50)
        print("CURRENT STATISTICS:")
        print("="*50)
        print(f"Frames captured: {stats['frames_captured']}")
        print(f"Samples saved: {stats['samples_saved']}")
        
        # Count by label
        label_counts = {}
        for sample in self.samples:
            label_counts[sample.label] = label_counts.get(sample.label, 0) + 1
        
        if label_counts:
            print("\nLabel Distribution:")
            for label, count in label_counts.items():
                print(f"  {label}: {count}")
        print("="*50 + "\n")
    
    def end_collection_session(self):
        """End current collection session and save metadata."""
        if self.current_session_dir is None:
            return
        
        # Save session metadata
        metadata = {
            'session_dir': str(self.current_session_dir),
            'total_samples': len(self.samples),
            'samples': [
                {
                    'image_path': s.image_path,
                    'label': s.label,
                    'timestamp': s.timestamp,
                    'source': s.source,
                    'metadata': s.metadata
                }
                for s in self.samples
            ]
        }
        
        metadata_path = self.current_session_dir / 'session_metadata.json'
        save_json(metadata, metadata_path)
        
        self.logger.info(f"Session ended. Metadata saved to {metadata_path}")
        
        # Reset
        self.samples = []
        self.current_session_dir = None
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about collected data.
        
        Returns:
            Collection statistics
        """
        label_counts = {}
        source_counts = {}
        
        for sample in self.samples:
            label_counts[sample.label] = label_counts.get(sample.label, 0) + 1
            source_counts[sample.source] = source_counts.get(sample.source, 0) + 1
        
        return {
            'total_samples': len(self.samples),
            'label_distribution': label_counts,
            'source_distribution': source_counts,
            'session_dir': str(self.current_session_dir) if self.current_session_dir else None
        }


if __name__ == "__main__":
    import sys
    
    print("\n" + "="*70)
    print("VIGILANT DRIVER - CUSTOM DATA COLLECTOR")
    print("="*70)
    print("This tool helps you collect training data using your laptop camera.")
    print("You can pause anytime to change your pose/condition!")
    print("="*70 + "\n")
    
    # Initialize collector
    collector = TrainingDataCollector()
    
    # Create session name
    session_name = input("Enter session name (or press Enter for default): ").strip()
    if not session_name:
        session_name = None
    
    # Start session
    session_dir = collector.start_collection_session(session_name)
    print(f"\n✓ Session started: {session_dir}\n")
    
    # Camera settings
    camera_id = 0  # Default laptop camera
    fps = 5  # Capture 5 frames per second
    
    try:
        # Start camera collection
        print("Starting camera... (This may take a few seconds)\n")
        stats = collector.collect_from_camera(camera_id=camera_id, fps=fps)
        
        # Print final stats
        print("\n" + "="*70)
        print("COLLECTION COMPLETE!")
        print("="*70)
        print(f"Total samples saved: {stats['samples_saved']}")
        print(f"Session directory: {session_dir}")
        
        # Show label distribution
        final_stats = collector.get_collection_stats()
        if final_stats['label_distribution']:
            print("\nLabel Distribution:")
            for label, count in final_stats['label_distribution'].items():
                print(f"  {label}: {count}")
        print("="*70 + "\n")
        
    except KeyboardInterrupt:
        print("\n\n⚠ Interrupted by user")
    except Exception as e:
        print(f"\n⚠ Error: {e}")
    finally:
        # End session and save metadata
        collector.end_collection_session()
        print("✓ Session saved successfully!\n")
