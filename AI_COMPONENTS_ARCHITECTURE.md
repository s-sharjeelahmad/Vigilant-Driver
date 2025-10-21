# AI Components Architecture - Vigilant Driver System

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VIGILANT DRIVER AI PIPELINE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   RAW DATA   │───▶│  PROCESSORS  │───▶│  PROCESSED   │          │
│  │   SOURCES    │    │              │    │    DATA      │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                    │                    │                  │
│         ▼                    ▼                    ▼                  │
│  ┌──────────────────────────────────────────────────────┐           │
│  │ 1. State Farm  2. DMD  3. NTHUDDD  4. YawDD          │           │
│  │ 5. UTA-RLDD    6. Vicomtech Drowsy  7. Custom        │           │
│  └──────────────────────────────────────────────────────┘           │
│                             │                                         │
│                             ▼                                         │
│                  ┌──────────────────────┐                           │
│                  │   DATASET MERGER     │                           │
│                  │ Unified Format       │                           │
│                  │ Class Balancing      │                           │
│                  │ Train/Val/Test Split │                           │
│                  └──────────────────────┘                           │
│                             │                                         │
│                             ▼                                         │
                  ┌──────────────────────┐                           │
                  │   MODEL TRAINING     │                           │
                  │ CNN (ResNet/MobileNet)│                          │
                  │ Automatic Feature    │                           │
                  │ Extraction via CNN   │                           │
                  └──────────────────────┘
│                             │                                         │
│                             ▼                                         │
│                  ┌──────────────────────┐                           │
│                  │  TRAINED MODEL       │                           │
│                  │ Alert/Drowsy/        │                           │
│                  │ Distracted Classifier│                           │
│                  └──────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Directory Structure

```
ai_components/
│
├── 📁 utils/                          # Foundation Layer
│   ├── config.py                      # ✅ Configuration management
│   ├── constants.py                   # ✅ System constants & enums
│   └── helpers.py                     # ✅ Utility functions
│
├── 📁 data_collection/                # Data Processing Layer
│   ├── state_farm_processor.py        # ✅ State Farm dataset
│   ├── dmd_processor.py               # ✅ Vicomtech DMD dataset
│   ├── nthuddd_processor.py           # ✅ NTHUDDD dataset
│   ├── yawdd_processor.py             # ✅ YawDD dataset
│   ├── uta_rldd_processor.py          # ✅ UTA-RLDD dataset
│   ├── vicomtech_drowsy_processor.py  # ✅ Vicomtech drowsiness
│   ├── training_data_collector.py     # ✅ Custom data collection
│   ├── dataset_merger.py              # ✅ Merge all datasets
│   └── feature_pipeline.py            # ✅ Feature extraction pipeline
│
└── 📁 model_training/                 # ML Training Layer
    ├── train_classifier.py            # 🔄 Model training
    └── model_evaluation.py            # 🔄 Model evaluation
```

---

## 🔄 Data Flow: Input → Process → Output

### **Layer 1: Foundation (Utils)**

#### `config.py`
- **Purpose**: Central configuration hub
- **Input**: YAML config file (optional) or defaults
- **Process**: 
  - Defines PathConfig (all file paths)
  - DataProcessingConfig (thresholds, splits)
  - ModelConfig (architecture params)
  - Dataset-specific configs (DMD, StateFarm, YawDD, etc.)
- **Output**: Config object used by all modules
- **Usage**: `config = get_config()`

#### `constants.py`
- **Purpose**: System-wide constants
- **Input**: None (static definitions)
- **Process**: Defines enums and constants
  - `DriverState`: ALERT, DROWSY, DISTRACTED
  - `OcclusionType`: SUNGLASSES, MASK, HAND, etc.
  - Landmark indices for MediaPipe
  - Thresholds (EAR, MAR, PERCLOS)
- **Output**: Importable constants
- **Usage**: `from constants import DriverState`

