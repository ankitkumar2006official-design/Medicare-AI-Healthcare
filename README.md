# MediGuard AI – Operation Ward Zero
> **Transforming Ordinary Patient Bedrooms into Simulated Smart Hospital Wards**  
> *SENSE &rarr; UNDERSTAND &rarr; PREDICT &rarr; ALERT &rarr; RESPOND*

---

## 1. Executive Summary & Problem Statement

Hospitals utilize continuous cardiopulmonary telemetry, intensive care early warning scores (NEWS2/MEWS), and rapid response teams to identify physiological deterioration hours before catastrophic events occur. At home or in unmonitored subacute beds, vulnerable patients frequently deteriorate unnoticed.

**MediGuard AI (Operation Ward Zero)** bridges this critical gap. It is an end-to-end healthcare technology platform that streams synthetic multi-parameter IoT telemetry, compares incoming signals against personalized **Patient Digital Twins**, predicts instability using a **3-Layer AI/ML Risk Engine** (Clinical Safety Redlines + Scikit-Learn Isolation Forest Anomaly Detection + Composite Risk Scoring), triggers prioritized hospital-grade alarms (IEC 60601-1-8 audio chimes), and orchestrates caregiver bedside responses with a complete audit trail.

---

## 2. Core Architecture: SENSE &rarr; UNDERSTAND &rarr; PREDICT &rarr; ALERT &rarr; RESPOND

```
  +-------------------------------------------------------------------------+
  |                                  SENSE                                  |
  |  Python IoT Sensor Engine & Standalone Telemetry Transmitters           |
  |  (Heart Rate, SpO2, Temp, BP Sys/Dia, Resp Rate every 2-5 seconds)      |
  +------------------------------------+------------------------------------+
                                       | (HTTP REST / WebSocket)
                                       v
  +-------------------------------------------------------------------------+
  |                               UNDERSTAND                                |
  |  FastAPI Backend Core & Patient Digital Twins                           |
  |  - MongoDB Atlas (with zero-config Resilient Document Store Fallback)   |
  |  - Personalized Patient Baselines vs Population Norms                   |
  +------------------------------------+------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  |                                 PREDICT                                 |
  |  3-Layer AI/ML Risk Engine                                              |
  |  • Layer 1: Deterministic Clinical Rules (Hypoxia, Tachycardia, Shock)  |
  |  • Layer 2: Scikit-learn Isolation Forest (Unsupervised Anomaly Metric) |
  |  • Layer 3: Composite Physiological Risk Scorer (0 - 100)               |
  |  • Optional Layer 4: Google Gemini Natural-Language Telemetry Analysis  |
  +------------------------------------+------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  |                                  ALERT                                  |
  |  Intelligent Alarm Manager                                              |
  |  • Severities: LOW, MODERATE, HIGH, CRITICAL                            |
  |  • IEC 60601-1-8 Synthetic Hospital Chime & Alarm Audio (w/ Mute)       |
  |  • Auto-Deduplication & Escalation Timers                               |
  +------------------------------------+------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  |                                 RESPOND                                 |
  |  Caregiver Response Station & Real-Time React Telemetry Wall            |
  |  • 1-Click Acknowledge, Bedside Observation Logging, Physician Escalate |
  |  • 17 Dedicated Healthcare Views / Responsive Dashboards                |
  +-------------------------------------------------------------------------+
```

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide React, Native WebSocket client, HTML5 Web Audio API telemetry chimes.
- **Backend**: Python 3.11, FastAPI, Pydantic v2, WebSockets, PyJWT, Passlib, Bcrypt, PyMongo, Resilient Document Store.
- **AI/ML Engine**: Scikit-Learn (`IsolationForest`), NumPy, Pandas, Google Gemini API integration (with deterministic clinical fallback).
- **IoT Simulator**: Python multi-patient sensor stream generator with 7 clinical deterioration scenarios and live interactive manual parameter overrides.
- **Database**: MongoDB Atlas support + Automatic local resilient file-backed document database fallback (`data/mediguard_db.json`).

---

## 4. Role-Based Access Control & Demo Accounts

MediGuard AI provides 4 authenticated roles. The application includes a **1-Click Demo Mode Switcher** located on the top banner for instant testing:

