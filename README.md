# 🚗 Vigilant Driver - AI-Based Driver Monitoring System# 🚗 Vigilant Driver - AI-Based Driver Monitoring System

**Final Year Project (FYP)** [![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)

**Students:** Syed Areeb Ashraf (Data Processing) & Abrar (Model Training) [![TensorFlow](https://img.shields.io/badge/TensorFlow-2.13+-orange.svg)](https://www.tensorflow.org/)

**Year:** 2025[![FastAPI](https://img.shields.io/badge/FastAPI-0.103+-green.svg)](https://fastapi.tiangolo.com/)

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

**Real-time driver state classification system detecting Alert, Drowsy, and Distracted states with occlusion detection.**

## 📋 Table of Contents

## 📋 Table of Contents

1. [Project Overview](#project-overview)

2. [Quick Start](#quick-start)- [Overview](#overview)

3. [Project Structure](#project-structure)- [Features](#features)

4. [Installation](#installation)- [Project Structure](#project-structure)

5. [Dataset Processing](#dataset-processing)- [Installation](#installation)

6. [Custom Data Collection](#custom-data-collection)- [Quick Start](#quick-start)

7. [Model Training](#model-training)- [Usage](#usage)

8. [Current Status](#current-status)- [Datasets](#datasets)

- [AI Components](#ai-components)

---- [API Documentation](#api-documentation)

- [Contributing](#contributing)

## 🎯 Project Overview- [Team](#team)

An AI-powered driver monitoring system that detects driver states in real-time:## 🎯 Overview

- **ALERT**: Normal, attentive driving

- **DROWSY**: Eyes closed, yawning, fatigueVigilant Driver is a comprehensive FYP (Final Year Project) system that uses computer vision and deep learning to monitor driver behavior in real-time. The system classifies driver states into three categories:

- **DISTRACTED**: Looking away, phone use, not focused

- **Alert**: Normal, attentive driving

### Key Features- **Drowsy**: Signs of fatigue (closed eyes, yawning, head drooping)

- ✅ Processes 6 public datasets (~180,000+ images)- **Distracted**: Looking away, using phone, etc.

- ✅ Custom Pakistani dataset collection

- ✅ Automated train/val/test splitting### Key Capabilities

- ✅ CNN-based classification (>90% accuracy target)

- ✅ Real-time inference capability- **Real-time Classification**: Processes video at 20+ FPS

- **Facial Feature Extraction**: EAR, MAR, PERCLOS, Head Pose

### Technology Stack- **Occlusion Detection**: Handles sunglasses, masks, hands on face

- **Language:** Python 3.11- **Multi-Dataset Training**: DMD + State Farm + Custom data

- **ML Framework:** TensorFlow/PyTorch- **Complete Pipeline**: Data processing → Training → Deployment

- **Computer Vision:** OpenCV, MediaPipe

- **Data Processing:** NumPy, Pandas## ✨ Features

---### AI Components

## 🚀 Quick Start- ✅ **MediaPipe Integration**: Robust facial landmark detection

- ✅ **Feature Extraction**: EAR, MAR, PERCLOS, Head Pose estimation

### For Data Processing (Syed):- ✅ **Occlusion Detection**: Sunglasses, masks, hands, shawls

- ✅ **Real-time Classification**: <50ms inference time

````powershell- ✅ **Multi-Dataset Support**: DMD, State Farm, Custom datasets

# 1. Activate environment

.\venv\Scripts\Activate.ps1### Backend & API



# 2. Collect custom data- 🔄 FastAPI REST API

python collect_data.py- 🔄 PostgreSQL database

- 🔄 WebSocket for real-time updates

# 3. Merge all datasets- 🔄 Driver session management

python merge_datasets.py- 🔄 Alert logging and analytics



# 4. Verify### Frontend & Mobile

python verify_datasets.py

```- 🔄 React dashboard with real-time monitoring

- 🔄 Flutter mobile app

### For Model Training (Abrar):- 🔄 Live camera feed visualization

- 🔄 Historical data analysis

```bash

# 1. Clone repository## 📁 Project Structure

git clone https://github.com/S-Areeb-Ashraf/Final-Year-Project.git

cd Final-Year-Project```

vigilant_driver/

# 2. Setup environment├── 📁 ai_components/              # Core AI modules

python -m venv venv│   ├── 📁 data_collection/        # Dataset processing

source venv/bin/activate  # Linux/Mac│   │   ├── dmd_processor.py       # ✅ Vicomtech DMD processor

.\venv\Scripts\Activate.ps1  # Windows│   │   ├── state_farm_processor.py # ✅ State Farm processor

pip install -r requirements.txt│   │   ├── nthuddd_processor.py   # ✅ NTHUDDD processor

│   │   ├── yawdd_processor.py     # ✅ YawDD processor

# 3. Get merged dataset from Syed│   │   ├── uta_rldd_processor.py  # ✅ UTA-RLDD processor

# Copy to: datasets/processed/merged_final/│   │   ├── vicomtech_drowsy_processor.py # ✅ Vicomtech drowsy

│   │   ├── data_preprocessor.py   # ✅ Image preprocessing

# 4. Train model│   │   ├── dataset_analyzer.py    # ✅ Dataset analysis

python -m ai_components.model_training.train_classifier│   │   ├── dataset_merger.py      # ✅ Dataset merging

```│   │   └── training_data_collector.py # ✅ Custom data collection

│   ├── 📁 model_training/         # Model training (Abrar)

---│   │   ├── train_classifier.py    # 🔄 Training pipeline

│   │   └── model_evaluation.py    # 🔄 Evaluation metrics

## 📁 Project Structure│   └── 📁 utils/                  # Utilities

│       ├── config.py              # ✅ Configuration management

```│       ├── constants.py           # ✅ Constants and enums

vigilant_driver/│       └── helpers.py             # ✅ Helper functions

├── 📁 ai_components/           # Core AI code│

│   ├── utils/                  # Configuration, constants, helpers├── 📁 datasets/                   # Dataset storage

│   ├── data_collection/        # Dataset processors│   ├── raw/                       # Raw datasets

│   │   ├── state_farm_processor.py│   │   ├── dmd/                   # Vicomtech DMD

│   │   ├── dmd_processor.py│   │   ├── state_farm/            # State Farm

│   │   ├── nthuddd_processor.py│   │   └── custom/                # Custom collected data

│   │   ├── yawdd_processor.py│   └── processed/                 # Processed datasets

│   │   ├── uta_rldd_processor.py│

│   │   ├── vicomtech_drowsy_processor.py├── 📁 models/                     # Trained models

│   │   └── training_data_collector.py├── 📁 logs/                       # Application logs

│   └── model_training/         # Training & evaluation├── 📁 documentation/              # Project documentation

│       ├── train_classifier.py├── 📁 tests/                      # Unit tests

│       └── model_evaluation.py│

│├── 🚀 run_complete_pipeline.py    # ✅ Main pipeline runner

├── 📁 datasets/                # Data storage (not in Git)├── requirements.txt               # ✅ Python dependencies

│   ├── raw/                    # Downloaded datasets├── docker-compose.yml             # 🔄 Docker setup

│   └── processed/              # Processed datasets└── README.md                      # ✅ This file

│       └── merged_final/       # Final merged dataset

│Legend: ✅ Complete | 🔄 In Progress | ⏳ Planned

├── 📁 models/                  # Trained models```

├── 📁 logs/                    # Processing logs

│## 🚀 Installation

├── collect_data.py             # Custom data collection launcher

├── merge_datasets.py           # Merge all datasets### Prerequisites

├── verify_datasets.py          # Verify datasets

├── requirements.txt            # Dependencies- Python 3.9+

└── README.md                   # This file- pip

```- (Optional) CUDA-capable GPU for faster training

- (Optional) Docker for containerized deployment

---

### Step 1: Clone Repository

## 💻 Installation

```bash

### Prerequisitesgit clone https://github.com/yourusername/vigilant-driver.git

- Python 3.11+cd vigilant-driver

- 50+ GB free disk space```

- (Optional) CUDA-capable GPU for training

### Step 2: Create Virtual Environment

### Setup Steps

```bash

```bash# Windows

# 1. Clone repositorypython -m venv venv

git clone https://github.com/S-Areeb-Ashraf/Final-Year-Project.gitvenv\Scripts\activate

cd Final-Year-Project

# Linux/Mac

# 2. Create virtual environmentpython3 -m venv venv

python -m venv venvsource venv/bin/activate

````

# Windows:

.\venv\Scripts\Activate.ps1### Step 3: Install Dependencies

# Linux/Mac:```bash

source venv/bin/activatepip install -r requirements.txt

````

# 3. Install dependencies

pip install -r requirements.txt### Step 4: Setup Datasets



# 4. Verify installationDownload and place datasets in appropriate directories:

python -c "import cv2, numpy, mediapipe; print('✅ All libraries installed')"

```1. **Vicomtech DMD Dataset**: Place in `datasets/raw/dmd/`

2. **State Farm Dataset**: Place in `datasets/raw/state_farm/`

---

## 🎯 Quick Start

## 📊 Dataset Processing

### Option 1: Run Complete Pipeline

### Supported Datasets

```bash

| Dataset | Source | Samples | Classes | Status |# Process datasets, analyze, merge, and extract features

|---------|--------|---------|---------|--------|python run_complete_pipeline.py --mode all

| State Farm | Kaggle | 102,150 | Alert, Distracted | ✅ Processed |```

| DMD | Vicomtech | 12,969 | All 3 | ✅ Processed |

| NTHUDDD | Taiwan | 66,521 | Alert, Drowsy | ✅ Processed |### Option 2: Run Real-Time Demo

| YawDD | Turkey | 39,694 | Alert, Drowsy | ✅ Processed |

| UTA-RLDD | UTA | 11,787 | Alert, Drowsy | ✅ Processed |```bash

| Vicomtech Drowsy | Spain | 305 | Alert, Drowsy | ✅ Processed |# Start webcam demo (no datasets required)

| **Custom Pakistani** | Local | 1,500+ | All 3 | 🎥 In Progress |python run_complete_pipeline.py --mode demo

````

### Processing Pipeline

### Option 3: Step-by-Step

````bash

# Process individual datasets (already done)```bash

python -m ai_components.data_collection.state_farm_processor# Step 1: Process datasets

python -m ai_components.data_collection.dmd_processorpython run_complete_pipeline.py --mode process

# ... (all processors)

# Step 2: Analyze datasets

# Merge all datasetspython run_complete_pipeline.py --mode analyze

python merge_datasets.py

# Step 3: Merge datasets

# Output: datasets/processed/merged_final/python run_complete_pipeline.py --mode merge

#   ├── train/ (70%)

#   ├── val/ (15%)# Step 4: Extract features

#   └── test/ (15%)python run_complete_pipeline.py --mode features

````

---## 📚 Usage

## 🎥 Custom Data Collection### 1. Dataset Processing

Collect Pakistani-specific data with cultural variations:#### Process DMD Dataset

`powershell`python

# Launch collection toolfrom ai_components.data_collection.dmd_processor import DMDProcessor

python collect_data.py

processor = DMDProcessor()

# Enter session name (e.g., pakistani_session_1)stats = processor.process_dataset(extract_frames=True)

# Controls:print(f"Processed {stats['total_samples']} samples")

# 1/2/3 - Select label (ALERT/DROWSY/DISTRACTED)```

# SPACE - Pause/Resume

# A - Auto-capture mode#### Process State Farm Dataset

# C - Manual capture

# S - Show statistics```python

# Q - Quit and savefrom ai_components.data_collection.state_farm_processor import StateFarmProcessor

````

processor = StateFarmProcessor()

### Collection Strategystats = processor.process_dataset(preprocess_images=True)

print(f"Processed {stats['total_samples']} samples")

**Target:** 1,500+ samples (500 per class)```



1. **Session 1-2**: Basic collection (600 samples)### 2. Feature Extraction

   - Normal lighting, frontal face

```python

2. **Session 3-4**: Cultural clothing (400 samples)from ai_components.feature_extraction import EnhancedFeatureExtractor

   - With dupatta/shawlimport cv2



3. **Session 5-6**: Varied lighting (300 samples)extractor = EnhancedFeatureExtractor()

   - Bright sunlight, low light

# From image file

4. **Session 7-10**: Edge cases (200 samples)image = cv2.imread('driver_image.jpg')

   - Different angles, subjectsfeatures = extractor.extract_features(image)



---print(f"EAR: {features.avg_ear}")

print(f"MAR: {features.mar}")

## 🤖 Model Trainingprint(f"PERCLOS: {features.perclos}")

print(f"Head Pose: Pitch={features.pitch}, Yaw={features.yaw}")

### Architecture```



**Baseline:** Transfer Learning with Pre-trained CNN### 3. Real-Time Classification

- Base: ResNet50 / MobileNetV3 / EfficientNetB0

- Custom Head: GlobalAvgPool → Dense(256) → Dropout(0.5) → Dense(3, softmax)```python

- Input: 224×224×3 RGB imagesfrom ai_components.feature_extraction import DriverStateClassifier

- Output: 3 classes (Alert, Drowsy, Distracted)import cv2



### Training Configurationclassifier = DriverStateClassifier()

cap = cv2.VideoCapture(0)

```python

BATCH_SIZE = 32while True:

EPOCHS = 50    ret, frame = cap.read()

LEARNING_RATE = 0.001    result = classifier.classify(frame)

OPTIMIZER = Adam

LOSS = Categorical Crossentropy    if result:

```        print(f"State: {result.state}")

        print(f"Confidence: {result.confidence:.2f}")

### Performance Targets        print(f"Alert: {result.alert_triggered}")



| Metric | Target |        # Visualize

|--------|--------|        vis_frame = classifier.visualize_classification(frame, result)

| Overall Accuracy | >90% |        cv2.imshow('Driver Monitoring', vis_frame)

| Alert Precision | >95% |

| Drowsy Recall | >85% |    if cv2.waitKey(1) & 0xFF == ord('q'):

| Distracted Recall | >85% |        break

| Inference Time | <50ms/frame |

cap.release()

---cv2.destroyAllWindows()

````

## 📈 Current Status

### 4. Custom Data Collection

### ✅ Completed (85%)

- [x] Project setup and structure```python

- [x] 6 dataset processorsfrom ai_components.data_collection import TrainingDataCollector

- [x] All public datasets processed (180,000+ images)

- [x] Custom data collection toolcollector = TrainingDataCollector()

- [x] Dataset mergercollector.start_collection_session("my_session")

- [x] Code pushed to GitHub

# Collect from webcam (Press 1=Alert, 2=Drowsy, 3=Distracted, Q=Quit)

### 🔄 In Progress (10%)stats = collector.collect_from_camera(camera_id=0)

- [ ] Custom Pakistani dataset (0/1,500)

- [ ] Final dataset mergecollector.end_collection_session()

```

### ⏸️ Pending (5%)

- [ ] Model training (Abrar)## 📊 Datasets

- [ ] Model evaluation

- [ ] Deployment### 1. Vicomtech DMD (Driver Monitoring Dataset)



---- **Source**: Vicomtech

- **Format**: OpenLABEL JSON annotations + mosaic videos

## 📞 Team- **Structure**: `gA/gB` groups, `s1/s2` sessions

- **Activities**: Normal driving, drowsiness, distraction behaviors

- **Syed Areeb Ashraf** - Data Processing & Collection

  - GitHub: [@S-Areeb-Ashraf](https://github.com/S-Areeb-Ashraf)### 2. State Farm Distracted Driver Detection



- **Abrar** - Model Training & Evaluation- **Source**: Kaggle

- **Classes**: c0-c9 (10 classes)

---- **Mapping**: c0=Alert, c1-c9=Distracted

- **Size**: ~22,000 images

## 🎯 Next Steps

### 3. Custom Dataset

1. ✅ Complete custom data collection (1,500 samples)

2. ✅ Run final dataset merge- **Collection Tool**: Built-in data collector

3. ✅ Transfer dataset to Abrar- **Format**: Organized by state (alert/drowsy/distracted)

4. 🔄 Abrar trains model- **Purpose**: Dataset augmentation and local conditions

5. 🔄 Evaluate and optimize

6. 🔄 Deploy for real-time inference## 🧠 AI Components



---### Feature Extraction



**Last Updated:** October 22, 2025  #### Eye Aspect Ratio (EAR)

**Repository:** https://github.com/S-Areeb-Ashraf/Final-Year-Project

```

EAR = (||p2-p6|| + ||p3-p5||) / (2 \* ||p1-p4||)

```

- **Threshold**: < 0.25 indicates closed eyes
- **Use**: Drowsiness detection

#### Mouth Aspect Ratio (MAR)

```

MAR = ||p2-p8|| / ||p1-p5||

````

- **Threshold**: > 0.6 indicates yawning
- **Use**: Fatigue detection

#### PERCLOS (Percentage of Eye Closure)

- **Window**: 30 frames (configurable)
- **Threshold**: > 80% indicates severe drowsiness
- **Use**: Fatigue level assessment

#### Head Pose Estimation

- **Angles**: Pitch (up/down), Yaw (left/right), Roll (tilt)
- **Threshold**: > 15° indicates looking away
- **Use**: Distraction detection

## 🔌 API Documentation

### Backend API (FastAPI)

**Base URL**: `http://localhost:8000/api/v1`

#### Endpoints

```bash
# Health Check
GET /health

# Real-time Classification
POST /classify
Body: { "image": "base64_encoded_image" }

# Driver Sessions
POST /sessions
GET /sessions/{session_id}

# Alerts
GET /alerts?session_id=xxx
POST /alerts

# Statistics
GET /stats?start_date=xxx&end_date=xxx
````

### WebSocket

```javascript
// Real-time monitoring
const ws = new WebSocket("ws://localhost:8000/ws/monitor");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Driver State:", data.state);
  console.log("Confidence:", data.confidence);
};
```

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=ai_components --cov-report=html

# Run specific test file
pytest tests/test_feature_extraction.py
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run linters
black ai_components/
flake8 ai_components/
mypy ai_components/
```

## 👥 Team

**Vigilant Driver FYP Team**

- **Developer**: Syed (AI Components, Data Processing, Feature Extraction)
- **ML Engineer**: Abrar (Model Training, Evaluation)
- **Full Stack**: [Your name] (Backend, Frontend, Mobile)

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- **Vicomtech** for the DMD dataset
- **Kaggle/State Farm** for the distracted driver dataset
- **MediaPipe** team for facial landmark detection
- **FastAPI** community

## 📞 Contact

For questions or support, please contact:

- Email: [your-email@example.com]
- GitHub Issues: [Project Issues](https://github.com/yourusername/vigilant-driver/issues)

---

**⚠️ Safety Notice**: This system is designed for research and educational purposes. Always follow traffic safety regulations and do not rely solely on automated systems while driving.

**Made with ❤️ for Road Safety**
