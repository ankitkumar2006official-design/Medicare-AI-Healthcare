from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status

from simulator.sensor_engine import sensor_engine
from simulator.scenarios import SCENARIOS
from app.auth import get_current_user, require_roles
from app.models import UserRole
from app.database import get_collection

router = APIRouter(prefix="/api/simulator", tags=["IoT Sensor Simulator Controls"])

class ScenarioRequest(BaseModel):
    patient_id: str
    scenario_id: str

class ManualOverrideRequest(BaseModel):
    patient_id: str
    vitals: Dict[str, float]

class IntervalRequest(BaseModel):
    interval_seconds: float

@router.get("/status")
async def get_simulator_status():
    patient_col = get_collection("patients")
    patients = await patient_col.find().to_list()

    patient_summaries = {}
    for p in patients:
        pid = p["patient_id"]
        st = sensor_engine.patient_states.get(pid)
        patient_summaries[pid] = {
            "patient_id": pid,
            "patient_name": p.get("full_name"),
            "scenario_id": st.scenario_id if st else p.get("active_scenario", "healthy"),
            "has_manual_override": bool(st.manual_override) if st else False,
            "current_vitals": st.current_vitals if st else {},
            "step_count": st.step_count if st else 0
        }

    return {
        "is_running": sensor_engine.is_running,
        "interval_seconds": sensor_engine.interval_seconds,
        "active_patients": patient_summaries,
        "available_scenarios": [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "sensor_connected": s.sensor_connected
            }
            for s in SCENARIOS.values()
        ]
    }

@router.post("/start")
async def start_simulator(current_user: dict = Depends(get_current_user)):
    sensor_engine.start()
    return {"message": "IoT Vital Simulator started successfully.", "is_running": True}

@router.post("/pause")
async def pause_simulator(current_user: dict = Depends(get_current_user)):
    sensor_engine.pause()
    return {"message": "IoT Vital Simulator paused.", "is_running": False}

@router.post("/reset")
async def reset_simulator(current_user: dict = Depends(get_current_user)):
    sensor_engine.reset_all()
    return {"message": "All patient sensor streams reset to baseline scenario parameters."}

@router.post("/scenario")
async def change_scenario(
    req: ScenarioRequest,
    current_user: dict = Depends(get_current_user)
):
    if req.scenario_id not in SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario '{req.scenario_id}'. Available: {list(SCENARIOS.keys())}"
        )

    patient_col = get_collection("patients")
    patient = await patient_col.find_one({"patient_id": req.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    sensor_engine.set_scenario(req.patient_id, req.scenario_id)
    await patient_col.update_one(
        {"patient_id": req.patient_id},
        {"$set": {"active_scenario": req.scenario_id}}
    )

    return {
        "message": f"Switched patient {req.patient_id} scenario to '{req.scenario_id}'",
        "scenario": SCENARIOS[req.scenario_id].name
    }

@router.post("/override")
async def set_manual_override(
    req: ManualOverrideRequest,
    current_user: dict = Depends(get_current_user)
):
    sensor_engine.set_manual_override(req.patient_id, req.vitals)
    return {
        "message": f"Manual override applied to patient {req.patient_id}.",
        "overrides": req.vitals
    }

@router.post("/override/clear")
async def clear_manual_override(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    sensor_engine.clear_manual_override(patient_id)
    return {"message": f"Cleared manual overrides for patient {patient_id}."}

@router.post("/interval")
async def update_interval(
    req: IntervalRequest,
    current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR]))
):
    if req.interval_seconds < 1.0 or req.interval_seconds > 10.0:
        raise HTTPException(status_code=400, detail="Interval must be between 1.0 and 10.0 seconds.")
    sensor_engine.interval_seconds = req.interval_seconds
    return {"message": f"Sampling interval set to {req.interval_seconds} seconds."}

class OfflineSimulationRequest(BaseModel):
    patient_id: str
    offline: bool = True

@router.post("/buffer/simulate-offline")
async def toggle_offline_buffering(
    req: OfflineSimulationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Simulates home gateway disconnection for a patient, causing sensor telemetry
    to accumulate in the local hardware buffer rather than reaching backend.
    """
    sensor_engine.set_offline_mode(req.patient_id, req.offline)
    return {
        "status": "success",
        "patient_id": req.patient_id,
        "offline_buffering_active": req.offline,
        "current_buffer_size": len(sensor_engine.offline_buffers.get(req.patient_id, []))
    }

@router.get("/buffer/status")
async def get_buffer_status(current_user: dict = Depends(get_current_user)):
    """Returns local offline buffer counts across all simulated patient devices."""
    statuses = {}
    for pid in sensor_engine.patient_states.keys():
        statuses[pid] = {
            "offline_mode": sensor_engine.offline_mode.get(pid, False),
            "buffered_packets_count": len(sensor_engine.offline_buffers.get(pid, [])),
            "sequence_counter": sensor_engine.sequence_counters.get(pid, 0)
        }
    return {
        "devices": statuses,
        "total_buffered_across_all": sum(len(b) for b in sensor_engine.offline_buffers.values())
    }

@router.post("/buffer/reconnect-and-sync")
async def reconnect_and_flush_buffer(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Simulates gateway network reconnection: restores online streaming and flushes
    all buffered readings through the reliability sync-buffer pipeline.
    """
    from app.models.reliability import BatchBufferSyncRequest, BufferedVitalReading
    from app.api.reliability import sync_offline_sensor_buffer
    import uuid

    buffered = sensor_engine.flush_offline_buffer(patient_id)
    if not buffered:
        return {
            "status": "empty",
            "patient_id": patient_id,
            "message": "No buffered readings pending transmission.",
            "synced_count": 0
        }

    readings = []
    for b in buffered:
        readings.append(BufferedVitalReading(
            client_sequence_id=b.get("client_sequence_id", f"{patient_id}-SEQ-{uuid.uuid4().hex[:6]}"),
            patient_id=patient_id,
            device_id=b.get("device_id", f"DEV-{patient_id}"),
            heart_rate=float(b.get("heart_rate", 75.0)),
            oxygen_saturation=float(b.get("oxygen_saturation", 98.0)),
            body_temperature=float(b.get("body_temperature", 36.8)),
            blood_pressure_systolic=float(b.get("blood_pressure_systolic", 120.0)),
            blood_pressure_diastolic=float(b.get("blood_pressure_diastolic", 80.0)),
            respiratory_rate=float(b.get("respiratory_rate", 16.0)),
            glucose_level=b.get("glucose_level"),
            sensor_connected=b.get("sensor_connected", True),
            recorded_at=b.get("timestamp", datetime.utcnow()),
            client_retry_count=1
        ))

    sync_req = BatchBufferSyncRequest(
        device_id=f"DEV-{patient_id}",
        batch_id=f"RECONNECT-BATCH-{uuid.uuid4().hex[:8].upper()}",
        readings=readings
    )

    result = await sync_offline_sensor_buffer(sync_req, current_user)
    return {
        "status": "synchronized",
        "patient_id": patient_id,
        "result": result
    }


