from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field

class MedicationBase(BaseModel):
    patient_id: str
    name: str
    dosage: str
    frequency: str
    scheduled_times: List[str] = Field(default_factory=lambda: ["08:00", "20:00"])
    route: str = "Oral"
    start_date: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    end_date: Optional[str] = None
    prescribed_by: Optional[str] = "Dr. Sarah Chen, MD"
    reminder_status: str = "active" # active, paused, completed
    instructions: Optional[str] = "Take with food and a full glass of water"

class MedicationCreate(MedicationBase):
    pass

class MedicationResponse(MedicationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    last_administered_at: Optional[datetime] = None
    last_administered_by: Optional[str] = None

