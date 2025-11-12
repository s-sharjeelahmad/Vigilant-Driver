"""
Custom Pakistani Dataset Organizer
Helps organize collected photos/videos into proper structure
"""
import cv2
from pathlib import Path
import shutil
from datetime import datetime
import json


class CustomDataOrganizer:
    """Organize custom collected data into proper folder structure"""
    
    def __init__(self, source_dir, output_dir="datasets/raw/custom_pakistani"):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.classes = ['ALERT', 'DROWSY', 'DISTRACTED']
        
        # Create output structure
        for class_name in self.classes:
            (self.output_dir / class_name).mkdir(parents=True, exist_ok=True)
    
    def extract_frames_from_video(self, video_path, class_name, subject_id, 
                                   scenario='normal', fps=2):
        """
        Extract frames from video for data collection
        
        Args:
            video_path: Path to video file
            class_name: 'ALERT', 'DROWSY', or 'DISTRACTED'
            subject_id: Unique subject identifier (e.g., 'subject01')
            scenario: 'normal', 'with_shawl', 'with_sunglasses', 'low_light', etc.
            fps: Frames per second to extract (default 2 = 1 frame every 0.5 sec)
        """
        video_path = Path(video_path)
        cap = cv2.VideoCapture(str(video_path))
        
        if not cap.isOpened():
            print(f"❌ Error: Could not open video {video_path}")
            return 0
        
        video_fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = int(video_fps / fps)
        
        frame_count = 0
        saved_count = 0
        
        print(f"📹 Processing video: {video_path.name}")
        print(f"   FPS: {video_fps}, Extracting every {frame_interval} frames")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Save frame at intervals
            if frame_count % frame_interval == 0:
                # Generate filename
                filename = f"{subject_id}_{class_name.lower()}_{scenario}_{saved_count:04d}.jpg"
                output_path = self.output_dir / class_name / filename
                
                # Save frame
                cv2.imwrite(str(output_path), frame)
                saved_count += 1
            
            frame_count += 1
        
        cap.release()
        print(f"✅ Extracted {saved_count} frames from {video_path.name}")
        return saved_count
    
    def organize_photos(self, photos_dir, class_name, subject_id, scenario='normal'):
        """
        Copy and rename photos from a directory
        
        Args:
            photos_dir: Directory containing photos
            class_name: 'ALERT', 'DROWSY', or 'DISTRACTED'
            subject_id: Unique subject identifier
            scenario: Scenario type
        """
        photos_dir = Path(photos_dir)
        
        if not photos_dir.exists():
            print(f"❌ Error: Directory {photos_dir} not found")
            return 0
        
        # Get all image files
        image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
        image_files = []
        for ext in image_extensions:
            image_files.extend(list(photos_dir.glob(ext)))
        
        if not image_files:
            print(f"⚠️  No images found in {photos_dir}")
            return 0
        
        print(f"📸 Found {len(image_files)} images in {photos_dir}")
        
        copied_count = 0
        for idx, img_path in enumerate(sorted(image_files)):
            # Generate filename
            filename = f"{subject_id}_{class_name.lower()}_{scenario}_{idx:04d}.jpg"
            output_path = self.output_dir / class_name / filename
            
            # Copy and rename
            shutil.copy2(img_path, output_path)
            copied_count += 1
        
        print(f"✅ Copied {copied_count} images")
        return copied_count
    
    def generate_metadata(self):
        """Generate metadata.json for the custom dataset"""
        metadata = {
            'dataset_name': 'Custom Pakistani Driver Dataset',
            'collection_date': datetime.now().strftime('%Y-%m-%d'),
            'description': 'Locally collected dataset with Pakistani context',
            'classes': {},
            'total_images': 0,
            'special_scenarios': {
                'with_shawl': 0,
                'with_sunglasses': 0,
                'with_cap': 0,
                'low_light': 0,
                'bright_sunlight': 0,
                'indoor': 0
            }
        }
        
        # Count images per class
        for class_name in self.classes:
            class_dir = self.output_dir / class_name
            image_count = len(list(class_dir.glob('*.jpg')))
            metadata['classes'][class_name] = image_count
            metadata['total_images'] += image_count
            
            # Count special scenarios
            for scenario in metadata['special_scenarios'].keys():
                scenario_count = len(list(class_dir.glob(f'*_{scenario}_*.jpg')))
                metadata['special_scenarios'][scenario] += scenario_count
        
        # Save metadata
        metadata_path = self.output_dir / 'metadata.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\n📊 Dataset Statistics:")
        print(f"   Total Images: {metadata['total_images']}")
        for class_name, count in metadata['classes'].items():
            print(f"   {class_name}: {count}")
        print(f"\n📋 Special Scenarios:")
        for scenario, count in metadata['special_scenarios'].items():
            if count > 0:
                print(f"   {scenario}: {count}")
        
        print(f"\n✅ Metadata saved to: {metadata_path}")
        return metadata


def main():
    """Example usage"""
    organizer = CustomDataOrganizer(
        source_dir="datasets/raw/custom_collection",
        output_dir="datasets/raw/custom_pakistani"
    )
    
    print("="*60)
    print("CUSTOM DATASET ORGANIZER")
    print("="*60)
    print("\nThis script helps organize your collected data.")
    print("\nUsage Examples:")
    print("\n1. Extract frames from video:")
    print("   organizer.extract_frames_from_video(")
    print("       'path/to/video.mp4',")
    print("       class_name='ALERT',")
    print("       subject_id='subject01',")
    print("       scenario='normal',")
    print("       fps=2  # Extract 2 frames per second")
    print("   )")
    print("\n2. Organize photos from folder:")
    print("   organizer.organize_photos(")
    print("       'path/to/photos/',")
    print("       class_name='DROWSY',")
    print("       subject_id='subject02',")
    print("       scenario='with_shawl'")
    print("   )")
    print("\n3. Generate metadata:")
    print("   organizer.generate_metadata()")
    print("\n" + "="*60)


if __name__ == '__main__':
    main()
