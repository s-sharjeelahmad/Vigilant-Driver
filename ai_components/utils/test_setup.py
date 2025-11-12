"""
Quick test script to verify feature extraction setup
Run this to test if everything is working before collecting data
"""
import sys
from pathlib import Path

print("="*70)
print("TESTING FEATURE EXTRACTION SETUP")
print("="*70)

# Test 1: Import check
print("\n1. Testing imports...")
try:
    import cv2
    print("   ✅ OpenCV installed")
except ImportError:
    print("   ❌ OpenCV not found! Run: pip install opencv-python")
    sys.exit(1)

try:
    import mediapipe as mp
    print("   ✅ MediaPipe installed")
except ImportError:
    print("   ❌ MediaPipe not found! Run: pip install mediapipe")
    sys.exit(1)

try:
    from scipy.spatial import distance
    print("   ✅ SciPy installed")
except ImportError:
    print("   ❌ SciPy not found! Run: pip install scipy")
    sys.exit(1)

try:
    import pandas as pd
    print("   ✅ Pandas installed")
except ImportError:
    print("   ❌ Pandas not found! Run: pip install pandas")
    sys.exit(1)

try:
    from tqdm import tqdm
    print("   ✅ tqdm installed")
except ImportError:
    print("   ❌ tqdm not found! Run: pip install tqdm")
    sys.exit(1)

# Test 2: Module import
print("\n2. Testing custom modules...")
try:
    from ai_components.data_collection.custom_data_organizer import CustomDataOrganizer
    print("   ✅ CustomDataOrganizer ready")
except Exception as e:
    print(f"   ❌ Error importing CustomDataOrganizer: {e}")
    sys.exit(1)

try:
    from ai_components.data_collection.feature_extractor import FacialFeatureExtractor
    print("   ✅ FacialFeatureExtractor ready")
except Exception as e:
    print(f"   ❌ Error importing FacialFeatureExtractor: {e}")
    sys.exit(1)

# Test 3: MediaPipe initialization
print("\n3. Testing MediaPipe initialization...")
try:
    extractor = FacialFeatureExtractor()
    print("   ✅ MediaPipe Face Mesh initialized")
except Exception as e:
    print(f"   ❌ Error initializing MediaPipe: {e}")
    sys.exit(1)

# Test 4: Directory structure
print("\n4. Checking directory structure...")
dirs_to_check = [
    "datasets/raw",
    "datasets/processed",
    "datasets/features",
    "reports",
    "notebooks"
]

for dir_path in dirs_to_check:
    path = Path(dir_path)
    if not path.exists():
        path.mkdir(parents=True, exist_ok=True)
        print(f"   ✅ Created: {dir_path}/")
    else:
        print(f"   ✅ Exists: {dir_path}/")

# Test 5: Test on sample image (if available)
print("\n5. Testing feature extraction on sample...")
test_images = list(Path("datasets/processed").rglob("*.jpg"))[:1]

if test_images:
    test_img = test_images[0]
    print(f"   Testing on: {test_img.name}")
    
    try:
        features = extractor.extract_features(test_img)
        if features:
            print(f"   ✅ Feature extraction successful!")
            print(f"      - EAR: {features['avg_ear']:.3f}")
            print(f"      - MAR: {features['mar']:.3f}")
            print(f"      - Head Yaw: {features['head_yaw']:.1f}°")
            print(f"      - Face visibility: {features['face_visibility_score']:.2f}")
        else:
            print(f"   ⚠️  No face detected in test image")
    except Exception as e:
        print(f"   ❌ Error during extraction: {e}")
else:
    print("   ⚠️  No sample images found (this is OK if you haven't collected data yet)")

# Summary
print("\n" + "="*70)
print("TEST SUMMARY")
print("="*70)
print("✅ All dependencies installed")
print("✅ Custom modules working")
print("✅ MediaPipe initialized")
print("✅ Directory structure ready")
print("\n🎯 You're ready to collect data and extract features!")
print("\nNext steps:")
print("  1. Collect custom Pakistani dataset (1,500 images)")
print("  2. Run: python process_custom_dataset.py")
print("  3. Run: jupyter notebook notebooks/feature_analysis.ipynb")
print("="*70)
