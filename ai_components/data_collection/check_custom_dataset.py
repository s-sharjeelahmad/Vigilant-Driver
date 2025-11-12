"""
Quick check of custom dataset status
"""
from pathlib import Path
import json

def check_dataset_status():
    """Display current custom dataset status"""
    
    print("="*70)
    print("CUSTOM DATASET STATUS CHECK")
    print("="*70)
    
    # Check extracted images
    output_dir = Path("datasets/raw/custom_pakistani")
    
    if not output_dir.exists():
        print("\n❌ Custom dataset not found!")
        print("   Run: python extract_video_frames.py")
        return
    
    # Count images per class
    total = 0
    for class_name in ['ALERT', 'DROWSY', 'DISTRACTED']:
        class_dir = output_dir / class_name
        if class_dir.exists():
            count = len(list(class_dir.glob('*.jpg')))
            total += count
            
            # Calculate progress
            target = 500
            progress = (count / target) * 100
            bar_length = 30
            filled = int(bar_length * count / target)
            bar = '█' * filled + '░' * (bar_length - filled)
            
            print(f"\n{class_name:12} [{bar}] {count:4}/{target} ({progress:.1f}%)")
        else:
            print(f"\n{class_name:12} [{'░' * 30}]    0/500 (0.0%)")
    
    print(f"\n{'─'*70}")
    total_target = 1500
    total_progress = (total / total_target) * 100
    remaining = total_target - total
    
    print(f"TOTAL:       {total:4}/{total_target} images ({total_progress:.1f}% complete)")
    print(f"REMAINING:   ~{remaining} images needed")
    
    # Check metadata
    metadata_path = output_dir / 'metadata.json'
    if metadata_path.exists():
        with open(metadata_path) as f:
            metadata = json.load(f)
        
        print(f"\n📊 Collection Date: {metadata.get('collection_date', 'N/A')}")
        
        # Check special scenarios
        special = metadata.get('special_scenarios', {})
        if any(special.values()):
            print(f"\n📋 Special Scenarios:")
            for scenario, count in special.items():
                if count > 0:
                    print(f"   {scenario}: {count} images")
        else:
            print(f"\n⚠️  No special scenarios yet!")
            print(f"   Remember to collect:")
            print(f"   - Images with shawl/dupatta (jury requirement!)")
            print(f"   - Images with sunglasses")
    
    # Estimate videos needed
    print(f"\n{'─'*70}")
    print(f"RECOMMENDATIONS:")
    
    if total < 500:
        videos_needed = ((1500 - total) // 100) + 1
        print(f"   📹 Record ~{videos_needed} more videos (60 seconds each)")
        print(f"   📸 This will give you ~{videos_needed * 120} more frames")
    elif total < 1000:
        videos_needed = ((1500 - total) // 100) + 1
        print(f"   📹 Record ~{videos_needed} more videos (60 seconds each)")
        print(f"   📸 Almost there! This will complete your dataset")
    elif total < 1500:
        videos_needed = ((1500 - total) // 100) + 1
        print(f"   📹 Record ~{videos_needed} final videos")
        print(f"   ✅ You're very close!")
    else:
        print(f"   ✅ Dataset complete!")
        print(f"   📊 Ready for feature extraction")
        print(f"   Run: python process_custom_dataset.py")
    
    print(f"\n{'─'*70}")
    print(f"NEXT STEP: Place more videos in datasets/raw/custom/[CLASS]/")
    print(f"           Then run: python extract_video_frames.py")
    print("="*70)


if __name__ == '__main__':
    check_dataset_status()
