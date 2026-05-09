# from pydantic import BaseModel
# from pydantic import BaseModel, EmailStr,Field,ConfigDict
# from uuid import UUID
# from datetime import date, datetime, timedelta
# from typing import Optional,Annotated, Literal, Dict, Any
# import pytz
# from ..authentication.auth import format_datetime_to_pst


# KARACHI_TZ = pytz.timezone("Asia/Karachi")
# class AppBaseModel(BaseModel):
#     model_config = ConfigDict(json_encoders={datetime: format_datetime_to_pst})

# # ----------------------------------------------------------------------------
# #                         Drivers Pydantic Models
# # ----------------------------------------------------------------------------
                              
# #                   Base schema (common shared fields)

# # so I have to add the optional thing in base model of driver base in comany id beacuse driver may not have company id
# class DriverBase(BaseModel):
#     cnic: Annotated[str,Field(max_length=13,min_length=13,description="CNIC should not contain (-)",example="1234567890123")]
#     full_name: str
#     phone_number: Optional[str] = None
#     company_id: Optional[UUID] = None
#     email: Optional[EmailStr] = None
#     license_number: str
#     license_expiry: Optional[date] = None
#     date_of_birth: Optional[date] = None
#     age: Optional[int] = None
#     gender: Optional[str] = None
#     address: Optional[str] = None
#     city: Optional[str] = None
#     profile_image_url: Optional[str] = None
#     experience_years: Optional[int] = None
#     is_active: Optional[bool] = True
#     risk_score: Optional[float] = 0.0


# # For creating a driver                                   currently no endpoint is using it

# class DriverCreate(DriverBase):
#     password: str  


# # For loggin in the driver                              currently endpoint using it -------->   (/auth/login/)

# class Driverlogin(BaseModel):
#     driver_id: str
#     password: str


# # For reading/returning driver data                    it is a response model for drivers (all endpoints are using it)

# class DriverRead(DriverBase):
#     driver_id: UUID
#     assigned_vehicle_id: Optional[UUID] = None
#     # company_id: UUID
#     created_at: datetime
#     updated_at: datetime
#     last_active: datetime

#     model_config = ConfigDict(from_attributes=True)


# # for updating the driver                               currently endpoint using it -------->   (/driver/update/)

# class DriverUpdate(BaseModel):
#     cnic: Optional[str] = None
#     full_name: Optional[str] = None
#     company_id: Optional[UUID] = None
#     phone_number: Optional[str] = None
#     email: Optional[EmailStr] = None
#     license_number: Optional[str] = None
#     license_expiry: Optional[date] = None
#     date_of_birth: Optional[date] = None
#     age: Optional[int] = None
#     gender: Optional[str] = None
#     address: Optional[str] = None
#     city: Optional[str] = None
#     profile_image_url: Optional[str] = None
#     experience_years: Optional[int] = None
#     is_active: Optional[bool] = None
#     risk_score: Optional[float] = None
#     password: Optional[str] = None


# # for driver self-update (limited personal details only)
# class DriverSelfUpdate(BaseModel):
#     phone_number: Optional[str] = None
#     email: Optional[EmailStr] = None
#     address: Optional[str] = None
#     city: Optional[str] = None
#     profile_image_url: Optional[str] = None
#     password: Optional[str] = None


# # for company-managed driver creation
# class CompanyDriverCreate(BaseModel):
#     cnic: Annotated[str, Field(max_length=13, min_length=13, description="CNIC should not contain (-)", example="1234567890123")]
#     full_name: str
#     password: str
#     phone_number: Optional[str] = None
#     email: Optional[EmailStr] = None
#     license_number: str
#     license_expiry: Optional[date] = None
#     date_of_birth: Optional[date] = None
#     age: Optional[int] = None
#     gender: Optional[str] = None
#     address: Optional[str] = None
#     city: Optional[str] = None
#     profile_image_url: Optional[str] = None
#     experience_years: Optional[int] = None
#     is_active: Optional[bool] = True
#     risk_score: Optional[float] = 0.0


# # for company-managed driver updates
# class CompanyDriverUpdate(BaseModel):
#     cnic: Optional[str] = None
#     full_name: Optional[str] = None
#     phone_number: Optional[str] = None
#     email: Optional[EmailStr] = None
#     license_number: Optional[str] = None
#     license_expiry: Optional[date] = None
#     date_of_birth: Optional[date] = None
#     age: Optional[int] = None
#     gender: Optional[str] = None
#     address: Optional[str] = None
#     city: Optional[str] = None
#     profile_image_url: Optional[str] = None
#     experience_years: Optional[int] = None
#     is_active: Optional[bool] = None
#     risk_score: Optional[float] = None
#     password: Optional[str] = None

# # ----------------------------------------------------------------------------
# #                         Drivers Sessions Pydantic Models
# #----------------------------------------------------------------------------

# #                   Base schema (common shared fields)
# class DriverSessionBase(BaseModel):
#     driver_id: UUID
#     cnic: str = Field(max_length=15)
#     company_id: Optional[UUID] = None
#     vehicle_id: Optional[UUID] = None
#     total_frames_processed: Optional[int] = 0
#     alert_frames: Optional[int] = 0
#     drowsy_frames: Optional[int] = 0
#     distracted_frames: Optional[int] = 0
#     average_confidence: Optional[float] = 0
#     attention_score: Optional[float] = 0
#     session_status: Optional[Literal['active', 'completed', 'interrupted', 'error']] = 'active'
#     termination_reason: Optional[str] = None


# # For creating a new session                            currently the endpoint using it -------->   (/driver/newsession/)

# class DriverSessionCreate(BaseModel):
#     start_time: datetime = Field(default_factory=lambda: datetime.now(KARACHI_TZ))
#     end_time: Optional[datetime] = None
#     session_status: Optional[str] = 'active'


# class DriverVehicleAssign(BaseModel):
#     driver_id: UUID
#     vehicle_id: UUID


# # For updating a session                               currently no endpoint is using it

# class DriverSessionUpdate(BaseModel):
#     end_time: Optional[datetime] = None
#     total_frames_processed: Optional[int] = None
#     alert_frames: Optional[int] = None
#     drowsy_frames: Optional[int] = None
#     distracted_frames: Optional[int] = None
#     average_confidence: Optional[float] = None
#     attention_score: Optional[float] = None
#     session_status: Optional[Literal['active', 'completed', 'interrupted', 'error']] = None
#     termination_reason: Optional[str] = None


# # For ending a session                                 currently the endpoint using it -------->   (/driver/endsession/)

# class DriverSessionEnd(BaseModel):
#     session_status: Literal['completed', 'interrupted', 'error'] = 'completed'
#     termination_reason: Optional[str] = None


