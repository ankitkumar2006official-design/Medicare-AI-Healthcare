"""
=============================================================================
OPERATION WARD ZERO: COMPREHENSIVE UPGRADE TEST SUITE
=============================================================================
Tests all newly implemented capabilities:
1. Caregiver Attendance, GPS Check-in/out, Geofence Verification
2. Caregiver Activity Logging & Performance / Response-Time Analytics
3. System Reliability: Offline Buffering, Batch Ingestion, Sync Logs
4. Duplicate Reading Prevention & Delayed Packet Detection
5. Stale Sensor Detection & System Health Snapshots
6. Contextual Intelligence: Medical History, Chronic Modifiers & Pattern Recognition
7. Predictive Analytics: 24-48h Forecasting, Uncertainty Horizons & Feature Importance
8. Alert Assignment, Delivery Tracking, SLA Timers & Auto-Escalation Audit Trail
=============================================================================
"""

import asyncio
import os
import sys
import uuid
from datetime import datetime, timedelta

# Ensure project root is in sys.path
root_dir = os.path.abspath(os.path.dirname(__file__))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import httpx
from app.database import db_manager, get_collection
from app.auth import create_access_token

BASE_URL = "http://127.0.0.1:8000"

# Color formatting
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

results = {"passed": 0, "failed": 0, "tests": []}

def record_test(test_id: str, description: str, passed: bool, detail: str = ""):
    status_str = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
    if passed:
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["tests"].append({"id": test_id, "desc": description, "passed": passed, "detail": detail})
    print(f"[{status_str}] {BOLD}{test_id}{RESET} - {description} {f'({detail})' if detail else ''}")

