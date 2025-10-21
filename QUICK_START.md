# VIGILANT DRIVER - QUICK REFERENCE

## START DATA COLLECTION
```powershell
.\venv\Scripts\Activate.ps1
python collect_data.py
```

### Camera Controls
- **SPACE** → Pause/Resume
- **1** → ALERT label
- **2** → DROWSY label  
- **3** → DISTRACTED label
- **C** → Capture one frame
- **A** → Auto-capture ON/OFF
- **Q** → Quit & save

## PROCESS DATASETS
```powershell
.\venv\Scripts\Activate.ps1

# Already completed:
# - State Farm: 102,150 samples
# - DMD: 13,642 samples  
# - NTHUDDD: 66,521 samples
# - Vicomtech Drowsy: 305 samples

# Still processing:
python -m ai_components.data_collection.yawdd_processor
python -m ai_components.data_collection.uta_rldd_processor
```

## DATASET STATUS

### Completed ✓
1. State Farm - 102,150 (alert + distracted)
2. DMD - 13,642 (alert + distracted)
3. NTHUDDD - 66,521 (alert + drowsy)
4. Vicomtech Drowsy - 305 (alert + drowsy)

### In Progress ⏳
5. YawDD - Extracting frames from videos
6. UTA-RLDD - Copying and resizing images

### Pending
7. Custom Pakistani data - Use collect_data.py

## NEXT STEPS

1. **Wait for processors** (~30-45 mins)
2. **Merge datasets**
   ```powershell
   python -m ai_components.data_collection.dataset_merger
   ```
3. **Extract features**
   ```powershell
   python -m ai_components.feature_extraction.enhanced_feature_extractor
   ```
4. **Collect custom data** (while waiting)
   ```powershell
   python collect_data.py
   ```

## FILE LOCATIONS
- Raw data: `datasets/raw/`
- Processed: `datasets/processed/`
- Custom data: `datasets/raw/custom/`
- Models: `models/`

## IMPORTANT NOTES
- Always activate venv first
- Custom data target: 1,500+ samples
- Use PAUSE feature between states
- Aim for 100+ samples per class per session
