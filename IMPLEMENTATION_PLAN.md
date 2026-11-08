# MediGuard AI – Operation Ward Zero: Architecture & Implementation Plan

## 1. System Overview
MediGuard AI transforms home care into a smart hospital ward via continuous IoT vital simulation, multi-tiered AI/ML risk detection, intelligent alerting, and caregiver response tracking:
**SENSE → UNDERSTAND → PREDICT → ALERT → RESPOND**

```
+-------------------------------------------------------------+
|                     IoT SENSOR SIMULATOR                    |
|   (Python async engine - 7 clinical scenarios, 2-5s stream)  |
+------------------------------+------------------------------+
                               | (HTTP / WebSocket)
                               v
+-------------------------------------------------------------+
|                     FASTAPI BACKEND CORE                    |
|  - JWT Auth & RBAC (Admin, Doctor, Caregiver, Patient)     |
|  - Patient Digital Twin & Baseline Engine                  |
|  - Multi-Client Real-Time WebSocket Hub                    |
|  - MongoDB Atlas Client with Resilient Fallback Store       |
+---------------+------------------------------+---------------+
                |                              |
                v                              v
+-------------------------------+ +----------------------------+
|     AI/ML RISK ENGINE         | |     ALERT MANAGEMENT       |
| Layer 1: Rule-Based Clinical  | | - Severity: Low/Med/Hi/Crit|
| Layer 2: Isolation Forest     | | - Auto-escalation timer    |
| Layer 3: Risk Composite       | | - Caregiver response cycle |
| Optional: Gemini Explanations | | - Complete Audit Trail     |
+-------------------------------+ +----------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                 REACT + VITE + TAILWIND UI                  |
|  - 17 Complete Views / Dashboards                           |
|  - Recharts Vitals Trends & ECG-style Monitoring            |
|  - Real-Time WebSocket Feeds with Live Status Badges        |
|  - Audio Alarm System (w/ Mute) & Interactive Simulator Hub |
+-------------------------------------------------------------+
```

## 2. Directory Structure
```
c:\Operation ward zero\
├── backend\
│   ├── app\
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI entrypoint & router mounts
│   │   ├── config.py                  # Environment config & constants
│   │   ├── database.py                # MongoDB Atlas / async resilient repository
│   │   ├── auth.py                    # Password hashing, JWT & RBAC dependencies
│   │   ├── models\                    # Pydantic & database domain models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── patient.py
│   │   │   ├── vital.py
│   │   │   ├── risk.py
│   │   │   ├── alert.py
│   │   │   ├── caregiver.py
│   │   │   ├── device.py
│   │   │   └── medication.py
│   │   ├── api\                       # REST API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── patients.py
│   │   │   ├── vitals.py
│   │   │   ├── risk.py
│   │   │   ├── alerts.py
│   │   │   ├── caregiver.py
│   │   │   ├── devices.py
│   │   │   ├── simulator.py
│   │   │   ├── medications.py
│   │   │   └── analytics.py
│   │   ├── ml\                        # AI/ML Risk & Anomaly Engine
│   │   │   ├── __init__.py
│   │   │   ├── rule_engine.py         # Layer 1 clinical rules
│   │   │   ├── anomaly_detector.py    # Layer 2 Scikit-Learn Isolation Forest
│   │   │   ├── risk_scorer.py         # Layer 3 Composite risk & scoring
│   │   │   └── gemini_assistant.py    # Layer 4 Gemini natural language explanation
│   │   ├── services\                  # Domain services & WebSocket hub
│   │   │   ├── __init__.py
│   │   │   ├── websocket_manager.py   # RBAC & patient-filtered WebSocket broadcaster
│   │   │   ├── alert_service.py       # Alert creation, auto-escalation, notifications
│   │   │   ├── digital_twin.py        # Patient Digital Twin & baseline comparisons
│   │   │   └── seed_data.py           # Pre-seeded users, 5 patients, devices
│   │   └── tests\                     # Pytest suite
│   │       ├── __init__.py
│   │       ├── test_auth.py
│   │       ├── test_vitals.py
│   │       ├── test_risk_ml.py
│   │       └── test_alerts.py
│   ├── requirements.txt
│   └── run.py
├── simulator\
│   ├── __init__.py
│   ├── sensor_engine.py               # Synthetic vital generator (7 clinical scenarios)
│   ├── device_runner.py               # Standalone runner / API-driven streaming
│   └── scenarios.py                   # Predefined clinical presets
├── frontend\
│   ├── src\
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── api\client.js              # Axios with JWT interceptors
│   │   ├── context\AuthContext.jsx    # User role & session state
│   │   ├── context\WebSocketContext.jsx # Real-time stream & live alerts
│   │   ├── context\AlertSoundContext.jsx # Hospital audio alert manager
│   │   ├── components\                # Shared UI elements
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── DemoBanner.jsx
│   │   │   ├── VitalGauge.jsx
│   │   │   ├── AlertBadge.jsx
│   │   │   ├── VitalChart.jsx
│   │   │   ├── SimulatorDrawer.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── pages\                     # All 17 core views
│   │       ├── LandingPage.jsx
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── AdminDashboard.jsx
│   │       ├── DoctorDashboard.jsx
│   │       ├── CaregiverDashboard.jsx
│   │       ├── PatientDashboard.jsx
│   │       ├── PatientDirectory.jsx
│   │       ├── PatientDetails.jsx
│   │       ├── LiveMonitoring.jsx
│   │       ├── AIRiskAnalysis.jsx
│   │       ├── AlertManagement.jsx
│   │       ├── CaregiverHistory.jsx
│   │       ├── MedicationManagement.jsx
│   │       ├── DeviceManagement.jsx
│   │       ├── ReportsAnalytics.jsx
│   │       └── UserSettings.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── .env.example
└── README.md
```

## 3. Phased Execution Roadmap
- **Phase 1**: Architecture validation, directory structure, core configuration.
- **Phase 2**: Backend setup, JWT Auth, RBAC, MongoDB Atlas client with async resilient fallback, Patient CRUD.
- **Phase 3**: IoT sensor simulator with 7 scenarios, realistic vital synthesis, REST & WebSocket ingestion.
- **Phase 4**: 3-layer AI/ML risk detection engine (Clinical safety rules, Isolation Forest, Risk Composite).
- **Phase 5**: React + Tailwind + Recharts frontend, real-time WebSocket bindings, 17 responsive views.
- **Phase 6**: Intelligent alert management, caregiver response workflow, escalation timers, audio alarms.
- **Phase 7**: Patient Digital Twin & Gemini AI Health Assistant integration.
- **Phase 8**: Security hardening, audit logs, comprehensive automated test suite.
- **Phase 9**: Seed demo data (5 patients, demo credentials), complete README & setup docs.
