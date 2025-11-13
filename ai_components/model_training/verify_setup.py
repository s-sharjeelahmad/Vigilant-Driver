"""
Setup Verification Script
=========================
Run this script to verify your training environment is correctly configured.
"""

import sys
import subprocess


def check_python_version():
    """Check Python version."""
    print("Checking Python version...")
    version = sys.version_info
    print(f"  ✓ Python {version.major}.{version.minor}.{version.micro}")
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("  ✗ Python 3.8+ required")
        return False
    return True


def check_pytorch():
    """Check PyTorch installation."""
    print("\nChecking PyTorch...")
    try:
        import torch
        print(f"  ✓ PyTorch {torch.__version__}")
        
        # Check CUDA
        if torch.cuda.is_available():
            print(f"  ✓ CUDA available")
            print(f"  ✓ GPU count: {torch.cuda.device_count()}")
            print(f"  ✓ GPU name: {torch.cuda.get_device_name(0)}")
            print(f"  ✓ CUDA version: {torch.version.cuda}")
        else:
            print("  ⚠ CUDA not available (CPU only)")
        
        return True
    except ImportError:
        print("  ✗ PyTorch not installed")
        print("  Install: pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118")
        return False


def check_torchvision():
    """Check torchvision installation."""
    print("\nChecking torchvision...")
    try:
        import torchvision
        print(f"  ✓ torchvision {torchvision.__version__}")
        return True
    except ImportError:
        print("  ✗ torchvision not installed")
        return False


def check_dependencies():
    """Check other dependencies."""
    print("\nChecking dependencies...")
    
    packages = {
        'numpy': 'numpy',
        'pandas': 'pandas',
        'matplotlib': 'matplotlib',
        'seaborn': 'seaborn',
        'sklearn': 'scikit-learn',
        'tqdm': 'tqdm',
        'PIL': 'Pillow',
    }
    
    all_installed = True
    for module, package in packages.items():
        try:
            __import__(module)
            print(f"  ✓ {package}")
        except ImportError:
            print(f"  ✗ {package} not installed")
            all_installed = False
    
    return all_installed


def check_dataset(data_dir="datasets/processed/merged_final"):
    """Check dataset structure."""
    print(f"\nChecking dataset at {data_dir}...")
    from pathlib import Path
    
    data_path = Path(data_dir)
    if not data_path.exists():
        print(f"  ✗ Dataset not found at {data_dir}")
        print("  Please extract merged_final.zip to datasets/processed/")
        return False
    
    # Check train/val/test folders
    splits = ['train', 'val', 'test']
    classes = ['ALERT', 'DISTRACTED', 'DROWSY']
    
    for split in splits:
        split_path = data_path / split
        if not split_path.exists():
            print(f"  ✗ {split} folder not found")
            return False
        
        print(f"  ✓ {split}/")
        for cls in classes:
            cls_path = split_path / cls
            if cls_path.exists():
                count = len(list(cls_path.glob('*.jpg'))) + len(list(cls_path.glob('*.png')))
                print(f"    ✓ {cls}: {count} images")
            else:
                print(f"    ✗ {cls} folder not found")
    
    return True


def check_gpu_memory():
    """Check GPU memory."""
    print("\nChecking GPU memory...")
    try:
        import torch
        if torch.cuda.is_available():
            for i in range(torch.cuda.device_count()):
                props = torch.cuda.get_device_properties(i)
                total_memory = props.total_memory / 1024**3  # Convert to GB
                print(f"  ✓ GPU {i}: {total_memory:.1f} GB")
                
                if total_memory < 4:
                    print(f"    ⚠ Low memory, use --batch-size 8")
                elif total_memory < 8:
                    print(f"    ⚠ Limited memory, use --batch-size 16")
                else:
                    print(f"    ✓ Good memory, can use --batch-size 32+")
        else:
            print("  ⚠ No GPU available")
        return True
    except Exception as e:
        print(f"  ✗ Error checking GPU: {e}")
        return False


def main():
    """Main verification function."""
    print("="*60)
    print("VIGILANT DRIVER - TRAINING SETUP VERIFICATION")
    print("="*60)
    
    checks = [
        check_python_version(),
        check_pytorch(),
        check_torchvision(),
        check_dependencies(),
        check_gpu_memory(),
    ]
    
    # Optional dataset check
    try:
        checks.append(check_dataset())
    except Exception as e:
        print(f"\n⚠ Dataset check skipped: {e}")
    
    print("\n" + "="*60)
    if all(checks):
        print("✓ ALL CHECKS PASSED")
        print("="*60)
        print("\nYou're ready to train!")
        print("\nQuick test command:")
        print("python ai_components/model_training/train_classifier.py \\")
        print("    --data-dir datasets/processed/merged_final \\")
        print("    --model resnet18 \\")
        print("    --epochs 1 \\")
        print("    --batch-size 16 \\")
        print("    --save-dir models/test \\")
        print("    --use-amp")
    else:
        print("✗ SOME CHECKS FAILED")
        print("="*60)
        print("\nPlease fix the issues above before training.")
    print()


if __name__ == "__main__":
    main()
