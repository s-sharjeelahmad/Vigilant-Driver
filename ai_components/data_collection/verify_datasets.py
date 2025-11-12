"""Verify all datasets have data"""
from pathlib import Path

processed_dir = Path("datasets/processed")

datasets = ['state_farm', 'dmd', 'nthuddd', 'yawdd', 'uta_rldd', 'vicomtech_drowsy']

print("Dataset Verification:")
print("=" * 60)

for dataset_name in datasets:
    dataset_path = processed_dir / dataset_name
    if dataset_path.exists():
        jpg_count = len(list(dataset_path.rglob("*.jpg")))
        png_count = len(list(dataset_path.rglob("*.png")))
        jpeg_count = len(list(dataset_path.rglob("*.jpeg")))
        total = jpg_count + png_count + jpeg_count
        print(f"{dataset_name:20} : {total:,} images")
    else:
        print(f"{dataset_name:20} : NOT FOUND")

print("=" * 60)