# # For reading/returning session data                      currently every endpoint is using it as a response model

# class DriverSessionRead(DriverSessionBase):
#     session_id: UUID
#     start_time: datetime
#     end_time: Optional[datetime] = None
#     created_at: datetime
#     updated_at: datetime
    
#     model_config = ConfigDict(from_attributes=True)


# class DriverSessionEndResponse(BaseModel):
#     detail: str
#     session: Optional[DriverSessionRead] = None


# # Extended read with computed fields                    currently no endpoint is using it, it can be used in future to compute fileds

# class DriverSessionReadDetailed(DriverSessionRead):

#     total_duration_seconds: Optional[float] = None
#     drowsiness_percentage: Optional[float] = None
#     distraction_percentage: Optional[float] = None
#     alert_percentage: Optional[float] = None
    
#     @classmethod
#     def from_orm_with_stats(cls, db_session):
#         """Helper to compute statistics from DB session"""
#         data = {
#             "session_id": db_session.session_id,
#             "driver_id": db_session.driver_id,
#             "cnic": db_session.cnic,
#             "company_id": db_session.company_id,
#             "vehicle_id": db_session.vehicle_id,
#             "start_time": db_session.start_time,
#             "end_time": db_session.end_time,
#             "total_frames_processed": db_session.total_frames_processed,
#             "alert_frames": db_session.alert_frames,
#             "drowsy_frames": db_session.drowsy_frames,
#             "distracted_frames": db_session.distracted_frames,
#             "average_confidence": db_session.average_confidence,
#             "attention_score": db_session.attention_score,
#             "session_status": db_session.session_status,
#             "termination_reason": db_session.termination_reason,
#             "created_at": db_session.created_at,
#             "updated_at": db_session.updated_at,
#         }
        
#         # Compute duration in seconds
#         if db_session.end_time and db_session.start_time:
#             duration = db_session.end_time - db_session.start_time
#             data["total_duration_seconds"] = duration.total_seconds()
        
#         # Compute percentages
#         if db_session.total_frames_processed and db_session.total_frames_processed > 0:
#             total = db_session.total_frames_processed
#             data["drowsiness_percentage"] = (db_session.drowsy_frames / total) * 100
#             data["distraction_percentage"] = (db_session.distracted_frames / total) * 100
#             data["alert_percentage"] = (db_session.alert_frames / total) * 100
        
#         return cls(**data)
    
#     model_config = ConfigDict(from_attributes=True)


# class DriverEventCreate(BaseModel):
#     session_id: UUID
#     state: str
#     confidence: Optional[float] = Field(default=None, ge=0, le=1)
#     severity: Optional[str] = None
#     features: Optional[Dict[str, Any]] = None
#     occlusion_detected: Optional[bool] = False
#     occlusion_type: Optional[str] = None
#     face_visibility_score: Optional[float] = Field(default=None, ge=0, le=1)
#     frame_image_url: Optional[str] = None
#     timestamp: Optional[datetime] = None
#     alert_type: Optional[Literal['audio', 'visual', 'vibration', 'push_notification']] = 'audio'
#     alert_message: Optional[str] = None


# class DriverEventRead(BaseModel):
#     event_id: UUID
#     session_id: UUID
#     driver_id: UUID
#     company_id: Optional[UUID] = None
#     timestamp: datetime
#     state: str
#     confidence: Optional[float] = None
#     severity: Optional[str] = None
#     features: Optional[Dict[str, Any]] = None
#     occlusion_detected: bool
#     occlusion_type: Optional[str] = None
#     face_visibility_score: Optional[float] = None
#     frame_image_url: Optional[str] = None
#     created_at: datetime
#     alert_generated: bool = False
#     alert_id: Optional[UUID] = None

#     model_config = ConfigDict(from_attributes=True)


# class DriverAlertAckRequest(BaseModel):
#     alert_id: UUID


# class DriverSessionMetricsPatch(BaseModel):
#     session_id: UUID
#     total_frames_processed_increment: Optional[int] = Field(default=None, ge=0)
#     alert_frames_increment: Optional[int] = Field(default=None, ge=0)
#     drowsy_frames_increment: Optional[int] = Field(default=None, ge=0)
#     distracted_frames_increment: Optional[int] = Field(default=None, ge=0)
#     average_confidence: Optional[float] = Field(default=None, ge=0, le=1)
#     attention_score: Optional[float] = Field(default=None, ge=0)


# class CompanyAlertRead(BaseModel):
#     alert_id: UUID
#     event_id: UUID
#     session_id: UUID
#     driver_id: UUID
#     company_id: UUID
#     alert_type: str
#     alert_message: str
#     delivered: bool
#     acknowledged: bool
#     acknowledged_at: Optional[datetime] = None
#     response_time_seconds: Optional[float] = None
#     created_at: datetime
#     event_state: Optional[str] = None

#     model_config = ConfigDict(from_attributes=True)


# class CompanyAlertAckResponse(BaseModel):
#     alert_id: UUID
#     acknowledged: bool
#     acknowledged_at: Optional[datetime] = None
#     response_time_seconds: Optional[float] = None
#     message: str


# class DriverDashboardMetricsRead(BaseModel):
#     company_id: Optional[UUID] = None
#     driver_id: UUID
#     period_type: Literal['daily', 'weekly', 'monthly']
#     period_start: date
#     period_end: date
#     total_sessions: int
#     total_duration: Optional[timedelta] = None
#     total_events: int
#     drowsy_events: int
#     distracted_events: int
#     high_risk_events: int
#     total_alerts: int
#     average_attention_score: float
#     average_confidence: float
#     risk_score: float
#     risk_level: Literal['low', 'medium', 'high', 'critical']
#     last_updated: datetime

#     model_config = ConfigDict(from_attributes=True)


# class CompanyDashboardViewResponse(BaseModel):
#     company_id: Optional[UUID] = None
#     total_sessions: int = 0
#     total_duration: Optional[timedelta] = None
#     total_events: int = 0
#     drowsy_events: int = 0
#     distracted_events: int = 0
#     high_risk_events: int = 0
#     total_alerts: int = 0
#     average_attention_score: float = 0.0
#     average_confidence: float = 0.0
#     risk_score: float = 0.0
#     risk_level: Optional[str] = None
#     last_updated: Optional[datetime] = None

#     model_config = ConfigDict(from_attributes=True, extra='allow')


# class AdminDashboardViewResponse(BaseModel):
#     total_companies: int = 0
#     total_drivers: int = 0
#     total_sessions: int = 0
#     total_events: int = 0
#     drowsy_events: int = 0
#     distracted_events: int = 0
#     high_risk_events: int = 0
#     total_alerts: int = 0
#     average_attention_score: float = 0.0
#     average_confidence: float = 0.0
#     risk_score: float = 0.0
#     risk_level: Optional[str] = None
#     last_updated: Optional[datetime] = None