#### `helpers.py`
- **Purpose**: Reusable utility functions
- **Input**: Varies by function
- **Process**: 
  - Logging setup
  - Math calculations (EAR, MAR, distances)
  - File I/O (JSON, directories)
  - Image operations (resize, normalize)
- **Output**: Helper functions
- **Usage**: `from helpers import calculate_ear`

---

### **Layer 2: Data Collection & Processing**

#### 1. **Dataset Processors** (6 files)

Each processor follows this pattern:

```python
INPUT: Raw dataset in datasets/raw/{dataset_name}/
PROCESS:
  1. Find all images/videos
  2. Parse annotations/labels
  3. Map to standard classes (ALERT/DROWSY/DISTRACTED)
  4. Resize/preprocess images
  5. Organize by class
  6. Generate metadata.json
OUTPUT: Processed dataset in datasets/processed/{dataset_name}/
  ├── alert/
  │   └── image_001.jpg
  ├── drowsy/
  │   └── image_002.jpg
  ├── distracted/
  │   └── image_003.jpg
  └── metadata.json
```

##### **state_farm_processor.py**
```
INPUT: datasets/raw/state-farm-distracted-driver-detection/
  ├── imgs/train/c0/ (alert)
  ├── imgs/train/c1-c9/ (distracted)
  └── driver_imgs_list.csv

PROCESS:
  - Read CSV for image-driver mapping
  - Map c0 → alert, c1-c9 → distracted
  - Copy & preprocess 22,424 images
  - Track statistics

OUTPUT: datasets/processed/state_farm/
  ├── alert/ (2,489 images)
  ├── distracted/ (19,935 images)
  └── metadata.json
```

##### **dmd_processor.py**
```
INPUT: datasets/raw/vicomtech/
  └── gA/gB groups with OpenLABEL JSON annotations

PROCESS:
  - Parse JSON (driver_actions, gaze_on_road)
  - Extract frames from videos at 5 FPS
  - Map activities to classes:
    * safe_drive → alert
    * texting/phone → distracted
    * drowsy actions → drowsy
  - Resize to 640x480

OUTPUT: datasets/processed/dmd/
  ├── alert/
  ├── distracted/
  ├── drowsy/
  └── metadata.json
```

##### **nthuddd_processor.py**
```
INPUT: datasets/raw/NTHUDDD/train_data/
  ├── drowsy/ (36,030 images)
  └── notdrowsy/ (30,491 images)

PROCESS:
  - Map notdrowsy → alert
  - Map drowsy → drowsy
  - Copy and resize to 224x224

OUTPUT: datasets/processed/nthuddd/
  ├── alert/ (30,491 images)
  ├── drowsy/ (36,030 images)
  └── metadata.json

COMPLETED: ✅ 66,521 images in ~11 minutes
```

##### **yawdd_processor.py**
```
INPUT: datasets/raw/yawDD/
  ├── Dash/Mirror camera folders
  └── Male/Female videos (.avi)

PROCESS:
  - Open video files
  - Extract frames at 5 FPS
  - Detect yawn/normal from filename
  - Map yawn → drowsy, normal → alert
  - Resize to 640x480

OUTPUT: datasets/processed/yawdd/
  ├── alert/
  ├── drowsy/
  └── metadata.json

STATUS: ⏳ Processing ~348 videos
```

##### **uta_rldd_processor.py**
```
INPUT: datasets/raw/UTA-RLDD/
  ├── train/active/ + train/fatigue/
  ├── val/active/ + val/fatigue/
  └── test/active/ + test/fatigue/

PROCESS:
  - Map active → alert, fatigue → drowsy
  - Preserve train/val/test splits
  - Copy and resize to 224x224

OUTPUT: datasets/processed/uta_rldd/
  ├── train/alert/ + train/drowsy/
  ├── val/alert/ + val/drowsy/
  ├── test/alert/ + test/drowsy/
  └── metadata.json

STATUS: ⏳ Processing ~18,000 images
```

