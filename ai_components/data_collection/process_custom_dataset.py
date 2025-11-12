"""
Process Custom Pakistani Dataset
Run this after collecting your local dataset
"""
from pathlib import Path
import sys

# Add ai_components to path
sys.path.insert(0, str(Path(__file__).parent))

from ai_components.data_collection.custom_data_organizer import CustomDataOrganizer
from ai_components.data_collection.feature_extractor import FacialFeatureExtractor


def process_custom_dataset():
    """
    Complete workflow for processing custom dataset:
    1. Organize collected data
    2. Extract features
    3. Generate statistics
    """
    print("="*70)
    print("CUSTOM PAKISTANI DATASET PROCESSING PIPELINE")
    print("="*70)
    
    # Step 1: Organize data (if needed)
    print("\n" + "="*70)
    print("STEP 1: Data Organization")
    print("="*70)
    print("\nIf you collected videos/photos in a messy folder structure,")
    print("you can use CustomDataOrganizer to organize them.")
    print("\nSkipping for now (assuming data is already organized)...")
    
    # Generate metadata
    print("\n📊 Generating dataset metadata...")
    organizer = CustomDataOrganizer(
        source_dir="datasets/raw/custom_collection",
        output_dir="datasets/raw/custom_pakistani"
    )
    
    dataset_path = Path("datasets/raw/custom_pakistani")
    if dataset_path.exists():
        metadata = organizer.generate_metadata()
        print(f"✅ Metadata generated: {metadata['total_images']} images")
    else:
        print("⚠️  Custom dataset not found. Will skip metadata generation.")
        print(f"   Expected location: {dataset_path}")
        print("\n   When you collect data, organize it as:")
        print("   datasets/raw/custom_pakistani/")
        print("   ├── ALERT/")
        print("   ├── DROWSY/")
        print("   └── DISTRACTED/")
    
    # Step 2: Extract features
    print("\n" + "="*70)
    print("STEP 2: Feature Extraction")
    print("="*70)
    
    if dataset_path.exists():
        print("\n🔍 Extracting facial features (EAR, MAR, head pose, occlusion)...")
        print("   This may take 5-10 minutes for 1,500 images...")
        
        extractor = FacialFeatureExtractor()
        
        features_df = extractor.extract_from_dataset(
            dataset_path=dataset_path,
            output_csv="datasets/features/custom_pakistani_features.csv"
        )
        
        if features_df is not None:
            print("\n✅ Feature extraction complete!")
            print(f"\n📊 Quick Statistics:")
            print(features_df[['class', 'avg_ear', 'mar', 'head_yaw', 
                             'face_visibility_score']].groupby('class').mean())
    else:
        print("\n⚠️  Custom dataset not found. Skipping feature extraction.")
        print("   Run this script again after you collect your data.")
    
    # Step 3: Next steps
    print("\n" + "="*70)
    print("NEXT STEPS")
    print("="*70)
    print("\n1. Analyze features:")
    print("   Run: jupyter notebook notebooks/feature_analysis.ipynb")
    print("\n2. Merge with public datasets:")
    print("   Run: python merge_datasets.py")
    print("\n3. Give merged dataset to Abrar for final training")
    print("\n" + "="*70)


if __name__ == '__main__':
    process_custom_dataset()
