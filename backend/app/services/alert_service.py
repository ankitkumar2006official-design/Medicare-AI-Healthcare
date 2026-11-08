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

            now = datetime.utcnow()
            assigned_cg = patient.get("assigned_caregiver") or "James Wilson, RN"
            assigned_cg_id = patient.get("assigned_caregiver_id") or "CG-001"
            assigned_doc = patient.get("assigned_doctor") or "Dr. Sarah Chen, MD"
            assigned_doc_id = patient.get("assigned_doctor_id") or "DOC-001"

            # SLA deadline: 90 seconds for critical/high, 180 seconds for moderate
            sla_seconds = 60 if severity_str == "critical" else (90 if severity_str == "high" else 180)
            ack_deadline = now + timedelta(seconds=sla_seconds)

            audit_entry = {
                "timestamp": now.isoformat(),
                "event": "ALERT_TRIGGERED",
                "details": f"Alert triggered for vital '{vital_key}' with severity '{severity_str}'",
                "actor": "Clinical Safety & Risk Engine",
                "assigned_to": f"{assigned_cg} ({assigned_cg_id})"
            }

            delivery_entry = {
                "timestamp": now.isoformat(),
                "event": "NOTIFICATION_DISPATCHED",
                "details": f"Push telemetry notification delivered to assigned caregiver {assigned_cg}",
                "channel": "WebSocket / In-App Telemetry Banner",
                "delivery_status": "delivered"
            }

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
                # Caregiver Assignment & Tracking
                "assigned_caregiver_id": assigned_cg_id,
                "assigned_caregiver_name": assigned_cg,
                "assigned_doctor_id": assigned_doc_id,
                "delivery_status": "delivered",
                "delivered_at": now,
                "ack_deadline": ack_deadline,
                "response_time_seconds": None,
                "audit_trail": [audit_entry, delivery_entry],
                "fallback_escalation_workflow": {
                    "fallback_recipient": assigned_doc,
                    "fallback_role": "Attending Physician / Cardiology",
                    "escalate_after_seconds": sla_seconds,
                    "trigger_condition": "Caregiver unacknowledged within SLA deadline"
                },
                "created_at": now,
                "updated_at": now
            }

            res = await alert_col.insert_one(alert_doc)
            alert_doc["id"] = alert_doc["_id"]
            new_alerts.append(alert_doc)

            # Broadcast WebSocket alert event
            await ws_manager.broadcast_event("alert_created", alert_doc, patient_id)
            logger.info(f"Generated {severity_str.upper()} alert {alert_doc['id']} for {patient_name} -> Assigned to {assigned_cg}")

        return new_alerts

    async def acknowledge_alert(self, alert_id: str, user_id: str, user_name: str, note: Optional[str] = None) -> Optional[Dict[str, Any]]:
        alert_col = get_collection("alerts")
        alert = await alert_col.find_one({"_id": alert_id})
        if not alert:
            return None

        now = datetime.utcnow()
        created_at = alert.get("created_at", now)
        resp_seconds = round((now - created_at).total_seconds(), 1)

        audit_trail = alert.get("audit_trail", [])
        audit_trail.append({
            "timestamp": now.isoformat(),
            "event": "ALERT_ACKNOWLEDGED",
            "actor": f"{user_name} ({user_id})",
            "details": f"Caregiver acknowledged alert in {resp_seconds}s. Bedside verification initiated.",
            "response_time_seconds": resp_seconds
        })

        update_fields = {
            "status": AlertStatus.ACKNOWLEDGED.value,
            "acknowledged_by": f"{user_name} ({user_id})",
            "acknowledged_at": now,
            "response_time_seconds": resp_seconds,
            "audit_trail": audit_trail,
            "updated_at": now
        }
        notes = alert.get("notes", [])
        if note:
            notes.append({
                "action": "acknowledged",
                "by": user_name,
                "note": note,
                "timestamp": now
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

        now = datetime.utcnow()
        audit_trail = alert.get("audit_trail", [])
        audit_trail.append({
            "timestamp": now.isoformat(),
            "event": "ALERT_ESCALATED",
            "actor": f"{user_name} ({user_id})",
            "target": doctor_id or "on-call-physician",
            "details": f"Escalated to physician: {urgent_reason}"
        })

        notes = alert.get("notes", [])
        notes.append({
            "action": "escalated_to_physician",
            "by": user_name,
            "doctor_id": doctor_id or "on-call-cardiology",
            "note": urgent_reason,
            "timestamp": now
        })

        await alert_col.update_one(
            {"_id": alert_id},
            {
                "$set": {
                    "status": AlertStatus.ESCALATED.value,
                    "severity": AlertSeverity.CRITICAL.value,
                    "audit_trail": audit_trail,
                    "updated_at": now,
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

        now = datetime.utcnow()
        audit_trail = alert.get("audit_trail", [])
        audit_trail.append({
            "timestamp": now.isoformat(),
            "event": "ALERT_RESOLVED",
            "actor": f"{user_name} ({user_id})",
            "details": f"Alert resolved: {resolution_note}"
        })

        notes = alert.get("notes", [])
        notes.append({
            "action": "resolved",
            "by": user_name,
            "note": resolution_note,
            "timestamp": now
        })

        await alert_col.update_one(
            {"_id": alert_id},
            {
                "$set": {
                    "status": AlertStatus.RESOLVED.value,
                    "resolved_by": f"{user_name} ({user_id})",
                    "resolved_at": now,
                    "resolution_note": resolution_note,
                    "audit_trail": audit_trail,
                    "updated_at": now,
                    "notes": notes
                }
            }
        )
        updated = await alert_col.find_one({"_id": alert_id})
        updated["id"] = str(updated["_id"])

        await ws_manager.broadcast_event("alert_resolved", updated, updated.get("patient_id"))
        return updated

    async def check_and_escalate_overdue_alerts(self) -> List[Dict[str, Any]]:
        """
        Scans for unacknowledged alerts that exceeded their ack_deadline SLA
        and automatically escalates them to the fallback attending physician.
        """
        alert_col = get_collection("alerts")
        now = datetime.utcnow()

        overdue_alerts = await alert_col.find({
            "status": AlertStatus.TRIGGERED.value,
            "ack_deadline": {"$lte": now},
            "escalation_count": 0
        }).to_list()

        escalated = []
        for alert in overdue_alerts:
            aid = alert["_id"]
            fallback = alert.get("fallback_escalation_workflow", {})
            doc_name = fallback.get("fallback_recipient", "Dr. Sarah Chen, MD")

            audit_trail = alert.get("audit_trail", [])
            audit_trail.append({
                "timestamp": now.isoformat(),
                "event": "AUTO_ESCALATED_SLA_BREACH",
                "actor": "System Reliability Watchdog",
                "target": doc_name,
                "details": f"Caregiver SLA deadline expired. Auto-escalated to fallback physician {doc_name}."
            })

            notes = alert.get("notes", [])
            notes.append({
                "action": "auto_escalated",
                "by": "System Reliability Watchdog",
                "note": f"SLA breach: Unacknowledged within deadline. Dispatched to {doc_name}.",
                "timestamp": now
            })

            await alert_col.update_one(
                {"_id": aid},
                {
                    "$set": {
                        "status": AlertStatus.ESCALATED.value,
                        "severity": AlertSeverity.CRITICAL.value,
                        "audit_trail": audit_trail,
                        "updated_at": now,
                        "notes": notes
                    },
                    "$inc": {"escalation_count": 1}
                }
            )

            updated = await alert_col.find_one({"_id": aid})
            updated["id"] = str(updated["_id"])
            await ws_manager.broadcast_event("alert_escalated", updated, updated.get("patient_id"))
            logger.warning(f"AUTO-ESCALATED SLA breach for alert {aid} -> {doc_name}")
            escalated.append(updated)

        return escalated


alert_service = AlertService()

