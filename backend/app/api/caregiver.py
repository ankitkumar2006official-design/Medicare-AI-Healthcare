from datetime import datetime
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_collection
from app.auth import get_current_user, require_roles, log_audit_event
from app.models import UserRole
from app.models.caregiver import CaregiverResponseCreate, CaregiverResponseModel
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/responses", tags=["Caregiver Response Management"])

@router.post("", response_model=CaregiverResponseModel, status_code=status.HTTP_201_CREATED)
async def create_caregiver_response(
    req: CaregiverResponseCreate,
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER]))
):
    resp_col = get_collection("caregiver_responses")
    doc = req.model_dump()
    doc["_id"] = str(uuid.uuid4())
    doc["caregiver_id"] = current_user["id"]
    doc["caregiver_name"] = current_user.get("full_name", "Caregiver")
    doc["timestamp"] = datetime.utcnow()

    await resp_col.insert_one(doc)
    doc["id"] = doc["_id"]

    # Broadcast event
    await ws_manager.broadcast_event("caregiver_response_created", doc, req.patient_id)
    await log_audit_event(
        current_user["id"],
        "caregiver_response_logged",
        "caregiver_responses",
        doc["id"],
        {"patient_id": req.patient_id, "action_type": req.action_type}
    )

    return CaregiverResponseModel(**doc)

@router.get("/{patient_id}", response_model=List[CaregiverResponseModel])
async def get_patient_caregiver_responses(
    patient_id: str,
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    resp_col = get_collection("caregiver_responses")
    docs = await resp_col.find({"patient_id": patient_id})\
        .sort("timestamp", -1)\
        .limit(limit)\
        .to_list()

    for d in docs:
        d["id"] = str(d.get("_id", ""))

    return [CaregiverResponseModel(**d) for d in docs]

@router.get("", response_model=List[CaregiverResponseModel])
async def get_all_caregiver_responses(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER]))
):
    resp_col = get_collection("caregiver_responses")
    docs = await resp_col.find().sort("timestamp", -1).limit(limit).to_list()

    for d in docs:
        d["id"] = str(d.get("_id", ""))

    return [CaregiverResponseModel(**d) for d in docs]
