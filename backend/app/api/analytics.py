from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_collection
from app.auth import get_current_user, verify_patient_access
from app.models import AlertStatus, DeviceStatus

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Reporting"])

@router.get("/overview")
async def get_system_overview(current_user: dict = Depends(get_current_user)):
    patient_col = get_collection("patients")
    alert_col = get_collection("alerts")
    device_col = get_collection("devices")
    vitals_col = get_collection("vital_readings")
    risk_col = get_collection("risk_assessments")

    patients = await patient_col.find().to_list()
    total_patients = len(patients)

    stable_count = 0
    attention_count = 0
    critical_count = 0

    for p in patients:
        risk = p.get("latest_risk", {})
        cat = risk.get("risk_category", "stable")
        if cat == "critical":
            critical_count += 1
        elif cat in ["high", "moderate", "low"]:
            attention_count += 1
        else:
            stable_count += 1

    # Active sensors vs disconnected
    devices = await device_col.find().to_list()
    active_sensors = sum(1 for d in devices if d.get("status") == DeviceStatus.ONLINE.value)
    disconnected_sensors = sum(1 for d in devices if d.get("status") in [DeviceStatus.OFFLINE.value, DeviceStatus.ERROR.value])

    # Unacknowledged alerts
    unack_alerts = await alert_col.count_documents({"status": AlertStatus.TRIGGERED.value})
    critical_alerts = await alert_col.count_documents({
        "severity": "critical",
        "status": {"$in": ["triggered", "acknowledged", "escalated"]}
    })

    # Recent 24h reading count
    twenty_four_hrs = datetime.utcnow() - timedelta(hours=24)
    readings_24h = await vitals_col.count_documents({"timestamp": {"$gte": twenty_four_hrs}})

    return {
        "total_patients": total_patients,
        "stable_patients": stable_count,
        "patients_requiring_attention": attention_count,
        "critical_patients": critical_count,
        "critical_simulated_alerts": critical_alerts,
        "active_sensors": active_sensors,
        "disconnected_sensors": disconnected_sensors,
        "unacknowledged_alerts": unack_alerts,
        "readings_ingested_last_24h": readings_24h,
        "timestamp": datetime.utcnow()
    }

@router.get("/patient/{patient_id}")
async def get_patient_analytics(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    authorized = await verify_patient_access(current_user, patient_id)
    if not authorized:
        raise HTTPException(status_code=403, detail="Unauthorized access to patient analytics.")

    patient_col = get_collection("patients")
    vitals_col = get_collection("vital_readings")
    risk_col = get_collection("risk_assessments")
    alert_col = get_collection("alerts")

    patient = await patient_col.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    vitals = await vitals_col.find({"patient_id": patient_id}).sort("timestamp", -1).limit(60).to_list()
    risks = await risk_col.find({"patient_id": patient_id}).sort("timestamp", -1).limit(30).to_list()
    alerts = await alert_col.find({"patient_id": patient_id}).sort("created_at", -1).limit(20).to_list()

    for a in alerts:
        a["id"] = str(a.get("_id", ""))

    vitals.reverse()
    risks.reverse()

    return {
        "patient_id": patient_id,
        "full_name": patient.get("full_name"),
        "vitals_trend": vitals,
        "risk_trend": risks,
        "recent_alerts": alerts
    }

