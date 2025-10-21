# 🎯 Vigilant Driver - Quick Workflow Guide

## Current Project Status

### ✅ Completed (182,618 samples)
- State Farm: 102,150 samples
- DMD (Vicomtech): 13,642 samples  
- NTHUDDD: 66,521 samples
- Vicomtech Drowsy: 305 samples

### ⏳ Processing (~32,000 samples)
- YawDD: ~14,000 samples (videos → frames)
- UTA-RLDD: ~18,000 samples (copying)

### 🎥 Ready to Start
- **Custom Pakistani Dataset**: 0 samples → **TARGET: 1,500+**

---

## 🚀 Your Immediate Action Plan

### Step 1: Start Custom Data Collection (NOW)

```powershell
# Activate environment
.\venv\Scripts\Activate.ps1

# Launch collection tool
python collect_data.py
```

**Collection Guide:**

1. **Enter session name**: `pakistani_session_1`

2. **Collect ALERT samples (500 target)**
   - Press `1` to select ALERT label
   - Press `A` to enable auto-capture
   - Sit normally, eyes open, looking forward
   - Move head slightly (left/right/up/down)
   - Press `S` to see statistics (aim for 100+ per session)
   - Press `SPACE` to pause when done

3. **Collect DROWSY samples (500 target)**
   - Press `SPACE` to resume
   - Press `2` to select DROWSY label
   - Press `A` for auto-capture
   - Close eyes, yawn, head nodding
   - Simulate sleepy behavior
   - Press `SPACE` to pause

4. **Collect DISTRACTED samples (500 target)**
   - Press `SPACE` to resume
   - Press `3` to select DISTRACTED label  
   - Press `A` for auto-capture
   - Look left/right (phone, mirror)
   - Look down (texting)
   - Turn head away from camera
   - Press `SPACE` to pause

5. **Save and exit**
   - Press `Q` to quit and save
   - Check: `datasets/raw/custom/pakistani_session_1/`

**Repeat 5-10 sessions with variations:**
- With dupatta/shawl
- Different lighting (bright/dim/night)
- Different angles
- With/without glasses
- Different times of day

---

## 📊 After Collection: Complete Pipeline

### Step 2: Wait for Background Processors (~30 minutes)

Check if YawDD and UTA-RLDD are complete:

```powershell
# Check processed folders
Get-ChildItem datasets\processed\ | Select-Object Name, LastWriteTime
```

When you see `yawdd/` and `uta_rldd/` folders, processors are done!

### Step 3: Merge All Datasets

```powershell
python -m ai_components.data_collection.dataset_merger
```

**What this does:**
- Combines all 7 datasets (State Farm + DMD + NTHUDDD + YawDD + UTA-RLDD + Vicomtech + Custom)
- Creates unified format: ALERT / DROWSY / DISTRACTED
- Splits into train (70%) / val (15%) / test (15%)
- Balances classes (optional)
- Output: `datasets/processed/merged/`

**Expected total: ~220,000+ samples**

### Step 4: Extract Features

```powershell
python run_complete_pipeline.py
```

Or manually:

```powershell
python -m ai_components.data_collection.feature_pipeline
```

**What this does:**
- Uses MediaPipe to detect 468 facial landmarks
- Calculates EAR, MAR, PERCLOS, head pose for each image
- Saves features to `datasets/processed/features/merged_features.pkl`
- Creates CSV file for inspection

**Time estimate: 2-3 hours for 220,000 images**

### Step 5: Transfer to University GPU Machine

Package everything:

```powershell
# Create transfer folder
New-Item -ItemType Directory -Path "transfer_to_gpu"

# Copy essential files
Copy-Item -Recurse datasets\processed\merged transfer_to_gpu\
Copy-Item -Recurse datasets\processed\features transfer_to_gpu\
Copy-Item -Recurse ai_components transfer_to_gpu\
Copy-Item requirements.txt transfer_to_gpu\
Copy-Item run_complete_pipeline.py transfer_to_gpu\
```

Compress and transfer to GPU machine.

### Step 6: Train Model (Abrar's Part)

On GPU machine:

```bash
# Install dependencies
pip install -r requirements.txt

# Train model
python -m ai_components.model_training.train_classifier
```

**Expected training time: 4-6 hours on GPU**

**Expected accuracy: >90%**

---

## 📁 Key File Locations

| What | Where |
|------|-------|
| Raw datasets | `datasets/raw/` |
| Processed datasets | `datasets/processed/` |
| Custom collected data | `datasets/raw/custom/` |
| Merged dataset | `datasets/processed/merged/` |
| Extracted features | `datasets/processed/features/` |
| Trained models | `models/` |
| Logs | `logs/` |
| Config file | `ai_components/utils/config.py` |

---

## 🎯 Quick Reference: Dataset Processors

Each processor reads from `datasets/raw/<name>/` and outputs to `datasets/processed/<name>/`:

```
state_farm_processor     → State Farm images
dmd_processor            → Vicomtech DMD videos
nthuddd_processor        → NTHUDDD images (✅ DONE: 66,521)
yawdd_processor          → YawDD videos (⏳ RUNNING)
uta_rldd_processor       → UTA-RLDD images (⏳ RUNNING)
vicomtech_drowsy_processor → Vicomtech drowsy videos (✅ DONE: 305)
training_data_collector  → YOUR custom camera data (🎥 START NOW!)
```

