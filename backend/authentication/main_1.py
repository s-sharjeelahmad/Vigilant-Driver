# import sys
# import os
# from pathlib import Path

# # Add project root to sys.path to resolve 'backend' and 'ai_advisor' modules
# root_path = Path(__file__).resolve().parents[2]
# if str(root_path) not in sys.path:
#     sys.path.append(str(root_path))

# import pytz
# import jwt
# import json
# import uuid
# from typing import List

# from ..model_s import models
# from ..pydantic import schemas
# from ..database_c.database import engine, get_db, initialize_database
# from .auth import get_current_driver, ALGORITHM, TOKEN_VALIDITY_MINUTES, PST
# from sqlalchemy.orm import Session
# from sqlalchemy import cast, String, or_
# from fastapi.security import HTTPBearer
# from datetime import date, datetime, timedelta
# from fastapi import FastAPI, Depends, HTTPException, status
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.security import OAuth2PasswordRequestForm
# from fastapi.security import OAuth2PasswordBearer
# from jwt import ExpiredSignatureError, InvalidTokenError
# from ..endpoints.app_end import router as app_router
# from ..endpoints.web_end import router as web_router
# from ..endpoints.admin_end import router as admin_router

import pytz
import jwt
import json
import uuid
from typing import List

from ..model_s import models
from ..pydantic import schemas

from sqlalchemy import cast, String, or_
from ..database_c.database import engine, get_db, initialize_database
from .auth import get_current_driver, SECRET_KEY, ALGORITHM, TOKEN_VALIDITY_MINUTES, PST
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer
from datetime import date, datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.security import OAuth2PasswordBearer
from jwt import ExpiredSignatureError, InvalidTokenError
from ..endpoints.app_end import router as app_router
from ..endpoints.web_end import router as web_router
from ..endpoints.admin_end import router as admin_router
from ..endpoints.auth_end import router as auth_router
from ..endpoints.ai_advisor import router as ai_advisor_router

app = FastAPI()

SECRET_KEY = "vigilant_demo_secret_key_32chars"

initialize_database()

app.add_middleware(
    CORSMiddleware,
    # allow_origins=[
    #     "http://localhost",
    #     "http://localhost:19006",
    #     "http://127.0.0.1",
    #     "http://127.0.0.1:19006",
    # ],
    allow_origins=["*"],
    # allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$",
    # allow_credentials=True,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# endpoints router for web and app both
app.include_router(app_router)
app.include_router(web_router)
app.include_router(admin_router)
app.include_router(auth_router)
app.include_router(ai_advisor_router)

#                              Home Root endpoint
@app.get("/")
async def root():
    return {"message": "Hello World"}

# -------------------------------Authentincation function and endpoint which will create JWT token------------------------

@app.post("/auth/login")
def login_driver(login_data: schemas.Driverlogin, db: Session = Depends(get_db)):

    driver = db.query(models.Driver).filter(
        or_(
            models.Driver.email == login_data.driver_id,
            models.Driver.cnic == login_data.driver_id,
        )
    ).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    if driver.password != login_data.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid password")

    now_pk = datetime.now(PST)
    exp_time = now_pk + timedelta(minutes=TOKEN_VALIDITY_MINUTES)
    payload = {
        "driver_id": str(driver.driver_id),
        "exp": exp_time
        # "exp": datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/company/login")
def login_company(login_data: schemas.Companylogin, db: Session = Depends(get_db)):

    company = db.query(models.Company).filter(models.Company.email.ilike(login_data.email)).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    if company.password != login_data.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid password")

    now_pk = datetime.now(PST)
    exp_time = now_pk + timedelta(minutes=TOKEN_VALIDITY_MINUTES)
    payload = {
        "company_id": str(company.company_id),
        "exp": exp_time
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/admin/login")
def login_admin(login_data: schemas.Adminlogin, db: Session = Depends(get_db)):

    admin = db.query(models.AdminUser).filter(models.AdminUser.email.ilike(login_data.email)).first()
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")
    if admin.password != login_data.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid password")

    now_pk = datetime.now(PST)
    exp_time = now_pk + timedelta(minutes=TOKEN_VALIDITY_MINUTES)
    payload = {
        "admin_id": str(admin.admin_id),
        "exp": exp_time
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}






