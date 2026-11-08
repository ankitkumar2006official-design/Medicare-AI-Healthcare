from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class GPSLocation(BaseModel):
    latitude: float = 37.7749
    longitude: float = -122.4194
    accuracy_meters: float = 5.0
    location_name: Optional[str] = "Ward Patient Residence"
    address_label: Optional[str] = "Ward Patient Residence"
    within_geofence: bool = True

class AttendanceCheckIn(BaseModel):
    caregiver_id: Optional[str] = None
    patient_id: Optional[str] = None
    gps_location: Optional[GPSLocation] = None
    location: Optional[Dict[str, Any]] = None
    shift_type: str = "day"
    notes: Optional[str] = None

class AttendanceCheckOut(BaseModel):
    attendance_id: str
    gps_location: Optional[GPSLocation] = None
    location: Optional[Dict[str, Any]] = None
    handover_notes: Optional[str] = None
    notes: Optional[str] = None

class CaregiverAttendanceRecord(BaseModel):
    id: str
    caregiver_id: str
    caregiver_name: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    shift_type: str = "day"
    status: str = "checked_in"  # "checked_in", "checked_out", "missed"
    check_in_gps: Optional[GPSLocation] = None
    check_in_location: Optional[Dict[str, Any]] = None
    check_out_gps: Optional[GPSLocation] = None
    check_out_location: Optional[Dict[str, Any]] = None
    duration_minutes: Optional[float] = None
    handover_notes: Optional[str] = None
    notes: Optional[str] = None
    is_missed_or_late: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
