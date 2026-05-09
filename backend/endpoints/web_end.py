from typing import List, Literal

from ..model_s import models
from ..pydantic import schemas
from ..database_c.database import get_db
from ..authentication.auth import get_current_company
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, text
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query

router = APIRouter()


def _safe_int(value, default: int = 0) -> int:
    return int(value) if value is not None else default


def _safe_float(value, default: float = 0.0) -> float:
    return float(value) if value is not None else default

# ---------------------------------------------Company Info Endpoints-------------------------------------------------------------
# Info of a logged in company

# @router.get("/company/me", response_model=schemas.CompanyRead)
@router.get("/company/me",response_model=schemas.CompanyResponse)
def get_company(current_company: models.Company = Depends(get_current_company)):
    current_company.last_active = datetime.utcnow()
    return current_company


@router.patch("/company/me", response_model=schemas.CompanyResponse)
def update_company(
    update_data: schemas.CompanyUpdate,
    current_company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    current_company.last_active = datetime.utcnow()
    
    # Validate company_name length if provided
    if update_data.company_name is not None:
        company_name_clean = update_data.company_name.strip()
        if not company_name_clean or len(company_name_clean) < 2:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company name must be at least 2 characters")
        if len(company_name_clean) > 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company name must not exceed 200 characters")
    
    # Check for duplicate email if changing
    if update_data.email is not None:
        existing_company = db.query(models.Company).filter(
            models.Company.email == update_data.email,
            models.Company.company_id != current_company.company_id
        ).first()
        if existing_company:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    
    # Check for duplicate contact_number if changing
    if update_data.contact_number is not None:
        if len(update_data.contact_number) < 10:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contact number must be at least 10 digits")
        existing_company = db.query(models.Company).filter(
            models.Company.contact_number == update_data.contact_number,
            models.Company.company_id != current_company.company_id
        ).first()
        if existing_company:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Contact number already exists")

    if update_data.password is not None:
        if len(update_data.password) < 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")
    
    # Update fields if provided
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            if key == "company_name":
                setattr(current_company, key, value.strip())
            else:
                setattr(current_company, key, value)
    
    db.add(current_company)
    try:
        db.commit()
        db.refresh(current_company)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Database error: {str(e.orig)}")
    
    return current_company


@router.get("/company/dashboard", response_model=schemas.CompanyDashboardViewResponse)
def get_company_dashboard(
    current_company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    current_company.last_active = datetime.utcnow()

    query = text(
        """
        SELECT *
        FROM company_dashboard_view
        WHERE company_id = :company_id
        LIMIT 1
        """
    )

    row = db.execute(query, {"company_id": current_company.company_id}).mappings().first()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company dashboard not found")

    payload = dict(row)
    payload["total_sessions"] = _safe_int(payload.get("total_sessions"))
    payload["total_events"] = _safe_int(payload.get("total_events"))
    payload["drowsy_events"] = _safe_int(payload.get("drowsy_events"))
    payload["distracted_events"] = _safe_int(payload.get("distracted_events"))
    payload["high_risk_events"] = _safe_int(payload.get("high_risk_events"))
    payload["total_alerts"] = _safe_int(payload.get("total_alerts"))
    # payload["average_attention_score"] = _safe_float(payload.get("average_attention_score"))
    payload["average_attention_score"] = _safe_float(payload.get("avg_attention_score"))
    payload["average_confidence"] = _safe_float(payload.get("avg_confidence_score"))
    # payload["risk_score"] = _safe_float(payload.get("risk_score"))
    payload["risk_score"] = _safe_float(payload.get("avg_risk_score"))
    payload.pop("period_type", None)
    payload.pop("period_start", None)
    payload.pop("period_end", None)

    return schemas.CompanyDashboardViewResponse(**payload)

# to get all drivers of a company
@router.get("/company/drivers",response_model=List[schemas.driver_read_company])
def get_company_drivers(search: str | None = None, current_company:models.Company=Depends(get_current_company),db:Session=Depends(get_db)):
    current_company.last_active=datetime.utcnow()
    drivers_query = db.query(models.Driver).filter(models.Driver.company_id==current_company.company_id)
    if search:
        search_term = f"%{search}%"
        drivers_query = drivers_query.filter(
            or_(
                models.Driver.full_name.ilike(search_term),
                models.Driver.cnic.ilike(search_term),
                models.Driver.email.ilike(search_term),
                models.Driver.license_number.ilike(search_term),
                models.Driver.phone_number.ilike(search_term),
            )
        )
    drivers = drivers_query.all()
    if not drivers:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="No drivers found.")
    return drivers


@router.post("/company/adddrivers", response_model=schemas.DriverRead, status_code=201)
def create_company_driver(
    driver_data: schemas.CompanyDriverCreate,
    current_company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    current_company.last_active = datetime.utcnow()

    country_code = (driver_data.country_code or "+92").replace("+", "").strip()
    combined_phone = f"{country_code}{driver_data.phone_number}"

    duplicate_filters = [
        models.Driver.cnic == driver_data.cnic,
        models.Driver.phone_number == combined_phone,
        models.Driver.license_number == driver_data.license_number,
    ]
    if driver_data.email:
        duplicate_filters.append(models.Driver.email == driver_data.email)

    existing_driver = db.query(models.Driver).filter(or_(*duplicate_filters)).first()
    if existing_driver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver with this email, CNIC, phone number, or license already exists",
        )

    new_driver = models.Driver(
        cnic=driver_data.cnic,
        full_name=driver_data.full_name,
        company_id=current_company.company_id,
        phone_number=combined_phone,
        email=driver_data.email,
        password=driver_data.password,
        license_number=driver_data.license_number,
        license_expiry=driver_data.license_expiry,
        date_of_birth=driver_data.date_of_birth,
        age=driver_data.age,
        gender=driver_data.gender,
        address=driver_data.address,
        city=driver_data.city,
        is_active=driver_data.is_active,
    )

    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)
    return new_driver


