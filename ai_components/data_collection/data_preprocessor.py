"""
Data Preprocessor
=================
Handles data preprocessing, augmentation, and normalization.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Tuple, Optional, List, Dict, Any
import logging
from dataclasses import dataclass

from ..utils.config import get_config
from ..utils.helpers import setup_logging, resize_image
from ..utils.constants import AUGMENTATION_PARAMS


@dataclass
class PreprocessingConfig:
    """Configuration for preprocessing operations."""
    resize: bool = True
    target_size: Tuple[int, int] = (224, 224)
    normalize: bool = True
    augment: bool = False
    grayscale: bool = False
    histogram_equalization: bool = False


class DataPreprocessor:
    """
    Handles various data preprocessing operations.
    
    Features:
        - Image resizing and normalization
        - Data augmentation
        - Histogram equalization
        - Noise reduction
    """
    
    def __init__(self, config=None):
        """
        Initialize data preprocessor.
        
        Args:
            config: Configuration object
        """
        self.config = config or get_config()
        self.logger = setup_logging(
            log_level=self.config.log_level,
            log_file=str(self.config.paths.logs_dir / 'data_preprocessor.log')
        )
        
        self.target_size = self.config.data_processing.target_image_size
        self.augmentation_params = AUGMENTATION_PARAMS
    
    def preprocess_image(
        self,
        image: np.ndarray,
        preprocessing_config: Optional[PreprocessingConfig] = None
    ) -> np.ndarray:
        """
        Apply preprocessing pipeline to an image.
        
        Args:
            image: Input image
            preprocessing_config: Preprocessing configuration
            
        Returns:
            Preprocessed image
        """
        if preprocessing_config is None:
            preprocessing_config = PreprocessingConfig()
        
        processed = image.copy()
        
        # Convert to grayscale if specified
        if preprocessing_config.grayscale and len(processed.shape) == 3:
            processed = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
        
        # Resize
        if preprocessing_config.resize:
            processed = resize_image(
                processed,
                preprocessing_config.target_size,
                maintain_aspect=False
            )
        
        # Histogram equalization
        if preprocessing_config.histogram_equalization:
            processed = self._apply_histogram_equalization(processed)
        
        # Normalize
        if preprocessing_config.normalize:
            processed = self._normalize_image(processed)
        
        # Augmentation (if enabled)
        if preprocessing_config.augment:
            processed = self._apply_augmentation(processed)
        
        return processed
    
    def _normalize_image(self, image: np.ndarray) -> np.ndarray:
        """
        Normalize image to [0, 1] range.
        
        Args:
            image: Input image
            
        Returns:
            Normalized image
        """
        return image.astype(np.float32) / 255.0
    
    def _apply_histogram_equalization(self, image: np.ndarray) -> np.ndarray:
        """
        Apply histogram equalization for better contrast.
        
        Args:
            image: Input image
            
        Returns:
            Equalized image
        """
        if len(image.shape) == 2:
            # Grayscale
            return cv2.equalizeHist(image)
        else:
            # Color - apply to each channel
            channels = cv2.split(image)
            eq_channels = [cv2.equalizeHist(ch) for ch in channels]
            return cv2.merge(eq_channels)
    
    def _apply_augmentation(self, image: np.ndarray) -> np.ndarray:
        """
        Apply random augmentation to image.
        
        Args:
            image: Input image
            
        Returns:
            Augmented image
        """
        augmented = image.copy()
        
        # Random horizontal flip
        if self.augmentation_params['horizontal_flip'] and np.random.rand() > 0.5:
            augmented = cv2.flip(augmented, 1)
        
        # Random rotation
        if np.random.rand() > 0.5:
            angle = np.random.uniform(
                -self.augmentation_params['rotation_range'],
                self.augmentation_params['rotation_range']
            )
            augmented = self._rotate_image(augmented, angle)
        
        # Random brightness
        if np.random.rand() > 0.5:
            brightness_factor = np.random.uniform(
                self.augmentation_params['brightness_range'][0],
                self.augmentation_params['brightness_range'][1]
            )
            augmented = self._adjust_brightness(augmented, brightness_factor)
        
        # Random zoom
        if np.random.rand() > 0.5:
            zoom_factor = 1.0 + np.random.uniform(
                -self.augmentation_params['zoom_range'],
                self.augmentation_params['zoom_range']
            )
            augmented = self._zoom_image(augmented, zoom_factor)
        
        return augmented
    
    def _rotate_image(self, image: np.ndarray, angle: float) -> np.ndarray:
        """
        Rotate image by specified angle.
        
        Args:
            image: Input image
            angle: Rotation angle in degrees
            
        Returns:
            Rotated image
        """
        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        
        # Get rotation matrix
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        
        # Perform rotation
        rotated = cv2.warpAffine(image, M, (w, h), borderMode=cv2.BORDER_REFLECT)
        
        return rotated
    
    def _adjust_brightness(self, image: np.ndarray, factor: float) -> np.ndarray:
        """
        Adjust image brightness.
        
        Args:
            image: Input image
            factor: Brightness factor (1.0 = no change)
            
        Returns:
            Brightness-adjusted image
        """
        adjusted = image.astype(np.float32) * factor
        adjusted = np.clip(adjusted, 0, 255).astype(np.uint8)
        return adjusted
    
    def _zoom_image(self, image: np.ndarray, zoom_factor: float) -> np.ndarray:
        """
        Zoom image.
        
        Args:
            image: Input image
            zoom_factor: Zoom factor (>1 = zoom in, <1 = zoom out)
            
        Returns:
            Zoomed image
        """
        h, w = image.shape[:2]
        
        # Calculate crop size
        crop_h = int(h / zoom_factor)
        crop_w = int(w / zoom_factor)
        
        # Calculate crop position (center)
        start_y = (h - crop_h) // 2
        start_x = (w - crop_w) // 2
        
        # Crop
        cropped = image[start_y:start_y+crop_h, start_x:start_x+crop_w]
        
        # Resize back to original size
        zoomed = cv2.resize(cropped, (w, h), interpolation=cv2.INTER_LINEAR)
        
        return zoomed
    
    def denoise_image(self, image: np.ndarray, method: str = 'bilateral') -> np.ndarray:
        """
        Apply denoising to image.
        
        Args:
            image: Input image
            method: Denoising method ('bilateral', 'gaussian', 'median')
            
        Returns:
            Denoised image
        """
        if method == 'bilateral':
            return cv2.bilateralFilter(image, 9, 75, 75)
        elif method == 'gaussian':
            return cv2.GaussianBlur(image, (5, 5), 0)
        elif method == 'median':
            return cv2.medianBlur(image, 5)
        else:
            return image
    
    def batch_preprocess(
        self,
        images: List[np.ndarray],
        preprocessing_config: Optional[PreprocessingConfig] = None
    ) -> np.ndarray:
        """
        Preprocess a batch of images.
        
        Args:
            images: List of input images
            preprocessing_config: Preprocessing configuration
            
        Returns:
            Batch of preprocessed images as numpy array
        """
        preprocessed = []
        
        for image in images:
            processed = self.preprocess_image(image, preprocessing_config)
            preprocessed.append(processed)
        
        return np.array(preprocessed)
    
    def create_augmented_dataset(
        self,
        image: np.ndarray,
        num_augmentations: int = 5
    ) -> List[np.ndarray]:
        """
        Create multiple augmented versions of an image.
        
        Args:
            image: Input image
            num_augmentations: Number of augmented versions to create
            
        Returns:
            List of augmented images
        """
        augmented_images = [image]  # Include original
        
        config = PreprocessingConfig(augment=True, normalize=False)
        
        for _ in range(num_augmentations):
            augmented = self.preprocess_image(image, config)
            augmented_images.append(augmented)
        
        return augmented_images


if __name__ == "__main__":
    # Test preprocessor
    preprocessor = DataPreprocessor()
    
    # Create dummy image
    test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    
    # Test preprocessing
    config = PreprocessingConfig(
        resize=True,
        normalize=True,
        augment=False
    )
    
    processed = preprocessor.preprocess_image(test_image, config)
    print(f"Original shape: {test_image.shape}")
    print(f"Processed shape: {processed.shape}")
    print(f"Processed range: [{processed.min()}, {processed.max()}]")
