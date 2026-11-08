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

