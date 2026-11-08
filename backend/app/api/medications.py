from datetime import datetime
from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_collection
from app.auth import get_current_user, require_roles, log_audit_event
from app.models import UserRole
from app.models.medication import MedicationCreate, MedicationResponse

router = APIRouter(prefix="/api/medications", tags=["Medications & Reminders"])

@router.get("/{patient_id}", response_model=List[MedicationResponse])
async def get_patient_medications(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    med_col = get_collection("medications")
    docs = await med_col.find({"patient_id": patient_id}).to_list()
    for d in docs:
        d["id"] = str(d.get("_id", ""))
    return [MedicationResponse(**d) for d in docs]

@router.post("", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def create_medication_schedule(
    med_in: MedicationCreate,
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR]))
):
    med_col = get_collection("medications")
    doc = med_in.model_dump()
    doc["_id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    doc["last_administered_at"] = None
    doc["last_administered_by"] = None

    await med_col.insert_one(doc)
    doc["id"] = doc["_id"]

    await log_audit_event(current_user["id"], "medication_scheduled", "medications", doc["id"])
    return MedicationResponse(**doc)

@router.put("/{med_id}/administer", response_model=MedicationResponse)
async def record_medication_administration(
    med_id: str,
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER]))
):
    med_col = get_collection("medications")
    med = await med_col.find_one({"_id": med_id})
    if not med:
        raise HTTPException(status_code=404, detail="Medication record not found.")

    patch = {
        "last_administered_at": datetime.utcnow(),
        "last_administered_by": current_user.get("full_name", "Caregiver"),
        "updated_at": datetime.utcnow()
    }
    await med_col.update_one({"_id": med_id}, {"$set": patch})
    updated = await med_col.find_one({"_id": med_id})
    updated["id"] = str(updated.get("_id", ""))

    await log_audit_event(current_user["id"], "medication_administered", "medications", med_id)
    return MedicationResponse(**updated)

