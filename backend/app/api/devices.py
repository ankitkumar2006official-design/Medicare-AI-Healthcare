from datetime import datetime
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_collection
from app.auth import get_current_user, require_roles, log_audit_event
from app.models import UserRole
from app.models.device import DeviceCreate, DeviceStatusUpdate, DeviceResponse
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/devices", tags=["Device & Sensor Management"])

@router.get("", response_model=List[DeviceResponse])
async def list_devices(current_user: dict = Depends(get_current_user)):
    dev_col = get_collection("devices")
    docs = await dev_col.find().to_list()
    for d in docs:
        d["id"] = str(d.get("_id", d.get("device_id")))
    return [DeviceResponse(**d) for d in docs]

@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    device_in: DeviceCreate,
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR]))
):
    dev_col = get_collection("devices")
    existing = await dev_col.find_one({"device_id": device_in.device_id})
    if existing:
        raise HTTPException(status_code=400, detail="Device with this Device ID is already registered.")

    doc = device_in.model_dump()
    doc["_id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()

    await dev_col.insert_one(doc)
    doc["id"] = doc["_id"]

    await log_audit_event(current_user["id"], "device_registered", "devices", doc["device_id"])
    return DeviceResponse(**doc)

@router.put("/{device_id}/status", response_model=DeviceResponse)
async def update_device_status(
    device_id: str,
    status_update: DeviceStatusUpdate,
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER]))
):
    dev_col = get_collection("devices")
    dev = await dev_col.find_one({"device_id": device_id}) or await dev_col.find_one({"_id": device_id})
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found.")

    patch = {"status": status_update.status.value, "updated_at": datetime.utcnow(), "last_ping": datetime.utcnow()}
    if status_update.battery_level is not None:
        patch["battery_level"] = status_update.battery_level

    target_id = dev["_id"]
    await dev_col.update_one({"_id": target_id}, {"$set": patch})
    updated = await dev_col.find_one({"_id": target_id})
    updated["id"] = str(updated.get("_id", updated.get("device_id")))

    await ws_manager.broadcast_event(
        "device_status_changed",
        {"device_id": device_id, "status": status_update.status.value},
        updated.get("patient_id")
    )

    return DeviceResponse(**updated)