@router.put("/company/drivers/{driver_id}", response_model=schemas.DriverRead)
def update_company_driver(
    driver_id: str,
    driver_update: schemas.CompanyDriverUpdate,
    current_company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    current_company.last_active = datetime.utcnow()

    driver = db.query(models.Driver).filter(
        models.Driver.driver_id == driver_id,
        models.Driver.company_id == current_company.company_id,
    ).first()

    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found in your company")

    update_data = driver_update.dict(exclude_unset=True)

    if "phone_number" in update_data:
        phone_suffix = update_data.get("phone_number")
        if phone_suffix:
            code = (update_data.get("country_code") or "+92").replace("+", "").strip()
            combined_phone = f"{code}{phone_suffix}"
            existing_phone = db.query(models.Driver).filter(
                models.Driver.phone_number == combined_phone,
                models.Driver.driver_id != driver.driver_id,
            ).first()
            if existing_phone:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Driver with this phone number already exists")
            update_data["phone_number"] = combined_phone
        else:
            update_data["phone_number"] = None
    if "country_code" in update_data:
        update_data.pop("country_code", None)

    if "email" in update_data and update_data["email"]:
        existing_email = db.query(models.Driver).filter(
            models.Driver.email == update_data["email"],
            models.Driver.driver_id != driver.driver_id,
        ).first()
        if existing_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Driver with this email already exists")

    if "cnic" in update_data and update_data["cnic"]:
        existing_cnic = db.query(models.Driver).filter(
            models.Driver.cnic == update_data["cnic"],
            models.Driver.driver_id != driver.driver_id,
        ).first()
        if existing_cnic:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Driver with this CNIC already exists")

    if "license_number" in update_data and update_data["license_number"]:
        existing_license = db.query(models.Driver).filter(
            models.Driver.license_number == update_data["license_number"],
            models.Driver.driver_id != driver.driver_id,
        ).first()
        if existing_license:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Driver with this license number already exists")

    for field, value in update_data.items():
        setattr(driver, field, value)

    db.commit()
    db.refresh(driver)
    return driver

# to get all vehicles of a company
@router.get("/company/vehicles",response_model=List[schemas.vehicle_read_company])
def get_company_vehicles(current_company:models.Company=Depends(get_current_company),db:Session=Depends(get_db)):
    current_company.last_active=datetime.utcnow()
    vehicles=db.query(models.Vehicle).filter(models.Vehicle.company_id==current_company.company_id).all()
    if not vehicles:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="No vehicles found.")
    return vehicles


