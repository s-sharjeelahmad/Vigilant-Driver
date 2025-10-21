"""
Create Balanced and Properly Split Dataset
"""

import shutil
from pathlib import Path
import json
import random
from collections import defaultdict
from tqdm import tqdm

# Configuration
SOURCE_DIR = Path("datasets/processed/merged_final")
OUTPUT_DIR = Path("datasets/processed/merged_balanced")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Split ratios
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

random.seed(42)  # For reproducibility

def redistribute_and_balance():
    """Redistribute all samples and balance classes"""
    
    print("\n" + "="*70)
    print("CREATING BALANCED DATASET WITH PROPER SPLITS")
    print("="*70)
    
    # Collect ALL samples from source (regardless of current split)
    all_samples = defaultdict(list)
    
    print("\n📂 Collecting all samples...")
    for split in ['train', 'val', 'test']:
        split_dir = SOURCE_DIR / split
        if not split_dir.exists():
            continue
        
        for class_name in ['ALERT', 'DROWSY', 'DISTRACTED']:
            class_dir = split_dir / class_name
            if not class_dir.exists():
                continue
            
            # Find all images
            for img_path in class_dir.glob("*.jpg"):
                all_samples[class_name].append(img_path)
            for img_path in class_dir.glob("*.png"):
                all_samples[class_name].append(img_path)
    
    # Print collection stats
    print(f"\n📊 Collected Samples:")
    for class_name, samples in all_samples.items():
        print(f"  {class_name:12s}: {len(samples):6,}")
    
    # Find minimum class size for balancing
    min_size = min(len(samples) for samples in all_samples.values())
    print(f"\n⚖️  Balancing to minimum class size: {min_size:,}")
    
    # Balance by undersampling
    balanced_samples = {}
    for class_name, samples in all_samples.items():
        random.shuffle(samples)
        balanced_samples[class_name] = samples[:min_size]
        print(f"  {class_name:12s}: {len(samples):6,} → {len(balanced_samples[class_name]):6,}")
    
    # Calculate split sizes
    train_size = int(min_size * TRAIN_RATIO)
    val_size = int(min_size * VAL_RATIO)
    test_size = min_size - train_size - val_size  # Remaining
    
    print(f"\n📂 Split Sizes (per class):")
    print(f"  Train: {train_size:,} ({TRAIN_RATIO*100:.0f}%)")
    print(f"  Val  : {val_size:,} ({VAL_RATIO*100:.0f}%)")
    print(f"  Test : {test_size:,} ({TEST_RATIO*100:.0f}%)")
    
    stats = {
        'total_samples': min_size * 3,
        'balanced': True,
        'samples_per_class': min_size,
        'splits': {
            'train': {'ALERT': 0, 'DROWSY': 0, 'DISTRACTED': 0, 'total': 0},
            'val': {'ALERT': 0, 'DROWSY': 0, 'DISTRACTED': 0, 'total': 0},
            'test': {'ALERT': 0, 'DROWSY': 0, 'DISTRACTED': 0, 'total': 0}
        }
    }
    
    # Copy files to new splits
    print(f"\n📦 Copying files to new structure...")
    for class_name, samples in balanced_samples.items():
        # Split samples
        train_samples = samples[:train_size]
        val_samples = samples[train_size:train_size+val_size]
        test_samples = samples[train_size+val_size:]
        
        # Copy train
        train_dir = OUTPUT_DIR / 'train' / class_name
        train_dir.mkdir(parents=True, exist_ok=True)
        for img_path in tqdm(train_samples, desc=f"  train/{class_name}", leave=False):
            shutil.copy2(img_path, train_dir / img_path.name)
        stats['splits']['train'][class_name] = len(train_samples)
        stats['splits']['train']['total'] += len(train_samples)
        
        # Copy val
        val_dir = OUTPUT_DIR / 'val' / class_name
        val_dir.mkdir(parents=True, exist_ok=True)
        for img_path in tqdm(val_samples, desc=f"  val/{class_name}", leave=False):
            shutil.copy2(img_path, val_dir / img_path.name)
        stats['splits']['val'][class_name] = len(val_samples)
        stats['splits']['val']['total'] += len(val_samples)
        
        # Copy test
        test_dir = OUTPUT_DIR / 'test' / class_name
        test_dir.mkdir(parents=True, exist_ok=True)
        for img_path in tqdm(test_samples, desc=f"  test/{class_name}", leave=False):
            shutil.copy2(img_path, test_dir / img_path.name)
        stats['splits']['test'][class_name] = len(test_samples)
        stats['splits']['test']['total'] += len(test_samples)
    
    # Save metadata
    metadata_path = OUTPUT_DIR / 'metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(stats, f, indent=2)
    
    # Print summary
    print("\n" + "="*70)
    print("BALANCED DATASET CREATED!")
    print("="*70)
    print(f"\n📊 Total Samples: {stats['total_samples']:,}")
    print(f"\n📁 Perfect Balance (each class):")
    print(f"  ALERT       : {min_size:6,} (33.3%)")
    print(f"  DROWSY      : {min_size:6,} (33.3%)")
    print(f"  DISTRACTED  : {min_size:6,} (33.3%)")
    
    print(f"\n📂 Split Distribution:")
    for split in ['train', 'val', 'test']:
        split_total = stats['splits'][split]['total']
        percentage = (split_total / stats['total_samples'] * 100)
        print(f"  {split:5s}: {split_total:7,} ({percentage:5.1f}%)")
        for class_name in ['ALERT', 'DROWSY', 'DISTRACTED']:
            class_count = stats['splits'][split][class_name]
            print(f"    - {class_name:12s}: {class_count:6,}")
    
    print(f"\n✅ Output Directory: {OUTPUT_DIR}")
    print(f"✅ Metadata saved: {metadata_path}")
    
    return stats

if __name__ == "__main__":
    stats = redistribute_and_balance()
    
    print("\n" + "="*70)
    print("RECOMMENDATION FOR ABRAR")
    print("="*70)
    print(f"\n📦 Give Abrar TWO options:")
    print(f"\n1️⃣  BALANCED Dataset (recommended for initial training):")
    print(f"   📁 datasets/processed/merged_balanced/")
    print(f"   ✅ Perfectly balanced classes (33.3% each)")
    print(f"   ✅ {stats['total_samples']:,} total samples")
    print(f"   ✅ Proper 70/15/15 splits")
    print(f"   ⚠️  Smaller size (due to undersampling)")
    
    print(f"\n2️⃣  FULL Dataset (for advanced training with class weights):")
    print(f"   📁 datasets/processed/merged_final/")
    print(f"   ✅ All 151,650 samples")
    print(f"   ✅ More diverse data")
    print(f"   ⚠️  Imbalanced (needs class weights)")
    
    print(f"\n💡 Suggest: Start with balanced, then try full dataset")
    print("="*70 + "\n")
