from sqlalchemy import Column, Integer, String, Boolean, Text, TIMESTAMP, Date, Float, ForeignKey, Interval
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..database_c.database import Base
from sqlalchemy.sql import func
from datetime import date, timedelta
import uuid

# --- Helper for UUID and current timestamp defaults ---
# In SQLAlchemy, you define the default behavior on the model.


class Driver(Base):
    __tablename__ = "drivers"

    driver_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    cnic = Column(String(15), unique=True, nullable=False)
        # --- Foreign Key to Company ---
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="SET NULL"), nullable=True)
    assigned_vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.vehicle_id", ondelete="SET NULL"), nullable=True)

    full_name = Column(String(100), nullable=False)
    phone_number = Column(String(20))
    email = Column(String(100), unique=True)
    password = Column(Text)
    license_number = Column(String(30), unique=True, nullable=False)
    license_expiry = Column(Date)
    date_of_birth = Column(Date)
    age = Column(Integer)
    gender = Column(String(10))
    address = Column(Text)
    city = Column(String(50))
    profile_image_url = Column(Text, default=None)
    experience_years = Column(Integer)
    is_active = Column(Boolean, default=True)
    risk_score = Column(Float, default=0.0)
    created_at = Column(TIMESTAMP(timezone=False), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=False), default=func.now(), onupdate=func.now())
    last_active = Column(TIMESTAMP(timezone=False),default=func.now(),onupdate=func.now())

    # --- Relationship to driver sessions ---
    driver_sessions = relationship("DriverSession", back_populates="drivers", foreign_keys="[DriverSession.driver_id]")
    fatigue_events = relationship("FatigueEvent", back_populates="driver", foreign_keys="[FatigueEvent.driver_id]")
    alerts = relationship("Alert", back_populates="driver", foreign_keys="[Alert.driver_id]")
        # --- Relationship to Company ---
    companies = relationship("Company", back_populates="drivers", foreign_keys=[company_id])
    assigned_vehicle = relationship("Vehicle", back_populates="assigned_drivers", foreign_keys=[assigned_vehicle_id])


class DriverSession(Base):
    __tablename__ = "driver_sessions"

    session_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.driver_id", ondelete="CASCADE"))
    cnic = Column(String(15), ForeignKey("drivers.cnic", ondelete="CASCADE"))
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="CASCADE"))
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.vehicle_id", ondelete="SET NULL"), nullable=True)
    start_time = Column(TIMESTAMP(timezone=False), default=func.now())
    end_time = Column(TIMESTAMP(timezone=False), nullable=True)
    total_frames_processed = Column(Integer, default=0)
    alert_frames = Column(Integer, default=0)
    drowsy_frames = Column(Integer, default=0)
    distracted_frames = Column(Integer, default=0)
    average_confidence = Column(Float, nullable=True)
    attention_score = Column(Float, nullable=True)
    session_status = Column(String(20), default='active')  # 'active', 'completed', 'interrupted', 'error'
    termination_reason = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=False), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=False), default=func.now(), onupdate=func.now())
    
    # --- Relationships ---
    drivers = relationship("Driver", back_populates="driver_sessions", foreign_keys=[driver_id])
    companies = relationship("Company", back_populates="driver_sessions", foreign_keys=[company_id])
    vehicles=relationship("Vehicle", back_populates="driver_sessions", foreign_keys=[vehicle_id])
    fatigue_events = relationship("FatigueEvent", back_populates="session", foreign_keys="[FatigueEvent.session_id]")
    alerts = relationship("Alert", back_populates="session", foreign_keys="[Alert.session_id]")

class Company(Base):
    __tablename__ = "companies"

    company_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    company_name = Column(String(200), nullable=False)
    company_type = Column(String(50), nullable=True)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(Text, nullable=False)
    contact_number = Column(String(20))
    company_address = Column(Text)
    city = Column(String(50))
    country = Column(String(50), default='Pakistan')
    subscription_plan = Column(String(30), default='basic')
    subscription_status = Column(String(20), default='active')
    # Default subscription expiry to 365 days from today (Python-side default)
    subscription_expiry = Column(Date, default=lambda: date.today() + timedelta(days=365))
    is_verified = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=False), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=False), default=func.now(), onupdate=func.now())

    # --- Relationships ---
    drivers = relationship("Driver", back_populates="companies", foreign_keys="[Driver.company_id]")
    vehicles = relationship("Vehicle", back_populates="companies", foreign_keys="[Vehicle.company_id]")
    # driver_sessions = relationship("DriverSession", back_populates="company")
    driver_sessions = relationship("DriverSession", back_populates="companies", foreign_keys="[DriverSession.company_id]")
    fatigue_events = relationship("FatigueEvent", back_populates="company", foreign_keys="[FatigueEvent.company_id]")
    alerts = relationship("Alert", back_populates="company", foreign_keys="[Alert.company_id]")


