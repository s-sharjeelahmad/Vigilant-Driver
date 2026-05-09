from typing import List

from ..model_s import models
from ..pydantic import schemas
from ..database_c.database import get_db
from ..authentication.auth import get_current_admin
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, text
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter()


def _safe_int(value, default: int = 0) -> int:
    return int(value) if value is not None else default


def _safe_float(value, default: float = 0.0) -> float:
    return float(value) if value is not None else default

# ---------------------------------------------Admin Info Endpoints-------------------------------------------------------------
# Info of a logged in admin

@router.get("/admin/me",response_model=schemas.AdminRead)
def get_admin(current_admin: models.AdminUser = Depends(get_current_admin)):
    current_admin.last_active = datetime.utcnow()
    return current_admin


@router.patch("/admin/me", response_model=schemas.AdminRead)
def update_admin(
    update_data: schemas.AdminUpdate,
    current_admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    current_admin.last_active = datetime.utcnow()
    
    # Validate CNIC if provided
    if update_data.cnic is not None:
        if len(update_data.cnic) != 13 or not update_data.cnic.isdigit():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CNIC must be exactly 13 digits")
    
    # Check for duplicate username if changing
    if update_data.username is not None:
        existing_admin = db.query(models.AdminUser).filter(
            models.AdminUser.username == update_data.username,
            models.AdminUser.admin_id != current_admin.admin_id
        ).first()
        if existing_admin:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")
    
    # Check for duplicate email if changing
    if update_data.email is not None:
        existing_admin = db.query(models.AdminUser).filter(
            models.AdminUser.email == update_data.email,
            models.AdminUser.admin_id != current_admin.admin_id
        ).first()
        if existing_admin:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    if update_data.password is not None:
        if len(update_data.password) < 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")
    
    # Update fields if provided
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(current_admin, key, value)
    
    db.add(current_admin)
    try:
        db.commit()
        db.refresh(current_admin)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Database error: {str(e.orig)}")
    
    return current_admin


@router.get("/admin/dashboard", response_model=schemas.AdminDashboardViewResponse)
def get_admin_dashboard(
    current_admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    current_admin.last_active = datetime.utcnow()

    query = text(
        """
        SELECT *
        FROM admin_dashboard_view
        LIMIT 1
        """
    )

    row = db.execute(query).mappings().first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin dashboard not found")

    payload = dict(row)
    payload["total_companies"] = _safe_int(payload.get("total_companies"))
    payload["total_drivers"] = _safe_int(payload.get("total_drivers"))
    payload["total_sessions"] = _safe_int(payload.get("total_sessions"))
    payload["total_events"] = _safe_int(payload.get("total_events"))
    payload["drowsy_events"] = _safe_int(payload.get("drowsy_events"))
    payload["distracted_events"] = _safe_int(payload.get("distracted_events"))
    payload["high_risk_events"] = _safe_int(payload.get("high_risk_events"))
    payload["total_alerts"] = _safe_int(payload.get("total_alerts"))
    # payload["average_attention_score"] = _safe_float(payload.get("average_attention_score"))
    payload["average_attention_score"] = _safe_float(payload.get("avg_attention_score"))
    payload["average_confidence"] = _safe_float(payload.get("avg_confidence_score"))
    # payload["average_confidence"] = _safe_float(payload.get("avg_confidence"))
    # payload["risk_score"] = _safe_float(payload.get("risk_score"))
    payload["risk_score"] = _safe_float(payload.get("avg_risk_score"))
    payload.pop("period_type", None)
    payload.pop("period_start", None)
    payload.pop("period_end", None)

    return schemas.AdminDashboardViewResponse(**payload)


@router.get("/admin/companies", response_model=List[schemas.CompanyResponse])
def get_all_companies(
    search: str | None = None,
    current_admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    current_admin.last_active = datetime.utcnow()
    companies_query = db.query(models.Company)
    if search:
        search_term = f"%{search}%"
        companies_query = companies_query.filter(
            or_(
                models.Company.company_name.ilike(search_term),
                models.Company.email.ilike(search_term),
                models.Company.city.ilike(search_term),
                models.Company.company_type.ilike(search_term),
            )
        )
    companies = companies_query.all()
    return companies


# create a new company (admin only)
@router.post("/admin/addcompanies", response_model=schemas.CompanyResponse, status_code=200)
def create_company(company: schemas.CompanyCreate,current_admin: models.AdminUser=Depends(get_current_admin),db: Session = Depends(get_db)):

    current_admin.last_active = datetime.utcnow()
    
    # to check if company name is empty or not provided or is "string" (default value in Swagger)
    if not company.company_name or company.company_name=="" or company.company_name=="string":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name Required")
    # uniqueness checks
    # normalize name/email and check uniqueness
    company_name_clean = company.company_name.strip() if company.company_name else company.company_name
    # required fields should not be empty after stripping
    if not company_name_clean:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="company_name is required and cannot be empty.")
    if not company.email or not str(company.email).strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="email is required and cannot be empty.")
    if not company.password or company.password=="string" or not str(company.password).strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="password is required and cannot be empty.")
    existing_name = db.query(models.Company).filter(models.Company.company_name.ilike(company_name_clean)).first()
    if existing_name:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Company with this name already exists.")

    existing = db.query(models.Company).filter(models.Company.email == company.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Company with this email already exists.")

    country_code = (company.country_code or "+92").replace("+", "").strip()
    combined_contact_number = f"{country_code}{company.contact_number}"

    if db.query(models.Company).filter(models.Company.contact_number == combined_contact_number).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Company with this contact number already exists.")
    
    payload = company.model_dump(exclude={"country_code"})
    payload["contact_number"] = combined_contact_number

    new_company = models.Company(**payload)

    # convert optional empty strings to None so DB stores NULL

    # def none_if_empty(val):
    #     if isinstance(val, str) and val.strip() == "":
    #         return None
    #     return val

    # new_company = models.Company(
    #     company_name=company_name_clean,
    #     company_type=none_if_empty(company.company_type),
    #     email=company.email,
    #     password=company.password,
    #     contact_number=none_if_empty(company.contact_number),
    #     company_address=none_if_empty(company.company_address),
    #     city=none_if_empty(company.city),
    #     country=none_if_empty(company.country),
    #     subscription_plan=none_if_empty(company.subscription_plan),
    #     subscription_status=none_if_empty(company.subscription_status),
    #     subscription_expiry=none_if_empty(company.subscription_expiry)
    # )

    db.add(new_company)
    try:
        db.commit()
        db.refresh(new_company)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Database integrity error: {str(e.orig)}")

    return new_company


# admin deleting a company
@router.delete("/admin/company/delete{company_id}", status_code=200)
def delete_company(company_id: str, current_admin: models.AdminUser = Depends(get_current_admin),db: Session = Depends(get_db)):
    current_admin.last_active = datetime.utcnow()

    company=db.query(models.Company).filter(models.Company.company_id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    
    db.delete(company)
    db.commit()

    return {"message": "Company deleted successfully."}
    # " All associated drivers, vehicles, and sessions have also been deleted."}