@router.post("/company/addvehicles", response_model=schemas.vehicle_read_company, status_code=201)
def create_company_vehicle(
    vehicle_data: schemas.VehicleCreateCompany,
    current_company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    """Create a vehicle under the currently logged-in company."""
    current_company.last_active = datetime.utcnow()

    existing_vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_number == vehicle_data.vehicle_number).first()
    if existing_vehicle:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vehicle with this number already exists")

    new_vehicle = models.Vehicle(
        company_id=current_company.company_id,
        vehicle_number=vehicle_data.vehicle_number,
        vehicle_type=vehicle_data.vehicle_type,
        make=vehicle_data.make,
        model=vehicle_data.model,
        year=vehicle_data.year,
        is_active=vehicle_data.is_active,
    )

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle


@router.post("/company/assign-vehicle", status_code=200)
def assign_vehicle_to_driver(
    assignment: schemas.DriverVehicleAssign,
    current_company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    current_company.last_active = datetime.utcnow()

    driver = db.query(models.Driver).filter(models.Driver.driver_id == assignment.driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    if driver.company_id != current_company.company_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver does not belong to your company")

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == assignment.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    if vehicle.company_id != current_company.company_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vehicle does not belong to your company")

    driver.assigned_vehicle_id = assignment.vehicle_id
    db.commit()
    db.refresh(driver)

    return {
        "message": "Vehicle assigned successfully",
        "driver_id": str(driver.driver_id),
        "assigned_vehicle_id": str(driver.assigned_vehicle_id),
    }


@router.delete("/company/vehicles/{vehicle_id}", status_code=200)
def delete_company_vehicle(
    vehicle_id: str,
    current_company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    """Delete a company vehicle and nullify related references."""
    current_company.last_active = datetime.utcnow()

    vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.vehicle_id == vehicle_id,
        models.Vehicle.company_id == current_company.company_id,
    ).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found in your company")

    try:
        db.query(models.Driver).filter(models.Driver.assigned_vehicle_id == vehicle.vehicle_id).update(
            {models.Driver.assigned_vehicle_id: None}, synchronize_session=False
        )
        db.query(models.DriverSession).filter(models.DriverSession.vehicle_id == vehicle.vehicle_id).update(
            {models.DriverSession.vehicle_id: None}, synchronize_session=False
        )
        db.delete(vehicle)
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete vehicle: {str(e)}")

    return {"message": "Vehicle deleted successfully", "deleted_vehicle_id": vehicle_id}


@router.delete("/company/drivers/{driver_id}", status_code=200)
def delete_company_driver(
    driver_id: str,
    current_company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    """Delete a company driver and all related sessions."""
    current_company.last_active = datetime.utcnow()

    driver = db.query(models.Driver).filter(
        models.Driver.driver_id == driver_id,
        models.Driver.company_id == current_company.company_id,
    ).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found in your company")

    try:
        deleted_sessions_count = db.query(models.DriverSession).filter(
            models.DriverSession.driver_id == driver.driver_id
        ).delete(synchronize_session=False)
        db.delete(driver)
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete driver: {str(e)}")

    return {
        "message": "Driver deleted successfully",
        "deleted_driver_id": driver_id,
        "deleted_sessions_count": deleted_sessions_count,
    }

# to get all drivers sessions of a company
@router.get("/company/driver_sessions",response_model=List[schemas.driver_session_read_company])
def get_all_sessions(current_company:models.Company=Depends(get_current_company),db:Session=Depends(get_db)):
    current_company.last_active=datetime.utcnow()
    
    # Query with joinedload to efficiently fetch driver relationship
    sessions = db.query(models.DriverSession)\
        .options(joinedload(models.DriverSession.drivers))\
        .filter(models.DriverSession.company_id == current_company.company_id)\
        .all()

    if not sessions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="No sessions found.")
    
    # Transform to match driver_session_read_company schema
    result = []
    for session in sessions:
        session_dict = {
            "session_id": session.session_id,
            "driver_id": session.driver_id,
            "cnic": session.cnic,
            "company_id": session.company_id,
            "vehicle_id": session.vehicle_id,
            "driver_name": session.drivers.full_name,
            "start_time": session.start_time,
            "end_time": session.end_time,
            "total_frames_processed": session.total_frames_processed,
            "alert_frames": session.alert_frames,
            "drowsy_frames": session.drowsy_frames,
            "distracted_frames": session.distracted_frames,
            "average_confidence": session.average_confidence,
            "attention_score": session.attention_score,
            "session_status": session.session_status,
            "termination_reason": session.termination_reason,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
        }
        result.append(session_dict)
    
    return result
    # return sessions

# to get recent drivers sessions of a company
@router.get("/company/driver_recent_sessions",response_model=List[schemas.driver_session_read_company])
def get_recent_sessions(current_company:models.Company=Depends(get_current_company),db:Session=Depends(get_db)):

    current_company.last_active=datetime.utcnow()
    # sessions=db.query(models.DriverSession).filter(models.DriverSession.company_id==current_company.company_id).order_by(models.DriverSession.start_time.desc()).limit(10).all()


    sessions = db.query(models.DriverSession)\
        .options(joinedload(models.DriverSession.drivers))\
        .filter(models.DriverSession.company_id == current_company.company_id).order_by(models.DriverSession.start_time.desc())\
        .all()

    # sessions=db.query(models.DriverSession).filter(models.DriverSession.company_id==current_company.company_id).order_by(models.DriverSession.start_time.desc()).limit(10).all()
    if not sessions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="No recent sessions found.")
    
    result = []
    for session in sessions:
        session_dict = {
            "session_id": session.session_id,
            "driver_id": session.driver_id,
            "cnic": session.cnic,
            "company_id": session.company_id,
            "vehicle_id": session.vehicle_id,
            "driver_name": session.drivers.full_name,
            "start_time": session.start_time,
            "end_time": session.end_time,
            "total_frames_processed": session.total_frames_processed,
            "alert_frames": session.alert_frames,
            "drowsy_frames": session.drowsy_frames,
            "distracted_frames": session.distracted_frames,
            "average_confidence": session.average_confidence,
            "attention_score": session.attention_score,
            "session_status": session.session_status,
            "termination_reason": session.termination_reason,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
        }
        result.append(session_dict)
    
    return result
    # return sessions

@router.get("/company/driver_active_sessions",response_model=List[schemas.driver_session_read_company])
def get_active_sessions(current_company:models.Company=Depends(get_current_company),db:Session=Depends(get_db)):
    # current_company.last_active=datetime.now()
    # sessions=db.query(models.DriverSession).filter(models.DriverSession.company_id==current_company.company_id).filter(models.DriverSession.session_status=="active").all()
    current_company.last_active=datetime.utcnow()

    sessions = db.query(models.DriverSession)\
        .options(joinedload(models.DriverSession.drivers))\
        .filter(models.DriverSession.company_id==current_company.company_id).filter(models.DriverSession.session_status=="active")\
        .all()

    if not sessions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="No active sessions found.")
    
    result = []
    for session in sessions:
        session_dict = {
            "session_id": session.session_id,
            "driver_id": session.driver_id,
            "cnic": session.cnic,
            "company_id": session.company_id,
            "vehicle_id": session.vehicle_id,
            "driver_name": session.drivers.full_name,
            "start_time": session.start_time,
            "end_time": session.end_time,
            "total_frames_processed": session.total_frames_processed,
            "alert_frames": session.alert_frames,
            "drowsy_frames": session.drowsy_frames,
            "distracted_frames": session.distracted_frames,
            "average_confidence": session.average_confidence,
            "attention_score": session.attention_score,
            "session_status": session.session_status,
            "termination_reason": session.termination_reason,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
        }
        result.append(session_dict)
    
    return result
    # return sessions


