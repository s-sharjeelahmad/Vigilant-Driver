"""Check merge progress"""
from pathlib import Path
import time

output_dir = Path("datasets/processed/merged_final")

print("Checking merge progress...")
print()

if output_dir.exists():
    # Check metadata
    if (output_dir / 'metadata.json').exists():
        import json
        with open(output_dir / 'metadata.json') as f:
            meta = json.load(f)
        
        print("✅ MERGE COMPLETE!")
        print()
        print("Final Statistics:")
        print(f"  Total Images: {meta['total_samples']:,}")
        print()
        print("Class Distribution:")
        for split in ['train', 'val', 'test']:
            split_data = meta['splits'][split]
            print(f"\n  {split.upper()}:")
            for class_name in ['ALERT', 'DROWSY', 'DISTRACTED']:
                if class_name in split_data:
                    print(f"    {class_name}: {split_data[class_name]:,}")
        
        print("\nDataset Contributions:")
        for source in meta['source_datasets']:
            print(f"  ✓ {source}")
    else:
        print("⏳ Still processing...")
        print()
        # Count current files
        for split in ['train', 'val', 'test']:
            split_dir = output_dir / split
            if split_dir.exists():
                print(f"{split}:")
                for class_dir in split_dir.iterdir():
                    if class_dir.is_dir():
                        count = len(list(class_dir.glob("*")))
                        print(f"  {class_dir.name}: {count:,}")
else:
    print("Merge not started yet")
