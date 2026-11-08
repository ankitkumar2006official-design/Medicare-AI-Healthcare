import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import uuid

from app.database import get_collection
from app.models import AlertSeverity, AlertStatus
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("mediguard.alerts")

class AlertService:
    async def process_risk_and_generate_alerts(
        self,
        patient_id: str,
        risk_result: Dict[str, Any],
        vitals: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Evaluates risk assessment triggers and creates or deduplicates active alerts.
        """
        triggers = risk_result.get("triggers", [])
        if not triggers:
            return []

        alert_col = get_collection("alerts")
        patient_col = get_collection("patients")
        patient = await patient_col.find_one({"patient_id": patient_id})
        patient_name = patient.get("full_name", f"Patient {patient_id}") if patient else f"Patient {patient_id}"

        new_alerts = []
        for trig in triggers:
            severity_str = trig.get("severity", "moderate")
            if severity_str == "none":
                continue

            vital_key = trig.get("vital")

            # Check if an unresolved alert for this vital & patient already exists within the last 3 minutes
            recent_threshold = datetime.utcnow() - timedelta(minutes=3)
            existing = await alert_col.find_one({
                "patient_id": patient_id,
                "trigger_vital": vital_key,
                "status": {"$in": [AlertStatus.TRIGGERED.value, AlertStatus.ACKNOWLEDGED.value]},
                "created_at": {"$gte": recent_threshold}
            })

            if existing:
                # If existing alert has lower severity than new trigger, escalate severity
                severity_ranks = {"low": 1, "moderate": 2, "high": 3, "critical": 4}
                if severity_ranks.get(severity_str, 1) > severity_ranks.get(existing.get("severity", "low"), 1):
                    await alert_col.update_one(
                        {"_id": existing["_id"]},
                        {
                            "$set": {
                                "severity": severity_str,
                                "reason": trig.get("reason"),
                                "triggering_readings": vitals,
                                "recommended_action": trig.get("recommended_action"),
                                "updated_at": datetime.utcnow()
                            },
                            "$inc": {"escalation_count": 1}
                        }
                    )
                    existing["severity"] = severity_str
                    existing["reason"] = trig.get("reason")
                    await ws_manager.broadcast_event("alert_escalated", existing, patient_id)
                continue

            alert_doc = {
                "_id": f"ALT-{uuid.uuid4().hex[:8].upper()}",
                "patient_id": patient_id,
                "patient_name": patient_name,
                "severity": severity_str,
                "status": AlertStatus.TRIGGERED.value,
                "trigger_vital": vital_key,
                "triggering_readings": vitals,
                "reason": trig.get("reason", "Vital abnormal threshold violation"),
                "recommended_action": trig.get("recommended_action", "Caregiver bedside assessment recommended"),
                "escalation_count": 0,
                "acknowledged_by": None,
                "acknowledged_at": None,
                "resolved_by": None,
                "resolved_at": None,
                "resolution_note": None,
                "notes": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }

            res = await alert_col.insert_one(alert_doc)
            alert_doc["id"] = alert_doc["_id"]
            new_alerts.append(alert_doc)

            # Broadcast WebSocket alert event
            await ws_manager.broadcast_event("alert_created", alert_doc, patient_id)
            logger.info(f"Generated {severity_str.upper()} alert {alert_doc['id']} for {patient_name}")

        return new_alerts

    async def acknowledge_alert(self, alert_id: str, user_id: str, user_name: str, note: Optional[str] = None) -> Optional[Dict[str, Any]]:
        alert_col = get_collection("alerts")
        alert = await alert_col.find_one({"_id": alert_id})
        if not alert:
            return None

        update_fields = {
            "status": AlertStatus.ACKNOWLEDGED.value,
            "acknowledged_by": f"{user_name} ({user_id})",
            "acknowledged_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        notes = alert.get("notes", [])
        if note:
            notes.append({
                "action": "acknowledged",
                "by": user_name,
                "note": note,
                "timestamp": datetime.utcnow()
            })
            update_fields["notes"] = notes

        await alert_col.update_one({"_id": alert_id}, {"$set": update_fields})
        updated = await alert_col.find_one({"_id": alert_id})
        updated["id"] = str(updated["_id"])

        await ws_manager.broadcast_event("alert_acknowledged", updated, updated.get("patient_id"))
        return updated

    async def escalate_alert(self, alert_id: str, user_id: str, user_name: str, urgent_reason: str, doctor_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        alert_col = get_collection("alerts")
        alert = await alert_col.find_one({"_id": alert_id})
        if not alert:
            return None

        notes = alert.get("notes", [])
        notes.append({
            "action": "escalated_to_physician",
            "by": user_name,
            "doctor_id": doctor_id or "on-call-cardiology",
            "note": urgent_reason,
            "timestamp": datetime.utcnow()
        })

        await alert_col.update_one(
            {"_id": alert_id},
            {
                "$set": {
                    "status": AlertStatus.ESCALATED.value,
                    "severity": AlertSeverity.CRITICAL.value,
                    "updated_at": datetime.utcnow(),
                    "notes": notes
                },
                "$inc": {"escalation_count": 1}
            }
        )
        updated = await alert_col.find_one({"_id": alert_id})
        updated["id"] = str(updated["_id"])

        await ws_manager.broadcast_event("alert_escalated", updated, updated.get("patient_id"))
        return updated

    async def resolve_alert(self, alert_id: str, user_id: str, user_name: str, resolution_note: str) -> Optional[Dict[str, Any]]:
        alert_col = get_collection("alerts")
        alert = await alert_col.find_one({"_id": alert_id})
        if not alert:
            return None

        notes = alert.get("notes", [])
        notes.append({
            "action": "resolved",
            "by": user_name,
            "note": resolution_note,
            "timestamp": datetime.utcnow()
        })

        await alert_col.update_one(
            {"_id": alert_id},
            {
                "$set": {
                    "status": AlertStatus.RESOLVED.value,
                    "resolved_by": f"{user_name} ({user_id})",
                    "resolved_at": datetime.utcnow(),
                    "resolution_note": resolution_note,
                    "updated_at": datetime.utcnow(),
                    "notes": notes
                }
            }
        )
        updated = await alert_col.find_one({"_id": alert_id})
        updated["id"] = str(updated["_id"])

        await ws_manager.broadcast_event("alert_resolved", updated, updated.get("patient_id"))
        return updated


alert_service = AlertService()