---

## 🔍 Understanding the Pipeline

```
YOUR CAMERA
    │
    ├─▶ training_data_collector.py ──▶ datasets/raw/custom/
    │
    ▼
[Raw Images from 7 datasets]
    │
    ├─▶ 6 Processors ──▶ datasets/processed/{dataset}/
    │
    ▼
[Standardized: alert/drowsy/distracted folders]
    │
    ├─▶ dataset_merger.py ──▶ datasets/processed/merged/
    │
    ▼
[Unified dataset with train/val/test splits]
    │
    ├─▶ feature_pipeline.py ──▶ datasets/processed/features/
    │
    ▼
[Feature vectors: EAR, MAR, PERCLOS, head pose, landmarks]
    │
    ├─▶ train_classifier.py ──▶ models/best_model.h5
    │
    ▼
[Trained CNN/LSTM model ready for deployment]
```

---

## ⚙️ Feature Extraction Explained

When you collect data, this is what happens during feature extraction:

### Input: Your Camera Image
![Face in image]

### Process: MediaPipe Detection
- Detects 468 facial landmarks (eyes, mouth, nose, face outline)
- Calculates metrics:

**1. EAR (Eye Aspect Ratio)**
- Normal: 0.25 - 0.35
- **Drowsy: < 0.25** ⚠️
- Formula: `(vertical_eye / horizontal_eye)`

**2. MAR (Mouth Aspect Ratio)**
- Normal: 0.3 - 0.5
- **Yawning: > 0.6** ⚠️
- Formula: `(vertical_mouth / horizontal_mouth)`

**3. PERCLOS (Percentage Eye Closure)**
- Normal: 0% - 20%
- Tired: 20% - 70%
- **Severely Drowsy: > 80%** ⚠️⚠️
- Measured over 30-frame window

**4. Head Pose**
- Pitch: Looking up (+) / down (-)
- Yaw: Looking left (-) / right (+)
- Roll: Head tilt left (-) / right (+)
- **Distracted: |yaw| > 20° or |pitch| > 15°** ⚠️

### Output: Feature Vector
```python
{
  avg_ear: 0.28,      # Eyes open
  mar: 0.45,          # Not yawning
  perclos: 0.15,      # 15% closure (normal)
  yaw: -5.2,          # Looking slightly left
  pitch: 3.1,         # Looking slightly down
  roll: 1.0,          # Head straight
  label: "alert"      # Classification
}
```

---

## 🚨 Troubleshooting

### Camera Not Opening
```powershell
# Test camera
python -c "import cv2; cap = cv2.VideoCapture(0); print('Camera OK' if cap.isOpened() else 'Camera Failed')"
```

### Processor Taking Too Long
- YawDD/UTA-RLDD are background processes
- Check terminal output for progress
- Can interrupt with Ctrl+C and restart later

### Features Not Extracting
```powershell
# Test MediaPipe
python -c "import mediapipe; print('MediaPipe OK')"
```

### Out of Disk Space
- Each image: ~100-200 KB
- 220,000 images ≈ 22-44 GB
- Ensure 50+ GB free space

---

## ✅ Quality Checklist

Before collecting custom data, verify:

- [ ] Good lighting (not too dark/bright)
- [ ] Camera at eye level
- [ ] Face clearly visible
- [ ] Stable camera position
- [ ] Quiet environment
- [ ] 30+ minutes available
- [ ] Comfortable seating

During collection:
- [ ] Vary head positions slightly
- [ ] Realistic drowsy behavior (not fake)
- [ ] Natural distractions (phone, mirror)
- [ ] Balanced samples (check with `S` key)

After collection:
- [ ] Check `datasets/raw/custom/` has 3 folders
- [ ] Each folder has 100+ images
- [ ] session_metadata.json exists
- [ ] Images are clear and not blurry

---

## 🎓 For Your FYP Report

### Dataset Breakdown

| Dataset | Source | Samples | Classes | Purpose |
|---------|--------|---------|---------|---------|
| State Farm | Kaggle | 102,150 | Alert, Distracted | Distracted driving |
| DMD | Vicomtech | 13,642 | All 3 | General drowsiness |
| NTHUDDD | Taiwan | 66,521 | Alert, Drowsy | Drowsiness detection |
| YawDD | Turkey | ~14,000 | Alert, Drowsy | Yawn detection |
| UTA-RLDD | UTA | ~18,000 | Alert, Drowsy | Fatigue detection |
| Vicomtech Drowsy | Vicomtech | 305 | Alert, Drowsy | Eye state |
| **Custom Pakistani** | **You** | **1,500+** | **All 3** | **Local diversity** |
| **TOTAL** | - | **~217,000** | **All 3** | **Comprehensive** |

### Why Custom Data Matters
- Existing datasets are Western/Asian faces
- Pakistani facial features different
- Cultural clothing (dupatta/shawl) unique
- Local lighting conditions
- Language/behavior patterns
- **Improves model generalization for deployment in Pakistan**

---

## 📞 Support

If stuck:
1. Check `logs/` folder for error messages
2. Verify virtual environment activated
3. Check disk space: `Get-PSDrive C`
4. Re-read `AI_COMPONENTS_ARCHITECTURE.md` for details

**Everything is ready. Start collecting now!** 🎥✨
