"""
Dataset Analyzer
================
Analyzes datasets for statistics, class distribution, and quality metrics.
"""

import os
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from collections import Counter
import logging
import matplotlib.pyplot as plt
from tqdm import tqdm

from ..utils.config import get_config
from ..utils.helpers import (
    setup_logging,
    ensure_dir,
    save_json,
    count_files_by_extension,
    create_class_weight
)
from ..utils.constants import DriverState


class DatasetAnalyzer:
    """
    Analyzes datasets for various metrics and statistics.
    
    Features:
        - Class distribution analysis
        - Image quality metrics
        - Dataset balance analysis
        - Visualization generation
    """
    
    def __init__(self, config=None):
        """
        Initialize dataset analyzer.
        
        Args:
            config: Configuration object
        """
        self.config = config or get_config()
        self.logger = setup_logging(
            log_level=self.config.log_level,
            log_file=str(self.config.paths.logs_dir / 'dataset_analyzer.log')
        )
        
        self.processed_dir = self.config.paths.processed_data_dir
        self.analysis_dir = self.processed_dir / 'analysis'
        ensure_dir(self.analysis_dir)
    
    def analyze_dataset(
        self,
        dataset_path: str,
        dataset_name: str = "dataset"
    ) -> Dict[str, Any]:
        """
        Perform comprehensive dataset analysis.
        
        Args:
            dataset_path: Path to dataset directory
            dataset_name: Name of the dataset
            
        Returns:
            Analysis results
        """
        self.logger.info(f"Analyzing dataset: {dataset_name}")
        
        dataset_path = Path(dataset_path)
        
        analysis = {
            'dataset_name': dataset_name,
            'dataset_path': str(dataset_path),
            'total_images': 0,
            'class_distribution': {},
            'image_statistics': {},
            'quality_metrics': {},
            'recommendations': []
        }
        
        # Get class distribution
        class_dist = self._analyze_class_distribution(dataset_path)
        analysis['class_distribution'] = class_dist
        analysis['total_images'] = sum(class_dist.values())
        
        # Analyze image statistics
        image_stats = self._analyze_image_statistics(dataset_path)
        analysis['image_statistics'] = image_stats
        
        # Calculate class weights for imbalanced data
        class_weights = create_class_weight(class_dist)
        analysis['class_weights'] = class_weights
        
        # Check dataset balance
        balance_metrics = self._check_dataset_balance(class_dist)
        analysis['balance_metrics'] = balance_metrics
        
        # Generate recommendations
        recommendations = self._generate_recommendations(analysis)
        analysis['recommendations'] = recommendations
        
        # Save analysis report
        self._save_analysis_report(analysis, dataset_name)
        
        # Generate visualizations
        self._generate_visualizations(analysis, dataset_name)
        
        self.logger.info(f"Analysis complete for {dataset_name}")
        return analysis
    
    def _analyze_class_distribution(self, dataset_path: Path) -> Dict[str, int]:
        """
        Analyze class distribution in dataset.
        
        Args:
            dataset_path: Path to dataset
            
        Returns:
            Dictionary of class: count
        """
        class_dist = {}
        
        # Check if organized by class folders
        for state in DriverState.get_all_states():
            state_dir = dataset_path / state
            if state_dir.exists() and state_dir.is_dir():
                # Count images
                image_count = len(list(state_dir.rglob('*.jpg'))) + \
                             len(list(state_dir.rglob('*.jpeg'))) + \
                             len(list(state_dir.rglob('*.png')))
                class_dist[state] = image_count
        
        return class_dist
    
    def _analyze_image_statistics(self, dataset_path: Path) -> Dict[str, Any]:
        """
        Analyze image statistics (resolution, size, etc.).
        
        Args:
            dataset_path: Path to dataset
            
        Returns:
            Image statistics
        """
        image_files = list(dataset_path.rglob('*.jpg')) + \
                     list(dataset_path.rglob('*.jpeg')) + \
                     list(dataset_path.rglob('*.png'))
        
        if not image_files:
            return {}
        
        widths, heights, file_sizes = [], [], []
        aspect_ratios = []
        
        # Sample images for analysis (to avoid processing all)
        sample_size = min(1000, len(image_files))
        sampled_files = np.random.choice(image_files, sample_size, replace=False)
        
        for img_path in tqdm(sampled_files, desc="Analyzing images"):
            try:
                # Get file size
                file_sizes.append(os.path.getsize(img_path))
                
                # Get image dimensions
                img = cv2.imread(str(img_path))
                if img is not None:
                    h, w = img.shape[:2]
                    widths.append(w)
                    heights.append(h)
                    aspect_ratios.append(w / h)
            except Exception as e:
                self.logger.warning(f"Error analyzing {img_path}: {e}")
        
        stats = {
            'num_samples_analyzed': len(widths),
            'resolution': {
                'width': {
                    'min': int(np.min(widths)) if widths else 0,
                    'max': int(np.max(widths)) if widths else 0,
                    'mean': float(np.mean(widths)) if widths else 0,
                    'std': float(np.std(widths)) if widths else 0
                },
                'height': {
                    'min': int(np.min(heights)) if heights else 0,
                    'max': int(np.max(heights)) if heights else 0,
                    'mean': float(np.mean(heights)) if heights else 0,
                    'std': float(np.std(heights)) if heights else 0
                }
            },
            'aspect_ratio': {
                'min': float(np.min(aspect_ratios)) if aspect_ratios else 0,
                'max': float(np.max(aspect_ratios)) if aspect_ratios else 0,
                'mean': float(np.mean(aspect_ratios)) if aspect_ratios else 0
            },
            'file_size_mb': {
                'min': float(np.min(file_sizes) / (1024*1024)) if file_sizes else 0,
                'max': float(np.max(file_sizes) / (1024*1024)) if file_sizes else 0,
                'mean': float(np.mean(file_sizes) / (1024*1024)) if file_sizes else 0
            }
        }
        
        return stats
    
    def _check_dataset_balance(self, class_dist: Dict[str, int]) -> Dict[str, Any]:
        """
        Check if dataset is balanced.
        
        Args:
            class_dist: Class distribution
            
        Returns:
            Balance metrics
        """
        if not class_dist:
            return {}
        
        counts = list(class_dist.values())
        max_count = max(counts)
        min_count = min(counts)
        
        # Calculate imbalance ratio
        imbalance_ratio = max_count / min_count if min_count > 0 else float('inf')
        
        # Determine if balanced (threshold: 1.5x difference)
        is_balanced = imbalance_ratio <= 1.5
        
        metrics = {
            'is_balanced': is_balanced,
            'imbalance_ratio': float(imbalance_ratio),
            'max_class_count': int(max_count),
            'min_class_count': int(min_count),
            'recommendation': 'Dataset is balanced' if is_balanced else 
                            'Consider data augmentation or resampling for minority classes'
        }
        
        return metrics
    
    def _generate_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """
        Generate recommendations based on analysis.
        
        Args:
            analysis: Analysis results
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # Check total samples
        total = analysis['total_images']
        if total < 1000:
            recommendations.append(
                f"Dataset is small ({total} images). Consider collecting more data or using transfer learning."
            )
        elif total < 5000:
            recommendations.append(
                f"Dataset size is moderate ({total} images). Data augmentation recommended."
            )
        
        # Check balance
        balance = analysis.get('balance_metrics', {})
        if not balance.get('is_balanced', True):
            recommendations.append(
                f"Dataset is imbalanced (ratio: {balance.get('imbalance_ratio', 0):.2f}). "
                "Use class weights or resampling techniques."
            )
        
        # Check image resolution
        img_stats = analysis.get('image_statistics', {})
        if img_stats:
            mean_width = img_stats['resolution']['width'].get('mean', 0)
            mean_height = img_stats['resolution']['height'].get('mean', 0)
            
            if mean_width < 224 or mean_height < 224:
                recommendations.append(
                    "Average image resolution is low. Consider using higher resolution images."
                )
        
        if not recommendations:
            recommendations.append("Dataset looks good! Ready for training.")
        
        return recommendations
    
    def _save_analysis_report(self, analysis: Dict[str, Any], dataset_name: str):
        """
        Save analysis report to file.
        
        Args:
            analysis: Analysis results
            dataset_name: Name of dataset
        """
        report_path = self.analysis_dir / f"{dataset_name}_analysis.json"
        save_json(analysis, report_path)
        self.logger.info(f"Analysis report saved to {report_path}")
    
    def _generate_visualizations(self, analysis: Dict[str, Any], dataset_name: str):
        """
        Generate visualization plots.
        
        Args:
            analysis: Analysis results
            dataset_name: Name of dataset
        """
        try:
            # Class distribution bar chart
            class_dist = analysis['class_distribution']
            if class_dist:
                plt.figure(figsize=(10, 6))
                plt.bar(class_dist.keys(), class_dist.values())
                plt.xlabel('Driver State')
                plt.ylabel('Number of Samples')
                plt.title(f'{dataset_name} - Class Distribution')
                plt.xticks(rotation=45)
                plt.tight_layout()
                
                plot_path = self.analysis_dir / f"{dataset_name}_class_distribution.png"
                plt.savefig(plot_path)
                plt.close()
                
                self.logger.info(f"Visualization saved to {plot_path}")
        except Exception as e:
            self.logger.warning(f"Could not generate visualizations: {e}")
    
    def compare_datasets(
        self,
        dataset_paths: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Compare multiple datasets.
        
        Args:
            dataset_paths: Dictionary of dataset_name: path
            
        Returns:
            Comparison results
        """
        self.logger.info(f"Comparing {len(dataset_paths)} datasets")
        
        comparison = {
            'datasets': {},
            'summary': {}
        }
        
        for name, path in dataset_paths.items():
            analysis = self.analyze_dataset(path, name)
            comparison['datasets'][name] = analysis
        
        # Generate summary
        total_images = sum(d['total_images'] for d in comparison['datasets'].values())
        comparison['summary'] = {
            'total_datasets': len(dataset_paths),
            'total_images': total_images,
            'average_images_per_dataset': total_images / len(dataset_paths)
        }
        
        # Save comparison report
        report_path = self.analysis_dir / 'dataset_comparison.json'
        save_json(comparison, report_path)
        
        return comparison


if __name__ == "__main__":
    # Test analyzer
    analyzer = DatasetAnalyzer()
    
    config = get_config()
    
    # Analyze DMD dataset
    dmd_path = config.paths.processed_data_dir / 'dmd'
    if dmd_path.exists():
        dmd_analysis = analyzer.analyze_dataset(str(dmd_path), 'DMD')
        print("\n=== DMD Analysis ===")
        print(f"Total images: {dmd_analysis['total_images']}")
        print(f"Class distribution: {dmd_analysis['class_distribution']}")
