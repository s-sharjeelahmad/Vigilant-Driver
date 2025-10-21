"""
Data Collection Package
=======================
Modules for processing datasets and collecting training data.
"""

# Lazy imports to avoid circular dependencies
__all__ = [
    'TrainingDataCollector',
    'DMDProcessor',
    'StateFarmProcessor',
    'DataPreprocessor',
    'DatasetAnalyzer',
    'FeaturePipeline',
    'DatasetMerger',
    'YawDDProcessor',
    'NTHUDDDProcessor',
    'UTARLDDProcessor'
]

def __getattr__(name):
    """Lazy import to avoid loading all modules at package import"""
    if name == 'TrainingDataCollector':
        from .training_data_collector import TrainingDataCollector
        return TrainingDataCollector
    elif name == 'DMDProcessor':
        from .dmd_processor import DMDProcessor
        return DMDProcessor
    elif name == 'StateFarmProcessor':
        from .state_farm_processor import StateFarmProcessor
        return StateFarmProcessor
    elif name == 'DataPreprocessor':
        from .data_preprocessor import DataPreprocessor
        return DataPreprocessor
    elif name == 'DatasetAnalyzer':
        from .dataset_analyzer import DatasetAnalyzer
        return DatasetAnalyzer
    elif name == 'FeaturePipeline':
        from .feature_pipeline import FeaturePipeline
        return FeaturePipeline
    elif name == 'DatasetMerger':
        from .dataset_merger import DatasetMerger
        return DatasetMerger
    elif name == 'YawDDProcessor':
        from .yawdd_processor import YawDDProcessor
        return YawDDProcessor
    elif name == 'NTHUDDDProcessor':
        from .nthuddd_processor import NTHUDDDProcessor
        return NTHUDDDProcessor
    elif name == 'UTARLDDProcessor':
        from .uta_rldd_processor import UTARLDDProcessor
        return UTARLDDProcessor
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
