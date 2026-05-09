import pytz
import jwt
from ..model_s import models
from ..database_c.database import get_db
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from jwt import ExpiredSignatureError, InvalidTokenError

SECRET_KEY = "vigilant_demo_secret_key_32chars"
ALGORITHM = "HS256"
TOKEN_VALIDITY_MINUTES = 400

PST = pytz.timezone("Asia/Karachi")

security = HTTPBearer()

def format_datetime_to_pst(datetime_obj):
    if datetime_obj is None:
        return None

    if isinstance(datetime_obj, str):
        try:
            datetime_obj = datetime.fromisoformat(datetime_obj)
        except ValueError:
            return datetime_obj

    if datetime_obj.tzinfo is None:
        datetime_obj = pytz.utc.localize(datetime_obj)

    pst_dt = datetime_obj.astimezone(PST)
    return f"{pst_dt.month}/{pst_dt.day}/{pst_dt.year}, {pst_dt.strftime('%I:%M:%S %p').lstrip('0')}"


# having exception of expired token
def get_current_driver(credentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials       
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        driver_id = decoded.get("driver_id")
    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session Expired. Please log in again.")
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token.")
    if not driver_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: driver credentials required.")
    
    driver = db.query(models.Driver).filter(models.Driver.driver_id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    return driver


def get_current_company(credentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials  
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        company_id = decoded.get("company_id")
    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session Expired. Please log in again.")
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token.")
    
    if not company_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: company credentials required.")
    
    company = db.query(models.Company).filter(models.Company.company_id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    return company


def get_current_admin(credentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials  
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id = decoded.get("admin_id")
    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session Expired. Please log in again.")
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token.")
    
    if not admin_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: admin credentials required.")
    
    admin = db.query(models.AdminUser).filter(models.AdminUser.admin_id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")

    return admin

