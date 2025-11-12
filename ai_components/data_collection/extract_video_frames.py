"""
Extract frames from collected videos for custom Pakistani dataset
Run this script to process all videos in datasets/raw/custom/
"""
import cv2
from pathlib import Path
from tqdm import tqdm
import sys

# Add ai_components to path
sys.path.insert(0, str(Path(__file__).parent))
from ai_components.data_collection.custom_data_organizer import CustomDataOrganizer


def get_video_info(video_path):
    """Get video metadata"""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return None
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps if fps > 0 else 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    cap.release()
    
    return {
        'fps': fps,
        'frames': frame_count,
        'duration': duration,
        'resolution': f"{width}x{height}"
    }


def process_all_videos():
    """Process all videos in datasets/raw/custom/"""
    
    print("="*70)
    print("CUSTOM DATASET VIDEO PROCESSOR")
    print("="*70)
    
    # Setup paths
    source_dir = Path("datasets/raw/custom")
    output_dir = Path("datasets/raw/custom_pakistani")
    
    if not source_dir.exists():
        print(f"\n❌ Error: Source directory not found: {source_dir}")
        return
    
    # Initialize organizer
    organizer = CustomDataOrganizer(
        source_dir=str(source_dir),
        output_dir=str(output_dir)
    )
    
    # Find all videos
    video_extensions = ['*.mp4', '*.avi', '*.mov', '*.MP4', '*.AVI', '*.MOV']
    all_videos = []
    
    for class_name in ['ALERT', 'DROWSY', 'DISTRACTED']:
        class_dir = source_dir / class_name
        if class_dir.exists():
            for ext in video_extensions:
                all_videos.extend([(v, class_name) for v in class_dir.glob(ext)])
    
    if not all_videos:
        print("\n❌ No videos found!")
        print(f"   Make sure videos are in: {source_dir}/[ALERT|DROWSY|DISTRACTED]/")
        return
    
    print(f"\n📹 Found {len(all_videos)} videos to process:")
    print()
    
    total_frames_extracted = 0
    
    # Display video info first
    for video_path, class_name in all_videos:
        info = get_video_info(video_path)
        if info:
            print(f"  📂 {class_name}/{video_path.name}")
            print(f"     Duration: {info['duration']:.1f}s | FPS: {info['fps']:.1f} | "
                  f"Frames: {info['frames']} | Resolution: {info['resolution']}")
    
    print("\n" + "="*70)
    print("EXTRACTING FRAMES (2 frames per second)")
    print("="*70)
    
    # Process each video
    for video_path, class_name in all_videos:
        print(f"\n📹 Processing: {video_path.name}")
        
        # Determine subject ID from filename
        # AlertAb.mp4 -> subject_abrar, AlertAr.mp4 -> subject_areeb
        filename_lower = video_path.stem.lower()
        
        if 'ab' in filename_lower or 'abrar' in filename_lower:
            subject_id = "abrar"
        elif 'ar' in filename_lower or 'areeb' in filename_lower:
            subject_id = "areeb"
        elif 'sy' in filename_lower or 'syed' in filename_lower:
            subject_id = "syed"
        else:
            # Generic naming
            subject_id = video_path.stem.lower().replace(class_name.lower(), "").strip('_- ')
            if not subject_id:
                subject_id = "unknown"
        
        # Determine scenario (later you can add with_shawl, with_sunglasses etc)
        scenario = "normal"
        
        # Extract frames
        frames_extracted = organizer.extract_frames_from_video(
            video_path=str(video_path),
            class_name=class_name,
            subject_id=subject_id,
            scenario=scenario,
            fps=2  # Extract 2 frames per second
        )
        
        total_frames_extracted += frames_extracted
    
    print("\n" + "="*70)
    print("EXTRACTION COMPLETE!")
    print("="*70)
    print(f"\n✅ Total frames extracted: {total_frames_extracted}")
    
    # Generate metadata
    print("\n📊 Generating metadata...")
    metadata = organizer.generate_metadata()
    
    print("\n" + "="*70)
    print("NEXT STEPS")
    print("="*70)
    print("\n1. Review extracted images:")
    print(f"   Location: {output_dir}/")
    print("\n2. Add more videos (yours + more from Abrar/Areeb):")
    print(f"   Place in: {source_dir}/[ALERT|DROWSY|DISTRACTED]/")
    print("   Then run this script again!")
    print("\n3. When you have ~1500 total images, extract features:")
    print("   Run: python process_custom_dataset.py")
    print("\n4. Then merge with public datasets:")
    print("   Run: python merge_datasets.py")
    print("="*70)


if __name__ == '__main__':
    process_all_videos()
