from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class BufferedVitalReading(BaseModel):
    client_sequence_id: str
    patient_id: str
    device_id: str
    heart_rate: float
    oxygen_saturation: float
    body_temperature: float
    blood_pressure_systolic: float
    blood_pressure_diastolic: float
    respiratory_rate: float
    glucose_level: Optional[float] = None
    sensor_connected: bool = True
    recorded_at: datetime
    client_retry_count: int = 0

class BatchBufferSyncRequest(BaseModel):
    device_id: str
    batch_id: str
    readings: List[BufferedVitalReading]
    device_firmware_version: Optional[str] = "v2.4-telemetry"

class SyncResult(BaseModel):
    batch_id: str
    total_received: int
    new_ingested: int
    duplicates_rejected: int
    delayed_flagged: int
    stale_sensors_detected: int
    synced_at: datetime = Field(default_factory=datetime.utcnow)

class StaleSensorAlert(BaseModel):
    device_id: str
    patient_id: str
    last_ping: datetime
    seconds_silent: float
    status: str = "stale"  # stale, offline

class SystemHealthSnapshot(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    uptime_seconds: float
    database_connected: bool
    database_type: str
    websocket_active_clients: int
    buffered_packets_count: int
    duplicates_prevented_total: int
    stale_devices_count: int
    average_api_latency_ms: float
    cpu_percent: float
    memory_mb: float