| Role | Demo Email | Demo Password | Clinical Persona | Primary Access & Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@mediguard.ai` | `AdminPass123!` | Dr. Arthur Pendelton | Full system governance, user management, global threshold tuning, audit trail. |
| **Doctor** | `doctor@mediguard.ai` | `DoctorPass123!` | Dr. Sarah Chen, MD | Cardiology overview, patient digital twins, clinical notes, baseline adjustment. |
| **Caregiver** | `caregiver@mediguard.ai` | `CaregiverPass123!` | James Wilson, RN | Bedside triage, real-time alert acknowledgement, observation logging, escalation. |
| **Patient** | `patient@mediguard.ai` | `PatientPass123!` | Eleanor Vance (PT-1001) | Personal health gauges, medication reminders, emergency assistance call button. |

---

## 5. Seven Predefined Clinical Scenarios (IoT Simulator)

The built-in Python IoT sensor engine runs continuously in the background and can be controlled via the interactive **IoT Simulator Hub** drawer (top navigation bar):

1. **Scenario 1: Healthy Patient** &ndash; Stable vitals with natural respiratory sinus arrhythmia (HR: 72 BPM, SpO2: 98.5%, Temp: 36.7°C, BP: 118/76 mmHg).
2. **Scenario 2: Falling Oxygen Saturation** &ndash; Gradual hypoxemic deterioration; SpO2 drifts from 97% down towards 85% with compensatory mild tachycardia.
3. **Scenario 3: Elevated Heart Rate (Tachycardia / AFib)** &ndash; Sudden onset arrhythmia; heart rate accelerates to 135–150 BPM.
4. **Scenario 4: High Fever & Pyrexia** &ndash; Acute pyrexia escalation; body temperature climbs to 39.5°C accompanied by tachycardia and flushing.
5. **Scenario 5: Respiratory Distress** &ndash; Severe tachypnea; respiratory rate climbs to 32 breaths/min with dropping oxygen saturation.
6. **Scenario 6: Multiple Vital Abnormalities (Septic Shock / Crisis)** &ndash; Multi-system failure: hypotension (82/52 mmHg), tachycardia (132 BPM), hyperthermia (39.4°C), SpO2 (86.5%).
7. **Scenario 7: Sensor Disconnection / Lead Off** &ndash; Telemetry leads detach; signal quality drops to 0.0 with offline alarm broadcast.

Reviewers can also use the **Live Demonstration Manual Overrides** to inject arbitrary numbers (e.g., HR = 160 or SpO2 = 82) to see immediate AI risk scoring.

---

## 6. Pre-Seeded Synthetic Patients

1. **`PT-1001` &ndash; Eleanor Vance (Age 74, Female)**: Congestive Heart Failure Stage B, Essential Hypertension. Room: *Ward A - Suite 101*.
2. **`PT-1002` &ndash; Marcus Rodriguez (Age 58, Male)**: Post-Operative CABG x3 (Day 6), Type 2 Diabetes. Room: *Ward A - Suite 102*.
3. **`PT-1003` &ndash; Beatrice Campbell (Age 82, Female)**: Severe COPD GOLD 3, Home Oxygen Therapy. Room: *Ward B - Suite 201*.
4. **`PT-1004` &ndash; David Chen (Age 46, Male)**: Right Lower Lobe Bacterial Pneumonia, Asthma. Room: *Ward B - Suite 202*.
5. **`PT-1005` &ndash; Aisha Patel (Age 67, Female)**: Paroxysmal Atrial Fibrillation, Chronic Kidney Disease Stage 3. Room: *Ward C - Suite 301*.

---

## 7. All 17 Completed Views & Pages

1. **Landing Page** (`/`): Product overview, architecture diagram, 1-click login cards.
2. **Login Page** (`/login`): Authentication with pre-fill demo role selectors.
3. **Registration Page** (`/register`): User registration with role selection.
4. **Admin Dashboard** (`/dashboard/admin`): System overview KPIs, user RBAC table, live event stream.
5. **Doctor Dashboard** (`/dashboard/doctor`): Assigned patient cards with live vitals, risk bars, recent alerts.
6. **Caregiver Dashboard** (`/dashboard/caregiver`): Bedside triage matrix, active unack alerts, 1-click Acknowledge/Escalate.
7. **Patient Dashboard** (`/dashboard/patient`): Personal health gauges, medication schedule, "Call Caregiver" button.
8. **Patient Directory** (`/patients`): Searchable, filterable patient roster, "Register New Patient" modal.
9. **Patient Details & Digital Twin** (`/patients/:id`): Demographics, baseline target comparisons, Recharts telemetry trends, clinician baseline adjustment.
10. **Live Monitoring Dashboard** (`/live`): ICU Telemetry Wall with pulsing ECG indicators, SpO2 bars, risk category filters.
11. **AI Risk Analysis** (`/ai-risk`): 3-Layer engine breakdown (Rules, Isolation Forest, Composite Score) + Gemini AI Assistant.
12. **Alert Management** (`/alerts`): Central alarm table, severity/status filters, Ack/Escalate/Resolve workflows.
13. **Caregiver Response History** (`/caregiver-history`): Bedside observation audit log, patient contacts, escalation notes.
14. **Medication Management** (`/medications`): Prescription dosages, schedules, "Confirm Intake" tracking.
15. **Device & Sensor Management** (`/devices`): Telemetry hardware fleet, online/offline status, battery levels, lead off simulation.
16. **Reports & Analytics** (`/reports`): Acuity pie chart, 24-hr alarm incident frequency, text report export.
17. **User Settings** (`/settings`): Profile information, password update form, deployment environment metrics.

---

## 8. Installation & Execution Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Quick Start (Windows)

1. **Start the Backend**:
   Double click `start_backend.bat` or run in terminal:
   ```powershell
   cd backend
   python run.py
   ```
   *FastAPI server will start on `http://localhost:8000` with the background IoT simulator active.*