##### **vicomtech_drowsy_processor.py**
```
INPUT: datasets/raw/vicomtech/dmd-dataset-drowsiness-gA-1/
  └── OpenLABEL JSON with eye state annotations

PROCESS:
  - Parse frame intervals for:
    * Action 0: eyes_open → alert
    * Action 1: eyes_closed → drowsy
    * Action 5/6: yawning → drowsy
  - Extract frames from face camera video
  - Sample at 2 FPS

OUTPUT: datasets/processed/vicomtech_drowsy/
  ├── alert/ (206 images)
  ├── drowsy/ (99 images)
  └── metadata.json

COMPLETED: ✅ 305 images
```

#### 2. **training_data_collector.py**

```
INPUT: Laptop webcam (live camera feed)

PROCESS:
  - Open camera with OpenCV
  - Display live preview
  - User controls:
    * SPACE: Pause/Resume
    * 1/2/3: Set label (alert/drowsy/distracted)
    * A: Auto-capture (continuous)
    * C: Manual capture (single frame)
    * Q: Quit
  - Save frames to session folder

OUTPUT: datasets/raw/custom/{session_name}/
  ├── ALERT/
  ├── DROWSY/
  ├── DISTRACTED/
  └── session_metadata.json

USAGE: python collect_data.py
```

#### 3. **dataset_merger.py**

```
INPUT: Multiple processed datasets
  - datasets/processed/state_farm/
  - datasets/processed/dmd/
  - datasets/processed/nthuddd/
  - datasets/processed/yawdd/
  - datasets/processed/uta_rldd/
  - datasets/processed/vicomtech_drowsy/
  - datasets/raw/custom/*/

PROCESS:
  1. Collect samples from all datasets
  2. Standardize labels (ALERT/DROWSY/DISTRACTED)
  3. Optional: Balance classes
  4. Split into train (70%) / val (15%) / test (15%)
  5. Copy images to merged structure
  6. Generate combined statistics

OUTPUT: datasets/processed/merged/
  ├── train/
  │   ├── alert/
  │   ├── drowsy/
  │   └── distracted/
  ├── val/
  │   ├── alert/
  │   ├── drowsy/
  │   └── distracted/
  ├── test/
  │   ├── alert/
  │   ├── drowsy/
  │   └── distracted/
  └── metadata.json

EXPECTED: ~200,000+ samples
```

#### 4. **feature_pipeline.py**

```
INPUT: Merged dataset (images)
  - datasets/processed/merged/

PROCESS:
  1. Initialize MediaPipe Face Mesh
  2. For each image:
     - Detect face landmarks (468 points)
     - Extract EAR (Eye Aspect Ratio)
     - Extract MAR (Mouth Aspect Ratio)
     - Calculate PERCLOS
     - Estimate head pose (pitch/yaw/roll)
     - Save features
  3. Cache features for fast reloading

OUTPUT: datasets/processed/features/
  ├── merged_features.pkl (pickled features)
  ├── merged_features.csv (tabular format)
  └── feature_metadata.json

FEATURES PER IMAGE:
  - left_ear, right_ear, avg_ear
  - mar
  - perclos
  - pitch, yaw, roll
  - 468 landmarks (x, y, z)
  - label
```

---

### **Layer 3: Model Training**

#### 1. **train_classifier.py** (To be completed by Abrar)

```
INPUT:
  - Feature vectors from feature_pipeline
  - datasets/processed/features/merged_features.pkl

PROCESS:
  1. Load features and labels
  2. Split train/val/test
  3. Build model architecture:
     - MobileNetV3 base (pre-trained on ImageNet)
     - OR custom CNN + LSTM for temporal
  4. Compile model (Adam optimizer, categorical crossentropy)
  5. Train with:
     - Data augmentation
     - Early stopping
     - Learning rate scheduling
  6. Save best model

OUTPUT: models/
  ├── best_model.h5
  ├── training_history.json
  └── model_config.json

METRICS:
  - Accuracy, Precision, Recall, F1
  - Confusion matrix
  - Per-class performance
```

