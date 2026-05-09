from typing import List, Literal
import logging
import os

from ..model_s import models
from ..pydantic import schemas
from ..database_c.database import get_db
from ..authentication.auth import get_current_driver
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
import pytz
from fastapi import APIRouter, Depends, HTTPException, status, Query

router = APIRouter()
logger = logging.getLogger(__name__)
DEBUG_DB_LOGS = os.getenv("DEBUG_DB_LOGS", "0") == "1"

ALERT_COOLDOWN_SECONDS = 20
ALERT_TRIGGER_STATES = {"DROWSY", "DISTRACTED"}
VALID_EVENT_STATES = {"ALERT", "DROWSY", "DISTRACTED"}
KARACHI_TZ = pytz.timezone("Asia/Karachi")


def current_pk_time() -> datetime:
    return datetime.now(KARACHI_TZ)


def as_karachi_time(value: datetime) -> datetime:
    if value.tzinfo is None:
        return KARACHI_TZ.localize(value)
    return value.astimezone(KARACHI_TZ)


def normalize_state(state: str) -> str:
    return state.strip().upper() if state else ""

# ---------------------------------------------Drivers Info Endpoints-------------------------------------------------------------
# Info of a logged in driver

@router.get("/driver/me", response_model=schemas.DriverRead)
def get_driver(current_driver: models.Driver = Depends(get_current_driver)):
    current_driver.last_active = current_pk_time()
    return current_driver


# update of driver's info

@router.put("/driver/update", response_model=schemas.DriverRead)
def update_driver(driver_update: schemas.DriverSelfUpdate,current_driver: models.Driver = Depends(get_current_driver),db: Session = Depends(get_db)):
    update_data = driver_update.dict(exclude_unset=True)
    current_driver.last_active = current_pk_time()

    for field, value in update_data.items():
        setattr(current_driver, field, value)

    db.commit()
    db.refresh(current_driver)
    return current_driver


# ---------------------------------------------Session Info Endpoints-------------------------------------------------------------
# Creating a new session

@router.post("/driver/newsession", response_model=schemas.DriverSessionRead)
def create_driver_session(session: schemas.DriverSessionCreate,current_driver: models.Driver = Depends(get_current_driver),db: Session = Depends(get_db)):

    # a new condition will be appended in this function to forbid the driver to create a new session if he not assigned to any company
    driver_id = current_driver.driver_id
    cnic=current_driver.cnic
    assigned_vehicle_id = current_driver.assigned_vehicle_id
    current_driver.last_active = current_pk_time()
    active_session = db.query(models.DriverSession).filter(models.DriverSession.driver_id == driver_id,models.DriverSession.session_status == "active").first()
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == assigned_vehicle_id).first()

    if not current_driver.company_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Driver is not assigned to any company. Cannot start session.")
    if active_session:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail=f"Driver already has an active session (session_id: {active_session.session_id})")
    if not assigned_vehicle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver is not assigned to any vehicle.")
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    if vehicle.company_id != current_driver.company_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vehicle does not belong to the driver's company.")

    new_session = models.DriverSession(
        driver_id=driver_id,
        cnic=cnic,
        session_status="active",
        company_id=current_driver.company_id,
        vehicle_id=assigned_vehicle_id,
        start_time=current_pk_time()
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


# Get sessions for a driver

@router.get("/driver/sessions", response_model=List[schemas.DriverSessionRead])
def get_driver_all_session(current_driver: models.Driver = Depends(get_current_driver), db: Session = Depends(get_db)):
    driver_id = current_driver.driver_id
    session = db.query(models.DriverSession).filter(models.DriverSession.driver_id == driver_id).all()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"No session found for driver {driver_id}")
    return session


