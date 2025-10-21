"""
DMD (Driver Monitoring Dataset) Processor
==========================================
Processes Vicomtech DMD dataset with OpenLABEL annotations.

Dataset Structure:
    dmd/
    ├── gA/
    │   ├── s1/
    │   │   ├── videos/
    │   │   │   └── mosaic.mp4
    │   │   └── annotations/
    │   │       └── annotations.json (OpenLABEL format)
    │   └── s2/
    └── gB/
        └── ...
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import cv2
import numpy as np
from tqdm import tqdm

from ..utils.config import get_config
from ..utils.constants import DriverState
from ..utils.helpers import (
    ensure_dir,
    load_json,
    save_json,
    get_video_info,
    setup_logging
)


@dataclass
class DMDSample:
    """Data structure for a DMD sample."""
    video_path: str
    frame_number: int
    timestamp: float
    activity: str
    driver_state: str
    group: str
    session: str
    annotations: Dict[str, Any]
    frame_saved_path: Optional[str] = None


class DMDProcessor:
    """
    Processor for Vicomtech Driver Monitoring Dataset (DMD).
    
    Features:
        - Parse OpenLABEL JSON annotations
        - Extract frames from mosaic videos
        - Map DMD activities to driver states
        - Handle multiple groups and sessions
    """
    
    def __init__(self, config=None):
        """
        Initialize DMD processor.
        
        Args:
            config: Configuration object (uses default if None)
        """
        self.config = config or get_config()
        self.logger = setup_logging(
            log_level=self.config.log_level,
            log_file=str(self.config.paths.logs_dir / 'dmd_processor.log')
        )
        
        self.dmd_dir = self.config.paths.dmd_raw_dir
        self.output_dir = self.config.paths.processed_data_dir / 'dmd'
        ensure_dir(self.output_dir)
        
        self.class_mapping = self.config.dmd.class_mapping
        self.groups = self.config.dmd.groups
        self.sessions = self.config.dmd.sessions
        
        self.samples: List[DMDSample] = []
        
    def process_dataset(self, extract_frames: bool = True) -> Dict[str, Any]:
        """
        Process entire DMD dataset.
        
        Args:
            extract_frames: Whether to extract and save frames
            
        Returns:
            Processing statistics
        """
        self.logger.info("Starting DMD dataset processing...")
        
        stats = {
            'total_samples': 0,
            'extracted_frames': 0,
            'class_distribution': {},
            'groups_processed': 0,
            'sessions_processed': 0,
            'errors': []
        }
        
        # Check if dataset exists
        if not self.dmd_dir.exists():
            self.logger.error(f"DMD dataset directory not found: {self.dmd_dir}")
            return stats
        
        # Process each group and session
        # First, try to find actual DMD sample folders (handles mini-sample structure)
        sample_folders = list(self.dmd_dir.glob('dmd-dataset-mini-sample-*'))
        
        if sample_folders:
            self.logger.info(f"Found {len(sample_folders)} DMD mini-sample folders")
            for sample_folder in sample_folders:
                try:
                    # Extract group and session from folder name
                    # Format: dmd-dataset-mini-sample-gA-3-s1
                    parts = sample_folder.name.split('-')
                    if len(parts) >= 5:
                        group = parts[4]  # gA, gB, etc.
                        session_num = parts[5] if len(parts) > 5 else parts[4].split('s')[1]
                        session = f"s{session_num}" if not session_num.startswith('s') else session_num
                        
                        # Find the actual session path inside the sample folder
                        session_path = sample_folder / 'dmd' / group / parts[5] if len(parts) > 5 else None
                        
                        # Search for the session directory
                        dmd_subdir = sample_folder / 'dmd'
                        if dmd_subdir.exists():
                            # Find group folder
                            group_folders = list(dmd_subdir.glob(f'{group}*'))
                            if group_folders:
                                # Find session in group
                                for gf in group_folders:
                                    session_folders = list(gf.glob('**/s*'))
                                    for sf in session_folders:
                                        session_stats = self._process_session_from_path(
                                            sf, group, sf.name, extract_frames
                                        )
                                        
                                        stats['total_samples'] += session_stats['samples']
                                        stats['extracted_frames'] += session_stats['frames']
                                        stats['sessions_processed'] += 1
                                        
                                        # Update class distribution
                                        for state, count in session_stats['class_dist'].items():
                                            stats['class_distribution'][state] = \
                                                stats['class_distribution'].get(state, 0) + count
                        
                except Exception as e:
                    error_msg = f"Error processing {sample_folder.name}: {str(e)}"
                    self.logger.error(error_msg)
                    stats['errors'].append(error_msg)
                    
            stats['groups_processed'] = len(set([sf.name.split('-')[4] for sf in sample_folders if len(sf.name.split('-')) > 4]))
        
        else:
            # Fallback to original structure (vicomtech/gA/s1/)
            for group in self.groups:
                for session in self.sessions:
                    session_path = self.dmd_dir / group / session
                    
                    if not session_path.exists():
                        self.logger.warning(f"Session path not found: {session_path}")
                        continue
                    
                    try:
                        session_stats = self._process_session(
                            group, session, extract_frames
                        )
                        
                        stats['total_samples'] += session_stats['samples']
                        stats['extracted_frames'] += session_stats['frames']
                        stats['sessions_processed'] += 1
                        
                        # Update class distribution
                        for state, count in session_stats['class_dist'].items():
                            stats['class_distribution'][state] = \
                                stats['class_distribution'].get(state, 0) + count
                        
                    except Exception as e:
                        error_msg = f"Error processing {group}/{session}: {str(e)}"
                        self.logger.error(error_msg)
                        stats['errors'].append(error_msg)
                
                stats['groups_processed'] += 1
        
        # Save metadata
        self._save_metadata(stats)
        
        self.logger.info(f"DMD processing complete. Total samples: {stats['total_samples']}")
        return stats
    
    def _process_session_from_path(
        self,
        session_path: Path,
        group: str,
        session: str,
        extract_frames: bool
    ) -> Dict[str, Any]:
        """
        Process a DMD session from a given path (handles mini-sample structure).
        
        Args:
            session_path: Full path to session directory
            group: Group identifier (gA, gB)
            session: Session identifier (s1, s2, etc.)
            extract_frames: Whether to extract frames
            
        Returns:
            Session statistics
        """
        self.logger.info(f"Processing {group}/{session} from {session_path}")
        
        stats = {
            'samples': 0,
            'frames': 0,
            'class_dist': {}
        }
        
        # Look for mosaic video
        mosaic_files = list(session_path.glob('*_rgb_mosaic.avi')) + list(session_path.glob('*_rgb_mosaic.mp4'))
        if not mosaic_files:
            self.logger.warning(f"No mosaic video found in {session_path}")
            return stats
        
        video_path = mosaic_files[0]
        
        # Look for annotation file
        annotation_files = list(session_path.glob('*_rgb_ann_*.json'))
        if not annotation_files:
            self.logger.warning(f"No annotations found in {session_path}")
            return stats
        
        annotation_path = annotation_files[0]
        
        # Process using existing logic
        return self._process_session_with_paths(
            video_path, annotation_path, group, session, extract_frames
        )
    
    def _process_session(
        self,
        group: str,
        session: str,
        extract_frames: bool
    ) -> Dict[str, Any]:
        """
        Process a single DMD session.
        
        Args:
            group: Group identifier (gA, gB)
            session: Session identifier (s1, s2)
            extract_frames: Whether to extract frames
            
        Returns:
            Session statistics
        """
        self.logger.info(f"Processing {group}/{session}...")
        
        session_path = self.dmd_dir / group / session
        video_path = session_path / 'videos' / 'mosaic.mp4'
        annotation_path = session_path / 'annotations' / 'annotations.json'
        
        return self._process_session_with_paths(
            video_path, annotation_path, group, session, extract_frames
        )
    
    def _process_session_with_paths(
        self,
        video_path: Path,
        annotation_path: Path,
        group: str,
        session: str,
        extract_frames: bool
    ) -> Dict[str, Any]:
        """
        Process DMD session with explicit video and annotation paths.
        
        Args:
            video_path: Path to video file
            annotation_path: Path to annotation JSON
            group: Group identifier
            session: Session identifier
            extract_frames: Whether to extract frames
            
        Returns:
            Session statistics
        """
        stats = {
            'samples': 0,
            'frames': 0,
            'class_dist': {}
        }
        
        # Check if files exist
        if not video_path.exists():
            self.logger.warning(f"Video not found: {video_path}")
            return stats
        
        if not annotation_path.exists():
            self.logger.warning(f"Annotations not found: {annotation_path}")
            return stats
        
        # Load annotations
        annotations = self._load_openlabel_annotations(annotation_path)
        
        # Get video info
        video_info = get_video_info(video_path)
        fps = video_info['fps']
        
        # Open video for frame extraction
        cap = None
        if extract_frames:
            cap = cv2.VideoCapture(str(video_path))
        
        # Process each activity in annotations
        for activity_data in annotations:
            activity = activity_data['activity']
            driver_state = self._map_activity_to_state(activity)
            
            # Skip if unmapped
            if driver_state == DriverState.UNKNOWN.value:
                continue
            
            # Extract frames for this activity
            start_frame = activity_data['start_frame']
            end_frame = activity_data['end_frame']
            
            # Sample frames at configured FPS
            frame_interval = max(1, int(fps / self.config.data_processing.frame_extraction_fps))
            
            for frame_num in range(start_frame, end_frame, frame_interval):
                sample = DMDSample(
                    video_path=str(video_path),
                    frame_number=frame_num,
                    timestamp=frame_num / fps,
                    activity=activity,
                    driver_state=driver_state,
                    group=group,
                    session=session,
                    annotations=activity_data
                )
                
                # Extract and save frame
                if extract_frames and cap is not None:
                    frame = self._extract_frame(cap, frame_num)
                    if frame is not None:
                        frame_path = self._save_frame(
                            frame, group, session, frame_num, driver_state
                        )
                        sample.frame_saved_path = frame_path
                        stats['frames'] += 1
                
                self.samples.append(sample)
                stats['samples'] += 1
                stats['class_dist'][driver_state] = \
                    stats['class_dist'].get(driver_state, 0) + 1
        
        if cap is not None:
            cap.release()
        
        return stats
    
    def _load_openlabel_annotations(self, annotation_path: Path) -> List[Dict[str, Any]]:
        """
        Load and parse OpenLABEL format annotations from DMD dataset.
        
        DMD uses action-based intervals rather than frame-by-frame objects.
        Structure: data['openlabel']['actions'] with frame_intervals.
        
        Args:
            annotation_path: Path to annotations JSON file
            
        Returns:
            List of activity annotations with frame intervals
        """
        try:
            data = load_json(annotation_path)
            activities = []
            
            # Parse OpenLABEL format - DMD uses 'actions' with frame_intervals
            if 'openlabel' in data and 'actions' in data['openlabel']:
                actions_data = data['openlabel']['actions']
                
                # Extract driver actions (level 6 in DMD annotation scheme)
                # These are the main distraction-related actions we want to classify
                for action_id, action_info in actions_data.items():
                    action_type = action_info.get('type', 'unknown')
                    
                    # Focus on driver_actions level (contains safe_drive, reach_side, etc.)
                    # Also include gaze actions for additional context
                    if action_type.startswith('driver_actions/') or action_type.startswith('gaze_on_road/'):
                        frame_intervals = action_info.get('frame_intervals', [])
                        
                        # Each action can have multiple frame intervals
                        for interval in frame_intervals:
                            activity = {
                                'activity': action_type,
                                'start_frame': interval.get('frame_start', 0),
                                'end_frame': interval.get('frame_end', 0),
                                'action_id': action_id,
                                'attributes': action_info.get('action_data_pointers', {})
                            }
                            activities.append(activity)
            
            self.logger.info(f"Loaded {len(activities)} activity intervals from annotations")
            return activities
            
        except Exception as e:
            self.logger.error(f"Error loading annotations: {e}")
            import traceback
            self.logger.error(traceback.format_exc())
            return []
    
    def _group_consecutive_activities(
        self,
        activities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Group consecutive frames with the same activity.
        
        Args:
            activities: List of frame-level activities
            
        Returns:
            List of grouped activities with start/end frames
        """
        if not activities:
            return []
        
        grouped = []
        current_activity = activities[0].copy()
        
        for activity in activities[1:]:
            if (activity['activity'] == current_activity['activity'] and
                activity['start_frame'] == current_activity['end_frame']):
                # Extend current activity
                current_activity['end_frame'] = activity['end_frame']
            else:
                # Save current and start new
                grouped.append(current_activity)
                current_activity = activity.copy()
        
        grouped.append(current_activity)
        return grouped
    
    def _map_activity_to_state(self, activity: str) -> str:
        """
        Map DMD activity to driver state.
        
        Args:
            activity: DMD activity name
            
        Returns:
            Driver state (alert, drowsy, distracted, unknown)
        """
        activity_lower = activity.lower().replace(' ', '_')
        
        # Try direct mapping
        if activity_lower in self.class_mapping:
            return self.class_mapping[activity_lower]
        
        # Try fuzzy matching
        for key, value in self.class_mapping.items():
            if key in activity_lower or activity_lower in key:
                return value
        
        self.logger.warning(f"Unknown activity: {activity}")
        return DriverState.UNKNOWN.value
    
    def _extract_frame(self, cap: cv2.VideoCapture, frame_num: int) -> Optional[np.ndarray]:
        """
        Extract a specific frame from video.
        
        Args:
            cap: OpenCV VideoCapture object
            frame_num: Frame number to extract
            
        Returns:
            Frame as numpy array or None if failed
        """
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        ret, frame = cap.read()
        
        if ret:
            return frame
        else:
            return None
    
    def _save_frame(
        self,
        frame: np.ndarray,
        group: str,
        session: str,
        frame_num: int,
        driver_state: str
    ) -> str:
        """
        Save extracted frame to disk.
        
        Args:
            frame: Frame image
            group: Group identifier
            session: Session identifier
            frame_num: Frame number
            driver_state: Driver state label
            
        Returns:
            Path to saved frame
        """
        # Create output directory structure
        output_dir = self.output_dir / driver_state / f"{group}_{session}"
        ensure_dir(output_dir)
        
        # Save frame
        filename = f"frame_{frame_num:06d}.jpg"
        output_path = output_dir / filename
        cv2.imwrite(str(output_path), frame)
        
        return str(output_path)
    
    def _save_metadata(self, stats: Dict[str, Any]):
        """
        Save processing metadata.
        
        Args:
            stats: Processing statistics
        """
        metadata = {
            'dataset': 'DMD',
            'stats': stats,
            'samples': [
                {
                    'video_path': s.video_path,
                    'frame_number': s.frame_number,
                    'timestamp': s.timestamp,
                    'activity': s.activity,
                    'driver_state': s.driver_state,
                    'group': s.group,
                    'session': s.session,
                    'frame_saved_path': s.frame_saved_path
                }
                for s in self.samples
            ]
        }
        
        metadata_path = self.output_dir / 'metadata.json'
        save_json(metadata, metadata_path)
        self.logger.info(f"Metadata saved to {metadata_path}")
    
    def get_samples_by_state(self, state: str) -> List[DMDSample]:
        """
        Get all samples for a specific driver state.
        
        Args:
            state: Driver state (alert, drowsy, distracted)
            
        Returns:
            List of samples
        """
        return [s for s in self.samples if s.driver_state == state]
    
    def get_class_distribution(self) -> Dict[str, int]:
        """
        Get class distribution.
        
        Returns:
            Dictionary of state: count
        """
        distribution = {}
        for sample in self.samples:
            state = sample.driver_state
            distribution[state] = distribution.get(state, 0) + 1
        return distribution


if __name__ == "__main__":
    # Test DMD processor
    processor = DMDProcessor()
    stats = processor.process_dataset(extract_frames=True)
    
    print("\n=== DMD Processing Results ===")
    print(f"Total samples: {stats['total_samples']}")
    print(f"Extracted frames: {stats['extracted_frames']}")
    print(f"Groups processed: {stats['groups_processed']}")
    print(f"Sessions processed: {stats['sessions_processed']}")
    print("\nClass distribution:")
    for state, count in stats['class_distribution'].items():
        print(f"  {state}: {count}")
