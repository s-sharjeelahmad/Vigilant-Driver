# Project File Structure Overview

## 📂 Clean and Minimal Structure

### Root Scripts (3 files only)

```
collect_data.py          - Launch custom data collection tool
merge_datasets.py        - Merge all 6 datasets + custom into train/val/test
verify_datasets.py       - Verify dataset integrity
```

### AI Components

```
ai_components/
├── utils/               - Core utilities
│   ├── config.py        - Centralized configuration
│   ├── constants.py     - System constants & enums
│   └── helpers.py       - Helper functions
│
├── data_collection/     - Dataset processing
│   ├── state_farm_processor.py
│   ├── dmd_processor.py
│   ├── nthuddd_processor.py
│   ├── yawdd_processor.py
│   ├── uta_rldd_processor.py
│   ├── vicomtech_drowsy_processor.py
│   ├── training_data_collector.py  - Camera collection tool
│   ├── dataset_merger.py           - Merge logic
│   ├── dataset_analyzer.py         - Analysis tools
│   ├── data_preprocessor.py        - Preprocessing
│   └── feature_pipeline.py         - Feature extraction
│
└── model_training/      - ML training (Abrar's work)
    ├── train_classifier.py         - Model training
    └── model_evaluation.py         - Evaluation metrics
```

### Documentation (2 files)

```
README.md                          - Complete project guide
FOR_ABRAR_INSTRUCTIONS.md          - Training instructions for teammate
```

### Data Folders (Not in Git)

```
datasets/                - Local only (~100 GB)
models/                  - Trained models
logs/                    - Processing logs
```

---

## 🎯 Workflow

### Phase 1: Data Collection (Syed)

1. Download 6 public datasets → `datasets/raw/`
2. Run processors → `datasets/processed/`
3. Collect custom data: `python collect_data.py`
4. Merge all: `python merge_datasets.py`

### Phase 2: Model Training (Abrar)

1. Get merged dataset from Syed
2. Implement training in `train_classifier.py`
3. Train model
4. Return trained model to Syed

### Phase 3: Deployment (Both)

1. Convert model to mobile format
2. Integrate with app
3. Test and deploy

---

## ✅ No Redundancy

- ❌ Removed 5 duplicate merge scripts → 1 clean script
- ❌ Removed 5 redundant docs → 1 comprehensive README
- ❌ Removed complex pipeline runner → Simple individual scripts
- ✅ Clean, minimal, efficient structure

---

**Total Files:**

- Python: 3 root scripts + 20 ai_components files
- Docs: 2 markdown files
- Config: requirements.txt, .gitignore

**Total Lines of Code:** ~8,600
