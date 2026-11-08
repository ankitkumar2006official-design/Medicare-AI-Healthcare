# MediGuard AI – Operation Ward Zero: API Documentation

This document provides a comprehensive specification of all REST endpoints and real-time WebSocket channels implemented in MediGuard AI.

---

## 1. Authentication & Security Specifications

All endpoints under `/api/` (except `/api/auth/login`, `/api/auth/register`, and `/api/health`) require a valid JSON Web Token (JWT) supplied in the HTTP Authorization header:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

Role-Based Access Control (RBAC) levels:
- `admin`: System administration, global configuration, user management, and health telemetry.
- `doctor`: Clinical review, patient history, risk assessment, clinical notes, and alert escalation.
- `caregiver`: Bedside triage, GPS attendance check-in/out, activity logging, and alert acknowledgment.
- `patient`: Personal health dashboard, baseline vitals, and assistance dispatch.

---

## 2. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/login`
Authenticates a user and issues an HMAC-SHA256 JWT access token.
- **Request Body**:
  ```json
  {
    "email": "doctor@mediguard.ai",
    "password": "DoctorPass123!"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "token_type": "bearer",
    "user": {
      "id": "user-doctor-01",
      "email": "doctor@mediguard.ai",
      "full_name": "Dr. Sarah Chen, MD",
      "role": "doctor",
      "assigned_patient_ids": ["PT-1001", "PT-1002", "PT-1003", "PT-1004", "PT-1005"]
    }
  }
  ```

### `POST /api/auth/register`
Onboards a new practitioner or patient.
- **Request Body**:
  ```json
  {
    "email": "nurse.davis@mediguard.ai",
    "password": "SecurePassword123!",
    "full_name": "Nurse Kelly Davis, BSN",
    "role": "caregiver",
    "phone": "+1-800-555-0199"
  }
  ```
- **Response (`201 Created`)**

### `GET /api/auth/me`
Retrieves current authenticated profile from the validated token session.

---

## 3. Patient Management & Digital Twins (`/api/patients`)

### `GET /api/patients`
Retrieves list of patients accessible under current user role permissions.
- **Query Parameters**: `search` (string), `risk_filter` (string: `critical`, `high`, `moderate`, `stable`).

### `GET /api/patients/{id}`
Retrieves complete clinical profile, emergency contacts, medical history, baseline vital sign thresholds, and current room assignment.

### `GET /api/patients/{id}/twin`
Returns the **Patient Digital Twin** model including:
- Baseline personalized vitals vs standard population norms.
- Historical vital trends across 5 parameters.
- Active prescriptions and recent clinician notes.
- Real-time Physiological Stability Index (PSI) score, trend trajectory, and MAP.

### `GET /api/patients/{id}/stability-index`
Calculates a dynamic, clinically-weighted Physiological Stability Index (0.0 - 100.0%) comparing live biometric signals against patient-specific baselines and clinical reference norms.
- **Response (`200 OK`)**:
  ```json
  {
    "patient_id": "PT-1001",
    "stability_score": 96.5,
    "stability_category": "Optimal Stability",
    "trend_direction": "stable",
    "trend_delta": 0.0,
    "mean_arterial_pressure": 93.3,
    "parameters": {
      "oxygen_saturation": {
        "parameter": "Oxygen Saturation (SpO2)",
        "current_value": 98.0,
        "target_baseline_range": { "min": 95.0, "max": 100.0 },
        "population_norm_range": { "min": 95.0, "max": 100.0 },
        "deviation_percentage": 0.0,
        "status": "optimal",
        "clinical_note": "Oxygen saturation 98.0% satisfies target baseline (≥95%)."
      }
    },
    "contributing_factors": [
      "All vital signs within clinician target baseline boundaries."
    ],
    "timestamp": "2026-11-09T04:15:00Z"
  }
  ```

