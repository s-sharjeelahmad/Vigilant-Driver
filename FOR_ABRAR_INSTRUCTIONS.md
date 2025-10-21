# 📋 Instructions for Abrar - Model Training

## 🎯 Your Task: Train the Driver State Classification Model

You will receive processed datasets and your job is to:
1. Build a CNN-based classifier
2. Train it on the merged dataset
3. Achieve >90% accuracy
4. Deploy the model for inference

---

## 📦 What You Will Receive from Me

### 1. **Processed Datasets** (~217,000 images)

I will provide you with a folder containing:

```
datasets/
└── processed/
    ├── merged/
    │   ├── train/
    │   │   ├── alert/       (~152,000 images)
    │   │   ├── drowsy/      (~32,000 images)
    │   │   └── distracted/  (~33,000 images)
    │   ├── val/
    │   │   ├── alert/
    │   │   ├── drowsy/
    │   │   └── distracted/
    │   └── test/
    │       ├── alert/
    │       ├── drowsy/
    │       └── distracted/
    └── metadata.json
```

**How to receive:**
- I'll transfer via external HDD or university network
- Compressed size: ~15-20 GB
- Uncompressed: ~40-50 GB

### 2. **Complete Code Repository**

```
vigilant_driver/
├── ai_components/
│   ├── utils/          # Config, constants, helpers
│   ├── data_collection/ # All processors (for reference)
│   └── model_training/ # YOUR WORK HERE
│       ├── train_classifier.py    # ⚠️ IMPLEMENT THIS
│       └── model_evaluation.py    # ⚠️ IMPLEMENT THIS
├── requirements.txt
└── FOR_ABRAR_INSTRUCTIONS.md  # This file
```

### 3. **Configuration File**

The system uses centralized configuration in `ai_components/utils/config.py`:

```python
from ai_components.utils.config import get_config

config = get_config()
print(config.paths.processed_data_dir)  # Where datasets are
print(config.paths.models_dir)          # Where to save models
print(config.model.input_size)          # (224, 224)
print(config.model.num_classes)         # 3 (alert, drowsy, distracted)
```

---

## 🔧 Setup Instructions

### Step 1: Receive Data

1. Get the external HDD/folder from me
2. Copy `datasets/processed/merged/` to your machine
3. Verify file structure matches above

```powershell
# Verify dataset
Get-ChildItem datasets\processed\merged\train\* | Measure-Object | Select-Object Count
# Should show 3 folders (alert, drowsy, distracted)
```

### Step 2: Setup Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install additional ML libraries
pip install tensorflow  # or pytorch, your choice
pip install keras
pip install scikit-learn
pip install matplotlib seaborn  # for visualization
pip install tensorboard  # for training monitoring
```

### Step 3: Verify GPU (if available)

```python
# For TensorFlow
import tensorflow as tf
print("GPUs Available:", tf.config.list_physical_devices('GPU'))

# For PyTorch
import torch
print("CUDA Available:", torch.cuda.is_available())
print("GPU Name:", torch.cuda.get_device_name(0))
```

---

## 📝 Implementation Guide

### Your Main Task: `train_classifier.py`

File location: `ai_components/model_training/train_classifier.py`

**Current state:** Boilerplate with TODO comments (lines 1-178)

**What you need to implement:**

#### 1. Data Loading

```python
def load_dataset(self, train_path, val_path, batch_size=32):
    """
    Load images using ImageDataGenerator or Dataset API
    
    Requirements:
    - Load from train/ and val/ folders
    - Apply data augmentation for training:
      * Random rotation (±15°)
      * Random zoom (0.9-1.1)
      * Horizontal flip
      * Brightness adjustment (0.8-1.2)
    - Normalize images to [0, 1]
    - Batch size: 32 (or 64 if GPU has enough memory)
    
    Labels:
    - alert: 0
    - distracted: 1
    - drowsy: 2
    """
    # TODO: Implement using tf.keras.preprocessing or torch.utils.data
```

#### 2. Model Architecture

**Option A: Transfer Learning (Recommended)**

```python
def build_model(self):
    """
    Use pre-trained model for transfer learning
    
    Recommended architectures:
    1. ResNet50 (best accuracy)
    2. MobileNetV3 (best for mobile deployment)
    3. EfficientNetB0 (balance of both)
    
    Steps:
    1. Load pre-trained ImageNet weights
    2. Freeze base layers (or fine-tune last few)
    3. Add custom classification head:
       - GlobalAveragePooling2D
       - Dense(256, activation='relu')
       - Dropout(0.5)
       - Dense(3, activation='softmax')
    
    Input shape: (224, 224, 3)
    Output: 3 classes (softmax)
    """
    # Example with TensorFlow/Keras:
    base = tf.keras.applications.ResNet50(
        include_top=False,
        weights='imagenet',
        input_shape=(224, 224, 3)
    )
    base.trainable = False  # Freeze base
    
    model = tf.keras.Sequential([
        base,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(256, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(3, activation='softmax')
    ])
    
    return model
```

**Option B: Custom CNN**

```python
def build_custom_cnn(self):
    """
    If you want to build from scratch
    
    Architecture suggestion:
    - Conv2D(32) -> ReLU -> MaxPool
    - Conv2D(64) -> ReLU -> MaxPool
    - Conv2D(128) -> ReLU -> MaxPool
    - Flatten
    - Dense(256) -> ReLU -> Dropout
    - Dense(3) -> Softmax
    """
```

#### 3. Compilation

```python
def compile_model(self, learning_rate=0.001):
    """
    Compile with:
    - Loss: categorical_crossentropy (or sparse_categorical_crossentropy)
    - Optimizer: Adam with learning_rate=0.001
    - Metrics: accuracy, precision, recall
    
    Important: Use class weights for imbalanced data!
    Class distribution:
    - alert: ~152K (70%)
    - drowsy: ~32K (15%)
    - distracted: ~33K (15%)
    
    Calculate class weights to balance:
    """
    from sklearn.utils.class_weight import compute_class_weight
    
    # Calculate weights
    class_weights = compute_class_weight(
        'balanced',
        classes=np.unique(train_labels),
        y=train_labels
    )
```

#### 4. Training

```python
def train(self, epochs=50):
    """
    Train with:
    - Epochs: 50 (or until convergence)
    - Callbacks:
      * ModelCheckpoint (save best model)
      * EarlyStopping (patience=5-10)
      * ReduceLROnPlateau (reduce LR when plateau)
      * TensorBoard (logging)
    
    Expected training time:
    - With GPU: 2-4 hours
    - Without GPU: 8-12 hours
    """
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            'models/best_model.h5',
            monitor='val_accuracy',
            save_best_only=True
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5
        ),
        tf.keras.callbacks.TensorBoard(
            log_dir='logs/tensorboard'
        )
    ]
