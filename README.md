# MediGuard AI – Operation Ward Zero
> **Transforming Ordinary Patient Bedrooms into Simulated Smart Hospital Wards**  
> *SENSE &rarr; UNDERSTAND &rarr; PREDICT &rarr; ALERT &rarr; RESPOND*

[![Live Prototype](https://img.shields.io/badge/Live%20Demo-Vercel%20Production-0ea5e9?style=for-the-badge&logo=vercel&logoColor=white)](https://frontend-fawn-eight-96.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Tests-19%2F19%20Passed%20(100%25)-emerald?style=for-the-badge&logo=pytest)](test_upgrades.py)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Frontend: React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)

🏥 **Live Production Application**: [https://frontend-fawn-eight-96.vercel.app/](https://frontend-fawn-eight-96.vercel.app/)  
⚡ **Instant Demo Access**: 1-click passwordless login on the top banner as **Doctor**, **Caregiver**, **Admin**, or **Patient**.  
🎬 **Judges' 5-Minute Walkthrough**: [Read the Interactive Hackathon Demonstration Script](HACKATHON_DEMO_GUIDE.md)

---

## 1. Executive Summary & Problem Statement

Hospitals utilize continuous cardiopulmonary telemetry, intensive care early warning scores (NEWS2/MEWS), and rapid response teams to identify physiological deterioration hours before catastrophic events occur. At home or in unmonitored subacute beds, vulnerable patients frequently deteriorate unnoticed.

**MediGuard AI (Operation Ward Zero)** bridges this critical gap. It is an end-to-end healthcare technology platform that streams synthetic multi-parameter IoT telemetry, compares incoming signals against personalized **Patient Digital Twins**, predicts instability using a **Contextual AI/ML Risk Engine**, forecasts 24–48 hour physiological trajectories with uncertainty confidence bounds, guarantees system reliability through offline buffering and duplicate rejection, verifies caregiver GPS bedside attendance, and orchestrates intelligent alarm escalation with complete auditability.

---

## 2. Core Architecture: SENSE &rarr; UNDERSTAND &rarr; PREDICT &rarr; ALERT &rarr; RESPOND

```
  +-----------------------------------------------------------------------------------------+
  |                                         SENSE                                           |
  |  Python IoT Sensor Engine & Edge Hardware Gateway Simulator                             |
  |  - Heart Rate, SpO2, Temperature, Blood Pressure Sys/Dia, Respiratory Rate (0.33 Hz)   |
  |  - Offline Edge Buffering: Buffers readings during Wi-Fi drops; auto-flushes on reconnect|
  |  - Sensor Disconnection & Stale Sensor Watchdog Detection                               |
  +-------------------------------------------+---------------------------------------------+
                                              | (HTTP REST / WebSocket / Edge Buffer Sync)
                                              v
  +-----------------------------------------------------------------------------------------+
  |                                       UNDERSTAND                                        |
  |  FastAPI Backend Core & Resilient Telemetry Ingestion Pipeline                          |
  |  - MongoDB Atlas Cloud Integration (Indexed collections with Resilient Store Fallback)  |
  |  - Duplicate Reading Prevention via Client Sequence IDs & Timestamp De-duplication     |
  |  - Patient Digital Twins: Personalized Baselines vs Population Norms                    |
  +-------------------------------------------+---------------------------------------------+
                                              |
                                              v
  +-----------------------------------------------------------------------------------------+
  |                                         PREDICT                                         |
  |  Contextual Intelligence & Predictive Forecasting Engines                               |
  |  • Layer 1: Deterministic Clinical Rules (Hypoxia, Malignant Tachycardia, Shock)       |
  |  • Layer 2: Scikit-Learn Isolation Forest (Unsupervised Multidimensional Anomaly Metric)|
  |  • Layer 3: Contextual Intelligence Engine (Vitals + Medical History + Patterns + Notes)|
  |  • Layer 4: 24–48h Autoregressive Forecasting (+6h, +12h, +24h, +48h w/ 95% CI Bounds)  |
  |  • Layer 5: Groq LLaMA-3.3-70B Ultra-Fast Natural Language Clinical Explanations        |
  +-------------------------------------------+---------------------------------------------+
                                              |
                                              v
  +-----------------------------------------------------------------------------------------+
  |                                          ALERT                                          |
  |  Intelligent Alarm Management & Escalation Engine                                       |
  |  • Severities: LOW, MODERATE, HIGH, CRITICAL                                            |
  |  • Responsible Caregiver Assignment & Notification Delivery Tracking                    |
  |  • Dynamic SLA Countdown Timers (60s/90s/180s response deadlines)                       |
  |  • SLA Watchdog: Auto-Escalation to On-Call Physician on Unacknowledged Breaches         |
  |  • IEC 60601-1-8 Synthetic Hospital Chimes & Alarm Audio                                |
  +-------------------------------------------+---------------------------------------------+
                                              |
                                              v
  +-----------------------------------------------------------------------------------------+
  |                                         RESPOND                                         |
  |  Caregiver Operations Hub & Real-Time React Telemetry Wall                              |
  |  • GPS Geofenced Bedside Attendance Check-In / Check-Out                                |
  |  • Response Time Analytics & SLA Adherence Gauges                                       |
  |  • Bedside Intervention Logging & Verifiable Audit Trail                                |
  |  • 21 Dedicated Clinical Views & Dashboards                                             |
  +-----------------------------------------------------------------------------------------+
```

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts (Confidence Envelopes, Multi-Series Trends), Lucide React, Native WebSocket Client, Web Audio API telemetry chimes.
- **Backend**: Python 3.11, FastAPI, Pydantic v2, WebSockets, PyJWT, Passlib, Bcrypt, PyMongo, PSUTIL, Resilient Document Store.
- **AI/ML Engine**: Scikit-Learn (`IsolationForest`), NumPy, Pandas, Autoregressive Time-Series Drift Modeling, Groq LLaMA-3.3-70B API integration (with deterministic clinical fallback).
- **IoT Simulator**: Multi-patient continuous sensor generator, offline buffer simulation, network drop injection, 7 clinical crisis scenarios, manual slider overrides.
- **Database**: MongoDB Atlas Cloud (`mediguard_db`) with indexed collections + Automatic local resilient file-backed fallback (`data/mediguard_db.json`).

---

## 4. Upgraded Capabilities (Operation Ward Zero Hackathon)

### 1. Caregiver Management & GPS Attendance
- **GPS Bedside Check-In/Check-Out**: Validates caregiver coordinates against the Ward Zero geofence perimeter (Lat: 37.7749, Lon: -122.4194, Accuracy: ±4.2m).
- **Shift Rostering**: Tracks Day, Evening, Night Telemetry, and Rapid On-Call shifts with live elapsed duration timers.
- **Performance Analytics**: Computes average acknowledgment latency (seconds), SLA compliance percentage, and tracks bedside interventions.
- **Missed Attendance Detection**: Identifies overdue check-ins and unacknowledged alerts.

### 2. System Reliability & Offline Edge Buffering
- **Offline Sensor Data Buffering**: Simulated hardware gateways buffer readings during Wi-Fi drops and synchronize automatically when reconnected.
- **Duplicate Reading Prevention**: Discards duplicate packets matching client sequence IDs (`PT-100X-SEQ-NNNN`) or identical timestamps.
- **Delayed Packet Flagging**: Detects and tags telemetry packets delayed by more than 5 minutes during transmission.
- **Stale Sensor Watchdog**: Detects silent devices exceeding the 15-second ping threshold.
- **System Health Dashboard**: Live monitoring of CPU utilization, RAM usage, WebSocket client count, uptime, and database status.

### 3. Contextual Intelligence & Explainable AI
- **Multi-Source Data Fusion**: Evaluates incoming vitals against historical trends, patient medical history (e.g. COPD, CHF, Diabetes), allergies, and recent caregiver clinical notes.
- **Repeated Pattern Recognition**: Identifies cyclic nocturnal desaturation clusters and compensatory tachycardia patterns.
- **Contributing Factors Breakdown**: Displays percentage weights of physiological deviations driving risk scores.
- **Groq LLaMA-3.3-70B Assistant**: Generates sub-second, clinically sound explanations and recommended action protocols.

### 4. Predictive Analytics (24–48 Hour Forecasting)
- **Multi-Horizon Autoregressive Drift**: Projects vital parameters at +6h, +12h, +24h, and +48h horizons with 95% confidence intervals.
- **Deterioration Probability Meter**: Quantitative risk likelihood (0–100%) indicating impending decompensation.
- **Feature Importance Weights**: Explainable drivers behind deterioration projections.
- **Mandatory Non-Clinical Disclaimer**: Clear research notice indicating predictions are for trend demonstration and not clinically validated.

### 5. Alert Management & SLA Auto-Escalation
- **Responsible Caregiver Assignment**: Automatically assigns triggered alerts to the responsible nurse/caregiver (`assigned_caregiver_name`).
- **Delivery Verification**: Tracks delivery status (`delivered`) over WebSockets.
- **SLA Countdown Timer**: Enforces response deadlines (60s for Critical, 90s for High, 180s for Moderate).
- **Auto-Escalation Fallback**: Watchdog scans for overdue unacknowledged alerts and automatically escalates them to the attending physician (`Dr. Sarah Chen, MD`).
- **Complete Audit Trail**: Immutable chronological log of trigger, delivery, acknowledgment, escalation, and resolution events.

---

## 5. Role-Based Access Control & Demo Accounts

| Role | Demo Email | Demo Password | Persona | Primary Access & Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@mediguard.ai` | `AdminPass123!` | Dr. Arthur Pendelton | Full system governance, user RBAC, reliability health metrics, global audit trail. |
| **Doctor** | `doctor@mediguard.ai` | `DoctorPass123!` | Dr. Sarah Chen, MD | Cardiology overview, patient digital twins, clinical notes, predictive forecasts. |
| **Caregiver** | `caregiver@mediguard.ai` | `CaregiverPass123!` | James Wilson, RN | Bedside triage, GPS check-in/out, SLA alert acknowledgment, observation logging. |
| **Patient** | `patient@mediguard.ai` | `PatientPass123!` | Eleanor Vance (PT-1001) | Personal health gauges, medication reminders, emergency assistance call button. |

---

## 6. All 21 Dedicated Healthcare Views & Dashboards

1. **Landing Page** (`/`): Architectural overview, SENSE&rarr;RESPOND workflow, 1-click role login.
2. **Login Page** (`/login`): Authentication with pre-fill demo role selectors.
3. **Registration Page** (`/register`): Role-based practitioner and patient onboarding.
4. **Admin Dashboard** (`/dashboard/admin`): System overview KPIs, user RBAC table, live event stream.
5. **Doctor Dashboard** (`/dashboard/doctor`): Assigned patient cards with live vitals, risk bars, recent alerts.
6. **Caregiver Dashboard** (`/dashboard/caregiver`): Bedside triage matrix, active unack alerts, 1-click Acknowledge/Escalate.
7. **Patient Dashboard** (`/dashboard/patient`): Personal health gauges, medication schedule, "Call Caregiver" button.
8. **Patient Directory** (`/patients`): Searchable, filterable patient roster, "Register New Patient" modal.
9. **Patient Details & Digital Twin** (`/patients/:id`): Demographics, baseline target comparisons, Recharts telemetry trends, clinician baseline adjustment.
10. **Live Monitoring Dashboard** (`/live`): Central ICU Telemetry Wall with pulsing ECG indicators, SpO2 bars, risk category filters.
11. **AI Risk Analysis** (`/ai-risk`): 3-Layer engine breakdown (Rules, Isolation Forest, Composite Score) + Contextual Intelligence + Groq LLaMA-3 Assistant.
12. **Alert Management** (`/alerts`): Central alarm table, assigned caregivers, SLA countdowns, auto-escalation watchdog, audit trail modal.
13. **Caregiver Attendance** (`/attendance`): **[NEW]** GPS geofence shift terminal, active ward roster, duration timer, audit log.
14. **Caregiver Performance** (`/caregiver-performance`): **[NEW]** Acknowledgment latency analytics, SLA adherence charts, bedside activity stream.
15. **System Reliability** (`/reliability`): **[NEW]** Hardware buffer simulator, duplicate rejection counter, stale sensor watchdog, sync audit log.
16. **Predictive Analytics** (`/forecasts`): **[NEW]** 24–48h autoregressive forecasting, 95% confidence envelopes, deterioration probability meter.
17. **Caregiver Response History** (`/caregiver-history`): Bedside observation audit log, patient contacts, escalation notes.
18. **Medication Management** (`/medications`): Prescription dosages, schedules, "Confirm Intake" tracking.
19. **Device & Sensor Management** (`/devices`): Telemetry hardware fleet, online/offline status, battery levels, lead off simulation.
20. **Reports & Analytics** (`/reports`): Acuity pie chart, 24-hr alarm incident frequency, text report export.
21. **User Settings** (`/settings`): Profile information, password update form, deployment environment metrics.

---

## 7. Database Collections & Schema

MediGuard AI connects directly to MongoDB Atlas (`mediguard_db`) with indexed collections:

- `users`: User authentication, hashed passwords, RBAC roles (`admin`, `doctor`, `caregiver`, `patient`).
- `patients`: Clinical profiles, medical histories, baselines, assigned doctors & caregivers.
- `devices`: Telemetry units, hardware firmware version, battery %, last ping timestamp.
- `vital_readings`: Real-time multi-parameter telemetry stream with compound indexes.
- `risk_assessments`: Scored anomaly records (rule violations, Isolation Forest score, composite acuity).
- `alerts`: Active & resolved alarms with assigned caregivers, delivery status, SLA deadlines, audit trails.
- `caregiver_attendance`: **[NEW]** Shift check-in/out records, GPS coordinates, geofence compliance, elapsed duration.
- `caregiver_activity`: **[NEW]** Verified bedside interventions, observation notes, medication administration events.
- `sensor_buffer`: **[NEW]** Edge buffer queue for offline ingestion resilience.
- `synchronization_logs`: **[NEW]** Ingestion batch reports, duplicate rejection tallies, packet delay metrics.
- `system_health_logs`: **[NEW]** CPU, memory, database latency, and active WebSocket client snapshots.
- `forecasts`: **[NEW]** 48-hour projected vital trajectories, confidence intervals, and feature importance weights.
- `medications`: Scheduled prescriptions, dosage, timing, and caregiver administration verification.
- `clinical_notes`: Physician notes and caregiver handover logs.
- `audit_logs`: Immutable security and clinical action audit trail.

---

## 8. Automated Testing & Verification

MediGuard AI includes automated test suites covering all functionalities:

```powershell
# Run the Comprehensive Upgrades Test Suite (19/19 Passed, 100%)
python test_upgrades.py

# Run Full System Integration Test Suite
python -u backend/test_runner.py
```

### Test Coverage Highlights:
- **GPS Attendance & Shift Handover**: Verified geofence check-in, duration calculation, and shift history.
- **Edge Buffering & Duplicate Rejection**: 100% duplicate packet prevention; delayed packets (>5m) flagged.
- **SLA Watchdog Auto-Escalation**: Overdue unacknowledged alerts escalated to fallback attending physician.
- **Predictive Forecasting**: Verified 4-horizon trajectory modeling (+6h, +12h, +24h, +48h) with valid 95% confidence intervals.
- **Contextual Intelligence**: Validated comorbid condition modifiers and repeated pattern recognition.

---

## 9. Quick Start Guide

### 1. Start the Backend
```powershell
python -u backend/run.py
```
*FastAPI runs on `http://localhost:8000` connected to MongoDB Atlas and streaming IoT telemetry.*

### 2. Start the Frontend
```powershell
cd frontend
npm run dev
```
*Vite runs on `http://localhost:5173`.*

### 3. Open Application
Navigate to `http://localhost:5173`. Use the **1-Click Demo Login Bar** on top to instantly sign in as **Caregiver**, **Doctor**, **Admin**, or **Patient**.

---

## 10. Safety & Compliance Notice

> **CLINICAL NOTICE**: MediGuard AI is a software prototype designed for clinical telemetry simulation and healthcare workflow demonstration for the Operation Ward Zero hackathon. Machine learning risk scores and predictive forecasting do not substitute for certified clinical judgment, medical diagnosis, or licensed emergency protocols. In acute distress, follow standard hospital escalation protocols immediately.