@router.get("/company/alerts", response_model=List[schemas.CompanyAlertRead])
def get_company_alerts(
    status_filter: Literal["unread", "all"] = Query("unread", alias="status"),
    since: datetime | None = Query(None),
    current_company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    current_company.last_active = datetime.utcnow()

    query = db.query(models.Alert, models.FatigueEvent.state).options(
        joinedload(models.Alert.driver),
    ).join(
        models.FatigueEvent,
        models.Alert.event_id == models.FatigueEvent.event_id,
    ).filter(models.Alert.company_id == current_company.company_id)

    if status_filter == "unread":
        query = query.filter(models.Alert.acknowledged == False)

    if since is not None:
        query = query.filter(models.Alert.created_at >= since)

    alert_rows = query.order_by(models.Alert.created_at.desc()).all()

    result = []
    for alert, event_state in alert_rows:
        result.append(
            schemas.CompanyAlertRead(
                alert_id=alert.alert_id,
                event_id=alert.event_id,
                session_id=alert.session_id,
                driver_id=alert.driver_id,
                driver_name=alert.driver.full_name if alert.driver else None,
                company_id=alert.company_id,
                alert_type=alert.alert_type,
                alert_message=alert.alert_message,
                delivered=alert.delivered,
                acknowledged=alert.acknowledged,
                acknowledged_at=alert.acknowledged_at,
                response_time_seconds=alert.response_time.total_seconds() if alert.response_time else None,
                created_at=alert.created_at,
                event_state=event_state,
            )
        )

    return result


@router.patch("/company/alerts/{alert_id}/ack", response_model=schemas.CompanyAlertAckResponse)
def ack_company_alert(
    alert_id: str,
    current_company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    current_company.last_active = datetime.utcnow()

    alert = db.query(models.Alert).filter(models.Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found.")

    if alert.company_id != current_company.company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to acknowledge this alert.")

    ack_time = datetime.utcnow()
    alert.acknowledged = True
    alert.acknowledged_at = ack_time
    alert.response_time = ack_time - alert.created_at
    db.commit()
    db.refresh(alert)

    return schemas.CompanyAlertAckResponse(
        alert_id=alert.alert_id,
        acknowledged=alert.acknowledged,
        acknowledged_at=alert.acknowledged_at,
        response_time_seconds=alert.response_time.total_seconds() if alert.response_time else None,
        message="Alert acknowledged by company.",
    )


@router.get("/company/sessions/{session_id}/events", response_model=List[schemas.DriverEventRead])
def get_company_session_events(
    session_id: str,
    limit: int = Query(100, ge=1, le=500),
    current_company: models.Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    current_company.last_active = datetime.utcnow()

    db_session = db.query(models.DriverSession).filter(models.DriverSession.session_id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    if db_session.company_id != current_company.company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Session does not belong to your company.")

    events = db.query(models.FatigueEvent).options(
        joinedload(models.FatigueEvent.driver),
    ).filter(
        models.FatigueEvent.session_id == db_session.session_id,
    ).order_by(models.FatigueEvent.timestamp.desc()).limit(limit).all()

    result = []
    for event in events:
        result.append(
            schemas.DriverEventRead(
                event_id=event.event_id,
                session_id=event.session_id,
                driver_id=event.driver_id,
                driver_name=event.driver.full_name if event.driver else None,
                company_id=event.company_id,
                timestamp=event.timestamp,
                state=event.state,
                confidence=event.confidence,
                severity=event.severity,
                features=event.features,
                occlusion_detected=event.occlusion_detected,
                occlusion_type=event.occlusion_type,
                face_visibility_score=event.face_visibility_score,
                frame_image_url=event.frame_image_url,
                created_at=event.created_at,
                alert_generated=event.event_id in [alert.event_id for alert in db.query(models.Alert).filter(models.Alert.session_id == session_id).all()],
                alert_id=None,
            )
        )

    return result





    # pass
# def get_company_derivers(current_company: models.Company = Depends(get_current_company), db: Session = Depends(get_db)):
#     current_company.last_active = datetime.now()
#     drivers = db.query(models.Driver).filter(models.Driver.company_id == current_company.company_id).all()
#     return drivers