#     model_config = ConfigDict(from_attributes=True, extra='allow')



# # --------------------------------------------------------------------------
# #                           Companies pydantic models
# # --------------------------------------------------------------------------

# # currently being used in auth/main_1.py ---------> (/auth/company/login/)

# class Companylogin(BaseModel):
#     company_id: UUID
#     password: str

# class ForgotPasswordRequest(AppBaseModel):
#     email: EmailStr

# # model for creating a company (used by admin)
# class CompanyCreate(BaseModel):
#     company_name: str = Field(..., min_length=2, max_length=200)
#     company_type: Optional[str] = Field(None, max_length=50)
#     email: EmailStr
#     password: str = Field(..., min_length=6, max_length=128)
#     contact_number: Optional[str] = Field(None, max_length=20)
#     company_address: Optional[str] = Field(None, max_length=500)
#     city: Optional[str] = Field(None, max_length=100)
#     country: Optional[str] = Field(None, max_length=100)
#     subscription_plan: Optional[str] = Field(None, max_length=50)
#     subscription_status: Optional[str] = Field(None, max_length=50)
#     subscription_expiry: Optional[date] = None

#     model_config = ConfigDict(str_strip_whitespace=True)


# # company read model
# # currently being used in web_end.py    ------get_company endpoint--------

# # class CompanyRead(BaseModel):
# #     company_id: UUID
# #     company_name: str
# #     company_type: Optional[str] = None
# #     email: EmailStr
# #     # password:str
# #     contact_number: Optional[str] = None
# #     company_address: Optional[str] = None
# #     city: Optional[str] = None
# #     country: Optional[str] = None
# #     subscription_plan: Optional[str] = Field("basic", max_length=10)
# #     subscription_status: Optional[str] = Field("active", max_length=10)
# #     subscription_expiry: Optional[date] = None
# #     is_verified: Optional[bool] = False
# #     created_at: datetime
# #     updated_at: datetime
# #     last_active: Optional[datetime] = None

# #     class Config:
# #         orm_mode = True   # allows ORM → Pydantic conversion


# class CompanyResponse(BaseModel):
#     company_id: UUID
#     company_name: str
#     email: EmailStr
#     password: str
#     company_type: Optional[str]=None
#     contact_number: Optional[str]=None
#     company_address: Optional[str]=None
#     city: Optional[str]=None
#     country: Optional[str]=None
#     subscription_plan: str
#     subscription_status: str
#     subscription_expiry: Optional[date]=None
#     is_verified: bool
#     created_at: datetime
#     updated_at: datetime
#     last_active: Optional[datetime] = None

#     # industry: Optional[str]
#     # website: Optional[str]
#     # phone: Optional[str]
#     # address: Optional[str]
    
#     # Default fields that are set automatically
    
#     # is_active: bool
#     # created_at: datetime
#     # updated_at: datetime
    
#     model_config = ConfigDict(from_attributes=True)  

# class CompanyUpdate(AppBaseModel):
#     company_name: Optional[str] = Field(None, min_length=2, max_length=200)
#     email: Optional[EmailStr] = None
#     company_type: Optional[str] = None
#     contact_number: Optional[str] = None
#     company_address: Optional[str] = None
#     city: Optional[str] = None
#     country: Optional[str] = None
#     password: Optional[str] = None

# # driver read model for company
# # currently being used in web_end.py ------get_company_drivers endpoint--------

# class driver_read_company(BaseModel):
#     driver_id: UUID
#     # company_name: UUID
#     cnic: Annotated[str,Field(max_length=13,min_length=13,description="CNIC should not contain (-)",example="1234567890123")]
#     full_name: str
#     gender: Optional[str] = None
#     age: Optional[int] = None
#     date_of_birth: Optional[date] = None
#     city: Optional[str] = None
#     phone_number: Optional[str] = None
#     address: Optional[str] = None
#     email: Optional[EmailStr] = None
#     license_number: str
#     license_expiry: Optional[date] = None
#     risk_score: Optional[float] = 0.0
#     experience_years: Optional[int] = None
#     last_active: datetime
#     created_at: datetime
#     updated_at: datetime

#     model_config = ConfigDict(from_attributes=True)


# # currently being used in web_end.py ------get_all_sessions endpoint--------

# class driver_session_read_company(DriverSessionBase):
#     session_id: UUID
#     driver_name: str
#     start_time: datetime
#     end_time: Optional[datetime] = None
#     created_at: datetime
#     updated_at: datetime
    
#     model_config = ConfigDict(from_attributes=True)


# # ---------------------------------------------------------------------------
# #                           Vehicles pydantic models
# # ---------------------------------------------------------------------------

# # vehicles company read model for company
# # cuurrently being used in web_end.py ------get_company_vehicles endpoint--------

# class vehicle_read_company(BaseModel):
#     vehicle_id: UUID
#     company_id: UUID
#     vehicle_number: str
#     vehicle_type: Optional[str]=None
#     make: Optional[str] = None
#     model: Optional[str] = None
#     year: Optional[int] = None
#     is_active: Optional[bool] = True
#     created_at: datetime
#     updated_at: datetime
#     # last_active: datetime
    
#     model_config = ConfigDict(from_attributes=True)


# class VehicleCreateCompany(BaseModel):
#     vehicle_number: str
#     vehicle_type: Optional[str] = None
#     make: Optional[str] = None
#     model: Optional[str] = None
#     year: Optional[int] = None
#     is_active: Optional[bool] = True



# # ---------------------------------------
# #        Admin pydantic models
# # ---------------------------------------

# # admin loign
# class Adminlogin(BaseModel):
#     admin_id: UUID
#     password: str

# # admin read model
# # currently being used in admin_end.py   ------get_admin endpoint--------

# class AdminRead(BaseModel):
#     admin_id: UUID
#     cnic: Annotated[str,Field(max_length=13,min_length=13,description="CNIC should not contain (-)",example="1234567890123")]
#     username: str
#     password: str
#     full_name: str
#     # email: Optional[EmailStr] = None
#     email: EmailStr
#     # phone_number: Optional[str] = None
#     created_at: datetime
#     updated_at: datetime
#     last_active: datetime

#     model_config = ConfigDict(from_attributes=True)


# class AdminUpdate(AppBaseModel):
#     full_name: Optional[str] = None
#     username: Optional[str] = None
#     email: Optional[EmailStr] = None
#     cnic: Optional[Annotated[str, Field(min_length=13, max_length=13, pattern="^[0-9]{13}$")]] = None
#     password: Optional[str] = None


