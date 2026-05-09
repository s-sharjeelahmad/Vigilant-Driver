## Vigilant Driver - Environment Guide

### Two Environments, Two Purposes

This project uses two separate Python environments intentionally:

#### 1. vigilant_driver/venv - AI & Training Environment

- Purpose: Model training, inference testing, Jupyter notebooks, computer vision
- Key packages: TensorFlow, OpenCV, MediaPipe, scikit-learn, NumPy, Pandas
- Activate: .\venv\Scripts\activate
- Use for: Running ai_components/, training scripts, model evaluation

#### 2. fyp_startup/venv - Backend API Environment

- Purpose: Running the FastAPI server only
- Key packages: FastAPI, SQLAlchemy, PyJWT, Pydantic, uvicorn, psycopg2
- Activate: cd to fyp_startup then .\venv\Scripts\activate
- Use for: Starting the backend API server

### How to Start the Full System

Terminal 1 (Backend):
cd "C:\Users\syeds\Documents\GitHub\Final-Year-Project\FYP testing\fyp_startup"
.\venv\Scripts\activate
uvicorn backend.authentication.main_1:app --reload --host 0.0.0.0 --port 8000

Terminal 2 (Mobile App):
cd C:\Users\syeds\Downloads\FYP\vigilant_driver\mobile-app
npx expo start

Terminal 3 (AI inference, if needed):
cd C:\Users\syeds\Downloads\FYP\vigilant_driver
.\venv\Scripts\activate
python ai_components/<script_name>.py