```

---

## 🎯 Target Performance Metrics

### Minimum Requirements:

| Metric | Target | Why |
|--------|--------|-----|
| Overall Accuracy | >90% | Industry standard |
| Alert Precision | >95% | Most common, should be very accurate |
| Drowsy Recall | >85% | Critical for safety (don't miss drowsy drivers) |
| Distracted Recall | >85% | Critical for safety |
| Training Time | <6 hours | Practical constraint |
| Inference Time | <50ms per frame | Real-time requirement (20 FPS) |

### Expected Confusion Matrix:

```
              Predicted
           Alert  Drowsy  Distracted
Actual:
Alert       95%     2%        3%
Drowsy       5%    90%        5%
Distracted   8%     4%       88%
```

---

## 📊 Evaluation Script: `model_evaluation.py`

Implement comprehensive evaluation:

```python
class ModelEvaluator:
    def evaluate(self, model, test_data):
        """
        Calculate and save:
        1. Accuracy, Precision, Recall, F1 (overall and per-class)
        2. Confusion matrix (plot and save)
        3. ROC curves and AUC (plot)
        4. Classification report
        5. Error analysis (save misclassified images)
        6. Inference speed test
        
        Save results to:
        - models/evaluation_report.json
        - models/confusion_matrix.png
        - models/roc_curves.png
        - models/error_analysis/
        """
```

---

## 📤 What to Return to Me

### 1. **Trained Model Files**

```
models/
├── best_model.h5          # Best model weights
├── model_architecture.json # Model architecture
├── training_history.json  # Loss, accuracy per epoch
├── evaluation_report.json # Test set metrics
├── confusion_matrix.png   # Visual confusion matrix
└── class_weights.json     # Class weights used
```

### 2. **Training Logs**

```
logs/
├── tensorboard/           # TensorBoard logs (view training curves)
├── training.log           # Text log of training process
└── evaluation.log         # Evaluation results
```

### 3. **Documentation**

Create a simple `TRAINING_REPORT.md`:

```markdown
# Training Report

## Dataset
- Total images: 217,000
- Train: 152,000
- Val: 32,000
- Test: 33,000

## Model Architecture
- Base: ResNet50
- Custom head: [describe]
- Total parameters: [number]

## Training Configuration
- Epochs: 50
- Batch size: 32
- Learning rate: 0.001
- Data augmentation: [list]
- Class weights: {alert: 0.7, drowsy: 2.3, distracted: 2.1}

## Results
- Training accuracy: XX%
- Validation accuracy: XX%
- Test accuracy: XX%
- Per-class metrics: [table]

## Training Time
- GPU: NVIDIA [model]
- Time: X hours

## Next Steps
- [Any recommendations]
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Out of Memory

**Solution:**
- Reduce batch size (32 → 16 → 8)
- Use mixed precision training
- Use MobileNetV3 instead of ResNet50

### Issue 2: Overfitting

**Solution:**
- Increase dropout rate
- Add more data augmentation
- Use stronger L2 regularization
- Train for fewer epochs (early stopping)

### Issue 3: Low Drowsy/Distracted Accuracy

**Solution:**
- Increase class weights for minority classes
- Apply more aggressive augmentation
- Consider focal loss instead of cross-entropy

### Issue 4: Slow Training

**Solution:**
- Use GPU if available
- Enable XLA (TensorFlow) or JIT (PyTorch)
- Use smaller input size (224 → 128, but may hurt accuracy)
- Use MobileNetV3 instead of ResNet50

---

## 📞 Contact

If you have questions:
1. Check `ai_components/utils/config.py` for paths and settings
2. Check `AI_COMPONENTS_ARCHITECTURE.md` for system overview
3. Contact me on WhatsApp/Teams

---

## ✅ Quick Checklist

Before starting:
- [ ] Received datasets folder
- [ ] Verified 3 folders in train/ (alert, drowsy, distracted)
- [ ] Installed Python dependencies
- [ ] GPU is detected (if available)
- [ ] Can import TensorFlow/PyTorch

During training:
- [ ] Data loading works (check batch shape)
- [ ] Model compiles without errors
- [ ] Class weights calculated correctly
- [ ] Training starts and progresses
- [ ] Validation accuracy improves
- [ ] TensorBoard logging works

After training:
- [ ] Best model saved
- [ ] Test accuracy >90%
- [ ] Confusion matrix generated
- [ ] All metrics calculated
- [ ] Files ready to transfer back

---

**Good luck with the training! Let me know if you need any clarification.** 🚀