# # class driverbase(BaseModel):
# #     driver_id: int
# #     name: str
# #     email: str
# #     password: str
# #     phone: str
# #     address: str
# #     license: str
# #     vehicle: str
# #     vehicle_number: str
# #     vehicle_type: str
# #     vehicle_capacity: str
# #     vehicle_color: str
# #     vehicle_model: str
# #     vehicle_brand: str
# #     vehicle_image: str
# #     vehicle_document: str
# #     vehicle_document_image: str







# # #                                           Drivers Pydantic Models
# # #                               ---------------------------------------------------
# # #                                       Base schema (common shared fields)
# # #                                ---------------------------------------------------

# # class DriverBase(BaseModel):
# #     cnic: Annotated[str,Field(max_length=13,min_length=13,description="CNIC should not contain (-)",example="1234567890123")]
# #     full_name: str
# #     phone_number: Optional[str] = None
# #     email: Optional[EmailStr] = None
# #     license_number: str
# #     license_expiry: Optional[date] = None
# #     date_of_birth: Optional[date] = None
# #     age: Optional[int] = None
# #     gender: Optional[str] = None
# #     address: Optional[str] = None
# #     city: Optional[str] = None
# #     profile_image_url: Optional[str] = None
# #     experience_years: Optional[int] = None
# #     is_active: Optional[bool] = True
# #     risk_score: Optional[float] = 0.0
# #     # created_at: datetime
# #     # updated_at: datetime
# #     # last_active: datetime


# # # ---------------------------------------------------
# # # For creating a driver (exclude autogenerated fields)
# # # ---------------------------------------------------
# # class DriverCreate(DriverBase):
# #     # company_id: UUID
# #     password: str  # required for creation


# # class Driverlogin(BaseModel):
# #     driver_id: UUID
# #     password: str


# # # ---------------------------------------------------
# # # For reading/returning driver data
# # # ---------------------------------------------------
# # class DriverRead(DriverBase):
# #     driver_id: UUID
# #     # company_id: UUID
# #     created_at: datetime
# #     updated_at: datetime
# #     # last_active: Optional[datetime]
# #     last_active: datetime

# #     class Config:
# #         # from_attributes = True   # allows ORM → Pydantic conversion
# #         orm_mode = True   # allows ORM → Pydantic conversion


# # # for updating the driver

# # class DriverUpdate(BaseModel):
# #     cnic: Optional[str] = None
# #     full_name: Optional[str] = None
# #     phone_number: Optional[str] = None
# #     email: Optional[EmailStr] = None
# #     license_number: Optional[str] = None
# #     license_expiry: Optional[date] = None
# #     date_of_birth: Optional[date] = None
# #     age: Optional[int] = None
# #     gender: Optional[str] = None
# #     address: Optional[str] = None
# #     city: Optional[str] = None
# #     profile_image_url: Optional[str] = None
# #     experience_years: Optional[int] = None
# #     is_active: Optional[bool] = None
# #     risk_score: Optional[float] = None
# #     password: Optional[str] = None  # optional for update
# #     # company_id: Optional[UUID] = None




# # # ===================================================
# # # DRIVER SESSION PYDANTIC MODELS
# # # Add these to your existing schemas.py file
# # # ===================================================

# # # from pydantic import BaseModel, Field, ConfigDict
# # # from uuid import UUID
# # # from datetime import datetime
# # # from typing import Optional, Literal


# # # ---------------------------------------------------
# # # Base schema for DriverSession
# # # ---------------------------------------------------
# # class DriverSessionBase(BaseModel):
# #     driver_id: UUID
# #     cnic: str = Field(max_length=15)
# #     # company_id: UUID
# #     # vehicle_id: Optional[UUID] = None
    
# #     # Session metrics
# #     total_frames_processed: Optional[int] = 0
# #     alert_frames: Optional[int] = 0
# #     drowsy_frames: Optional[int] = 0
# #     distracted_frames: Optional[int] = 0
# #     average_confidence: Optional[float] = 0
# #     attention_score: Optional[float] = 0
    
# #     # Session status
# #     session_status: Optional[Literal['active', 'completed', 'interrupted', 'error']] = 'active'
# #     termination_reason: Optional[str] = None


# # # ---------------------------------------------------
# # # For creating a new session
# # # ---------------------------------------------------
# # class DriverSessionCreate(BaseModel):
# #     # driver_id: UUID
# #     # cnic: str = Field(max_length=13)
# #     # company_id: UUID
# #     # vehicle_id: Optional[UUID] = None
    
# #     # Optional: allow setting initial values if needed
# #     start_time: datetime = datetime.now()
# #     end_time: Optional[datetime] = None
# #     session_status: Optional[str] = 'active'


# # # ---------------------------------------------------
# # # For updating a session (metrics during session)
# # # ---------------------------------------------------
# # class DriverSessionUpdate(BaseModel):
# #     # vehicle_id: Optional[UUID] = None
# #     end_time: Optional[datetime] = None
    
# #     # Metrics that can be updated
# #     total_frames_processed: Optional[int] = None
# #     alert_frames: Optional[int] = None
# #     drowsy_frames: Optional[int] = None
# #     distracted_frames: Optional[int] = None
# #     average_confidence: Optional[float] = None
# #     attention_score: Optional[float] = None
    
# #     session_status: Optional[Literal['active', 'completed', 'interrupted', 'error']] = None
# #     termination_reason: Optional[str] = None


# # # ---------------------------------------------------
# # # For ending a session
# # # ---------------------------------------------------
# # class DriverSessionEnd(BaseModel):
# #     session_status: Literal['completed', 'interrupted', 'error'] = 'completed'
# #     termination_reason: Optional[str] = None


# # # ---------------------------------------------------
# # # For reading/returning session data
# # # ---------------------------------------------------
# # class DriverSessionRead(DriverSessionBase):
# #     session_id: UUID
# #     start_time: datetime
# #     end_time: Optional[datetime] = None
# #     created_at: datetime
# #     updated_at: datetime
    
# #     model_config = ConfigDict(from_attributes=True)


# # # ---------------------------------------------------
# # # Extended read with computed fields
# # # ---------------------------------------------------
# # class DriverSessionReadDetailed(DriverSessionRead):
# #     """Extended response with computed statistics"""
# #     total_duration_seconds: Optional[float] = None
# #     drowsiness_percentage: Optional[float] = None
# #     distraction_percentage: Optional[float] = None
# #     alert_percentage: Optional[float] = None
    
