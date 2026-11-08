from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from app.models import AlertSeverity, AlertStatus

class AlertBase(BaseModel):
    patient_id: str
    patient_name: str
    severity: AlertSeverity
    status: AlertStatus = AlertStatus.TRIGGERED
    trigger_vital: str
    triggering_readings: Dict[str, Any] = Field(default_factory=dict)
    reason: str
    recommended_action: str
    escalation_count: int = 0
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    notes: List[Dict[str, Any]] = Field(default_factory=list)
    # Caregiver Assignment, Delivery Tracking & Escalation Audit
    assigned_caregiver_id: Optional[str] = None
    assigned_caregiver_name: Optional[str] = None
    assigned_doctor_id: Optional[str] = None
    delivery_status: str = "delivered"
    delivered_at: Optional[datetime] = None
    ack_deadline: Optional[datetime] = None
    response_time_seconds: Optional[float] = None
    audit_trail: List[Dict[str, Any]] = Field(default_factory=list)
    fallback_escalation_workflow: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AlertCreate(BaseModel):
    patient_id: str
    severity: AlertSeverity
    trigger_vital: str
    triggering_readings: Dict[str, Any]
    reason: str
    recommended_action: str

class AlertAcknowledgeRequest(BaseModel):
    note: Optional[str] = "Alert acknowledged by caregiver"

class AlertEscalateRequest(BaseModel):
    doctor_id: Optional[str] = None
    urgent_reason: str = "Patient condition deteriorating, doctor review required"

class AlertResolveRequest(BaseModel):
    resolution_note: str = "Patient vitals stabilized, observation recorded"

class AlertResponse(AlertBase):
    id: str

