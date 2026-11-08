import asyncio
import pytest
from app.services.alert_service import alert_service
from app.database import db_manager, get_collection
from app.models import AlertStatus

def test_alert_lifecycle():
    async def _run():
        await db_manager.connect()
        
        # Process risk with triggers
        risk_with_triggers = {
            "triggers": [{
                "vital": "oxygen_saturation",
                "value": 84.0,
                "severity": "critical",
                "reason": "CRITICAL HYPOXIA",
                "recommended_action": "High-flow oxygen"
            }]
        }
        vitals = {"oxygen_saturation": 84.0, "heart_rate": 110.0}
        
        alerts = await alert_service.process_risk_and_generate_alerts("PT-TEST-02", risk_with_triggers, vitals)
        assert len(alerts) >= 1
        alert_id = alerts[0]["id"]
        assert alerts[0]["severity"] == "critical"
        assert alerts[0]["status"] == AlertStatus.TRIGGERED.value

        # Caregiver acknowledges alert
        ack_res = await alert_service.acknowledge_alert(alert_id, "user-caregiver-01", "Nurse Wilson", "Mask applied")
        assert ack_res["status"] == AlertStatus.ACKNOWLEDGED.value
        assert ack_res["acknowledged_by"] is not None

        # Escalate alert
        esc_res = await alert_service.escalate_alert(alert_id, "user-caregiver-01", "Nurse Wilson", "No improvement after 2 mins")
        assert esc_res["status"] == AlertStatus.ESCALATED.value

        # Resolve alert
        res_res = await alert_service.resolve_alert(alert_id, "user-doctor-01", "Dr. Chen", "Intubation avoided; SpO2 recovered to 96%")
        assert res_res["status"] == AlertStatus.RESOLVED.value

    asyncio.run(_run())