# #     @classmethod
# #     def from_orm_with_stats(cls, db_session):
# #         """Helper to compute statistics from DB session"""
# #         data = {
# #             "session_id": db_session.session_id,
# #             "driver_id": db_session.driver_id,
# #             "cnic": db_session.cnic,
# #             # "company_id": db_session.company_id,
# #             # "vehicle_id": db_session.vehicle_id,
# #             "start_time": db_session.start_time,
# #             "end_time": db_session.end_time,
# #             "total_frames_processed": db_session.total_frames_processed,
# #             "alert_frames": db_session.alert_frames,
# #             "drowsy_frames": db_session.drowsy_frames,
# #             "distracted_frames": db_session.distracted_frames,
# #             "average_confidence": db_session.average_confidence,
# #             "attention_score": db_session.attention_score,
# #             "session_status": db_session.session_status,
# #             "termination_reason": db_session.termination_reason,
# #             "created_at": db_session.created_at,
# #             "updated_at": db_session.updated_at,
# #         }
        
# #         # Compute duration in seconds
# #         if db_session.end_time and db_session.start_time:
# #             duration = db_session.end_time - db_session.start_time
# #             data["total_duration_seconds"] = duration.total_seconds()
        
# #         # Compute percentages
# #         if db_session.total_frames_processed and db_session.total_frames_processed > 0:
# #             total = db_session.total_frames_processed
# #             data["drowsiness_percentage"] = (db_session.drowsy_frames / total) * 100
# #             data["distraction_percentage"] = (db_session.distracted_frames / total) * 100
# #             data["alert_percentage"] = (db_session.alert_frames / total) * 100
        
# #         return cls(**data)
    
# #     model_config = ConfigDict(from_attributes=True)







# # class TodoBase(BaseModel):
# #     title: str
# #     description: str | None = None
# #     priority: int = 1

# # class TodoCreate(TodoBase):
# #     pass

# # class TodoResponse(TodoBase):
# #     id: int

# #     class Config:
# #         orm_mode = True  # allows returning SQLAlchemy objects directly

# lambda

from pydantic import BaseModel
from pydantic import BaseModel, EmailStr,Field,ConfigDict
from uuid import UUID
from datetime import date, datetime, timedelta
from typing import Optional,Annotated, Literal, Dict, Any
from ..authentication.auth import format_datetime_to_pst


class AppBaseModel(BaseModel):
    model_config = ConfigDict(json_encoders={datetime: format_datetime_to_pst})

# ----------------------------------------------------------------------------
#                         Drivers Pydantic Models
# ----------------------------------------------------------------------------
                              
#                   Base schema (common shared fields)

# so I have to add the optional thing in base model of driver base in comany id beacuse driver may not have company id
class DriverBase(BaseModel):
    cnic: Annotated[str,Field(max_length=13,min_length=13,description="CNIC should not contain (-)",example="1234567890123")]
    full_name: str
    phone_number: Optional[str] = None
    company_id: Optional[UUID] = None
    email: Optional[EmailStr] = None
    license_number: str
    license_expiry: Optional[date] = None
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    profile_image_url: Optional[str] = None
    experience_years: Optional[int] = None
    is_active: Optional[bool] = True
    risk_score: Optional[float] = 0.0


# For creating a driver                                   currently no endpoint is using it

class DriverCreate(DriverBase):
    password: str  


# For loggin in the driver                              currently endpoint using it -------->   (/auth/login/)

class Driverlogin(BaseModel):
    driver_id: str
    password: str


# For reading/returning driver data                    it is a response model for drivers (all endpoints are using it)

class DriverRead(DriverBase):
    driver_id: UUID
    assigned_vehicle_id: Optional[UUID] = None
    # company_id: UUID
    created_at: datetime
    updated_at: datetime
    last_active: datetime

    class Config:
        orm_mode = True   # allows ORM → Pydantic conversion


# for updating the driver                               currently endpoint using it -------->   (/driver/update/)

class DriverUpdate(BaseModel):
    cnic: Optional[str] = None
    full_name: Optional[str] = None
    company_id: Optional[UUID] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    profile_image_url: Optional[str] = None
    experience_years: Optional[int] = None
    is_active: Optional[bool] = None
    risk_score: Optional[float] = None
    password: Optional[str] = None


# for driver self-update (limited personal details only)
class DriverSelfUpdate(BaseModel):
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    profile_image_url: Optional[str] = None
    password: Optional[str] = None


# for company-managed driver creation
class CompanyDriverCreate(AppBaseModel):
    cnic: Annotated[str, Field(min_length=13, max_length=13, pattern="^[0-9]{13}$", description="CNIC should contain exactly 13 digits", example="1234567890123")]
    full_name: str
    password: str
    country_code: str = "+92"
    phone_number: Annotated[str, Field(pattern="^[0-9]{10}$")]
    email: Optional[EmailStr] = None
    license_number: str
    license_expiry: Optional[date] = None
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    gender: Optional[Literal["Male", "Female", "Other"]] = None
    address: Optional[str] = None
    city: str
    is_active: Optional[bool] = True


# for company-managed driver updates
class CompanyDriverUpdate(AppBaseModel):
    cnic: Optional[Annotated[str, Field(min_length=13, max_length=13, pattern="^[0-9]{13}$")]] = None
    full_name: Optional[str] = None
    country_code: Optional[str] = None
    phone_number: Optional[str] = Field(default=None, pattern="^[0-9]{10}$")
    email: Optional[EmailStr] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    gender: Optional[Literal["Male", "Female", "Other"]] = None
    address: Optional[str] = None
    city: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

# ----------------------------------------------------------------------------
#                         Drivers Sessions Pydantic Models
#----------------------------------------------------------------------------

#                   Base schema (common shared fields)
class DriverSessionBase(BaseModel):
    driver_id: UUID
    cnic: str = Field(max_length=15)
    company_id: Optional[UUID] = None
    vehicle_id: Optional[UUID] = None
    total_frames_processed: Optional[int] = 0
    alert_frames: Optional[int] = 0
    drowsy_frames: Optional[int] = 0
    distracted_frames: Optional[int] = 0
    average_confidence: Optional[float] = 0
    attention_score: Optional[float] = 0
    session_status: Optional[Literal['active', 'completed', 'interrupted', 'error']] = 'active'
    termination_reason: Optional[str] = None


# For creating a new session                            currently the endpoint using it -------->   (/driver/newsession/)

class DriverSessionCreate(BaseModel):
    start_time: datetime = datetime.now()
    end_time: Optional[datetime] = None
    session_status: Optional[str] = 'active'


class DriverVehicleAssign(BaseModel):
    driver_id: UUID
    vehicle_id: UUID


# For updating a session                               currently no endpoint is using it

