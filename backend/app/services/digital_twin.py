import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from app.database import get_collection

logger = logging.getLogger("mediguard.digital_twin")

class DigitalTwinService:
    async def get_patient_digital_twin(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """
        Assembles comprehensive Digital Twin profile:
        - Patient demographics & clinical history
        - Baseline vitals
        - Current telemetry snapshot & sensor connection status
        - 24-reading vital time-series for trend curves
        - Historical risk trajectory
        - Active alerts & caregiver response logs
        """
        patient_col = get_collection("patients")
        vitals_col = get_collection("vital_readings")
        risk_col = get_collection("risk_assessments")
        alert_col = get_collection("alerts")
        device_col = get_collection("devices")
        responses_col = get_collection("caregiver_responses")

        patient = await patient_col.find_one({"patient_id": patient_id})
        if not patient:
            return None

        # Fetch recent historical vitals (last 30 points)
        recent_vitals = await vitals_col.find({"patient_id": patient_id})\
            .sort("timestamp", -1)\
            .limit(30)\
            .to_list()
        recent_vitals.reverse() # Chronological

        latest_vital = recent_vitals[-1] if recent_vitals else None

        # Fetch latest risk assessment
        latest_risk = await risk_col.find_one({"patient_id": patient_id})
        risk_history = await risk_col.find({"patient_id": patient_id})\
            .sort("timestamp", -1)\
            .limit(10)\
            .to_list()
        risk_history.reverse()

        # Fetch active alerts
        active_alerts = await alert_col.find({
            "patient_id": patient_id,
            "status": {"$in": ["triggered", "acknowledged", "escalated"]}
        }).sort("created_at", -1).to_list()

        # Fetch device status
        device = await device_col.find_one({"patient_id": patient_id})

        # Fetch recent caregiver interactions
        recent_responses = await responses_col.find({"patient_id": patient_id})\
            .sort("timestamp", -1)\
            .limit(5)\
            .to_list()

        # Calculate baseline comparison statistics
        baseline = patient.get("baseline_vitals", {})
        baseline_comparison = {}
        if latest_vital:
            for k in ["heart_rate", "oxygen_saturation", "body_temperature", "blood_pressure_systolic", "respiratory_rate"]:
                val = latest_vital.get(k)
                if val is not None:
                    b_min = baseline.get(f"{k}_min")
                    b_max = baseline.get(f"{k}_max")
                    in_range = True
                    if b_min is not None and val < b_min:
                        in_range = False
                    if b_max is not None and val > b_max:
                        in_range = False
                    baseline_comparison[k] = {
                        "current_value": val,
                        "in_range": in_range,
                        "min_baseline": b_min,
                        "max_baseline": b_max
                    }

        return {
            "patient_id": patient_id,
            "full_name": patient.get("full_name"),
            "age": patient.get("age"),
            "gender": patient.get("gender"),
            "room_number": patient.get("room_number"),
            "medical_history": patient.get("medical_history", []),
            "existing_conditions": patient.get("existing_conditions", []),
            "allergies": patient.get("allergies", []),
            "emergency_contact": patient.get("emergency_contact", {}),
            "baseline_vitals": baseline,
            "active_scenario": patient.get("active_scenario", "healthy"),
            "is_monitored": patient.get("is_monitored", True),
            "device": device,
            "latest_vitals": latest_vital,
            "vital_time_series": recent_vitals,
            "baseline_comparison": baseline_comparison,
            "latest_risk": latest_risk,
            "risk_history": risk_history,
            "active_alerts": active_alerts,
            "recent_caregiver_responses": recent_responses,
            "twin_sync_timestamp": datetime.utcnow()
        }


digital_twin_service = DigitalTwinService()
