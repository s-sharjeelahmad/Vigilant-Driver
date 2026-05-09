from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database_c.database import get_db
from ..model_s import models
from ..pydantic import schemas
from ..utils.email_service import generate_temporary_password, send_password_reset_email

router = APIRouter()


@router.post("/auth/admin/forgot-password")
def forgot_password_admin(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    admin = db.query(models.AdminUser).filter(models.AdminUser.email.ilike(payload.email)).first()
    if not admin:
        return {"message": "Email not found", "status": "error"}

    temp_password = generate_temporary_password(12)
    try:
        send_password_reset_email(payload.email, temp_password, "admin")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to send reset email: {str(exc)}",
        )

    admin.password = temp_password
    admin.updated_at = datetime.now()
    db.commit()
    return {"message": "Password sent to your email", "status": "success"}


@router.post("/auth/company/forgot-password")
def forgot_password_company(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.email.ilike(payload.email)).first()
    if not company:
        return {"message": "Email not found", "status": "error"}

    temp_password = generate_temporary_password(12)
    try:
        send_password_reset_email(payload.email, temp_password, "company")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to send reset email: {str(exc)}",
        )

    company.password = temp_password
    company.updated_at = datetime.now()
    db.commit()
    return {"message": "Password sent to your email", "status": "success"}
