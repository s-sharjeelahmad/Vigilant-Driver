"""Quick status checker for merge progress"""
from pathlib import Path
import time

output_dir = Path("datasets/processed/merged_final")

while True:
    if output_dir.exists():
        for split in ['train', 'val', 'test']:
            split_dir = output_dir / split
            if split_dir.exists():
                print(f"\n{split.upper()}:")
                for class_dir in split_dir.iterdir():
                    if class_dir.is_dir():
                        count = len(list(class_dir.glob("*")))
                        print(f"  {class_dir.name}: {count:,} images")
    
    # Check if metadata exists (completion indicator)
    if (output_dir / 'metadata.json').exists():
        print("\n✅ MERGE COMPLETE!")
        break
    
    print("\n⏳ Still processing... (refresh in 10 seconds)")
    time.sleep(10)
