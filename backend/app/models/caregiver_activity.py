from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class CaregiverActivityCreate(BaseModel):
    caregiver_id: Optional[str] = None
    patient_id: str
    activity_type: str = "bedside_visit"  # bedside_visit, vitals_check, alert_acknowledged, medication_administered, emergency_assist
    duration_minutes: int = 15
    clinical_observations: Optional[str] = None
    description: Optional[str] = None
    outcome_status: str = "completed"  # completed, escalated, pending_review
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class CaregiverActivityRecord(BaseModel):
    id: str
    caregiver_id: str
    caregiver_name: str
    patient_id: str
    patient_name: str
    activity_type: str
    duration_minutes: int = 15
    clinical_observations: Optional[str] = None
    description: Optional[str] = None
    outcome_status: str = "completed"
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
