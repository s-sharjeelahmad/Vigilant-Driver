"""
Merge All Processed Datasets
=============================
Merges all internet-sourced datasets into training-ready format for Abrar.
"""

from pathlib import Path
from ai_components.data_collection.dataset_merger import DatasetMerger
from ai_components.utils.config import get_config
from ai_components.utils.helpers import save_json
import json

def main():
    print("="*70)
    print("MERGING ALL DATASETS FOR ABRAR")
    print("="*70)
    
    config = get_config()
    merger = DatasetMerger(config)
    
    processed_dir = Path("datasets/processed")
    
    # Define all available datasets
    datasets_to_merge = {
        'state_farm': str(processed_dir / 'state_farm'),
        'dmd': str(processed_dir / 'dmd'),
        'nthuddd': str(processed_dir / 'nthuddd'),
        'yawdd': str(processed_dir / 'yawdd'),
        'uta_rldd': str(processed_dir / 'uta_rldd'),
        'vicomtech_drowsy': str(processed_dir / 'vicomtech_drowsy')
    }
    
    # Check which datasets exist
    existing_datasets = {}
    for name, path in datasets_to_merge.items():
        if Path(path).exists():
            # Count files
            file_count = len(list(Path(path).rglob("*.jpg"))) + \
                        len(list(Path(path).rglob("*.png"))) + \
                        len(list(Path(path).rglob("*.jpeg")))
            
            if file_count > 0:
                existing_datasets[name] = path
                print(f"✅ Found {name}: {file_count:,} images")
            else:
                print(f"⚠️  Skipping {name}: No images found")
        else:
            print(f"⚠️  Skipping {name}: Directory not found")
    
    print(f"\n📊 Total datasets to merge: {len(existing_datasets)}")
    
    if not existing_datasets:
        print("\n❌ No datasets found to merge!")
        print("Please process datasets first.")
        return
    
    # Confirm
    print("\n" + "="*70)
    print("MERGE CONFIGURATION")
    print("="*70)
    print(f"Datasets: {', '.join(existing_datasets.keys())}")
    print(f"Output: datasets/processed/merged/")
    print(f"Splits: 70% train, 15% val, 15% test")
    print(f"Balance classes: No (keep original distribution)")
    print("\nThis will:")
    print("  1. Copy all images to merged folder")
    print("  2. Organize by class (ALERT/DROWSY/DISTRACTED)")
    print("  3. Split into train/val/test folders")
    print("  4. Create metadata.json with statistics")
    print("="*70)
    
    response = input("\n➡️  Proceed with merge? (yes/no): ").strip().lower()
    
    if response not in ['yes', 'y']:
        print("\n❌ Merge cancelled.")
        return
    
    # Merge datasets
    print("\n🚀 Starting merge process...\n")
    
    stats = merger.merge_datasets(
        dataset_paths=existing_datasets,
        output_name="merged_dataset",
        create_splits=True,
        balance=False  # Keep original distribution
    )
    
    # Create comprehensive metadata for Abrar
    print("\n📝 Creating metadata.json...")
    
    metadata = {
        "dataset_name": "vigilant_driver_merged",
        "version": "1.0",
        "created_date": "2025-10-21",
        "description": "Merged dataset from 6 public sources for driver state classification",
        "total_samples": stats['total_images'],
        "source_datasets": stats['datasets_merged'],
        "dataset_contributions": stats['dataset_contributions'],
        "class_mapping": {
            "ALERT": 0,
            "DISTRACTED": 1,
            "DROWSY": 2
        },
        "classes": ["ALERT", "DISTRACTED", "DROWSY"],
        "image_format": ["jpg", "jpeg", "png"],
        "splits": {
            "train": {
                "split_ratio": 0.70,
                "total": stats['splits']['train']['total'],
                "by_class": stats['splits']['train']['by_class']
            },
            "val": {
                "split_ratio": 0.15,
                "total": stats['splits']['val']['total'],
                "by_class": stats['splits']['val']['by_class']
            },
            "test": {
                "split_ratio": 0.15,
                "total": stats['splits']['test']['total'],
                "by_class": stats['splits']['test']['by_class']
            }
        },
        "class_distribution": stats['class_distribution'],
        "notes": [
            "This dataset is ready for training.",
            "Images are in original resolution (will be resized during training).",
            "Custom Pakistani dataset not included yet (will be added later).",
            "Use PyTorch ImageFolder or TensorFlow ImageDataGenerator to load."
        ],
        "recommended_training": {
            "input_size": [224, 224],
            "batch_size": 32,
            "epochs": 50,
            "optimizer": "Adam",
            "learning_rate": 0.001,
            "augmentation": [
                "RandomHorizontalFlip",
                "RandomRotation(10)",
                "ColorJitter",
                "RandomResizedCrop"
            ]
        }
    }
    
    # Save metadata
    metadata_path = Path("datasets/processed/merged/merged_dataset/metadata.json")
    save_json(metadata, metadata_path)
    
    # Print summary
    print("\n" + "="*70)
    print("✅ MERGE COMPLETE!")
    print("="*70)
    
    print(f"\n📊 SUMMARY:")
    print(f"  Total images: {stats['total_images']:,}")
    print(f"\n  Train: {stats['splits']['train']['total']:,} images")
    for class_name, count in stats['splits']['train']['by_class'].items():
        print(f"    - {class_name}: {count:,}")
    
    print(f"\n  Validation: {stats['splits']['val']['total']:,} images")
    for class_name, count in stats['splits']['val']['by_class'].items():
        print(f"    - {class_name}: {count:,}")
    
    print(f"\n  Test: {stats['splits']['test']['total']:,} images")
    for class_name, count in stats['splits']['test']['by_class'].items():
        print(f"    - {class_name}: {count:,}")
    
    print(f"\n📁 OUTPUT LOCATION:")
    print(f"  datasets/processed/merged/merged_dataset/")
    print(f"    ├── train/")
    print(f"    │   ├── ALERT/")
    print(f"    │   ├── DISTRACTED/")
    print(f"    │   └── DROWSY/")
    print(f"    ├── val/")
    print(f"    │   ├── ALERT/")
    print(f"    │   ├── DISTRACTED/")
    print(f"    │   └── DROWSY/")
    print(f"    ├── test/")
    print(f"    │   ├── ALERT/")
    print(f"    │   ├── DISTRACTED/")
    print(f"    │   └── DROWSY/")
    print(f"    └── metadata.json")
    
    print(f"\n📦 DATASET CONTRIBUTIONS:")
    for dataset, count in stats['dataset_contributions'].items():
        percentage = (count / stats['total_images']) * 100
        print(f"  {dataset}: {count:,} images ({percentage:.1f}%)")
    
    print(f"\n🎯 CLASS DISTRIBUTION:")
    for class_name, count in stats['class_distribution'].items():
        percentage = (count / stats['total_images']) * 100
        print(f"  {class_name}: {count:,} images ({percentage:.1f}%)")
    
    print(f"\n📝 METADATA:")
    print(f"  metadata.json created with full dataset information")
    
    print(f"\n✅ This dataset is now ready for Abrar!")
    print(f"   Transfer the 'merged_dataset' folder to him.")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    main()