class AdminUser(Base):
    __tablename__ = "admin_users"

    admin_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    cnic = Column(String(15), unique=True, nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(Text, nullable=False) 
    email = Column(String(100), unique=True)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    last_login = Column(TIMESTAMP(timezone=False))
    created_at = Column(TIMESTAMP(timezone=False), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=False), default=func.now(), onupdate=func.now())


class Vehicle(Base):
    __tablename__ = "vehicles"

    vehicle_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    # --- Foreign Key to Company ---
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="SET NULL"), nullable=True)
    
    vehicle_number = Column(String(30), unique=True, nullable=False)
    vehicle_type = Column(String(50))
    make = Column(String(50))
    model = Column(String(50))
    year = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=False), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=False), default=func.now(), onupdate=func.now())

    # --- Relationship to Company ---
    companies = relationship("Company", back_populates="vehicles",foreign_keys=[company_id])
    # driver_sessions = relationship("DriverSession", back_populates="vehicle")
    driver_sessions = relationship("DriverSession", back_populates="vehicles",foreign_keys=[DriverSession.vehicle_id])
    assigned_drivers = relationship("Driver", back_populates="assigned_vehicle", foreign_keys="[Driver.assigned_vehicle_id]")


class FatigueEvent(Base):
    __tablename__ = "fatigue_events"

    event_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("driver_sessions.session_id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.driver_id", ondelete="CASCADE"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="SET NULL"), nullable=True)

    timestamp = Column(TIMESTAMP(timezone=False), default=func.now())
    state = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=True)
    severity = Column(String(20), nullable=True)
    features = Column(JSONB, nullable=True)
    occlusion_detected = Column(Boolean, default=False)
    occlusion_type = Column(String(30), nullable=True)
    face_visibility_score = Column(Float, nullable=True)
    frame_image_url = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=False), default=func.now())

    session = relationship("DriverSession", back_populates="fatigue_events", foreign_keys=[session_id])
    driver = relationship("Driver", back_populates="fatigue_events", foreign_keys=[driver_id])
    company = relationship("Company", back_populates="fatigue_events", foreign_keys=[company_id])
    alerts = relationship("Alert", back_populates="event", foreign_keys="[Alert.event_id]")


class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("fatigue_events.event_id", ondelete="CASCADE"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("driver_sessions.session_id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.driver_id", ondelete="CASCADE"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="CASCADE"), nullable=False)

    alert_type = Column(String(30), nullable=False)
    alert_message = Column(Text, nullable=False)
    delivered = Column(Boolean, default=False)
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(TIMESTAMP(timezone=False), nullable=True)
    response_time = Column(Interval, nullable=True)
    created_at = Column(TIMESTAMP(timezone=False), default=func.now())

    event = relationship("FatigueEvent", back_populates="alerts", foreign_keys=[event_id])
    session = relationship("DriverSession", back_populates="alerts", foreign_keys=[session_id])
    driver = relationship("Driver", back_populates="alerts", foreign_keys=[driver_id])
    company = relationship("Company", back_populates="alerts", foreign_keys=[company_id])


class DashboardMetric(Base):
    __tablename__ = "dashboard_metrics"

    metric_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.driver_id", ondelete="CASCADE"), nullable=False)
    period_type = Column(String(20), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    total_sessions = Column(Integer, default=0)
    total_duration = Column(Interval, nullable=True)
    total_events = Column(Integer, default=0)
    drowsy_events = Column(Integer, default=0)
    distracted_events = Column(Integer, default=0)
    high_risk_events = Column(Integer, default=0)
    total_alerts = Column(Integer, default=0)
    average_attention_score = Column(Float, nullable=True)
    average_confidence = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=True)
    risk_level = Column(String(20), nullable=True)
    last_updated = Column(TIMESTAMP(timezone=False), default=func.now())
    created_at = Column(TIMESTAMP(timezone=False), default=func.now())




# class Driver(Base):
#     __tablename__ = "drivers"

#     driver_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
#     cnic = Column(String(15), unique=True, nullable=False)
    
#     # --- Foreign Key to Company ---
#     # company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="CASCADE"))
    
