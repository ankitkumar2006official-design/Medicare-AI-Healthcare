from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models import DeviceStatus

class DeviceBase(BaseModel):
    device_id: str
    device_type: str = "Multi-Vital Bedside Monitor"
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    status: DeviceStatus = DeviceStatus.ONLINE
    battery_level: float = 98.0
    firmware_version: str = "v3.2.1-mguard"
    sampling_rate_hz: float = 0.5
    last_ping: datetime = Field(default_factory=datetime.utcnow)
    connection_details: Dict[str, Any] = Field(default_factory=lambda: {"protocol": "WebSocket/TLS", "rssi": -42})

class DeviceCreate(DeviceBase):
    pass

class DeviceStatusUpdate(BaseModel):
    status: DeviceStatus
    battery_level: Optional[float] = None
    error_message: Optional[str] = None

class DeviceResponse(DeviceBase):
    id: str
    created_at: datetime
    updated_at: datetime
