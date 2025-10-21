"""
Dataset Merger
==============
Merges multiple datasets into a unified training dataset.
"""

import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Optional
import logging
import shutil
from tqdm import tqdm

from ..utils.config import get_config
from ..utils.helpers import setup_logging, ensure_dir, save_json, split_data
from ..utils.constants import DriverState, DatasetType


class DatasetMerger:
    """
    Merges datasets from different sources into a unified format.
    
    Features:
        - Merge DMD, State Farm, and custom datasets
        - Handle label mapping and standardization
        - Create train/val/test splits
        - Balance merged dataset
    """
    
    def __init__(self, config=None):
        """
        Initialize dataset merger.
        
        Args:
            config: Configuration object
        """
        self.config = config or get_config()
        self.logger = setup_logging(
            log_level=self.config.log_level,
            log_file=str(self.config.paths.logs_dir / 'dataset_merger.log')
        )
        
        self.processed_dir = self.config.paths.processed_data_dir
        self.merged_dir = self.processed_dir / 'merged'
        ensure_dir(self.merged_dir)
    
    def merge_datasets(
        self,
        dataset_paths: Dict[str, str],
        output_name: str = "merged_dataset",
        create_splits: bool = True,
        balance: bool = False
    ) -> Dict[str, Any]:
        """
        Merge multiple datasets into one.
        
        Args:
            dataset_paths: Dictionary of dataset_name: path
            output_name: Name for merged dataset
            create_splits: Whether to create train/val/test splits
            balance: Whether to balance classes
            
        Returns:
            Merge statistics
        """
        self.logger.info(f"Merging {len(dataset_paths)} datasets into {output_name}")
        
        output_dir = self.merged_dir / output_name
        ensure_dir(output_dir)
        
        stats = {
            'datasets_merged': list(dataset_paths.keys()),
            'total_images': 0,
            'class_distribution': {},
            'dataset_contributions': {},
            'splits': {}
        }
        
        # Collect all samples
        all_samples = []
        
        for dataset_name, dataset_path in dataset_paths.items():
            self.logger.info(f"Processing dataset: {dataset_name}")
            
            dataset_path = Path(dataset_path)
            dataset_samples = self._collect_samples(dataset_path, dataset_name)
            
            all_samples.extend(dataset_samples)
            
            # Track contributions
            stats['dataset_contributions'][dataset_name] = len(dataset_samples)
        
        stats['total_images'] = len(all_samples)
        
        # Balance if requested
        if balance:
            self.logger.info("Balancing dataset...")
            all_samples = self._balance_samples(all_samples)
            stats['balanced'] = True
            stats['total_images_after_balance'] = len(all_samples)
        
        # Get class distribution
        for sample in all_samples:
            label = sample['label']
            stats['class_distribution'][label] = \
                stats['class_distribution'].get(label, 0) + 1
        
        # Create splits
        if create_splits:
            train, val, test = split_data(
                all_samples,
                train_split=self.config.data_processing.train_split,
                val_split=self.config.data_processing.val_split,
                test_split=self.config.data_processing.test_split,
                shuffle=True,
                random_seed=self.config.random_seed
            )
            
            # Copy files to split directories
            stats['splits']['train'] = self._create_split(train, output_dir, 'train')
            stats['splits']['val'] = self._create_split(val, output_dir, 'val')
            stats['splits']['test'] = self._create_split(test, output_dir, 'test')
        else:
            # Copy all to single directory
            self._copy_samples(all_samples, output_dir)
        
        # Save metadata
        metadata_path = output_dir / 'merge_metadata.json'
        save_json(stats, metadata_path)
        
        self.logger.info(
            f"Merge complete. Total images: {stats['total_images']}, "
            f"Output: {output_dir}"
        )
        
        return stats
    
    def _collect_samples(
        self,
        dataset_path: Path,
        dataset_name: str
    ) -> List[Dict[str, Any]]:
        """
        Collect all samples from a dataset.
        
        Args:
            dataset_path: Path to dataset
            dataset_name: Name of dataset
            
        Returns:
            List of sample dictionaries
        """
        samples = []
        
        # Process each class
        for state in DriverState.get_all_states():
            state_dir = dataset_path / state
            
            if not state_dir.exists():
                continue
            
            # Get all images
            image_files = list(state_dir.rglob('*.jpg')) + \
                         list(state_dir.rglob('*.jpeg')) + \
                         list(state_dir.rglob('*.png'))
            
            for img_path in image_files:
                samples.append({
                    'image_path': str(img_path),
                    'label': state,
                    'dataset': dataset_name
                })
        
        self.logger.info(f"Collected {len(samples)} samples from {dataset_name}")
        return samples
    
    def _balance_samples(
        self,
        samples: List[Dict[str, Any]],
        method: str = 'undersample'
    ) -> List[Dict[str, Any]]:
        """
        Balance samples across classes.
        
        Args:
            samples: List of samples
            method: Balancing method ('undersample' or 'oversample')
            
        Returns:
            Balanced samples
        """
        # Group by class
        class_samples = {}
        for sample in samples:
            label = sample['label']
            if label not in class_samples:
                class_samples[label] = []
            class_samples[label].append(sample)
        
        # Find target size
        class_sizes = [len(samples) for samples in class_samples.values()]
        
        if method == 'undersample':
            target_size = min(class_sizes)
        else:  # oversample
            target_size = max(class_sizes)
        
        # Balance each class
        balanced = []
        for label, label_samples in class_samples.items():
            if len(label_samples) > target_size:
                # Undersample
                sampled = np.random.choice(
                    label_samples,
                    size=target_size,
                    replace=False
                ).tolist()
            else:
                # Oversample
                sampled = np.random.choice(
                    label_samples,
                    size=target_size,
                    replace=True
                ).tolist()
            
            balanced.extend(sampled)
        
        self.logger.info(
            f"Balanced dataset: {len(samples)} -> {len(balanced)} samples"
        )
        
        return balanced
    
    def _create_split(
        self,
        samples: List[Dict[str, Any]],
        output_dir: Path,
        split_name: str
    ) -> Dict[str, int]:
        """
        Create a dataset split.
        
        Args:
            samples: List of samples
            output_dir: Output directory
            split_name: Split name (train/val/test)
            
        Returns:
            Split statistics
        """
        split_dir = output_dir / split_name
        ensure_dir(split_dir)
        
        stats = {'total': len(samples), 'by_class': {}}
        
        # Copy files organized by class
        for sample in tqdm(samples, desc=f"Creating {split_name} split"):
            label = sample['label']
            source_path = Path(sample['image_path'])
            
            # Create class directory
            class_dir = split_dir / label
            ensure_dir(class_dir)
            
            # Copy file
            dest_path = class_dir / source_path.name
            
            # Handle duplicate names
            counter = 1
            while dest_path.exists():
                stem = source_path.stem
                ext = source_path.suffix
                dest_path = class_dir / f"{stem}_{counter}{ext}"
                counter += 1
            
            shutil.copy2(source_path, dest_path)
            
            stats['by_class'][label] = stats['by_class'].get(label, 0) + 1
        
        self.logger.info(f"Created {split_name} split with {stats['total']} samples")
        return stats
    
    def _copy_samples(self, samples: List[Dict[str, Any]], output_dir: Path):
        """
        Copy samples to output directory.
        
        Args:
            samples: List of samples
            output_dir: Output directory
        """
        for sample in tqdm(samples, desc="Copying samples"):
            label = sample['label']
            source_path = Path(sample['image_path'])
            
            # Create class directory
            class_dir = output_dir / label
            ensure_dir(class_dir)
            
            # Copy file
            dest_path = class_dir / source_path.name
            shutil.copy2(source_path, dest_path)
    
    def get_merged_dataset_info(self, merged_name: str = "merged_dataset") -> Dict[str, Any]:
        """
        Get information about a merged dataset.
        
        Args:
            merged_name: Name of merged dataset
            
        Returns:
            Dataset information
        """
        merged_dir = self.merged_dir / merged_name
        metadata_path = merged_dir / 'merge_metadata.json'
        
        if metadata_path.exists():
            import json
            with open(metadata_path, 'r') as f:
                return json.load(f)
        else:
            self.logger.warning(f"Metadata not found for {merged_name}")
            return {}


if __name__ == "__main__":
    # Test dataset merger
    merger = DatasetMerger()
    
    config = get_config()
    
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
    
    if existing_datasets:
        print(f"\nMerging datasets: {list(existing_datasets.keys())}")
        stats = merger.merge_datasets(
            existing_datasets,
            output_name="merged_dataset",
            create_splits=True,
            balance=False
        )
        
        print("\n=== Merge Results ===")
        print(f"Total images: {stats['total_images']}")
        print(f"Class distribution: {stats['class_distribution']}")
        if 'splits' in stats:
            print(f"\nSplits:")
            for split_name, split_stats in stats['splits'].items():
                print(f"  {split_name}: {split_stats['total']} samples")
    else:
        print("No processed datasets found to merge")
