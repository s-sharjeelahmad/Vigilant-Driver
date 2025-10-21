# 🚗 Vigilant Driver - AI-Based Driver Monitoring System

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.13+-orange.svg)](https://www.tensorflow.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.103+-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Real-time driver state classification system detecting Alert, Drowsy, and Distracted states with occlusion detection.**

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Datasets](#datasets)
- [AI Components](#ai-components)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Team](#team)

## 🎯 Overview

Vigilant Driver is a comprehensive FYP (Final Year Project) system that uses computer vision and deep learning to monitor driver behavior in real-time. The system classifies driver states into three categories:

- **Alert**: Normal, attentive driving
- **Drowsy**: Signs of fatigue (closed eyes, yawning, head drooping)
- **Distracted**: Looking away, using phone, etc.

### Key Capabilities

- **Real-time Classification**: Processes video at 20+ FPS
- **Facial Feature Extraction**: EAR, MAR, PERCLOS, Head Pose
- **Occlusion Detection**: Handles sunglasses, masks, hands on face
- **Multi-Dataset Training**: DMD + State Farm + Custom data
- **Complete Pipeline**: Data processing → Training → Deployment

## ✨ Features

### AI Components

- ✅ **MediaPipe Integration**: Robust facial landmark detection
- ✅ **Feature Extraction**: EAR, MAR, PERCLOS, Head Pose estimation
- ✅ **Occlusion Detection**: Sunglasses, masks, hands, shawls
- ✅ **Real-time Classification**: <50ms inference time
- ✅ **Multi-Dataset Support**: DMD, State Farm, Custom datasets

### Backend & API

- 🔄 FastAPI REST API
- 🔄 PostgreSQL database
- 🔄 WebSocket for real-time updates
- 🔄 Driver session management
- 🔄 Alert logging and analytics

### Frontend & Mobile

- 🔄 React dashboard with real-time monitoring
- 🔄 Flutter mobile app
- 🔄 Live camera feed visualization
- 🔄 Historical data analysis

## 📁 Project Structure

```
vigilant_driver/
├── 📁 ai_components/              # Core AI modules
│   ├── 📁 data_collection/        # Dataset processing
│   │   ├── dmd_processor.py       # ✅ Vicomtech DMD processor
│   │   ├── state_farm_processor.py # ✅ State Farm processor
│   │   ├── nthuddd_processor.py   # ✅ NTHUDDD processor
│   │   ├── yawdd_processor.py     # ✅ YawDD processor
│   │   ├── uta_rldd_processor.py  # ✅ UTA-RLDD processor
│   │   ├── vicomtech_drowsy_processor.py # ✅ Vicomtech drowsy
│   │   ├── data_preprocessor.py   # ✅ Image preprocessing
│   │   ├── dataset_analyzer.py    # ✅ Dataset analysis
│   │   ├── dataset_merger.py      # ✅ Dataset merging
│   │   └── training_data_collector.py # ✅ Custom data collection
│   ├── 📁 model_training/         # Model training (Abrar)
│   │   ├── train_classifier.py    # 🔄 Training pipeline
│   │   └── model_evaluation.py    # 🔄 Evaluation metrics
│   └── 📁 utils/                  # Utilities
│       ├── config.py              # ✅ Configuration management
│       ├── constants.py           # ✅ Constants and enums
│       └── helpers.py             # ✅ Helper functions
│
├── 📁 datasets/                   # Dataset storage
│   ├── raw/                       # Raw datasets
│   │   ├── dmd/                   # Vicomtech DMD
│   │   ├── state_farm/            # State Farm
│   │   └── custom/                # Custom collected data
│   └── processed/                 # Processed datasets
│
├── 📁 models/                     # Trained models
├── 📁 logs/                       # Application logs
├── 📁 documentation/              # Project documentation
├── 📁 tests/                      # Unit tests
│
├── 🚀 run_complete_pipeline.py    # ✅ Main pipeline runner
├── requirements.txt               # ✅ Python dependencies
├── docker-compose.yml             # 🔄 Docker setup
└── README.md                      # ✅ This file

Legend: ✅ Complete | 🔄 In Progress | ⏳ Planned
```

## 🚀 Installation

### Prerequisites

- Python 3.9+
- pip
- (Optional) CUDA-capable GPU for faster training
- (Optional) Docker for containerized deployment

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/vigilant-driver.git
cd vigilant-driver
```

### Step 2: Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Setup Datasets

Download and place datasets in appropriate directories:

1. **Vicomtech DMD Dataset**: Place in `datasets/raw/dmd/`
2. **State Farm Dataset**: Place in `datasets/raw/state_farm/`

## 🎯 Quick Start

### Option 1: Run Complete Pipeline

```bash
# Process datasets, analyze, merge, and extract features
python run_complete_pipeline.py --mode all
```

### Option 2: Run Real-Time Demo

```bash
# Start webcam demo (no datasets required)
python run_complete_pipeline.py --mode demo
```

### Option 3: Step-by-Step

```bash
# Step 1: Process datasets
python run_complete_pipeline.py --mode process

# Step 2: Analyze datasets
python run_complete_pipeline.py --mode analyze

# Step 3: Merge datasets
python run_complete_pipeline.py --mode merge

# Step 4: Extract features
python run_complete_pipeline.py --mode features
```

## 📚 Usage

### 1. Dataset Processing

#### Process DMD Dataset

```python
from ai_components.data_collection.dmd_processor import DMDProcessor

processor = DMDProcessor()
stats = processor.process_dataset(extract_frames=True)
print(f"Processed {stats['total_samples']} samples")
```

#### Process State Farm Dataset

```python
from ai_components.data_collection.state_farm_processor import StateFarmProcessor

processor = StateFarmProcessor()
stats = processor.process_dataset(preprocess_images=True)
print(f"Processed {stats['total_samples']} samples")
```

### 2. Feature Extraction

```python
from ai_components.feature_extraction import EnhancedFeatureExtractor
import cv2

extractor = EnhancedFeatureExtractor()

# From image file
image = cv2.imread('driver_image.jpg')
features = extractor.extract_features(image)

print(f"EAR: {features.avg_ear}")
print(f"MAR: {features.mar}")
print(f"PERCLOS: {features.perclos}")
print(f"Head Pose: Pitch={features.pitch}, Yaw={features.yaw}")
```

### 3. Real-Time Classification

```python
from ai_components.feature_extraction import DriverStateClassifier
import cv2

classifier = DriverStateClassifier()
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    result = classifier.classify(frame)
    
    if result:
        print(f"State: {result.state}")
        print(f"Confidence: {result.confidence:.2f}")
        print(f"Alert: {result.alert_triggered}")
        
        # Visualize
        vis_frame = classifier.visualize_classification(frame, result)
        cv2.imshow('Driver Monitoring', vis_frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

### 4. Custom Data Collection

```python
from ai_components.data_collection import TrainingDataCollector

collector = TrainingDataCollector()
collector.start_collection_session("my_session")

# Collect from webcam (Press 1=Alert, 2=Drowsy, 3=Distracted, Q=Quit)
stats = collector.collect_from_camera(camera_id=0)

collector.end_collection_session()
```

## 📊 Datasets

### 1. Vicomtech DMD (Driver Monitoring Dataset)

- **Source**: Vicomtech
- **Format**: OpenLABEL JSON annotations + mosaic videos
- **Structure**: `gA/gB` groups, `s1/s2` sessions
- **Activities**: Normal driving, drowsiness, distraction behaviors

### 2. State Farm Distracted Driver Detection

- **Source**: Kaggle
- **Classes**: c0-c9 (10 classes)
- **Mapping**: c0=Alert, c1-c9=Distracted
- **Size**: ~22,000 images

### 3. Custom Dataset

- **Collection Tool**: Built-in data collector
- **Format**: Organized by state (alert/drowsy/distracted)
- **Purpose**: Dataset augmentation and local conditions

## 🧠 AI Components

### Feature Extraction

#### Eye Aspect Ratio (EAR)

```
EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
```

- **Threshold**: < 0.25 indicates closed eyes
- **Use**: Drowsiness detection

#### Mouth Aspect Ratio (MAR)

```
MAR = ||p2-p8|| / ||p1-p5||
```

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
```

### WebSocket

```javascript
// Real-time monitoring
const ws = new WebSocket('ws://localhost:8000/ws/monitor');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Driver State:', data.state);
    console.log('Confidence:', data.confidence);
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
