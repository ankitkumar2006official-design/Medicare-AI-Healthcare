import logging
from datetime import datetime
from typing import Dict, Any, Optional

from app.database import get_collection
from app.ml.risk_scorer import risk_engine
from app.services.alert_service import alert_service
from app.services.websocket_manager import ws_manager
from app.services.sensor_validator import sensor_validator
from app.models import DeviceStatus

logger = logging.getLogger("mediguard.ingestion")

async def ingest_vital_reading(vital_packet: Dict[str, Any]) -> Dict[str, Any]:
    """
    Central pipeline:
    SENSE (IoT sensor packet)
    -> UNDERSTAND (Baseline comparison, persistence)
    -> PREDICT (Isolation Forest + Clinical Rules + Trend Risk)
    -> ALERT (Intelligent deduplication & escalation)
    -> BROADCAST (WebSocket real-time push to authorized subscribers)
    """
    patient_id = vital_packet.get("patient_id")
    if not patient_id:
        raise ValueError("Missing patient_id in vital packet")

    # 1. Save Vital Reading to DB
    vitals_col = get_collection("vital_readings")
    patient_col = get_collection("patients")
    device_col = get_collection("devices")
    risk_col = get_collection("risk_assessments")

    reading_doc = {
        "patient_id": patient_id,
        "device_id": vital_packet.get("device_id", f"DEV-{patient_id}"),
        "heart_rate": vital_packet.get("heart_rate", 0.0),
        "oxygen_saturation": vital_packet.get("oxygen_saturation", 0.0),
        "body_temperature": vital_packet.get("body_temperature", 0.0),
        "blood_pressure_systolic": vital_packet.get("blood_pressure_systolic", 0.0),
        "blood_pressure_diastolic": vital_packet.get("blood_pressure_diastolic", 0.0),
        "respiratory_rate": vital_packet.get("respiratory_rate", 0.0),
        "glucose_level": vital_packet.get("glucose_level"),
        "sensor_connected": vital_packet.get("sensor_connected", True),
        "signal_quality": vital_packet.get("signal_quality", 1.0),
        "timestamp": vital_packet.get("timestamp", datetime.utcnow())
    }

    # Fetch previous reading to perform rate-of-change and motion artifact detection
    prev_reading = await vitals_col.find_one({"patient_id": patient_id}, sort=[("timestamp", -1)])

    # Validate and compute Signal Quality Index (SQI)
    sanitized_doc, sqi, artifacts = sensor_validator.validate_and_compute_sqi(
        current_vitals=reading_doc,
        previous_vitals=prev_reading
    )
    reading_doc = sanitized_doc

    # If sensor is disconnected, update device status and notify
    if not reading_doc["sensor_connected"]:
        await device_col.update_one(
            {"patient_id": patient_id},
            {"$set": {"status": DeviceStatus.OFFLINE.value, "last_ping": datetime.utcnow()}}
        )
        await ws_manager.broadcast_event(
            "device_status_changed",
            {"patient_id": patient_id, "status": "offline", "reason": "Sensor lead detached"},
            patient_id
        )

    # Insert vital reading
    res = await vitals_col.insert_one(reading_doc)
    reading_doc["id"] = str(res.inserted_id)

    # Fetch patient baseline and recent history for trend analysis
    patient = await patient_col.find_one({"patient_id": patient_id})
    baseline = patient.get("baseline_vitals") if patient else None

    recent_history = await vitals_col.find({"patient_id": patient_id})\
        .sort("timestamp", -1)\
        .limit(6)\
        .to_list()

    # 2. PREDICT: ML & Clinical Safety Assessment
    risk_assessment = risk_engine.evaluate_risk(
        patient_id=patient_id,
        current_vitals=reading_doc,
        baseline=baseline,
        vital_history=recent_history
    )

    # Save risk assessment
    risk_res = await risk_col.insert_one(risk_assessment)
    risk_assessment["id"] = str(risk_res.inserted_id)

    # Update patient latest cache
    await patient_col.update_one(
        {"patient_id": patient_id},
        {
            "$set": {
                "latest_vitals": reading_doc,
                "latest_risk": risk_assessment,
                "updated_at": datetime.utcnow()
            }
        }
    )

    # 3. ALERT: Intelligent alert generation and threshold processing
    generated_alerts = []
    if reading_doc["sensor_connected"]:
        generated_alerts = await alert_service.process_risk_and_generate_alerts(
            patient_id=patient_id,
            risk_result=risk_assessment,
            vitals=reading_doc
        )

    # 4. RESPOND: Broadcast real-time events via WebSockets
    await ws_manager.broadcast_event("vital_update", reading_doc, patient_id)
    await ws_manager.broadcast_event("risk_update", risk_assessment, patient_id)

    return {
        "vital_id": reading_doc["id"],
        "risk_id": risk_assessment["id"],
        "risk_category": risk_assessment["risk_category"],
        "risk_score": risk_assessment["risk_score"],
        "alerts_generated": len(generated_alerts)
    }

