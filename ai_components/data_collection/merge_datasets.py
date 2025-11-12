"""
Simple Dataset Merger - Creates train/val/test splits with proper format
"""
import shutil
from pathlib import Path
import json
import random
from collections import defaultdict
from tqdm import tqdm

# Set random seed for reproducibility
random.seed(42)

# Paths
PROCESSED_DIR = Path("datasets/processed")
OUTPUT_DIR = Path("datasets/processed/merged_final")

# Class mapping (standardize all to these 3 classes)
CLASS_MAPPING = {
    'alert': 'ALERT',
    'drowsy': 'DROWSY', 
    'distracted': 'DISTRACTED',
    'notdrowsy': 'ALERT',  # NTHUDDD uses this
    'active': 'ALERT',  # UTA-RLDD uses this
    'fatigue': 'DROWSY',  # UTA-RLDD uses this
}

# Dataset configurations (simplified - structure doesn't matter now)
DATASETS = {
    'state_farm': {'path': PROCESSED_DIR / 'state_farm'},
    'dmd': {'path': PROCESSED_DIR / 'dmd'},
    'nthuddd': {'path': PROCESSED_DIR / 'nthuddd'},
    'yawdd': {'path': PROCESSED_DIR / 'yawdd'},
    'uta_rldd': {'path': PROCESSED_DIR / 'uta_rldd'},
    'vicomtech_drowsy': {'path': PROCESSED_DIR / 'vicomtech_drowsy'},
    'custom_pakistani': {'path': Path('datasets/raw/custom_pakistani')}  # Our custom dataset!
}

def collect_images_from_dataset(dataset_name, dataset_info):
    """Collect all images from a dataset organized by class - ignore existing splits, collect all"""
    images_by_class = defaultdict(list)
    dataset_path = dataset_info['path']
    
    if not dataset_path.exists():
        print(f"⚠️  Dataset not found: {dataset_name} at {dataset_path}")
        return images_by_class
    
    print(f"\n📂 Processing {dataset_name}...")
    
    # For all datasets, recursively find all images and organize by their parent folder name
    # This works for flat, nested, and split structures
    for img_path in dataset_path.rglob("*.jpg"):
        # Get the immediate parent folder name (should be a class name)
        parent_name = img_path.parent.name.lower()
        
        # Map to standard class
        if parent_name in CLASS_MAPPING:
            standard_class = CLASS_MAPPING[parent_name]
            images_by_class[standard_class].append({
                'path': img_path,
                'source': dataset_name
            })
    
    # Also check for png and jpeg
    for ext in ['*.png', '*.jpeg']:
        for img_path in dataset_path.rglob(ext):
            parent_name = img_path.parent.name.lower()
            if parent_name in CLASS_MAPPING:
                standard_class = CLASS_MAPPING[parent_name]
                # Avoid duplicates
                if not any(d['path'] == img_path for d in images_by_class[standard_class]):
                    images_by_class[standard_class].append({
                        'path': img_path,
                        'source': dataset_name
                    })
    
    for class_name, imgs in images_by_class.items():
        print(f"  {class_name}: {len(imgs)} images")
    
    return images_by_class

def split_data(images_list, train_ratio=0.7, val_ratio=0.15, test_ratio=0.15):
    """Split images into train/val/test"""
    random.shuffle(images_list)
    
    total = len(images_list)
    train_end = int(total * train_ratio)
    val_end = train_end + int(total * val_ratio)
    
    return {
        'train': images_list[:train_end],
        'val': images_list[train_end:val_end],
        'test': images_list[val_end:]
    }

def copy_images(splits, output_dir):
    """Copy images to final structure"""
    stats = defaultdict(lambda: defaultdict(int))
    
    for split_name, classes in splits.items():
        print(f"\n📋 Copying {split_name} split...")
        
        for class_name, images in classes.items():
            dest_dir = output_dir / split_name / class_name
            dest_dir.mkdir(parents=True, exist_ok=True)
            
            for idx, img_info in enumerate(tqdm(images, desc=f"  {class_name}")):
                src_path = img_info['path']
                source = img_info['source']
                
                # Create unique filename: source_classname_originalname
                new_name = f"{source}_{class_name.lower()}_{src_path.name}"
                dest_path = dest_dir / new_name
                
                # Copy image
                shutil.copy2(src_path, dest_path)
                
                # Update stats
                stats[split_name][class_name] += 1
                stats['sources'][source] += 1
    
    return stats

