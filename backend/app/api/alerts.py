from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_collection
from app.auth import get_current_user, require_roles, log_audit_event
from app.models import UserRole
from app.models.alert import (
    AlertResponse,
    AlertAcknowledgeRequest,
    AlertEscalateRequest,
    AlertResolveRequest
)
from app.services.alert_service import alert_service

router = APIRouter(prefix="/api/alerts", tags=["Alert Management"])

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    patient_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    alert_col = get_collection("alerts")
    query = {}
    if patient_id:
        query["patient_id"] = patient_id
    if severity:
        query["severity"] = severity.lower()
    if status_filter:
        query["status"] = status_filter.lower()

    # Patient role restriction
    if current_user.get("role") == UserRole.PATIENT.value:
        assigned = current_user.get("assigned_patient_ids", [])
        user_pid = current_user.get("patient_id")
        pids = list(set(assigned + ([user_pid] if user_pid else [])))
        query["patient_id"] = {"$in": pids}

    docs = await alert_col.find(query).sort("created_at", -1).limit(limit).to_list()
    for d in docs:
        d["id"] = str(d.get("_id", ""))

    return [AlertResponse(**d) for d in docs]

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    alert_col = get_collection("alerts")
    alert = await alert_col.find_one({"_id": alert_id})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert["id"] = str(alert.get("_id", ""))
    return AlertResponse(**alert)

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: str,
    req: AlertAcknowledgeRequest,
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER]))
):
    updated = await alert_service.acknowledge_alert(
        alert_id=alert_id,
        user_id=current_user["id"],
        user_name=current_user.get("full_name", "Staff Member"),
        note=req.note
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found.")

    await log_audit_event(current_user["id"], "alert_acknowledged", "alerts", alert_id, {"note": req.note})
    return AlertResponse(**updated)

@router.post("/{alert_id}/escalate", response_model=AlertResponse)
async def escalate_alert(
    alert_id: str,
    req: AlertEscalateRequest,
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER]))
):
    updated = await alert_service.escalate_alert(
        alert_id=alert_id,
        user_id=current_user["id"],
        user_name=current_user.get("full_name", "Staff Member"),
        urgent_reason=req.urgent_reason,
        doctor_id=req.doctor_id
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found.")

    await log_audit_event(current_user["id"], "alert_escalated", "alerts", alert_id, {"reason": req.urgent_reason})
    return AlertResponse(**updated)

@router.post("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: str,
    req: AlertResolveRequest,
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER]))
):
    updated = await alert_service.resolve_alert(
        alert_id=alert_id,
        user_id=current_user["id"],
        user_name=current_user.get("full_name", "Staff Member"),
        resolution_note=req.resolution_note
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found.")

    await log_audit_event(current_user["id"], "alert_resolved", "alerts", alert_id, {"resolution": req.resolution_note})
    return AlertResponse(**updated)

