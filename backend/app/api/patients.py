from datetime import datetime
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_collection
from app.auth import get_current_user, require_roles, verify_patient_access, log_audit_event
from app.models import UserRole
from app.models.patient import PatientCreate, PatientUpdate, PatientResponse
from app.services.digital_twin import digital_twin_service

router = APIRouter(prefix="/api/patients", tags=["Patients"])

@router.get("", response_model=List[PatientResponse])
async def get_patients(
    search: Optional[str] = Query(None, description="Search by name, room, or ID"),
    risk_category: Optional[str] = Query(None, description="Filter by risk level"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    patient_col = get_collection("patients")
    alert_col = get_collection("alerts")

    query = {}
    # RBAC check: Patient can only list themselves
    if current_user.get("role") == UserRole.PATIENT.value:
        assigned = current_user.get("assigned_patient_ids", [])
        user_pid = current_user.get("patient_id")
        pids = list(set(assigned + ([user_pid] if user_pid else [])))
        query["patient_id"] = {"$in": pids}

    if search:
        query["$or"] = [
            {"full_name": {"$regex": search}},
            {"patient_id": {"$regex": search}},
            {"room_number": {"$regex": search}}
        ]

    cursor = patient_col.find(query).skip(skip).limit(limit)
    patients = await cursor.to_list()

    results = []
    for p in patients:
        p["id"] = str(p.get("_id", p.get("patient_id")))
        # Count active alerts
        active_cnt = await alert_col.count_documents({
            "patient_id": p["patient_id"],
            "status": {"$in": ["triggered", "acknowledged", "escalated"]}
        })
        p["active_alerts_count"] = active_cnt

        if risk_category:
            latest_risk = p.get("latest_risk", {})
            if latest_risk.get("risk_category") != risk_category.lower():
                continue

        results.append(PatientResponse(**p))

    return results

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_in: PatientCreate,
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR]))
):
    patient_col = get_collection("patients")
    existing = await patient_col.find_one({"patient_id": patient_in.patient_id})
    if existing:
        raise HTTPException(status_code=400, detail="Patient with this Patient ID already exists.")

    p_dict = patient_in.model_dump()
    p_dict["_id"] = str(uuid.uuid4())
    p_dict["created_at"] = datetime.utcnow()
    p_dict["updated_at"] = datetime.utcnow()
    p_dict["latest_vitals"] = None
    p_dict["latest_risk"] = None

    await patient_col.insert_one(p_dict)
    p_dict["id"] = p_dict["_id"]
    p_dict["active_alerts_count"] = 0

    await log_audit_event(current_user["id"], "patient_created", "patients", p_dict["patient_id"])
    return PatientResponse(**p_dict)

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient_details(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    authorized = await verify_patient_access(current_user, patient_id)
    if not authorized:
        raise HTTPException(status_code=403, detail="Unauthorized access to this patient record.")

    patient_col = get_collection("patients")
    alert_col = get_collection("alerts")
    p = await patient_col.find_one({"patient_id": patient_id})
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found.")

    p["id"] = str(p.get("_id", p.get("patient_id")))
    p["active_alerts_count"] = await alert_col.count_documents({
        "patient_id": patient_id,
        "status": {"$in": ["triggered", "acknowledged", "escalated"]}
    })
    return PatientResponse(**p)

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    update_data: PatientUpdate,
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR]))
):
    patient_col = get_collection("patients")
    p = await patient_col.find_one({"patient_id": patient_id})
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found.")

    patch = {k: v for k, v in update_data.model_dump(exclude_unset=True).items()}
    patch["updated_at"] = datetime.utcnow()

    await patient_col.update_one({"patient_id": patient_id}, {"$set": patch})
    updated = await patient_col.find_one({"patient_id": patient_id})
    updated["id"] = str(updated.get("_id", updated.get("patient_id")))

    await log_audit_event(current_user["id"], "patient_updated", "patients", patient_id, patch)
    return PatientResponse(**updated)

@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    patient_col = get_collection("patients")
    p = await patient_col.find_one({"patient_id": patient_id})
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found.")

    await patient_col.delete_one({"patient_id": patient_id})
    await log_audit_event(current_user["id"], "patient_deleted", "patients", patient_id)
    return {"message": f"Patient {patient_id} deleted successfully."}

@router.get("/{patient_id}/twin")
async def get_patient_twin(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    authorized = await verify_patient_access(current_user, patient_id)
    if not authorized:
        raise HTTPException(status_code=403, detail="Unauthorized access to patient digital twin.")

    twin = await digital_twin_service.get_patient_digital_twin(patient_id)
    if not twin:
        raise HTTPException(status_code=404, detail="Patient digital twin profile could not be assembled.")

    return twin

