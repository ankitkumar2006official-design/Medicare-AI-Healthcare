from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CaregiverActionType(str):
    ACKNOWLEDGED = "acknowledged"
    OBSERVATION_RECORDED = "observation_recorded"
    CONTACTED_PATIENT = "contacted_patient"
    MEDICATION_GIVEN = "medication_given"
    ESCALATED_TO_DOCTOR = "escalated_to_doctor"
    EMERGENCY_SERVICES_CALLED = "emergency_services_called"
    RESOLVED = "resolved"

class CaregiverResponseCreate(BaseModel):
    alert_id: Optional[str] = None
    patient_id: str
    action_type: str = "observation_recorded"
    observation: str
    patient_contacted: bool = False
    vitals_rechecked: bool = False
    escalated: bool = False
    notes: Optional[str] = None

class CaregiverResponseModel(CaregiverResponseCreate):
    id: str
    caregiver_id: str
    caregiver_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