class DriverSessionUpdate(BaseModel):
    end_time: Optional[datetime] = None
    total_frames_processed: Optional[int] = None
    alert_frames: Optional[int] = None
    drowsy_frames: Optional[int] = None
    distracted_frames: Optional[int] = None
    average_confidence: Optional[float] = None
    attention_score: Optional[float] = None
    session_status: Optional[Literal['active', 'completed', 'interrupted', 'error']] = None
    termination_reason: Optional[str] = None


# For ending a session                                 currently the endpoint using it -------->   (/driver/endsession/)

class DriverSessionEnd(BaseModel):
    session_status: Literal['completed', 'interrupted', 'error'] = 'completed'
    termination_reason: Optional[str] = None


# For reading/returning session data                      currently every endpoint is using it as a response model

class DriverSessionRead(DriverSessionBase):
    session_id: UUID
    start_time: datetime
    end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, json_encoders={datetime: format_datetime_to_pst})

class DriverSessionEndResponse(BaseModel):
    detail: str
    session: Optional[DriverSessionRead] = None

# Extended read with computed fields                    currently no endpoint is using it, it can be used in future to compute fileds

class DriverSessionReadDetailed(DriverSessionRead):

    total_duration_seconds: Optional[float] = None
    drowsiness_percentage: Optional[float] = None
    distraction_percentage: Optional[float] = None
    alert_percentage: Optional[float] = None
    
    @classmethod
    def from_orm_with_stats(cls, db_session):
        """Helper to compute statistics from DB session"""
        data = {
            "session_id": db_session.session_id,
            "driver_id": db_session.driver_id,
            "cnic": db_session.cnic,
            "company_id": db_session.company_id,
            "vehicle_id": db_session.vehicle_id,
            "start_time": db_session.start_time,
            "end_time": db_session.end_time,
            "total_frames_processed": db_session.total_frames_processed,
            "alert_frames": db_session.alert_frames,
            "drowsy_frames": db_session.drowsy_frames,
            "distracted_frames": db_session.distracted_frames,
            "average_confidence": db_session.average_confidence,
            "attention_score": db_session.attention_score,
            "session_status": db_session.session_status,
            "termination_reason": db_session.termination_reason,
            "created_at": db_session.created_at,
            "updated_at": db_session.updated_at,
        }
        
        # Compute duration in seconds
        if db_session.end_time and db_session.start_time:
            duration = db_session.end_time - db_session.start_time
            data["total_duration_seconds"] = duration.total_seconds()
        
        # Compute percentages
        if db_session.total_frames_processed and db_session.total_frames_processed > 0:
            total = db_session.total_frames_processed
            data["drowsiness_percentage"] = (db_session.drowsy_frames / total) * 100
            data["distraction_percentage"] = (db_session.distracted_frames / total) * 100
            data["alert_percentage"] = (db_session.alert_frames / total) * 100
        
        return cls(**data)
    
    model_config = ConfigDict(from_attributes=True, json_encoders={datetime: format_datetime_to_pst})


class DriverEventCreate(BaseModel):
    session_id: UUID
    state: str
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    severity: Optional[str] = None
    features: Optional[Dict[str, Any]] = None
    occlusion_detected: Optional[bool] = False
    occlusion_type: Optional[str] = None
    face_visibility_score: Optional[float] = Field(default=None, ge=0, le=1)
    frame_image_url: Optional[str] = None
    timestamp: Optional[datetime] = None
    alert_type: Optional[Literal['audio', 'visual', 'vibration', 'push_notification']] = 'audio'
    alert_message: Optional[str] = None


class DriverEventRead(BaseModel):
    event_id: UUID
    session_id: UUID
    driver_id: UUID
    driver_name: Optional[str] = None
    company_id: Optional[UUID] = None
    timestamp: datetime
    state: str
    confidence: Optional[float] = None
    severity: Optional[str] = None
    features: Optional[Dict[str, Any]] = None
    occlusion_detected: bool
    occlusion_type: Optional[str] = None
    face_visibility_score: Optional[float] = None
    frame_image_url: Optional[str] = None
    created_at: datetime
    alert_generated: Optional[bool] = False
    alert_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True, json_encoders={datetime: format_datetime_to_pst})


class DriverAlertAckRequest(BaseModel):
    alert_id: UUID


class DriverSessionMetricsPatch(BaseModel):
    session_id: UUID
    total_frames_processed_increment: Optional[int] = Field(default=None, ge=0)
    alert_frames_increment: Optional[int] = Field(default=None, ge=0)
    drowsy_frames_increment: Optional[int] = Field(default=None, ge=0)
    distracted_frames_increment: Optional[int] = Field(default=None, ge=0)
    average_confidence: Optional[float] = Field(default=None, ge=0, le=1)
    attention_score: Optional[float] = Field(default=None, ge=0)


class CompanyAlertRead(BaseModel):
    alert_id: UUID
    event_id: UUID
    session_id: UUID
    driver_id: UUID
    driver_name: Optional[str] = None
    company_id: UUID
    alert_type: str
    alert_message: str
    delivered: bool
    acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    response_time_seconds: Optional[float] = None
    created_at: datetime
    event_state: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, json_encoders={datetime: format_datetime_to_pst})


class CompanyAlertAckResponse(BaseModel):
    alert_id: UUID
    acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    response_time_seconds: Optional[float] = None
    message: str


class DriverDashboardMetricsRead(BaseModel):
    company_id: Optional[UUID] = None
    driver_id: UUID
    period_type: Literal['daily', 'weekly', 'monthly']
    period_start: date
    period_end: date
    total_sessions: int
    total_duration: Optional[timedelta] = None
    total_events: int
    drowsy_events: int
    distracted_events: int
    high_risk_events: int
    total_alerts: int
    average_attention_score: float
    average_confidence: float
    risk_score: float
    risk_level: Literal['low', 'medium', 'high', 'critical']
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={datetime: format_datetime_to_pst})


class CompanyDashboardViewResponse(BaseModel):
    company_id: Optional[UUID] = None
    total_sessions: int = 0
    total_duration: Optional[timedelta] = None
    total_events: int = 0
    drowsy_events: int = 0
    distracted_events: int = 0
    high_risk_events: int = 0
    total_alerts: int = 0
    average_attention_score: Optional[float] = 0.0
    average_confidence: float = 0.0
    risk_score: Optional[float] = 0.0
    risk_level: Optional[str] = None
    last_updated: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, extra='allow', json_encoders={datetime: format_datetime_to_pst})


class AdminDashboardViewResponse(BaseModel):
    total_companies: int = 0
    total_drivers: int = 0
    total_sessions: int = 0
    total_events: int = 0
    drowsy_events: int = 0
    distracted_events: int = 0
    high_risk_events: int = 0
    total_alerts: int = 0
    average_attention_score: float = 0.0
    average_confidence: float = 0.0
    risk_score: float = 0.0
    risk_level: Optional[str] = None
    last_updated: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, extra='allow', json_encoders={datetime: format_datetime_to_pst})