### `POST /api/patients/{id}/assign-caregiver`
Allows clinicians or administrators to dynamically assign or reallocate primary caregivers to a patient with an authenticated audit trail.
- **Request Body**:
  ```json
  {
    "caregiver_id": "user-caregiver-01",
    "caregiver_name": "Nurse Kelly Davis, RN",
    "reason": "Shift handover"
  }
  ```

### `POST /api/patients/{id}/notes`
Adds a clinician observation or caregiver shift note to the patient's record.
- **Request Body**:
  ```json
  {
    "author_name": "Dr. Sarah Chen, MD",
    "note": "Patient exhibits mild exertional dyspnea; titrating supplemental O2."
  }
  ```

---

## 4. Caregiver Operations & GPS Attendance (`/api/caregivers`)

### `POST /api/caregivers/attendance/check-in`
Verifies GPS coordinates against the hospital/home ward geofence and starts duty shift timer.
- **Request Body**:
  ```json
  {
    "caregiver_id": "user-caregiver-01",
    "patient_id": "PT-1001",
    "shift_type": "day",
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "accuracy_meters": 4.2,
      "address_label": "Ward Zero Central Residence Room 101, San Francisco, CA",
      "within_geofence": true
    },
    "notes": "Morning vitals check and telemetry lead inspection."
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "id": "att-42b78b0f-5007-4f65-a3fb",
    "caregiver_id": "user-caregiver-01",
    "caregiver_name": "James Wilson, RN",
    "patient_id": "PT-1001",
    "shift_type": "day",
    "status": "checked_in",
    "check_in_time": "2026-11-09T02:40:00Z",
    "duration_minutes": null
  }
  ```

### `POST /api/caregivers/attendance/check-out`
Records caregiver shift conclusion, calculates total on-duty minutes, and logs handover notes.
- **Request Body**:
  ```json
  {
    "attendance_id": "att-42b78b0f-5007-4f65-a3fb",
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "accuracy_meters": 4.5,
      "within_geofence": true
    },
    "notes": "Shift complete. Telemetry leads functioning normally. Handover to evening nurse."
  }
  ```

### `GET /api/caregivers/attendance/history`
Returns historical check-in records filtered by caregiver or patient.

### `POST /api/caregivers/activity`
Logs a timestamped bedside intervention (manual vitals validation, alert acknowledgment, patient repositioning).

### `GET /api/caregivers/analytics/performance`
Computes caregiver SLA response-time metrics.
- **Response (`200 OK`)**:
  ```json
  {
    "caregiver_id": "user-caregiver-01",
    "caregiver_name": "James Wilson, RN",
    "total_alerts_acknowledged": 34,
    "avg_ack_time_seconds": 34.2,
    "sla_compliance_rate_percent": 96.8,
    "missed_attendance_count": 0,
    "evaluated_at": "2026-11-09T03:00:00Z"
  }
  ```

---

## 5. System Reliability & Offline Edge Buffering (`/api/reliability`)

### `POST /api/reliability/sync-buffer`
Synchronizes an offline batch of sensor telemetry accumulated during network drops.
- **Request Body**:
  ```json
  {
    "device_id": "DEV-PT-1001",
    "batch_id": "BATCH-B30E68F9",
    "readings": [
      {
        "client_sequence_id": "PT1001-SEQ-1045",
        "patient_id": "PT-1001",
        "device_id": "DEV-PT-1001",
        "heart_rate": 76.0,
        "oxygen_saturation": 98.0,
        "body_temperature": 36.8,
        "blood_pressure_systolic": 118.0,
        "blood_pressure_diastolic": 78.0,
        "respiratory_rate": 15.0,
        "recorded_at": "2026-11-09T02:50:00Z"
      }
    ]
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "batch_id": "BATCH-B30E68F9",
    "total_received": 1,
    "new_ingested": 1,
    "duplicates_rejected": 0,
    "delayed_flagged": 0,
    "synced_at": "2026-11-09T02:50:05Z"
  }
  ```

### `GET /api/reliability/stale-sensors`
Watchdog query detecting sensors that have stopped sending heartbeats beyond a specified threshold (`max_silent_seconds=15`).