#     full_name = Column(String(100), nullable=False)
#     phone_number = Column(String(20))
#     email = Column(String(100), unique=True)
#     password = Column(Text)
#     license_number = Column(String(30), unique=True, nullable=False)
#     license_expiry = Column(Date)
#     date_of_birth = Column(Date)
#     age = Column(Integer)
#     gender = Column(String(10))
#     address = Column(Text)
#     city = Column(String(50))
#     profile_image_url = Column(Text, default=None)
#     experience_years = Column(Integer)
#     is_active = Column(Boolean, default=True)
#     risk_score = Column(Float, default=0.0)
#     created_at = Column(TIMESTAMP(timezone=False), default=func.now())
#     updated_at = Column(TIMESTAMP(timezone=False), default=func.now(), onupdate=func.now())
#     last_active = Column(TIMESTAMP(timezone=False),default=func.now(),onupdate=func.now())

#     # --- Relationship to Company ---
#     # company = relationship("Company", back_populates="drivers")
#     # driver_sessions = relationship("DriverSession", back_populates="drivers")
#     # sessions = relationship("DriverSession", back_populates="driver", foreign_keys="[DriverSession.driver_id]")
  
#     # driver_sessions = relationship("DriverSession", back_populates="drivers", foreign_keys="[DriverSession.driver_id]")
#     # -----------------------wait for testing
#     driver_sessions = relationship("DriverSession", back_populates="drivers", foreign_keys="[DriverSession.driver_id]")



# class Vehicle(Base):
#     __tablename__ = "vehicles"

#     vehicle_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    
#     # --- Foreign Key to Company ---
#     company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="CASCADE"))
    
#     vehicle_number = Column(String(30), unique=True, nullable=False)
#     vehicle_type = Column(String(50))
#     make = Column(String(50))
#     model = Column(String(50))
#     year = Column(Integer)
#     is_active = Column(Boolean, default=True)
#     created_at = Column(TIMESTAMP(timezone=False), default=func.now())
#     updated_at = Column(TIMESTAMP(timezone=False), default=func.now(), onupdate=func.now())

#     # --- Relationship to Company ---
#     company = relationship("Company", back_populates="vehicles")
#     # driver_sessions = relationship("DriverSession", back_populates="vehicle")
#     driver_sessions = relationship("DriverSession", back_populates="vehicles")

# # ===================================================
# # DRIVER SESSION MODEL
# # Add this to your existing models.py file
# # ===================================================

# # from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, TIMESTAMP
# # from sqlalchemy.dialects.postgresql import UUID
# # from sqlalchemy.orm import relationship
# # from sqlalchemy.sql import func
# # import uuid


# class DriverSession(Base):
#     __tablename__ = "driver_sessions"

#     session_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    
#     # --- Foreign Keys ---
#     driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.driver_id", ondelete="CASCADE"))
#     cnic = Column(String(15), ForeignKey("drivers.cnic", ondelete="CASCADE"))
    
#     # company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="CASCADE"))
#     # vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.vehicle_id", ondelete="SET NULL"), nullable=True)
    
#     # --- Session timing ---
#     start_time = Column(TIMESTAMP(timezone=False), default=func.now())
#     end_time = Column(TIMESTAMP(timezone=False), nullable=True)
#     # Note: total_duration is GENERATED column in DB (calculated automatically by PostgreSQL)
#     # We don't map it here as it's computed by the database
    
#     # --- Session metrics ---
#     total_frames_processed = Column(Integer, default=0)
#     alert_frames = Column(Integer, default=0)
#     drowsy_frames = Column(Integer, default=0)
#     distracted_frames = Column(Integer, default=0)
#     average_confidence = Column(Float, nullable=True)
#     attention_score = Column(Float, nullable=True)
    
#     # --- Session status ---
#     session_status = Column(String(20), default='active')  # 'active', 'completed', 'interrupted', 'error'
#     termination_reason = Column(Text, nullable=True)
    
#     # --- Timestamps ---
#     created_at = Column(TIMESTAMP(timezone=False), default=func.now())
#     updated_at = Column(TIMESTAMP(timezone=False), default=func.now(), onupdate=func.now())
    
#     # --- Relationships ---
#     # company = relationship("Company", back_populates="DriverSession")
#     # driver = relationship("Driver", back_populates="DriverSession")
#     # vehicle = relationship("Vehicle", back_populates="DriverSession")

#     drivers = relationship("Driver", back_populates="driver_sessions", foreign_keys=[driver_id])
    
#     # company = relationship("Company", back_populates="driver_sessions")
#     # vehicles = relationship("Vehicle", back_populates="driver_sessions")  # Uncomment when Vehicle model exists


# ===================================================
# UPDATE YOUR EXISTING MODELS WITH THESE RELATIONSHIPS
# ===================================================

# Add this line to your Driver class (in existing models.py):
# sessions = relationship("DriverSession", back_populates="driver", foreign_keys="[DriverSession.driver_id]")

# Add this line to your Company class (in existing models.py):
# driver_sessions = relationship("DriverSession", back_populates="company")
