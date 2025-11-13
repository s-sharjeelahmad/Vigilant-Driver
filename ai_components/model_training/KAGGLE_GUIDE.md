# Vigilant Driver - Kaggle Training Notebook

**Quick start notebook for training on Kaggle GPUs**

## Setup

```python
# Install additional dependencies
!pip install -q seaborn tqdm tensorboard

# Clone repository
!git clone https://github.com/S-Areeb-Ashraf/Final-Year-Project.git
%cd Final-Year-Project
```

## Dataset Preparation

### Option 1: Upload to Kaggle Datasets (Recommended)

1. Upload `merged_final.zip` to Kaggle Datasets (private)
2. Add dataset to notebook
3. Extract:

```python
import zipfile
import os

# Extract dataset
with zipfile.ZipFile('/kaggle/input/merged-final/merged_final.zip', 'r') as zip_ref:
    zip_ref.extractall('/kaggle/working/')

# Verify structure
!ls /kaggle/working/merged_final/train
# Should show: ALERT, DISTRACTED, DROWSY
```

### Option 2: Download from Google Drive

```python
# Download dataset
!gdown --id YOUR_GOOGLE_DRIVE_FILE_ID -O merged_final.zip

# Extract
!unzip -q merged_final.zip -d /kaggle/working/
```

## Quick Test (5 epochs)

```python
!python ai_components/model_training/train_classifier.py \
    --data-dir /kaggle/working/merged_final \
    --model resnet18 \
    --epochs 5 \
    --batch-size 32 \
    --save-dir /kaggle/working/models/quick_test \
    --use-amp
```

## Full Training (ResNet18)

```python
!python ai_components/model_training/train_classifier.py \
    --data-dir /kaggle/working/merged_final \
    --model resnet18 \
    --epochs 50 \
    --batch-size 32 \
    --lr 0.0001 \
    --optimizer adam \
    --scheduler cosine \
    --save-dir /kaggle/working/models/resnet18_baseline \
    --use-amp \
    --early-stopping \
    --patience 10
```

## Mobile Model (MobileNetV3)

```python
!python ai_components/model_training/train_classifier.py \
    --data-dir /kaggle/working/merged_final \
    --model mobilenet_v3_small \
    --epochs 50 \
    --batch-size 64 \
    --save-dir /kaggle/working/models/mobilenet_baseline \
    --use-amp \
    --early-stopping
```

## View Results

```python
import json
import matplotlib.pyplot as plt
from PIL import Image

# Load training history
with open('/kaggle/working/models/resnet18_baseline/training_history.json', 'r') as f:
    history = json.load(f)

# Plot training curves
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(history['train_loss'], label='Train Loss')
plt.plot(history['val_loss'], label='Val Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.title('Training Loss')

plt.subplot(1, 2, 2)
plt.plot(history['train_acc'], label='Train Acc')
plt.plot(history['val_acc'], label='Val Acc')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()
plt.title('Training Accuracy')

plt.tight_layout()
plt.show()

# Show confusion matrix
img = Image.open('/kaggle/working/models/resnet18_baseline/confusion_matrix.png')
plt.figure(figsize=(10, 8))
plt.imshow(img)
plt.axis('off')
plt.show()

# Print test report
with open('/kaggle/working/models/resnet18_baseline/test_report.txt', 'r') as f:
    print(f.read())
```

## Download Models

```python
# Download trained models
from IPython.display import FileLink
import shutil

# Create zip of models folder
shutil.make_archive('/kaggle/working/trained_models', 'zip', '/kaggle/working/models')

# Display download link
FileLink('/kaggle/working/trained_models.zip')
```

## Tips for Kaggle

1. **GPU Session Limits**: Kaggle gives ~30 hours GPU/week
2. **Save Frequently**: Copy outputs to `/kaggle/working/` so they persist
3. **Internet**: Enable internet in notebook settings if needed
4. **Commit**: Click "Save Version" to save your work
5. **Resume Training**: Save checkpoints and resume if session times out

## Kaggle-Specific Settings

```python
# Use smaller batch size if OOM
--batch-size 16

# Reduce workers (Kaggle has limited CPUs)
--num-workers 2

# Use mixed precision (saves memory)
--use-amp
```

## Monitor GPU

```python
# Check GPU
!nvidia-smi

# Check PyTorch GPU
import torch
print("CUDA Available:", torch.cuda.is_available())
print("GPU Count:", torch.cuda.device_count())
print("GPU Name:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "N/A")
```

## Troubleshooting

### Out of Memory

```python
# Reduce batch size
--batch-size 8

# Use smaller model
--model mobilenet_v3_small

# Reduce image size
--img-size 192
```

### Session Timeout

```python
# Save checkpoint every 5 epochs (automatic)
# Resume from checkpoint:
!python ai_components/model_training/train_classifier.py \
    --resume /kaggle/working/models/resnet18_baseline/checkpoint_epoch_25.pth
```

---

**Ready to train! Good luck! 🚀**