@router.get("/driver/sessions/{session_id}", response_model=schemas.DriverSessionRead)
async def get_session_by_id(session_id: str, db: Session = Depends(get_db), current_driver: models.Driver = Depends(get_current_driver)):
    session = db.query(models.DriverSession).filter(
        models.DriverSession.session_id == session_id,
        models.DriverSession.driver_id == current_driver.driver_id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


# Ending a session

@router.put("/driver/endsession", response_model=schemas.DriverSessionEndResponse)
@router.put("/sessions/end", response_model=schemas.DriverSessionEndResponse)
def end_driver_session(session_end: schemas.DriverSessionEnd,current_driver: models.Driver = Depends(get_current_driver),db: Session = Depends(get_db)):
    
    driver_id = current_driver.driver_id
    current_driver.last_active = current_pk_time()
    active_session = db.query(models.DriverSession).filter(models.DriverSession.driver_id == driver_id,models.DriverSession.session_status == "active").first()

    if not active_session:
        return schemas.DriverSessionEndResponse(detail="Session already ended or not found")
    active_session.session_status = session_end.session_status
    active_session.termination_reason = session_end.termination_reason
    active_session.end_time = current_pk_time()
    alert_frames = active_session.alert_frames or 0
    drowsy_frames = active_session.drowsy_frames or 0
    distracted_frames = active_session.distracted_frames or 0
    total_frames = active_session.total_frames_processed or (alert_frames + drowsy_frames + distracted_frames)
    if total_frames > 0:
        safe_frames = max(0, total_frames - drowsy_frames - distracted_frames)
        active_session.attention_score = round((safe_frames / total_frames) * 100, 2)
    else:
        active_session.attention_score = 0
    db.commit()
    db.refresh(active_session)
    if DEBUG_DB_LOGS:
        logger.info(
            "[DB] Session ended session_id=%s total=%s alert=%s drowsy=%s distracted=%s attention=%.2f",
            active_session.session_id,
            total_frames,
            alert_frames,
            drowsy_frames,
            distracted_frames,
            active_session.attention_score or 0,
        )
    return schemas.DriverSessionEndResponse(detail="Session ended successfully", session=active_session)


@router.post("/driver/events", response_model=schemas.DriverEventRead, status_code=status.HTTP_201_CREATED)
def create_driver_event(
    event_data: schemas.DriverEventCreate,
    current_driver: models.Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    state = normalize_state(event_data.state)
    if state not in VALID_EVENT_STATES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state. Use ALERT, DROWSY, or DISTRACTED.")

    active_session = db.query(models.DriverSession).filter(
        models.DriverSession.session_id == event_data.session_id,
        models.DriverSession.driver_id == current_driver.driver_id,
        models.DriverSession.session_status == "active",
    ).first()

    if not active_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active session not found for this driver.")

    # Persist server-side canonical PKT timestamp for event and session updates.
    now = current_pk_time()
    db_event = models.FatigueEvent(
        session_id=active_session.session_id,
        driver_id=current_driver.driver_id,
        company_id=active_session.company_id,
        timestamp=now,
        state=state,
        confidence=event_data.confidence,
        severity=event_data.severity,
        features=event_data.features,
        occlusion_detected=bool(event_data.occlusion_detected),
        occlusion_type=event_data.occlusion_type,
        face_visibility_score=event_data.face_visibility_score,
        frame_image_url=event_data.frame_image_url,
    )
    db.add(db_event)
    db.flush()

    previous_frames = active_session.total_frames_processed or 0
    active_session.total_frames_processed = previous_frames + 1

    if state == "ALERT":
        active_session.alert_frames = (active_session.alert_frames or 0) + 1
    elif state == "DROWSY":
        active_session.drowsy_frames = (active_session.drowsy_frames or 0) + 1
    elif state == "DISTRACTED":
        active_session.distracted_frames = (active_session.distracted_frames or 0) + 1

    if event_data.confidence is not None:
        old_avg = active_session.average_confidence or 0.0
        new_total = active_session.total_frames_processed
        active_session.average_confidence = ((old_avg * previous_frames) + event_data.confidence) / new_total

    active_session.updated_at = now

    created_alert = None
    if state in ALERT_TRIGGER_STATES:
        recent_alert = db.query(models.Alert).join(
            models.FatigueEvent,
            models.Alert.event_id == models.FatigueEvent.event_id,
        ).filter(
            models.Alert.driver_id == current_driver.driver_id,
            models.Alert.session_id == active_session.session_id,
            models.FatigueEvent.state == state,
        ).order_by(models.Alert.created_at.desc()).first()

        in_cooldown = False
        if recent_alert and recent_alert.created_at:
            alert_time = as_karachi_time(recent_alert.created_at)
            
            elapsed = now - alert_time
            in_cooldown = elapsed.total_seconds() < ALERT_COOLDOWN_SECONDS

        if not in_cooldown:
            alert_msg = event_data.alert_message or f"{state} detected"
            created_alert = models.Alert(
                event_id=db_event.event_id,
                session_id=active_session.session_id,
                driver_id=current_driver.driver_id,
                company_id=active_session.company_id,
                alert_type=event_data.alert_type or "audio",
                alert_message=alert_msg,
                delivered=True,
            )
            db.add(created_alert)

    db.commit()
    db.refresh(db_event)

    if DEBUG_DB_LOGS:
        logger.info(
            "[DB] Event saved session_id=%s state=%s confidence=%s counts=(alert=%s,drowsy=%s,distracted=%s,total=%s) features=%s",
            active_session.session_id,
            state,
            event_data.confidence,
            active_session.alert_frames,
            active_session.drowsy_frames,
            active_session.distracted_frames,
            active_session.total_frames_processed,
            event_data.features,
        )

        if created_alert is not None:
            logger.info(
                "[DB] Alert created alert_id=%s session_id=%s state=%s",
                created_alert.alert_id,
                active_session.session_id,
                state,
            )

    return schemas.DriverEventRead(
        event_id=db_event.event_id,
        session_id=db_event.session_id,
        driver_id=db_event.driver_id,
        company_id=db_event.company_id,
        timestamp=db_event.timestamp,
        state=db_event.state,
        confidence=db_event.confidence,
        severity=db_event.severity,
        features=db_event.features,
        occlusion_detected=db_event.occlusion_detected,
        occlusion_type=db_event.occlusion_type,
        face_visibility_score=db_event.face_visibility_score,
        frame_image_url=db_event.frame_image_url,
        created_at=db_event.created_at,
        alert_generated=created_alert is not None,
        alert_id=created_alert.alert_id if created_alert else None,
    )


@router.post("/driver/alerts/ack", response_model=schemas.CompanyAlertAckResponse)
def ack_driver_alert(
    payload: schemas.DriverAlertAckRequest,
    current_driver: models.Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    alert = db.query(models.Alert).filter(models.Alert.alert_id == payload.alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found.")

    if alert.driver_id != current_driver.driver_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to acknowledge this alert.")

    active_session = db.query(models.DriverSession).filter(
        models.DriverSession.session_id == alert.session_id,
        models.DriverSession.driver_id == current_driver.driver_id,
        models.DriverSession.session_status == "active",
    ).first()
    if not active_session:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Alert is not tied to an active driver session.")

    ack_time = current_pk_time()
    alert.acknowledged = True
    alert.acknowledged_at = ack_time
    
    alert_created = as_karachi_time(alert.created_at)
        
    alert.response_time = ack_time - alert_created
    db.commit()
    db.refresh(alert)

    return schemas.CompanyAlertAckResponse(
        alert_id=alert.alert_id,
        acknowledged=alert.acknowledged,
        acknowledged_at=alert.acknowledged_at,
        response_time_seconds=alert.response_time.total_seconds() if alert.response_time else None,
        message="Alert acknowledged by driver.",
    )


@router.patch("/driver/sessions/metrics", response_model=schemas.DriverSessionRead)
def patch_driver_session_metrics(
    metrics: schemas.DriverSessionMetricsPatch,
    current_driver: models.Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    has_update = any([
        metrics.total_frames_processed_increment is not None,
        metrics.alert_frames_increment is not None,
        metrics.drowsy_frames_increment is not None,
        metrics.distracted_frames_increment is not None,
        metrics.average_confidence is not None,
        metrics.attention_score is not None,
    ])
    if not has_update:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No metric updates provided.")

    active_session = db.query(models.DriverSession).filter(
        models.DriverSession.session_id == metrics.session_id,
    ).first()
    if not active_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    if active_session.driver_id != current_driver.driver_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this session.")

    if active_session.session_status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only active sessions can be updated.")

    if metrics.total_frames_processed_increment is not None:
        active_session.total_frames_processed = (active_session.total_frames_processed or 0) + metrics.total_frames_processed_increment
    if metrics.alert_frames_increment is not None:
        active_session.alert_frames = (active_session.alert_frames or 0) + metrics.alert_frames_increment
    if metrics.drowsy_frames_increment is not None:
        active_session.drowsy_frames = (active_session.drowsy_frames or 0) + metrics.drowsy_frames_increment
    if metrics.distracted_frames_increment is not None:
        active_session.distracted_frames = (active_session.distracted_frames or 0) + metrics.distracted_frames_increment
    if metrics.average_confidence is not None:
        active_session.average_confidence = metrics.average_confidence
    if metrics.attention_score is not None:
        active_session.attention_score = metrics.attention_score

    active_session.updated_at = current_pk_time()
    db.commit()
    db.refresh(active_session)
    if DEBUG_DB_LOGS:
        logger.info(
            "[DB] Session metrics patched session_id=%s total=%s alert=%s drowsy=%s distracted=%s avg_conf=%s attention=%s",
            active_session.session_id,
            active_session.total_frames_processed,
            active_session.alert_frames,
            active_session.drowsy_frames,
            active_session.distracted_frames,
            active_session.average_confidence,
            active_session.attention_score,
        )
    return active_session


@router.get("/driver/dashboard/metrics", response_model=schemas.DriverDashboardMetricsRead)
def get_driver_dashboard_metrics(
    period_type: Literal["daily", "weekly", "monthly"] = Query("daily"),
    period_start: date | None = Query(None),
    period_end: date | None = Query(None),
    current_driver: models.Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    today = date.today()

    if period_start is None and period_end is None:
        if period_type == "daily":
            period_start = today
            period_end = today
        elif period_type == "weekly":
            period_start = today - timedelta(days=today.weekday())
            period_end = period_start + timedelta(days=6)
        else:
            period_start = today.replace(day=1)
            period_end = today
    elif period_start is None and period_end is not None:
        if period_type == "daily":
            period_start = period_end
        elif period_type == "weekly":
            period_start = period_end - timedelta(days=6)
        else:
            period_start = period_end.replace(day=1)
    elif period_end is None and period_start is not None:
        if period_type == "daily":
            period_end = period_start
        elif period_type == "weekly":
            period_end = period_start + timedelta(days=6)
        else:
            if period_start.month == 12:
                next_month_start = date(period_start.year + 1, 1, 1)
            else:
                next_month_start = date(period_start.year, period_start.month + 1, 1)
            period_end = next_month_start - timedelta(days=1)

    if period_start > period_end:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="period_start cannot be greater than period_end")

    # Use PKT boundaries for dashboard ranges.
    range_start_dt = KARACHI_TZ.localize(datetime.combine(period_start, datetime.min.time()))
    range_end_dt = KARACHI_TZ.localize(datetime.combine(period_end + timedelta(days=1), datetime.min.time()))

    sessions = db.query(models.DriverSession).filter(
        models.DriverSession.driver_id == current_driver.driver_id,
        models.DriverSession.start_time >= range_start_dt,
        models.DriverSession.start_time < range_end_dt,
    ).all()

    events = db.query(models.FatigueEvent).filter(
        models.FatigueEvent.driver_id == current_driver.driver_id,
        models.FatigueEvent.timestamp >= range_start_dt,
        models.FatigueEvent.timestamp < range_end_dt,
    ).all()

    alerts = db.query(models.Alert).filter(
        models.Alert.driver_id == current_driver.driver_id,
        models.Alert.created_at >= range_start_dt,
        models.Alert.created_at < range_end_dt,
    ).all()

    total_sessions = len(sessions)

    total_duration = timedelta(0)
    now_pk = current_pk_time()
    
    for s in sessions:
        if s.start_time:
            start_t = as_karachi_time(s.start_time)
                
            end_t = as_karachi_time(s.end_time) if s.end_time else now_pk

            if end_t >= start_t:
                total_duration += (end_t - start_t)

    total_events = len(events)
    drowsy_events = sum(1 for e in events if (e.state or "").upper() == "DROWSY")
    distracted_events = sum(1 for e in events if (e.state or "").upper() == "DISTRACTED")
    high_risk_events = sum(1 for e in events if (e.severity or "").lower() in {"high", "critical"})
    total_alerts = len(alerts)

    attention_values = [s.attention_score for s in sessions if s.attention_score is not None]
    confidence_values = [s.average_confidence for s in sessions if s.average_confidence is not None]

    average_attention_score = (sum(attention_values) / len(attention_values)) if attention_values else 0.0
    average_confidence = (sum(confidence_values) / len(confidence_values)) if confidence_values else 0.0

    # Deterministic dashboard risk formula. Weights are intentionally simple and easy to tune.
    safe_sessions = total_sessions if total_sessions > 0 else 1
    safe_events = total_events if total_events > 0 else 1

    event_rate = total_events / safe_sessions
    alert_rate = total_alerts / safe_sessions
    drowsy_ratio = drowsy_events / safe_events
    distracted_ratio = distracted_events / safe_events
    high_risk_ratio = high_risk_events / safe_events

    attention_penalty = max(0.0, 100.0 - average_attention_score)
    confidence_penalty = max(0.0, 1.0 - average_confidence) * 100.0

    risk_score = (
        (event_rate * 10.0)
        + (alert_rate * 8.0)
        + (drowsy_ratio * 25.0)
        + (distracted_ratio * 20.0)
        + (high_risk_ratio * 30.0)
        + (attention_penalty * 0.2)
        + (confidence_penalty * 0.1)
    )
    risk_score = round(min(100.0, max(0.0, risk_score)), 2)

    if risk_score < 25:
        risk_level = "low"
    elif risk_score < 50:
        risk_level = "medium"
    elif risk_score < 75:
        risk_level = "high"
    else:
        risk_level = "critical"

    return schemas.DriverDashboardMetricsRead(
        company_id=current_driver.company_id,
        driver_id=current_driver.driver_id,
        period_type=period_type,
        period_start=period_start,
        period_end=period_end,
        total_sessions=total_sessions,
        total_duration=total_duration,
        total_events=total_events,
        drowsy_events=drowsy_events,
        distracted_events=distracted_events,
        high_risk_events=high_risk_events,
        total_alerts=total_alerts,
        average_attention_score=round(average_attention_score, 2),
        average_confidence=round(average_confidence, 4),
        risk_score=risk_score,
        risk_level=risk_level,
        last_updated=current_pk_time(),
    )