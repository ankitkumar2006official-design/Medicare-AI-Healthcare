from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BaselineVitals(BaseModel):
    heart_rate_min: float = 60.0
    heart_rate_max: float = 100.0
    spo2_min: float = 95.0
    temp_min: float = 36.1
    temp_max: float = 37.2
    bp_sys_min: float = 90.0
    bp_sys_max: float = 120.0
    bp_dia_min: float = 60.0
    bp_dia_max: float = 80.0
    resp_rate_min: float = 12.0
    resp_rate_max: float = 20.0
    glucose_min: float = 70.0
    glucose_max: float = 140.0

class PatientBase(BaseModel):
    patient_id: str
    full_name: str
    age: int
    gender: str
    room_number: Optional[str] = "Ward A-101"
    medical_history: List[str] = Field(default_factory=list)
    existing_conditions: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    emergency_contact: Dict[str, str] = Field(
        default_factory=lambda: {"name": "Contact", "phone": "555-0199", "relation": "Family"}
    )
    assigned_doctor_id: Optional[str] = None
    assigned_caregiver_id: Optional[str] = None
    baseline_vitals: BaselineVitals = Field(default_factory=BaselineVitals)
    is_monitored: bool = True
    active_scenario: Optional[str] = "healthy"

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    room_number: Optional[str] = None
    medical_history: Optional[List[str]] = None
    existing_conditions: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    emergency_contact: Optional[Dict[str, str]] = None
    assigned_doctor_id: Optional[str] = None
    assigned_caregiver_id: Optional[str] = None
    baseline_vitals: Optional[BaselineVitals] = None
    is_monitored: Optional[bool] = None
    active_scenario: Optional[str] = None

class PatientResponse(PatientBase):
    id: str
    created_at: datetime
    updated_at: datetime
    latest_vitals: Optional[Dict[str, Any]] = None
    latest_risk: Optional[Dict[str, Any]] = None
    active_alerts_count: int = 0

