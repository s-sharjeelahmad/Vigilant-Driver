"""
Complete Pipeline Runner
========================
Main script to run the complete Vigilant Driver pipeline.

Usage:
    python run_complete_pipeline.py --mode [process|train|demo]
"""

import argparse
import sys
from pathlib import Path
import logging

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from ai_components.utils.config import get_config
from ai_components.utils.helpers import setup_logging
from ai_components.data_collection.dmd_processor import DMDProcessor
from ai_components.data_collection.state_farm_processor import StateFarmProcessor
from ai_components.data_collection.dataset_analyzer import DatasetAnalyzer
from ai_components.data_collection.dataset_merger import DatasetMerger
from ai_components.data_collection.feature_pipeline import FeaturePipeline


def process_datasets():
    """Process all datasets (DMD + State Farm)."""
    print("\n" + "="*60)
    print("STEP 1: Processing Datasets")
    print("="*60)
    
    config = get_config()
    
    # Process DMD Dataset
    print("\n[1/2] Processing Vicomtech DMD Dataset...")
    dmd_processor = DMDProcessor(config)
    dmd_stats = dmd_processor.process_dataset(extract_frames=True)
    
    print("\nDMD Processing Results:")
    print(f"  Total samples: {dmd_stats['total_samples']}")
    print(f"  Extracted frames: {dmd_stats['extracted_frames']}")
    print(f"  Class distribution: {dmd_stats['class_distribution']}")
    
    # Process State Farm Dataset
    print("\n[2/2] Processing State Farm Dataset...")
    sf_processor = StateFarmProcessor(config)
    sf_stats = sf_processor.process_dataset(preprocess_images=True)
    
    print("\nState Farm Processing Results:")
    print(f"  Total samples: {sf_stats['total_samples']}")
    print(f"  Preprocessed images: {sf_stats['preprocessed_images']}")
    print(f"  Class distribution: {sf_stats['class_distribution']}")
    
    return dmd_stats, sf_stats


def analyze_datasets():
    """Analyze processed datasets."""
    print("\n" + "="*60)
    print("STEP 2: Analyzing Datasets")
    print("="*60)
    
    config = get_config()
    analyzer = DatasetAnalyzer(config)
    
    # Analyze DMD
    print("\n[1/2] Analyzing DMD Dataset...")
    dmd_path = config.paths.processed_data_dir / 'dmd'
    if dmd_path.exists():
        dmd_analysis = analyzer.analyze_dataset(str(dmd_path), 'DMD')
        print(f"  Total images: {dmd_analysis['total_images']}")
        print(f"  Balanced: {dmd_analysis['balance_metrics']['is_balanced']}")
        print(f"  Recommendations: {dmd_analysis['recommendations']}")
    
    # Analyze State Farm
    print("\n[2/2] Analyzing State Farm Dataset...")
    sf_path = config.paths.processed_data_dir / 'state_farm'
    if sf_path.exists():
        sf_analysis = analyzer.analyze_dataset(str(sf_path), 'StateFarm')
        print(f"  Total images: {sf_analysis['total_images']}")
        print(f"  Balanced: {sf_analysis['balance_metrics']['is_balanced']}")


def merge_datasets():
    """Merge all datasets into training-ready format."""
    print("\n" + "="*60)
    print("STEP 3: Merging Datasets")
    print("="*60)
    
    config = get_config()
    merger = DatasetMerger(config)
    
    # Define datasets to merge
    datasets = {
        'dmd': str(config.paths.processed_data_dir / 'dmd'),
        'state_farm': str(config.paths.processed_data_dir / 'state_farm')
    }
    
    # Check which datasets exist
    existing_datasets = {
        name: path for name, path in datasets.items()
        if Path(path).exists()
    }
    
    if not existing_datasets:
        print("⚠️  No processed datasets found. Run with --mode process first.")
        return None
    
    print(f"\nMerging datasets: {list(existing_datasets.keys())}")
    merge_stats = merger.merge_datasets(
        existing_datasets,
        output_name="merged_dataset",
        create_splits=True,
        balance=False
    )
    
    print("\nMerge Results:")
    print(f"  Total images: {merge_stats['total_images']}")
    print(f"  Class distribution: {merge_stats['class_distribution']}")
    print(f"  Train samples: {merge_stats['splits']['train']['total']}")
    print(f"  Val samples: {merge_stats['splits']['val']['total']}")
    print(f"  Test samples: {merge_stats['splits']['test']['total']}")
    
    return merge_stats


def extract_features():
    """Extract features from merged dataset."""
    print("\n" + "="*60)
    print("STEP 4: Extracting Features")
    print("="*60)
    
    config = get_config()
    pipeline = FeaturePipeline(config)
    
    merged_path = config.paths.processed_data_dir / 'merged' / 'merged_dataset' / 'train'
    
    if not merged_path.exists():
        print("⚠️  Merged dataset not found. Run merge step first.")
        return None
    
    print("\nExtracting features from training data...")
    features = pipeline.extract_features_from_dataset(
        str(merged_path),
        'merged_train',
        use_cache=True
    )
    
    print(f"\nFeature Extraction Results:")
    print(f"  Total processed: {features['total_processed']}")
    print(f"  Features shape: {features['features'].shape}")
    print(f"  Errors: {features['errors']}")
    
    return features


def run_demo():
    """Run real-time demo with webcam."""
    print("\n" + "="*60)
    print("DEMO MODE - Use collect_data.py for data collection")
    print("="*60)
    print("\n⚠️  Demo mode removed (feature_extraction cleaned up)")
    print("\nFor live camera data collection, use:")
    print("  python collect_data.py")
    print("\nFor model inference after training:")
    print("  Abrar will implement model inference script")


def main():
    """Main pipeline execution."""
    parser = argparse.ArgumentParser(
        description="Vigilant Driver - Complete Pipeline Runner"
    )
    parser.add_argument(
        '--mode',
        type=str,
        choices=['process', 'analyze', 'merge', 'features', 'all', 'demo'],
        default='all',
        help='Pipeline mode to run'
    )
    
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("VIGILANT DRIVER - AI-Based Driver Monitoring System")
    print("="*60)
    print(f"Mode: {args.mode.upper()}")
    
    try:
        if args.mode == 'process':
            process_datasets()
        
        elif args.mode == 'analyze':
            analyze_datasets()
        
        elif args.mode == 'merge':
            merge_datasets()
        
        elif args.mode == 'features':
            extract_features()
        
        elif args.mode == 'all':
            # Run complete pipeline
            print("\n🚀 Running complete pipeline...")
            
            # Check if datasets exist
            config = get_config()
            dmd_exists = (config.paths.dmd_raw_dir).exists()
            sf_exists = (config.paths.state_farm_raw_dir).exists()
            
            if not dmd_exists and not sf_exists:
                print("\n⚠️  WARNING: No raw datasets found!")
                print("\nPlease place datasets in:")
                print(f"  DMD: {config.paths.dmd_raw_dir}")
                print(f"  State Farm: {config.paths.state_farm_raw_dir}")
                return
            
            # Run pipeline steps
            process_datasets()
            analyze_datasets()
            merge_datasets()
            extract_features()
            
            print("\n" + "="*60)
            print("✅ PIPELINE COMPLETE!")
            print("="*60)
            print("\nNext steps:")
            print("1. Review analysis results in datasets/processed/analysis/")
            print("2. Train model using ai_components/model_training/")
            print("3. Run demo: python run_complete_pipeline.py --mode demo")
        
        elif args.mode == 'demo':
            run_demo()
        
        print("\n✅ Done!")
    
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(0)
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