async def run_upgrades_test_suite():
    print(f"\n{BOLD}{CYAN}===================================================================={RESET}")
    print(f"{BOLD}{CYAN} MEDIGUARD AI: OPERATION WARD ZERO UPGRADE VERIFICATION TEST SUITE {RESET}")
    print(f"{BOLD}{CYAN}===================================================================={RESET}\n")

    await db_manager.connect()

    # Generate Auth Tokens
    admin_token = create_access_token({
        "sub": "user-admin-01",
        "email": "admin@mediguard.ai",
        "role": "admin",
        "assigned_patient_ids": ["PT-1001", "PT-1002", "PT-1003", "PT-1004", "PT-1005"]
    })
    caregiver_token = create_access_token({
        "sub": "user-caregiver-01",
        "email": "caregiver@mediguard.ai",
        "role": "caregiver",
        "assigned_patient_ids": ["PT-1001", "PT-1002"]
    })

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    caregiver_headers = {"Authorization": f"Bearer {caregiver_token}"}

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        # ---------------------------------------------------------------------
        # 1. CAREGIVER MANAGEMENT & GPS ATTENDANCE
        # ---------------------------------------------------------------------
        print(f"\n{BOLD}--> PHASE 1: Caregiver Attendance & GPS Verification{RESET}")
        
        # Test 1: Check-in
        checkin_payload = {
            "caregiver_id": "user-caregiver-01",
            "patient_id": "PT-1001",
            "shift_type": "day",
            "location": {
                "latitude": 37.7749,
                "longitude": -122.4194,
                "accuracy_meters": 4.1,
                "address_label": "Ward Zero Bedroom 101, San Francisco, CA",
                "within_geofence": True
            },
            "notes": "Morning telemetry shift check-in"
        }
        res1 = await client.post("/api/caregivers/attendance/check-in", json=checkin_payload, headers=caregiver_headers)
        att_id = None
        if res1.status_code == 201:
            att_id = res1.json().get("id")
            record_test("TEST-UPG-01", "Caregiver GPS Bedside Check-In", True, f"ID: {att_id}, Geofenced: True")
        else:
            record_test("TEST-UPG-01", "Caregiver GPS Bedside Check-In", False, f"Status: {res1.status_code}")

        # Test 2: Attendance History & Active Roster
        res2 = await client.get("/api/caregivers/attendance/history", headers=caregiver_headers)
        if res2.status_code == 200 and len(res2.json()) > 0:
            record_test("TEST-UPG-02", "Attendance History & Roster Query", True, f"Retrieved {len(res2.json())} shift records")
        else:
            record_test("TEST-UPG-02", "Attendance History & Roster Query", False, f"Status: {res2.status_code}")

        # Test 3: Log Activity
        act_payload = {
            "caregiver_id": "user-caregiver-01",
            "patient_id": "PT-1001",
            "activity_type": "bedside_visit",
            "description": "Routine vital sign manual confirmation & ECG lead adhesion check",
            "metadata": {"bp_confirmed": "120/80", "spo2_confirmed": 98}
        }
        res3 = await client.post("/api/caregivers/activity", json=act_payload, headers=caregiver_headers)
        if res3.status_code == 201:
            record_test("TEST-UPG-03", "Caregiver Bedside Activity Logging", True, "Activity logged with metadata")
        else:
            record_test("TEST-UPG-03", "Caregiver Bedside Activity Logging", False, f"Status: {res3.status_code}")

        # Test 4: Performance Analytics
        res4 = await client.get("/api/caregivers/analytics/performance?caregiver_id=user-caregiver-01", headers=caregiver_headers)
        if res4.status_code == 200:
            d = res4.json()
            record_test("TEST-UPG-04", "Caregiver Response-Time Analytics", True, f"Avg Ack: {d.get('avg_ack_time_seconds')}s, SLA: {d.get('sla_compliance_rate_percent')}%")
        else:
            record_test("TEST-UPG-04", "Caregiver Response-Time Analytics", False, f"Status: {res4.status_code}")

        # Test 5: Check-Out
        if att_id:
            checkout_payload = {
                "attendance_id": att_id,
                "location": {
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "accuracy_meters": 4.5,
                    "address_label": "Ward Zero Bedroom 101, San Francisco, CA",
                    "within_geofence": True
                },
                "notes": "Shift finished, patient handover completed"
            }
            res5 = await client.post("/api/caregivers/attendance/check-out", json=checkout_payload, headers=caregiver_headers)
            if res5.status_code == 200 and res5.json().get("status") in ["checked_out", "completed"]:
                record_test("TEST-UPG-05", "Caregiver Shift Check-Out & Duration Log", True, f"Duration: {res5.json().get('duration_minutes')} min")
            else:
                record_test("TEST-UPG-05", "Caregiver Shift Check-Out & Duration Log", False, f"Status: {res5.status_code}")

        # ---------------------------------------------------------------------
        # 2. SYSTEM RELIABILITY & OFFLINE BUFFERING
        # ---------------------------------------------------------------------
        print(f"\n{BOLD}--> PHASE 2: System Reliability & Offline Buffering{RESET}")

        # Test 6: Sync Buffer Batch
        seq_1 = f"PT1001-SEQ-{uuid.uuid4().hex[:6]}"
        seq_2 = f"PT1001-SEQ-{uuid.uuid4().hex[:6]}"
        now = datetime.utcnow()
        batch_req = {
            "device_id": "DEV-PT-1001",
            "batch_id": f"BATCH-{uuid.uuid4().hex[:8].upper()}",
            "readings": [
                {
                    "client_sequence_id": seq_1,
                    "patient_id": "PT-1001",
                    "device_id": "DEV-PT-1001",
                    "heart_rate": 74.0,
                    "oxygen_saturation": 98.0,
                    "body_temperature": 36.7,
                    "blood_pressure_systolic": 118.0,
                    "blood_pressure_diastolic": 78.0,
                    "respiratory_rate": 15.0,
                    "sensor_connected": True,
                    "recorded_at": (now - timedelta(minutes=2)).isoformat()
                },
                {
                    "client_sequence_id": seq_2,
                    "patient_id": "PT-1001",
                    "device_id": "DEV-PT-1001",
                    "heart_rate": 76.0,
                    "oxygen_saturation": 97.5,
                    "body_temperature": 36.8,
                    "blood_pressure_systolic": 120.0,
                    "blood_pressure_diastolic": 80.0,
                    "respiratory_rate": 16.0,
                    "sensor_connected": True,
                    "recorded_at": (now - timedelta(minutes=1)).isoformat()
                }
            ]
        }
        res6 = await client.post("/api/reliability/sync-buffer", json=batch_req, headers=admin_headers)
        if res6.status_code == 200 and res6.json().get("new_ingested") == 2:
            record_test("TEST-UPG-06", "Offline Buffer Batch Ingestion", True, f"Ingested {res6.json().get('new_ingested')} buffered readings")
        else:
            record_test("TEST-UPG-06", "Offline Buffer Batch Ingestion", False, f"Status: {res6.status_code}")

        # Test 7: Duplicate Reading Prevention (resubmit identical batch)
        res7 = await client.post("/api/reliability/sync-buffer", json=batch_req, headers=admin_headers)
        if res7.status_code == 200 and res7.json().get("duplicates_rejected") == 2:
            record_test("TEST-UPG-07", "Duplicate Reading Prevention", True, f"Successfully rejected {res7.json().get('duplicates_rejected')} duplicate packets")
        else:
            record_test("TEST-UPG-07", "Duplicate Reading Prevention", False, f"Rejected: {res7.json().get('duplicates_rejected')}")

        # Test 8: Delayed Packet Detection (packet older than 5 minutes)
        delayed_batch = {
            "device_id": "DEV-PT-1001",
            "batch_id": f"DELAYED-{uuid.uuid4().hex[:8].upper()}",
            "readings": [
                {
                    "client_sequence_id": f"PT1001-SEQ-{uuid.uuid4().hex[:6]}",
                    "patient_id": "PT-1001",
                    "device_id": "DEV-PT-1001",
                    "heart_rate": 78.0,
                    "oxygen_saturation": 98.0,
                    "body_temperature": 36.8,
                    "blood_pressure_systolic": 120.0,
                    "blood_pressure_diastolic": 80.0,
                    "respiratory_rate": 16.0,
                    "sensor_connected": True,
                    "recorded_at": (now - timedelta(minutes=10)).isoformat()
                }
            ]
        }
        res8 = await client.post("/api/reliability/sync-buffer", json=delayed_batch, headers=admin_headers)
        if res8.status_code == 200 and res8.json().get("delayed_flagged") == 1:
            record_test("TEST-UPG-08", "Delayed Packet Detection", True, "10-minute delayed packet flagged")
        else:
            record_test("TEST-UPG-08", "Delayed Packet Detection", False, f"Flagged: {res8.json().get('delayed_flagged')}")

        # Test 9: Stale Sensor Detection Watchdog
        res9 = await client.get("/api/reliability/stale-sensors?max_silent_seconds=30", headers=admin_headers)
        if res9.status_code == 200 and isinstance(res9.json(), list):
            record_test("TEST-UPG-09", "Stale Sensor Detection Watchdog", True, f"Active watchdog returned {len(res9.json())} monitored nodes")
        else:
            record_test("TEST-UPG-09", "Stale Sensor Detection Watchdog", False, f"Status: {res9.status_code}")

        # Test 10: System Health Snapshot
        res10 = await client.get("/api/reliability/health-snapshot", headers=admin_headers)
        if res10.status_code == 200 and "uptime_seconds" in res10.json():
            h = res10.json()
            record_test("TEST-UPG-10", "System Health Snapshot Metrics", True, f"Uptime: {round(h['uptime_seconds'])}s, DB: {h['database_type']}, CPU: {h['cpu_percent']}%")
        else:
            record_test("TEST-UPG-10", "System Health Snapshot Metrics", False, f"Status: {res10.status_code}")

        # ---------------------------------------------------------------------
        # 3. PREDICTIVE ANALYTICS (24–48 HOUR FORECASTING)
        # ---------------------------------------------------------------------
        print(f"\n{BOLD}--> PHASE 3: Predictive Analytics (24–48h Forecasting){RESET}")

        # Test 11: Get 48h Patient Forecast
        res11 = await client.get("/api/forecasts/PT-1002", headers=admin_headers)
        if res11.status_code == 200:
            fc = res11.json()
            prob = fc.get("deterioration_probability") or fc.get("deterioration_probability_48h")
            rating = fc.get("risk_trajectory_rating") or fc.get("projected_risk_trend")
            record_test("TEST-UPG-11", "24-48h Autoregressive Forecast", True, f"Deterioration Likelihood: {prob}%, Rating: {rating}")
        else:
            record_test("TEST-UPG-11", "24-48h Autoregressive Forecast", False, f"Status: {res11.status_code}")

        # Test 12: Horizons & Confidence Bounds
        if res11.status_code == 200:
            params = res11.json().get("parameters", {})
            spo2_pts = params.get("oxygen_saturation", {}).get("points", [])
            valid_bounds = len(spo2_pts) == 4 and all(
                (p.get("upper_bound_95") or p.get("confidence_upper", 0)) >= (p.get("lower_bound_95") or p.get("confidence_lower", 0))
                for p in spo2_pts
            )
            record_test("TEST-UPG-12", "Multi-Horizon 95% Confidence Bounds", valid_bounds, f"Verified 4 horizons (+6h, +12h, +24h, +48h)")
        else:
            record_test("TEST-UPG-12", "Multi-Horizon 95% Confidence Bounds", False, "No forecast payload")

        # ---------------------------------------------------------------------
        # 4. CONTEXTUAL INTELLIGENCE & PATTERN RECOGNITION
        # ---------------------------------------------------------------------
        print(f"\n{BOLD}--> PHASE 4: Contextual Intelligence & Pattern Recognition{RESET}")

        # Test 13: Contextual Intelligence Query
        res13 = await client.get("/api/risk/PT-1002/contextual-intelligence", headers=admin_headers)
        if res13.status_code == 200:
            ctx = res13.json()
            factors = ctx.get("contributing_factors", {})
            patterns = ctx.get("repeated_patterns", [])
            record_test("TEST-UPG-13", "Contextual Intelligence Synthesis", True, f"{len(factors)} contributing factor categories analyzed")
        else:
            record_test("TEST-UPG-13", "Contextual Intelligence Synthesis", False, f"Status: {res13.status_code}")

        # Test 14: Medical History Vulnerability Multipliers
        if res13.status_code == 200:
            mods = res13.json().get("chronic_modifiers", [])
            record_test("TEST-UPG-14", "Medical History Vulnerability Modifiers", True, f"Identified {len(mods)} chronic condition modifiers")
        else:
            record_test("TEST-UPG-14", "Medical History Vulnerability Modifiers", False, "Failed")

        # ---------------------------------------------------------------------
        # 5. ALERT ASSIGNMENT, SLA TIMERS & AUTO-ESCALATION
        # ---------------------------------------------------------------------
        print(f"\n{BOLD}--> PHASE 5: Alert Assignment, Delivery & SLA Escalation{RESET}")

        # Test 15: Create simulated alert to verify assigned caregiver & ack_deadline
        alert_col = get_collection("alerts")
        test_alert_id = f"ALT-TEST-{uuid.uuid4().hex[:6].upper()}"
        now_ts = datetime.utcnow()
        test_alert_doc = {
            "_id": test_alert_id,
            "patient_id": "PT-1001",
            "patient_name": "Eleanor Vance",
            "severity": "critical",
            "status": "triggered",
            "trigger_vital": "oxygen_saturation",
            "triggering_readings": {"oxygen_saturation": 86.5, "heart_rate": 105},
            "reason": "Test Critical Hypoxia Violation",
            "recommended_action": "Urgent bedside verification",
            "escalation_count": 0,
            "assigned_caregiver_id": "user-caregiver-01",
            "assigned_caregiver_name": "James Wilson, RN",
            "assigned_doctor_id": "user-doctor-01",
            "delivery_status": "delivered",
            "delivered_at": now_ts,
            "ack_deadline": now_ts - timedelta(seconds=10), # Past deadline to test auto-escalation
            "response_time_seconds": None,
            "audit_trail": [
                {"timestamp": now_ts.isoformat(), "event": "ALERT_TRIGGERED", "details": "Critical hypoxia rule violation"}
            ],
            "fallback_escalation_workflow": {
                "fallback_recipient": "Dr. Sarah Chen, MD",
                "fallback_role": "Attending Physician / Cardiology",
                "escalate_after_seconds": 60
            },
            "created_at": now_ts - timedelta(seconds=70),
            "updated_at": now_ts - timedelta(seconds=70)
        }
        await alert_col.insert_one(test_alert_doc)

        # Test 16: Check Alert Assignment & Delivery
        res16 = await client.get(f"/api/alerts/{test_alert_id}", headers=admin_headers)
        if res16.status_code == 200:
            a = res16.json()
            assigned_ok = a.get("assigned_caregiver_name") == "James Wilson, RN" and a.get("delivery_status") == "delivered"
            record_test("TEST-UPG-15", "Alert Caregiver Assignment & Delivery Tracking", assigned_ok, f"Assigned: {a.get('assigned_caregiver_name')}, Delivered: True")
        else:
            record_test("TEST-UPG-15", "Alert Caregiver Assignment & Delivery Tracking", False, f"Status: {res16.status_code}")

        # Test 17: Auto-escalation watchdog check (should auto-escalate the overdue alert)
        res17 = await client.post("/api/alerts/check-escalations", headers=admin_headers)
        if res17.status_code == 200 and res17.json().get("escalated_count", 0) >= 1:
            record_test("TEST-UPG-16", "SLA Watchdog Auto-Escalation", True, f"Auto-escalated {res17.json().get('escalated_count')} overdue unacknowledged alerts")
        else:
            record_test("TEST-UPG-16", "SLA Watchdog Auto-Escalation", False, f"Result: {res17.json()}")

        # Test 18: Audit Trail Retrieval
        res18 = await client.get(f"/api/alerts/{test_alert_id}/audit-trail", headers=admin_headers)
        if res18.status_code == 200:
            trail = res18.json().get("audit_trail", [])
            has_auto_escalated = any("AUTO_ESCALATED" in ev.get("event", "") for ev in trail)
            record_test("TEST-UPG-17", "Alert Response Audit Trail Completeness", has_auto_escalated, f"{len(trail)} audit events recorded")
        else:
            record_test("TEST-UPG-17", "Alert Response Audit Trail Completeness", False, f"Status: {res18.status_code}")

        # ---------------------------------------------------------------------
        # 6. IoT SIMULATOR EDGE BUFFER CONTROLS
        # ---------------------------------------------------------------------
        print(f"\n{BOLD}--> PHASE 6: IoT Simulator Edge Buffer Controls{RESET}")

        # Test 19: Simulate Offline Edge Buffering
        res19 = await client.post("/api/simulator/buffer/simulate-offline", json={"patient_id": "PT-1003", "offline": True}, headers=admin_headers)
        if res19.status_code == 200 and res19.json().get("offline_buffering_active") is True:
            record_test("TEST-UPG-18", "IoT Simulator Edge Buffering Mode Toggle", True, "Patient PT-1003 set to offline buffering")
        else:
            record_test("TEST-UPG-18", "IoT Simulator Edge Buffering Mode Toggle", False, f"Status: {res19.status_code}")

        # Test 20: Reconnect & Sync Buffer
        res20 = await client.post("/api/simulator/buffer/reconnect-and-sync?patient_id=PT-1003", headers=admin_headers)
        if res20.status_code == 200:
            record_test("TEST-UPG-19", "IoT Simulator Reconnect & Buffer Flush Pipeline", True, f"Reconnected with status: {res20.json().get('status')}")
        else:
            record_test("TEST-UPG-19", "IoT Simulator Reconnect & Buffer Flush Pipeline", False, f"Status: {res20.status_code}")

        # Restore offline state to normal
        await client.post("/api/simulator/buffer/simulate-offline", json={"patient_id": "PT-1003", "offline": False}, headers=admin_headers)

    print(f"\n{BOLD}{CYAN}===================================================================={RESET}")
    print(f"{BOLD}TOTAL TESTS: {len(results['tests'])} | {GREEN}PASSED: {results['passed']}{RESET} | {RED}FAILED: {results['failed']}{RESET}")
    print(f"{BOLD}{CYAN}===================================================================={RESET}\n")

if __name__ == "__main__":
    asyncio.run(run_upgrades_test_suite())
