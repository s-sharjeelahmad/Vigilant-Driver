# Model Training Guide

Complete guide for training driver state classification models using PyTorch.

## 🚀 Quick Start

### 1. Setup Environment

```powershell
# Clone repository
git clone https://github.com/S-Areeb-Ashraf/Final-Year-Project.git
cd Final-Year-Project

# Create virtual environment
python -m venv venv

# Activate environment (Windows)
.\venv\Scripts\Activate.ps1

# Install PyTorch with CUDA (adjust version for your GPU)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install other dependencies
pip install -r requirements.txt
```

### 2. Prepare Dataset

```powershell
# Extract dataset to correct location
Expand-Archive -Path merged_final.zip -DestinationPath datasets\processed\

# Verify structure
dir datasets\processed\merged_final\train
# Should show: ALERT, DISTRACTED, DROWSY folders
```

### 3. Quick Test (1 epoch)

```powershell
python ai_components/model_training/train_classifier.py `
    --data-dir datasets/processed/merged_final `
    --model resnet18 `
    --epochs 1 `
    --batch-size 16 `
    --save-dir models/test_run `
    --use-amp
```

## 📊 Training Commands

### Baseline (ResNet18) - Recommended

```powershell
python ai_components/model_training/train_classifier.py `
    --data-dir datasets/processed/merged_final `
    --model resnet18 `
    --epochs 50 `
    --batch-size 32 `
    --lr 0.0001 `
    --optimizer adam `
    --scheduler cosine `
    --save-dir models/resnet18_baseline `
    --use-amp `
    --early-stopping `
    --patience 10
```

**Expected:** 86-89% accuracy, 6-8 hours

### Mobile (MobileNetV3-Small)

```powershell
python ai_components/model_training/train_classifier.py `
    --data-dir datasets/processed/merged_final `
    --model mobilenet_v3_small `
    --epochs 50 `
    --batch-size 64 `
    --lr 0.0001 `
    --save-dir models/mobilenet_baseline `
    --use-amp `
    --early-stopping `
    --patience 10
```

**Expected:** 83-86% accuracy, 4-6 hours

### High Accuracy (ResNet50)

```powershell
python ai_components/model_training/train_classifier.py `
    --data-dir datasets/processed/merged_final `
    --model resnet50 `
    --epochs 50 `
    --batch-size 16 `
    --lr 0.00005 `
    --save-dir models/resnet50_baseline `
    --use-amp `
    --early-stopping `
    --patience 10
```

**Expected:** 88-91% accuracy, 10-12 hours

## 🎛️ Command Line Arguments

### Required

- `--data-dir`: Path to dataset with train/val/test folders

### Model

- `--model`: Model architecture (`resnet18`, `resnet50`, `mobilenet_v3_small`, `mobilenet_v3_large`)
- `--pretrained`: Use ImageNet pretrained weights (default: True)
- `--img-size`: Input image size (default: 224)

### Training

- `--epochs`: Number of training epochs (default: 50)
- `--batch-size`: Batch size (default: 32)
- `--lr`: Learning rate (default: 0.0001)
- `--optimizer`: Optimizer (`adam`, `adamw`, `sgd`)
- `--scheduler`: LR scheduler (`cosine`, `step`, `plateau`, `none`)
- `--weight-decay`: Weight decay for regularization (default: 0.0001)
- `--class-weights`: Class weights for imbalanced data (e.g., `--class-weights 1.0 1.0 2.0`)

### System

- `--device`: Device (`cuda` or `cpu`)
- `--num-workers`: Number of data loading workers (default: 4)
- `--use-amp`: Use automatic mixed precision (recommended)

### Checkpointing

- `--save-dir`: Directory to save models (default: `models/run`)
- `--early-stopping`: Enable early stopping
- `--patience`: Early stopping patience (default: 10)

## 📈 Monitoring Training

### TensorBoard

```powershell
# In a separate terminal
tensorboard --logdir runs

# Open browser: http://localhost:6006
```

### GPU Monitoring

```powershell
# Check GPU usage
nvidia-smi

# Watch GPU in real-time (Linux/WSL)
watch -n 1 nvidia-smi
```

## 📁 Output Files

After training completes, you'll find:

```
models/resnet18_baseline/
├── best_model.pth              # Best validation accuracy model
├── checkpoint_epoch_50.pth     # Final checkpoint
├── training_history.json       # Loss/accuracy per epoch
├── training_curves.png         # Training plots
├── test_report.txt            # Classification report
├── confusion_matrix.png       # Confusion matrix visualization
└── summary.json               # Training summary
```

## 🔧 Troubleshooting

### Out of Memory Error

```powershell
# Reduce batch size
--batch-size 16  # or --batch-size 8

# Use smaller model
--model mobilenet_v3_small

# Reduce image size
--img-size 192
```

### CUDA Not Available

```powershell
# Check CUDA installation
nvidia-smi

# Check PyTorch CUDA
python -c "import torch; print(torch.cuda.is_available())"

# Reinstall PyTorch with correct CUDA version
# For CUDA 11.8:
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# For CUDA 12.1:
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

### Slow Training

```powershell
# Use mixed precision
--use-amp

# Increase workers
--num-workers 8

# Check GPU utilization
nvidia-smi
# Should be >80%
```

## 🎯 Hyperparameter Tuning

### Learning Rate

```powershell
# Conservative (safe, slower)
--lr 0.00005

# Default (balanced)
--lr 0.0001

# Aggressive (faster, may overfit)
--lr 0.0005
```

### Batch Size

- **Small GPU (8 GB)**: `--batch-size 16`
- **Medium GPU (12-16 GB)**: `--batch-size 32`
- **Large GPU (24+ GB)**: `--batch-size 64`

### Scheduler

- **Cosine** (recommended): Smooth annealing
- **Step**: Reduce LR every N epochs
- **Plateau**: Reduce on validation plateau

### Class Weights (for imbalanced data)

```powershell
# Give DISTRACTED class 2x weight
--class-weights 1.0 1.0 2.0
```

## 📊 Expected Results

| Model       | Accuracy | DROWSY Recall | Inference (ms) | Size (MB) |
| ----------- | -------- | ------------- | -------------- | --------- |
| MobileNetV3 | 84%      | 88%           | 15 ms          | 5 MB      |
| ResNet18    | 87%      | 92%           | 25 ms          | 45 MB     |
| ResNet50    | 89%      | 94%           | 50 ms          | 98 MB     |

## 🎓 Training Best Practices

1. **Always start with a quick test** (1-5 epochs) to verify setup
2. **Use mixed precision** (`--use-amp`) for 2x speedup
3. **Enable early stopping** to prevent overfitting
4. **Monitor TensorBoard** to watch training progress
5. **Save checkpoints** every few epochs
6. **Compare multiple models** to find best for your use case

## 📧 Support

For issues or questions, contact the development team.

**Team:**

- Syed: Data Collection & Feature Engineering
- Abrar: AI Model Training
- Areeb: Backend & Documentation
