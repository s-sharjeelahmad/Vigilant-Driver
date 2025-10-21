"""
Enhanced Dataset Merger for All Processed Datasets
Handles datasets with existing train/val/test splits
"""

import shutil
from pathlib import Path
from collections import defaultdict
import json
from tqdm import tqdm

# Configuration
PROCESSED_DIR = Path("datasets/processed")
OUTPUT_DIR = Path("datasets/processed/merged_final")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Dataset paths (check which ones exist)
DATASETS = {
    'state_farm': PROCESSED_DIR / 'state_farm',
    'dmd': PROCESSED_DIR / 'dmd',
    'nthuddd': PROCESSED_DIR / 'nthuddd',
    'yawdd': PROCESSED_DIR / 'yawdd',
    'uta_rldd': PROCESSED_DIR / 'uta_rldd',
    'vicomtech_drowsy': PROCESSED_DIR / 'vicomtech_drowsy'
}

# Class mapping (normalize all to standard names)
CLASS_MAPPING = {
    'alert': 'ALERT',
    'drowsy': 'DROWSY',
    'distracted': 'DISTRACTED',
    'ALERT': 'ALERT',
    'DROWSY': 'DROWSY',
    'DISTRACTED': 'DISTRACTED'
}

def copy_images(src_dir, dest_dir, dataset_name, split_name, class_name):
    """Copy images from source to destination with progress bar"""
    src_dir = Path(src_dir)
    dest_dir = Path(dest_dir)
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    # Find all images (recursively to handle nested folders like DMD)
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
    image_files = []
    for ext in image_extensions:
        image_files.extend(src_dir.rglob(ext))  # Changed from glob to rglob for recursive search
    
    copied = 0
    for img_path in tqdm(image_files, desc=f"  {dataset_name}/{split_name}/{class_name}", leave=False):
        # Create unique filename to avoid conflicts
        new_name = f"{dataset_name}_{img_path.stem}{img_path.suffix}"
        dest_path = dest_dir / new_name
        
        # Copy if not exists (to avoid duplicates)
        if not dest_path.exists():
            shutil.copy2(img_path, dest_path)
            copied += 1
    
    return copied