#### 2. **model_evaluation.py** (To be completed by Abrar)

```
INPUT:
  - Trained model (best_model.h5)
  - Test dataset

PROCESS:
  1. Load model
  2. Predict on test set
  3. Calculate metrics:
     - Accuracy, Precision, Recall, F1
     - ROC curve, AUC
     - Confusion matrix
  4. Per-class analysis
  5. Error analysis
  6. Generate visualizations

OUTPUT:
  - Evaluation report (JSON/PDF)
  - Confusion matrix plot
  - ROC curves
  - Misclassification examples

EXPECTED PERFORMANCE:
  - Accuracy: >90%
  - Alert class: >95% (most common)
  - Drowsy class: >85% (critical)
  - Distracted class: >88%
```

---

## 🔗 Component Relationships

```
config.py ──────┬─────────────────────────────────┐
                │                                 │
                ├──▶ state_farm_processor.py      │
                ├──▶ dmd_processor.py             │
                ├──▶ nthuddd_processor.py         │
                ├──▶ yawdd_processor.py           │
                ├──▶ uta_rldd_processor.py        │
                ├──▶ vicomtech_drowsy_processor.py│
                │                                  │
                │         ALL OUTPUT TO            │
                │              ▼                   │
                │    datasets/processed/           │
                │              │                   │
                │              ▼                   │
                ├──▶ dataset_merger.py ────▶ merged/
                │              │
                │              ▼
                └──▶ train_classifier.py ────▶ models/
                     (CNN extracts features automatically)

constants.py ───▶ All feature extraction modules
helpers.py ─────▶ All processing modules
```

---

## ✅ Current Status

| Component | Status | Samples | Notes |
|-----------|--------|---------|-------|
| State Farm | ✅ Done | 102,150 | Alert + Distracted |
| DMD | ✅ Done | 13,642 | All 3 classes |
| NTHUDDD | ✅ Done | 66,521 | Alert + Drowsy |
| Vicomtech Drowsy | ✅ Done | 305 | Alert + Drowsy |
| YawDD | ⏳ Running | ~14,000 | Alert + Drowsy |
| UTA-RLDD | ⏳ Running | ~18,000 | Alert + Drowsy |
| Custom Collection | ⏸️ Ready | 0 | **Start now!** |
| Dataset Merger | ⏸️ Pending | - | After processors |
| Feature Extraction | ⏸️ Pending | - | After merger |
| Model Training | ⏸️ Pending | - | Abrar's task |

---

## 🚀 Next Steps for You

### **1. Collect Custom Pakistani Dataset**

```bash
# Activate environment
.\venv\Scripts\Activate.ps1

# Start collection
python collect_data.py
```

**Target**: 1,500+ samples (500 per class)

**Strategy**:
- Session 1: Basic states (300 samples)
- Session 2: With shawl/dupatta (200 samples)
- Session 3: Bright sunlight (200 samples)
- Session 4: Night/low-light (200 samples)
- Sessions 5-10: Varied conditions (600 samples)

### **2. Wait for Processors** (~30 mins)
- YawDD and UTA-RLDD will complete soon
- Check status: `Get-ChildItem datasets\processed\`

### **3. Merge Datasets**

```bash
python -m ai_components.data_collection.dataset_merger
```

### **4. Extract Features**

```bash
python -m ai_components.feature_extraction.enhanced_feature_extractor
```

### **5. Transfer to GPU Machine**
- Copy `datasets/processed/merged/` (or just features)
- Copy code repository
- Abrar starts training

---

## 💡 Key Design Decisions

1. **Modular Architecture**: Each dataset has its own processor
2. **Standard Output**: All processors output to same format
3. **Configuration-Driven**: Centralized config for easy changes
4. **Lazy Loading**: Processors don't load heavy libraries until needed
5. **Metadata Tracking**: Every stage saves metadata.json
6. **Error Recovery**: Processors can resume if interrupted

Everything is ready. **Start collecting your custom data now!** 🎥