### `GET /api/reliability/health-snapshot`
Live system health metrics: CPU utilization, memory usage, server uptime, active WebSocket connections, and database status.

---

## 6. Predictive Analytics (24–48h Forecasting) (`/api/forecasts`)

### `GET /api/forecasts/{patient_id}`
Generates a multi-horizon autoregressive physiological forecast (+6h, +12h, +24h, +48h) with 95% uncertainty confidence intervals and quantitative deterioration probability (0–100%).
- **Response (`200 OK`)**:
  ```json
  {
    "patient_id": "PT-1002",
    "patient_name": "Marcus Rodriguez",
    "forecast_window_hours": 48,
    "deterioration_probability_24h": 58.0,
    "deterioration_probability_48h": 70.0,
    "projected_risk_trend": "HIGH_RISK_DETERIORATION",
    "parameters": {
      "oxygen_saturation": {
        "parameter": "Oxygen Saturation (SpO2)",
        "unit": "%",
        "current_value": 85.4,
        "trajectory": "deteriorating",
        "points": [
          {"horizon_hours": 6.0, "predicted_value": 84.1, "confidence_lower": 82.1, "confidence_upper": 86.1},
          {"horizon_hours": 12.0, "predicted_value": 83.2, "confidence_lower": 80.4, "confidence_upper": 86.0},
          {"horizon_hours": 24.0, "predicted_value": 82.0, "confidence_lower": 78.0, "confidence_upper": 86.0},
          {"horizon_hours": 48.0, "predicted_value": 80.5, "confidence_lower": 74.8, "confidence_upper": 86.2}
        ]
      }
    },
    "contributing_feature_weights": {
      "spo2_downward_drift": 0.42,
      "tachycardia_compensation": 0.28,
      "chronic_copd_vulnerability": 0.18,
      "respiratory_variability": 0.12
    },
    "disclaimer": "RESEARCH NOTICE: This 24–48 hour physiological forecast is experimental and generated using synthetic time-series trends. Designed for proactive caregiver preparedness."
  }
  ```

---

## 7. Contextual Intelligence & Risk Engine (`/api/risk`)

### `GET /api/risk/{patient_id}/contextual-intelligence`
Combines current telemetry with patient medical history, comorbidity vulnerability multipliers, repeated pattern recognition, and caregiver observations.

### `POST /api/risk/{patient_id}/explain`
Executes an ultra-fast query to the **Groq LLaMA-3.3-70B Assistant** for explainable clinical insights and recommended bedside protocols.

---

## 8. Alarm Management & Escalation Engine (`/api/alerts`)

### `GET /api/alerts`
Retrieves alarm records filtered by `patient_id`, `severity` (`critical`, `high`, `moderate`, `low`), and `status` (`triggered`, `acknowledged`, `escalated`, `resolved`).

### `POST /api/alerts/{id}/acknowledge`
Caregiver bedside acknowledgment. Records timestamp and computes `response_time_seconds`.

### `POST /api/alerts/{id}/escalate`
Escalates unacknowledged alert to on-call physician with clinical justification.

### `POST /api/alerts/check-escalations`
SLA Watchdog scan that evaluates active alerts against their SLA deadline timers (60s/90s/180s) and automatically escalates breaches to the fallback attending doctor.

### `GET /api/alerts/{id}/audit-trail`
Returns the complete chronological event audit trail for an alert (trigger, notification delivery, acknowledgment, escalation, resolution).

---

## 9. Real-Time Telemetry Channels (`/ws`)

### `WebSocket /ws?token={jwt}`
Bidirectional low-latency streaming channel.
- **Client Actions**:
  - `{"action": "subscribe_patient", "patient_id": "PT-1002"}`
  - `{"action": "ping"}`
- **Server Events**:
  - `vital_reading`: Emitted every 3 seconds with updated sensor parameters.
  - `alert_created`: Emitted immediately upon safety rule or ML anomaly detection.
  - `alert_acknowledged`: Broadcasts caregiver response status.
  - `alert_escalated`: Broadcasts physician escalation notice.