def merge_datasets():
    """Merge all processed datasets into unified structure"""
    
    print("\n" + "="*70)
    print("MERGING ALL PROCESSED DATASETS")
    print("="*70)
    
    stats = {
        'total_samples': 0,
        'splits': {
            'train': {'ALERT': 0, 'DROWSY': 0, 'DISTRACTED': 0, 'total': 0},
            'val': {'ALERT': 0, 'DROWSY': 0, 'DISTRACTED': 0, 'total': 0},
            'test': {'ALERT': 0, 'DROWSY': 0, 'DISTRACTED': 0, 'total': 0}
        },
        'dataset_contributions': {},
        'class_totals': {'ALERT': 0, 'DROWSY': 0, 'DISTRACTED': 0}
    }
    
    # Process each dataset
    for dataset_name, dataset_path in DATASETS.items():
        if not dataset_path.exists():
            print(f"\n⚠️  Skipping {dataset_name} (not found)")
            continue
        
        print(f"\n📂 Processing: {dataset_name}")
        dataset_stats = {'train': 0, 'val': 0, 'test': 0}
        
        # Check if dataset has splits or flat structure
        has_splits = (dataset_path / 'train').exists()
        
        if has_splits:
            # Dataset has train/val/test splits
            for split in ['train', 'val', 'test']:
                split_dir = dataset_path / split
                if not split_dir.exists():
                    continue
                
                # Process each class in this split
                for class_dir in split_dir.iterdir():
                    if not class_dir.is_dir():
                        continue
                    
                    class_name_orig = class_dir.name
                    class_name = CLASS_MAPPING.get(class_name_orig, class_name_orig.upper())
                    
                    if class_name not in ['ALERT', 'DROWSY', 'DISTRACTED']:
                        print(f"  ⚠️  Unknown class: {class_name_orig}, skipping")
                        continue
                    
                    # Copy images
                    output_split_dir = OUTPUT_DIR / split / class_name
                    count = copy_images(class_dir, output_split_dir, dataset_name, split, class_name)
                    
                    stats['splits'][split][class_name] += count
                    stats['splits'][split]['total'] += count
                    stats['class_totals'][class_name] += count
                    dataset_stats[split] += count
        
        else:
            # Flat structure (no splits) - treat as training data
            print(f"  📁 No splits found, treating as training data")
            for class_dir in dataset_path.iterdir():
                if not class_dir.is_dir() or class_dir.name == '__pycache__':
                    continue
                
                class_name_orig = class_dir.name
                class_name = CLASS_MAPPING.get(class_name_orig, class_name_orig.upper())
                
                if class_name not in ['ALERT', 'DROWSY', 'DISTRACTED']:
                    continue
                
                # Copy to train split
                output_split_dir = OUTPUT_DIR / 'train' / class_name
                count = copy_images(class_dir, output_split_dir, dataset_name, 'train', class_name)
                
                stats['splits']['train'][class_name] += count
                stats['splits']['train']['total'] += count
                stats['class_totals'][class_name] += count
                dataset_stats['train'] += count
        
        # Record dataset contribution
        total_from_dataset = sum(dataset_stats.values())
        stats['dataset_contributions'][dataset_name] = {
            'total': total_from_dataset,
            'by_split': dataset_stats
        }
        print(f"  ✅ Contributed {total_from_dataset:,} samples")
    
    # Calculate total
    stats['total_samples'] = sum(stats['class_totals'].values())
    
    # Save metadata
    metadata_path = OUTPUT_DIR / 'metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(stats, f, indent=2)
    
    # Print summary
    print("\n" + "="*70)
    print("MERGE COMPLETE!")
    print("="*70)
    print(f"\n📊 Total Samples: {stats['total_samples']:,}")
    print(f"\n📁 Class Distribution:")
    for class_name, count in stats['class_totals'].items():
        percentage = (count / stats['total_samples'] * 100) if stats['total_samples'] > 0 else 0
        print(f"  {class_name:12s}: {count:7,} ({percentage:5.1f}%)")
    
    print(f"\n📂 Split Distribution:")
    for split in ['train', 'val', 'test']:
        split_total = stats['splits'][split]['total']
        if split_total > 0:
            percentage = (split_total / stats['total_samples'] * 100)
            print(f"  {split:5s}: {split_total:7,} ({percentage:5.1f}%)")
            for class_name in ['ALERT', 'DROWSY', 'DISTRACTED']:
                class_count = stats['splits'][split][class_name]
                if class_count > 0:
                    print(f"    - {class_name:12s}: {class_count:6,}")
    
    print(f"\n📦 Dataset Contributions:")
    for dataset_name, contrib in stats['dataset_contributions'].items():
        print(f"  {dataset_name:20s}: {contrib['total']:7,} samples")
    
    print(f"\n✅ Output Directory: {OUTPUT_DIR}")
    print(f"✅ Metadata saved: {metadata_path}")
    
    # Check for class imbalance
    print(f"\n⚖️  Class Balance Analysis:")
    max_count = max(stats['class_totals'].values())
    min_count = min(stats['class_totals'].values())
    imbalance_ratio = max_count / min_count if min_count > 0 else float('inf')
    
    if imbalance_ratio > 3:
        print(f"  ⚠️  WARNING: Significant class imbalance detected!")
        print(f"     Ratio: {imbalance_ratio:.2f}:1")
        print(f"     Consider using class weights during training")
    else:
        print(f"  ✅ Classes are reasonably balanced (ratio: {imbalance_ratio:.2f}:1)")
    
    return stats

if __name__ == "__main__":
    merge_datasets()
    print("\n🎉 All done! Ready to transfer to Abrar!\n")