def main():
    print("="*60)
    print("CREATING FINAL MERGED DATASET")
    print("="*60)
    
    # Step 1: Collect all images from all datasets
    print("\n🔍 Step 1: Collecting images from all datasets...")
    all_images = defaultdict(list)
    source_stats = defaultdict(int)
    
    for dataset_name, dataset_info in DATASETS.items():
        images = collect_images_from_dataset(dataset_name, dataset_info)
        for class_name, img_list in images.items():
            all_images[class_name].extend(img_list)
            source_stats[dataset_name] += len(img_list)
    
    # Print collection summary
    print("\n📊 Collection Summary:")
    total = 0
    for class_name in ['ALERT', 'DROWSY', 'DISTRACTED']:
        count = len(all_images[class_name])
        total += count
        print(f"  {class_name}: {count:,} images")
    print(f"  TOTAL: {total:,} images")
    
    if total == 0:
        print("\n❌ No images found! Check dataset paths.")
        return
    
    # Step 2: Split each class into train/val/test
    print("\n✂️  Step 2: Splitting into train/val/test (70/15/15)...")
    splits = {
        'train': defaultdict(list),
        'val': defaultdict(list),
        'test': defaultdict(list)
    }
    
    for class_name, images in all_images.items():
        class_splits = split_data(images, train_ratio=0.7, val_ratio=0.15, test_ratio=0.15)
        
        splits['train'][class_name] = class_splits['train']
        splits['val'][class_name] = class_splits['val']
        splits['test'][class_name] = class_splits['test']
        
        print(f"  {class_name}:")
        print(f"    Train: {len(class_splits['train'])}, Val: {len(class_splits['val'])}, Test: {len(class_splits['test'])}")
    
    # Step 3: Copy images to final structure
    print("\n📁 Step 3: Creating final directory structure...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    stats = copy_images(splits, OUTPUT_DIR)
    
    # Step 4: Create metadata
    print("\n📝 Step 4: Creating metadata...")
    metadata = {
        'dataset_name': 'Vigilant Driver - Merged Dataset',
        'version': '1.0',
        'created_date': '2025-10-21',
        'total_samples': sum(stats['train'].values()) + sum(stats['val'].values()) + sum(stats['test'].values()),
        'splits': {
            'train': dict(stats['train']),
            'val': dict(stats['val']),
            'test': dict(stats['test'])
        },
        'source_datasets': list(DATASETS.keys()),
        'source_contributions': dict(stats['sources']),
        'class_mapping': {
            'ALERT': 0,
            'DISTRACTED': 1,
            'DROWSY': 2
        },
        'image_format': 'jpg/png',
        'split_ratio': {
            'train': 0.7,
            'val': 0.15,
            'test': 0.15
        }
    }
    
    # Save metadata
    with open(OUTPUT_DIR / 'metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print("\n" + "="*60)
    print("✅ MERGE COMPLETE!")
    print("="*60)
    print(f"\n📂 Output Location: {OUTPUT_DIR}")
    print(f"\n📊 Final Dataset Statistics:")
    print(f"  Total Images: {metadata['total_samples']:,}")
    print(f"\n  Train Split ({sum(stats['train'].values()):,} images):")
    for class_name, count in stats['train'].items():
        print(f"    {class_name}: {count:,}")
    print(f"\n  Validation Split ({sum(stats['val'].values()):,} images):")
    for class_name, count in stats['val'].items():
        print(f"    {class_name}: {count:,}")
    print(f"\n  Test Split ({sum(stats['test'].values()):,} images):")
    for class_name, count in stats['test'].items():
        print(f"    {class_name}: {count:,}")
    
    print(f"\n📦 Source Dataset Contributions:")
    for source, count in sorted(stats['sources'].items()):
        print(f"    {source}: {count:,} images")
    
    print("\n✨ Ready to transfer to Abrar!")
    print(f"   Give him the folder: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