2. **Start the Frontend**:
   Double click `start_frontend.bat` or run in terminal:
   ```powershell
   cd frontend
   npm run dev
   ```
   *Vite development server will open on `http://localhost:5173`.*

3. **Open the App**:
   Navigate to `http://localhost:5173` in your browser. Use the 1-click demo login buttons to log in as **Doctor**, **Caregiver**, **Admin**, or **Patient**.

### Running the Standalone IoT Transmitter CLI (Optional)
To test sending readings to the backend from an external command-line process:
```powershell
python simulator/device_runner.py --patient PT-1002 --scenario falling_spo2 --interval 3.0 --count 20
```

### Running the Test Suite
To verify the complete test suite (Auth, ML Isolation Forest, Safety Rules, Ingestion Pipeline, Alert Lifecycle):
```powershell
python -u backend/test_runner.py
```

---

## 9. REST API Reference

- `POST /api/auth/login`: Authenticate and receive JWT token.
- `POST /api/auth/register`: Register new practitioner or patient.
- `GET /api/auth/me`: Get current authenticated user profile.
- `GET /api/patients`: Searchable, filterable list of patient records.
- `GET /api/patients/{id}`: Detailed patient profile and baseline targets.
- `GET /api/patients/{id}/twin`: Comprehensive digital twin payload (vitals time-series, baselines, risk history).
- `POST /api/vitals`: Ingest telemetry packet (triggers SENSE &rarr; UNDERSTAND &rarr; PREDICT &rarr; ALERT).
- `GET /api/vitals/{patient_id}`: Query historical telemetry time-series.
- `POST /api/risk/analyze`: On-demand risk assessment on arbitrary vitals.
- `POST /api/risk/{patient_id}/explain`: AI Health Assistant natural language clinical explanation.
- `GET /api/alerts`: List alerts filtered by severity and status.
- `POST /api/alerts/{id}/acknowledge`: Caregiver acknowledgment.
- `POST /api/alerts/{id}/escalate`: Physician emergency escalation.
- `POST /api/alerts/{id}/resolve`: Close alert with clinical note.
- `POST /api/simulator/start` | `/pause` | `/reset`: Simulator master controls.
- `POST /api/simulator/scenario`: Switch patient to any of the 7 clinical presets.
- `POST /api/simulator/override`: Inject manual demonstration values.
- `WS /ws?token={jwt}`: Real-time telemetry WebSocket broadcaster.

---

## 10. Safety & Compliance Notice

> **CLINICAL NOTICE**: MediGuard AI is a prototype designed for software engineering demonstration and clinical workflow simulation for the Operation Ward Zero hackathon. Machine learning risk scores and synthetic telemetry do not substitute for certified clinical judgment, medical diagnosis, or licensed emergency protocols. In real clinical distress, follow standard hospital escalation protocols immediately.

