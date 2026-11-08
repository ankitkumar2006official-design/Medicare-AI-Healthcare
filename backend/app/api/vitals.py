from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_collection
from app.auth import get_current_user, verify_patient_access
from app.models.vital import VitalReadingCreate, VitalReadingResponse
from app.services.ingestion_service import ingest_vital_reading

router = APIRouter(prefix="/api/vitals", tags=["Vitals Telemetry"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def post_vital_reading(vital_in: VitalReadingCreate):
    """
    Ingest a telemetry packet from IoT sensor simulator or connected hardware.
    Executes full pipeline: SENSE -> UNDERSTAND -> PREDICT -> ALERT -> RESPOND.
    """
    try:
        packet = vital_in.model_dump()
        result = await ingest_vital_reading(packet)
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vital ingestion failure: {str(e)}")

@router.get("/{patient_id}", response_model=List[VitalReadingResponse])
async def get_patient_vital_history(
    patient_id: str,
    limit: int = Query(50, ge=1, le=500),
    current_user: dict = Depends(get_current_user)
):
    authorized = await verify_patient_access(current_user, patient_id)
    if not authorized:
        raise HTTPException(status_code=403, detail="Unauthorized access to patient vitals.")

    vitals_col = get_collection("vital_readings")
    readings = await vitals_col.find({"patient_id": patient_id})\
        .sort("timestamp", -1)\
        .limit(limit)\
        .to_list()

    for r in readings:
        r["id"] = str(r.get("_id", ""))

    return [VitalReadingResponse(**r) for r in readings]

@router.get("/{patient_id}/latest", response_model=Optional[VitalReadingResponse])
async def get_latest_vital(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    authorized = await verify_patient_access(current_user, patient_id)
    if not authorized:
        raise HTTPException(status_code=403, detail="Unauthorized access to patient vitals.")

    vitals_col = get_collection("vital_readings")
    reading = await vitals_col.find_one({"patient_id": patient_id}, sort=[("timestamp", -1)])
    if not reading:
        return None

    reading["id"] = str(reading.get("_id", ""))
    return VitalReadingResponse(**reading)

