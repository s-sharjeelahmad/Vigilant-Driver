"""
Feature Pipeline
================
Pipeline for extracting features from processed datasets.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import logging
from tqdm import tqdm
import pickle

from ..utils.config import get_config
from ..utils.helpers import setup_logging, ensure_dir, save_json
from ..utils.constants import DriverState


class FeaturePipeline:
    """
    Pipeline for extracting and saving features from images.
    
    Features:
        - Batch feature extraction
        - Feature caching
        - Integration with feature extractors
    """
    
    def __init__(self, config=None):
        """
        Initialize feature pipeline.
        
        Args:
            config: Configuration object
        """
        self.config = config or get_config()
        self.logger = setup_logging(
            log_level=self.config.log_level,
            log_file=str(self.config.paths.logs_dir / 'feature_pipeline.log')
        )
        
        self.processed_dir = self.config.paths.processed_data_dir
        self.features_dir = self.processed_dir / 'features'
        ensure_dir(self.features_dir)
        
        # Will be initialized when needed
        self.feature_extractor = None
    
    def extract_features_from_dataset(
        self,
        dataset_path: str,
        dataset_name: str,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Extract features from entire dataset.
        
        Args:
            dataset_path: Path to dataset directory
            dataset_name: Name of the dataset
            use_cache: Whether to use cached features
            
        Returns:
            Extraction results
        """
        self.logger.info(f"Extracting features from {dataset_name}")
        
        dataset_path = Path(dataset_path)
        cache_file = self.features_dir / f"{dataset_name}_features.pkl"
        
        # Check cache
        if use_cache and cache_file.exists():
            self.logger.info(f"Loading cached features from {cache_file}")
            return self._load_features_cache(cache_file)
        
        results = {
            'dataset_name': dataset_name,
            'features': [],
            'labels': [],
            'metadata': [],
            'total_processed': 0,
            'errors': 0
        }
        
        # Process each class
        for state in DriverState.get_all_states():
            state_dir = dataset_path / state
            
            if not state_dir.exists():
                continue
            
            # Get all images
            image_files = list(state_dir.rglob('*.jpg')) + \
                         list(state_dir.rglob('*.jpeg')) + \
                         list(state_dir.rglob('*.png'))
            
            self.logger.info(f"Processing {len(image_files)} images for class {state}")
            
            for img_path in tqdm(image_files, desc=f"Extracting {state}"):
                try:
                    # Extract features
                    features = self._extract_image_features(img_path)
                    
                    if features is not None:
                        results['features'].append(features)
                        results['labels'].append(state)
                        results['metadata'].append({
                            'image_path': str(img_path),
                            'class': state
                        })
                        results['total_processed'] += 1
                    else:
                        results['errors'] += 1
                        
                except Exception as e:
                    self.logger.error(f"Error processing {img_path}: {e}")
                    results['errors'] += 1
        
        # Convert to numpy arrays
        if results['features']:
            results['features'] = np.array(results['features'])
            results['labels'] = np.array(results['labels'])
        
        # Save cache
        self._save_features_cache(results, cache_file)
        
        self.logger.info(
            f"Feature extraction complete. "
            f"Processed: {results['total_processed']}, Errors: {results['errors']}"
        )
        
        return results
    
    def _extract_image_features(self, image_path: Path) -> Optional[np.ndarray]:
        """
        Extract features from a single image.
        
        NOTE: This is a simplified feature extractor.
        For your FYP, the CNN model will extract features automatically during training.
        This pipeline is mainly for organizing image paths and labels.
        
        Args:
            image_path: Path to image
            
        Returns:
            Feature vector (flattened image) or None if failed
        """
        try:
            # Read image
            image = cv2.imread(str(image_path))
            
            if image is None:
                return None
            
            # Resize to standard size (224x224 for most CNNs)
            resized = cv2.resize(image, (224, 224))
            
            # Flatten to feature vector and normalize to [0, 1]
            features = resized.flatten().astype(np.float32) / 255.0
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting features from {image_path}: {e}")
            return None
    
    def _save_features_cache(self, features_data: Dict[str, Any], cache_file: Path):
        """
        Save extracted features to cache.
        
        Args:
            features_data: Features and metadata
            cache_file: Cache file path
        """
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump(features_data, f)
            self.logger.info(f"Features cached to {cache_file}")
        except Exception as e:
            self.logger.error(f"Error saving features cache: {e}")
    
    def _load_features_cache(self, cache_file: Path) -> Dict[str, Any]:
        """
        Load features from cache.
        
        Args:
            cache_file: Cache file path
            
        Returns:
            Cached features data
        """
        try:
            with open(cache_file, 'rb') as f:
                features_data = pickle.load(f)
            self.logger.info(f"Features loaded from cache: {cache_file}")
            return features_data
        except Exception as e:
            self.logger.error(f"Error loading features cache: {e}")
            return {}
    
    def create_training_dataset(
        self,
        feature_datasets: List[Dict[str, Any]],
        output_name: str = "merged_features"
    ) -> Dict[str, Any]:
        """
        Combine multiple feature datasets into training-ready format.
        
        Args:
            feature_datasets: List of feature extraction results
            output_name: Output dataset name
            
        Returns:
            Combined dataset
        """
        self.logger.info(f"Creating training dataset: {output_name}")
        
        all_features = []
        all_labels = []
        all_metadata = []
        
        for dataset in feature_datasets:
            if 'features' in dataset and len(dataset['features']) > 0:
                all_features.append(dataset['features'])
                all_labels.extend(dataset['labels'])
                all_metadata.extend(dataset['metadata'])
        
        if not all_features:
            self.logger.error("No features to combine")
            return {}
        
        # Combine features
        combined_features = np.vstack(all_features)
        combined_labels = np.array(all_labels)
        
        result = {
            'features': combined_features,
            'labels': combined_labels,
            'metadata': all_metadata,
            'total_samples': len(combined_labels),
            'class_distribution': self._get_class_distribution(combined_labels)
        }
        
        # Save combined dataset
        output_file = self.features_dir / f"{output_name}.pkl"
        self._save_features_cache(result, output_file)
        
        self.logger.info(
            f"Training dataset created with {result['total_samples']} samples"
        )
        
        return result
    
    def _get_class_distribution(self, labels: np.ndarray) -> Dict[str, int]:
        """
        Get class distribution from labels.
        
        Args:
            labels: Array of labels
            
        Returns:
            Dictionary of class: count
        """
        unique, counts = np.unique(labels, return_counts=True)
        return dict(zip(unique, counts.tolist()))
    
    def prepare_for_training(
        self,
        features_data: Dict[str, Any],
        train_split: float = 0.7,
        val_split: float = 0.15,
        test_split: float = 0.15,
        shuffle: bool = True
    ) -> Tuple[Dict[str, np.ndarray], Dict[str, np.ndarray], Dict[str, np.ndarray]]:
        """
        Split features into train/val/test sets.
        
        Args:
            features_data: Features and labels
            train_split: Training set proportion
            val_split: Validation set proportion
            test_split: Test set proportion
            shuffle: Whether to shuffle data
            
        Returns:
            Tuple of (train_data, val_data, test_data)
        """
        features = features_data['features']
        labels = features_data['labels']
        
        n = len(features)
        indices = np.arange(n)
        
        if shuffle:
            np.random.shuffle(indices)
        
        train_end = int(n * train_split)
        val_end = train_end + int(n * val_split)
        
        train_indices = indices[:train_end]
        val_indices = indices[train_end:val_end]
        test_indices = indices[val_end:]
        
        train_data = {
            'features': features[train_indices],
            'labels': labels[train_indices]
        }
        
        val_data = {
            'features': features[val_indices],
            'labels': labels[val_indices]
        }
        
        test_data = {
            'features': features[test_indices],
            'labels': labels[test_indices]
        }
        
        self.logger.info(
            f"Data split - Train: {len(train_indices)}, "
            f"Val: {len(val_indices)}, Test: {len(test_indices)}"
        )
        
        return train_data, val_data, test_data


if __name__ == "__main__":
    # Test feature pipeline
    pipeline = FeaturePipeline()
    
    config = get_config()
    
    # Example: Extract features from DMD dataset
    dmd_path = config.paths.processed_data_dir / 'dmd'
    if dmd_path.exists():
        features = pipeline.extract_features_from_dataset(
            str(dmd_path),
            'dmd',
            use_cache=False
        )
        print(f"\nExtracted features shape: {features['features'].shape}")
        print(f"Labels shape: {features['labels'].shape}")
        print(f"Class distribution: {features.get('class_distribution', {})}")