# --------------------------------------------------------------------------
#                           Companies pydantic models
# --------------------------------------------------------------------------

# currently being used in auth/main_1.py ---------> (/auth/company/login/)

class Companylogin(AppBaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(AppBaseModel):
    email: EmailStr


# model for creating a company (used by admin)
class CompanyCreate(AppBaseModel):
    company_name: str = Field(..., min_length=2, max_length=200)
    company_type: Optional[str] = Field(None, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    country_code: str = Field(default="+92", description="Select country code")
    contact_number: Annotated[str, Field(pattern="^[0-9]{10}$", description="10-digit number")]
    company_address: Optional[str] = Field(None, max_length=500)
    city: str = Field(..., max_length=100)
    country: str = Field(default="Pakistan", max_length=100)
    subscription_plan: Optional[Literal["basic", "premium"]] = Field(default="basic")
    subscription_status: Optional[Literal["active", "suspended"]] = Field(default="active")
    subscription_expiry: Optional[date] = None

    class Config:
        anystr_strip_whitespace = True


# company read model
# currently being used in web_end.py    ------get_company endpoint--------

# class CompanyRead(BaseModel):
#     company_id: UUID
#     company_name: str
#     company_type: Optional[str] = None
#     email: EmailStr
#     # password:str
#     contact_number: Optional[str] = None
#     company_address: Optional[str] = None
#     city: Optional[str] = None
#     country: Optional[str] = None
#     subscription_plan: Optional[str] = Field("basic", max_length=10)
#     subscription_status: Optional[str] = Field("active", max_length=10)
#     subscription_expiry: Optional[date] = None
#     is_verified: Optional[bool] = False
#     created_at: datetime
#     updated_at: datetime
#     last_active: Optional[datetime] = None

#     class Config:
#         orm_mode = True   # allows ORM → Pydantic conversion


class CompanyResponse(AppBaseModel):
    company_id: UUID
    company_name: str
    email: EmailStr
    password: str
    company_type: Optional[str]=None
    contact_number: Optional[str]=None
    company_address: Optional[str]=None
    city: Optional[str]=None
    country: Optional[str]=None
    subscription_plan: str
    subscription_status: str
    subscription_expiry: Optional[date]=None
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_active: Optional[datetime] = None

    # industry: Optional[str]
    # website: Optional[str]
    # phone: Optional[str]
    # address: Optional[str]
    
    # Default fields that are set automatically
    
    # is_active: bool
    # created_at: datetime
    # updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, json_encoders={datetime: format_datetime_to_pst})  


class CompanyUpdate(AppBaseModel):
    company_name: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    company_type: Optional[str] = None
    contact_number: Optional[str] = None
    company_address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    password: Optional[str] = None


# driver read model for company
# currently being used in web_end.py ------get_company_drivers endpoint--------

class driver_read_company(AppBaseModel):
    driver_id: UUID
    # company_name: UUID
    cnic: Annotated[str,Field(max_length=13,min_length=13,description="CNIC should not contain (-)",example="1234567890123")]
    full_name: str
    gender: Optional[str] = None
    age: Optional[int] = None
    date_of_birth: Optional[date] = None
    city: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    license_number: str
    license_expiry: Optional[date] = None
    risk_score: Optional[float] = 0.0
    experience_years: Optional[int] = None
    last_active: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True   # allows ORM → Pydantic conversion


# currently being used in web_end.py ------get_all_sessions endpoint--------

class driver_session_read_company(DriverSessionBase):
    session_id: UUID
    driver_name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, json_encoders={datetime: format_datetime_to_pst})


# ---------------------------------------------------------------------------
#                           Vehicles pydantic models
# ---------------------------------------------------------------------------

# vehicles company read model for company
# cuurrently being used in web_end.py ------get_company_vehicles endpoint--------

class vehicle_read_company(AppBaseModel):
    vehicle_id: UUID
    company_id: UUID
    vehicle_number: str
    vehicle_type: Optional[str]=None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    is_active: Optional[bool] = True
    created_at: datetime
    updated_at: datetime
    # last_active: datetime
    
    class Config:
        orm_mode = True   # allows ORM → Pydantic conversion


class VehicleCreateCompany(BaseModel):
    vehicle_number: str
    vehicle_type: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    is_active: Optional[bool] = True



# ---------------------------------------
#        Admin pydantic models
# ---------------------------------------

# admin loign
class Adminlogin(AppBaseModel):
    email: EmailStr
    password: str

# admin read model
# currently being used in admin_end.py   ------get_admin endpoint--------

class AdminRead(AppBaseModel):
    admin_id: UUID
    cnic: Annotated[str,Field(max_length=13,min_length=13,description="CNIC should not contain (-)",example="1234567890123")]
    username: str
    password: str
    full_name: str
    # email: Optional[EmailStr] = None
    email: EmailStr
    # phone_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_active: datetime

    class Config:
        orm_mode = True   # allows ORM → Pydantic conversion


class AdminUpdate(AppBaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    cnic: Optional[Annotated[str, Field(min_length=13, max_length=13, pattern="^[0-9]{13}$")]] = None
    password: Optional[str] = None




# class driverbase(BaseModel):
#     driver_id: int
#     name: str
#     email: str
#     password: str
#     phone: str
#     address: str
#     license: str
#     vehicle: str
#     vehicle_number: str
#     vehicle_type: str
#     vehicle_capacity: str
#     vehicle_color: str
#     vehicle_model: str
#     vehicle_brand: str
#     vehicle_image: str
#     vehicle_document: str
#     vehicle_document_image: str







# #                                           Drivers Pydantic Models
# #                               ---------------------------------------------------
# #                                       Base schema (common shared fields)
# #                                ---------------------------------------------------

# class DriverBase(BaseModel):
#     cnic: Annotated[str,Field(max_length=13,min_length=13,description="CNIC should not contain (-)",example="1234567890123")]
#     full_name: str
#     phone_number: Optional[str] = None
#     email: Optional[EmailStr] = None
#     license_number: str
#     license_expiry: Optional[date] = None
#     date_of_birth: Optional[date] = None
#     age: Optional[int] = None
#     gender: Optional[str] = None
#     address: Optional[str] = None
#     city: Optional[str] = None
#     profile_image_url: Optional[str] = None
#     experience_years: Optional[int] = None
#     is_active: Optional[bool] = True
#     risk_score: Optional[float] = 0.0
#     # created_at: datetime
#     # updated_at: datetime
#     # last_active: datetime


# # ---------------------------------------------------
# # For creating a driver (exclude autogenerated fields)
# # ---------------------------------------------------
# class DriverCreate(DriverBase):
#     # company_id: UUID
#     password: str  # required for creation


# class Driverlogin(BaseModel):
#     driver_id: UUID
#     password: str


# # ---------------------------------------------------
# # For reading/returning driver data
# # ---------------------------------------------------
# class DriverRead(DriverBase):
#     driver_id: UUID
#     # company_id: UUID
#     created_at: datetime
#     updated_at: datetime
#     # last_active: Optional[datetime]
#     last_active: datetime

#     class Config:
#         # from_attributes = True   # allows ORM → Pydantic conversion
#         orm_mode = True   # allows ORM → Pydantic conversion


# # for updating the driver

# class DriverUpdate(BaseModel):
#     cnic: Optional[str] = None
#     full_name: Optional[str] = None
#     phone_number: Optional[str] = None
#     email: Optional[EmailStr] = None
#     license_number: Optional[str] = None
#     license_expiry: Optional[date] = None
#     date_of_birth: Optional[date] = None
#     age: Optional[int] = None
#     gender: Optional[str] = None
#     address: Optional[str] = None
#     city: Optional[str] = None
#     profile_image_url: Optional[str] = None
#     experience_years: Optional[int] = None
#     is_active: Optional[bool] = None
#     risk_score: Optional[float] = None
#     password: Optional[str] = None  # optional for update
#     # company_id: Optional[UUID] = None




# # ===================================================
# # DRIVER SESSION PYDANTIC MODELS
# # Add these to your existing schemas.py file
# # ===================================================

# # from pydantic import BaseModel, Field, ConfigDict
# # from uuid import UUID
# # from datetime import datetime
# # from typing import Optional, Literal


# # ---------------------------------------------------
# # Base schema for DriverSession
# # ---------------------------------------------------
# class DriverSessionBase(BaseModel):
#     driver_id: UUID
#     cnic: str = Field(max_length=15)
#     # company_id: UUID
#     # vehicle_id: Optional[UUID] = None
    
#     # Session metrics
#     total_frames_processed: Optional[int] = 0
#     alert_frames: Optional[int] = 0
#     drowsy_frames: Optional[int] = 0
#     distracted_frames: Optional[int] = 0
#     average_confidence: Optional[float] = 0
#     attention_score: Optional[float] = 0
    
#     # Session status
#     session_status: Optional[Literal['active', 'completed', 'interrupted', 'error']] = 'active'
#     termination_reason: Optional[str] = None


# # ---------------------------------------------------
# # For creating a new session
# # ---------------------------------------------------
# class DriverSessionCreate(BaseModel):
#     # driver_id: UUID
#     # cnic: str = Field(max_length=13)
#     # company_id: UUID
#     # vehicle_id: Optional[UUID] = None
    
#     # Optional: allow setting initial values if needed
#     start_time: datetime = datetime.now()
#     end_time: Optional[datetime] = None
#     session_status: Optional[str] = 'active'


# # ---------------------------------------------------
# # For updating a session (metrics during session)
# # ---------------------------------------------------
# class DriverSessionUpdate(BaseModel):
#     # vehicle_id: Optional[UUID] = None
#     end_time: Optional[datetime] = None
    
#     # Metrics that can be updated
#     total_frames_processed: Optional[int] = None
#     alert_frames: Optional[int] = None
#     drowsy_frames: Optional[int] = None
#     distracted_frames: Optional[int] = None
#     average_confidence: Optional[float] = None
#     attention_score: Optional[float] = None
    
#     session_status: Optional[Literal['active', 'completed', 'interrupted', 'error']] = None
#     termination_reason: Optional[str] = None


# # ---------------------------------------------------
# # For ending a session
# # ---------------------------------------------------
# class DriverSessionEnd(BaseModel):
#     session_status: Literal['completed', 'interrupted', 'error'] = 'completed'
#     termination_reason: Optional[str] = None


# # ---------------------------------------------------
# # For reading/returning session data
# # ---------------------------------------------------
# class DriverSessionRead(DriverSessionBase):
#     session_id: UUID
#     start_time: datetime
#     end_time: Optional[datetime] = None
#     created_at: datetime
#     updated_at: datetime
    
#     model_config = ConfigDict(from_attributes=True)


# # ---------------------------------------------------
# # Extended read with computed fields
# # ---------------------------------------------------
# class DriverSessionReadDetailed(DriverSessionRead):
#     """Extended response with computed statistics"""
#     total_duration_seconds: Optional[float] = None
#     drowsiness_percentage: Optional[float] = None
#     distraction_percentage: Optional[float] = None
#     alert_percentage: Optional[float] = None
    
#     @classmethod
#     def from_orm_with_stats(cls, db_session):
#         """Helper to compute statistics from DB session"""
#         data = {
#             "session_id": db_session.session_id,
#             "driver_id": db_session.driver_id,
#             "cnic": db_session.cnic,
#             # "company_id": db_session.company_id,
#             # "vehicle_id": db_session.vehicle_id,
#             "start_time": db_session.start_time,
#             "end_time": db_session.end_time,
#             "total_frames_processed": db_session.total_frames_processed,
#             "alert_frames": db_session.alert_frames,
#             "drowsy_frames": db_session.drowsy_frames,
#             "distracted_frames": db_session.distracted_frames,
#             "average_confidence": db_session.average_confidence,
#             "attention_score": db_session.attention_score,
#             "session_status": db_session.session_status,
#             "termination_reason": db_session.termination_reason,
#             "created_at": db_session.created_at,
#             "updated_at": db_session.updated_at,
#         }
        
#         # Compute duration in seconds
#         if db_session.end_time and db_session.start_time:
#             duration = db_session.end_time - db_session.start_time
#             data["total_duration_seconds"] = duration.total_seconds()
        
#         # Compute percentages
#         if db_session.total_frames_processed and db_session.total_frames_processed > 0:
#             total = db_session.total_frames_processed
#             data["drowsiness_percentage"] = (db_session.drowsy_frames / total) * 100
#             data["distraction_percentage"] = (db_session.distracted_frames / total) * 100
#             data["alert_percentage"] = (db_session.alert_frames / total) * 100
        
#         return cls(**data)
    
#     model_config = ConfigDict(from_attributes=True)







# class TodoBase(BaseModel):
#     title: str
#     description: str | None = None
#     priority: int = 1

# class TodoCreate(TodoBase):
#     pass

# class TodoResponse(TodoBase):
#     id: int

#     class Config:
#         orm_mode = True  # allows returning SQLAlchemy objects directly



