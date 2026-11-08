from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class VitalReadingBase(BaseModel):
    patient_id: str
    device_id: Optional[str] = "SENSOR-SIM-01"
    heart_rate: float = Field(..., description="Beats per minute")
    oxygen_saturation: float = Field(..., description="SpO2 percentage (0-100)")
    body_temperature: float = Field(..., description="Celsius")
    blood_pressure_systolic: float = Field(..., description="mmHg")
    blood_pressure_diastolic: float = Field(..., description="mmHg")
    respiratory_rate: float = Field(..., description="Breaths per minute")
    glucose_level: Optional[float] = Field(None, description="mg/dL")
    sensor_connected: bool = True
    signal_quality: float = Field(default=1.0, ge=0.0, le=1.0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class VitalReadingCreate(VitalReadingBase):
    pass

class VitalReadingResponse(VitalReadingBase):
    id: str

