# MediGuard AI – Operation Ward Zero: System Architecture Specification

---

## 1. High-Level System Architecture

The following diagram illustrates the complete end-to-end telemetry and clinical decision-support pipeline implementing the **SENSE &rarr; UNDERSTAND &rarr; PREDICT &rarr; ALERT &rarr; RESPOND** architecture:

```mermaid
flowchart TD
    subgraph SENSE["1. SENSE: IoT Sensor Telemetry & Edge Gateway"]
        Sensors["Multi-Parameter Sensors<br/>(HR, SpO2, Temp, BP, Resp)"]
        Buffer["Edge Hardware Buffer<br/>(Offline Resiliency Queue)"]
        Sensors -->|"Online (0.33 Hz)"| IngestionEndpoint["FastAPI Ingestion Endpoint<br/>/api/vitals & /api/reliability/sync-buffer"]
        Sensors -.->|"Wi-Fi Disconnection"| Buffer
        Buffer -->|"Reconnect & Flush"| IngestionEndpoint
    end

    subgraph UNDERSTAND["2. UNDERSTAND: Ingestion & Digital Twin"]
        IngestionEndpoint --> DeDup{"Duplicate & Delay Check<br/>(Client Sequence ID)"}
        DeDup -->|"Duplicate"| Drop["Drop & Log Prevention"]
        DeDup -->|"Valid Packet"| DBStore[("MongoDB Atlas Cloud<br/>Indexed Collections")]
        DBStore --> DigitalTwin["Patient Digital Twin<br/>(Personalized Baselines vs Population Norms)"]
    end

    subgraph PREDICT["3. PREDICT: Multi-Layer AI/ML Risk & Forecasting"]
        DigitalTwin --> Layer1["Layer 1: Deterministic Rules<br/>(Hypoxia, Shock, Tachycardia)"]
        DigitalTwin --> Layer2["Layer 2: Isolation Forest ML<br/>(Unsupervised Anomaly Metric)"]
        DigitalTwin --> Layer3["Layer 3: Contextual Engine<br/>(History + Notes + Patterns)"]
        DigitalTwin --> Layer4["Layer 4: 24-48h Forecasting<br/>(Autoregressive + 95% CI)"]
        DigitalTwin --> Layer5["Layer 5: Groq LLaMA-3.3-70B<br/>(Explainable Clinical AI)"]
        
        Layer1 --> CompositeScore["Composite Acuity & Risk Engine"]
        Layer2 --> CompositeScore
        Layer3 --> CompositeScore
    end

    subgraph ALERT["4. ALERT: Intelligent Alarm & Escalation Hub"]
        CompositeScore -->|"Threshold Breach"| AlarmEngine["Alarm Generator & Router"]
        AlarmEngine --> AssignCG["Assign Responsible Caregiver<br/>& Track Notification Delivery"]
        AssignCG --> SLATimer["Start SLA Deadline Timer<br/>(60s / 90s / 180s)"]
        SLATimer --> Watchdog{"SLA Breach?<br/>(Unacknowledged)"}
        Watchdog -->|"Yes"| FallbackDoc["Auto-Escalate to Physician<br/>(Dr. Sarah Chen, MD)"]
        Watchdog -->|"No"| AckTrail["Log Caregiver Response Time"]
    end

    subgraph RESPOND["5. RESPOND: Caregiver Station & Ward Telemetry"]
        AlarmEngine -->|"WebSocket Broadcast"| WSConn["WebSocket Server (/ws)"]
        WSConn --> LiveWall["React ICU Telemetry Wall"]
        WSConn --> CaregiverApp["Caregiver Terminal & GPS Attendance"]
        AckTrail --> AuditLog[("Audit Trail Record")]
        FallbackDoc --> AuditLog
    end
```

---

## 2. Alarm Lifecycle & SLA Fallback State Machine

```mermaid
stateDiagram-v2
    [*] --> TRIGGERED: Physiological Violation / Anomaly Detected
    
    TRIGGERED --> NOTIFICATION_DELIVERED: WebSocket Broadcast to Assigned Caregiver
    
    NOTIFICATION_DELIVERED --> ACKNOWLEDGED: Caregiver Bedside Ack (Within SLA Deadline)
    NOTIFICATION_DELIVERED --> AUTO_ESCALATED: SLA Deadline Expired (Unacknowledged)
    
    ACKNOWLEDGED --> ESCALATED: Caregiver Manually Escalates to Physician
    ACKNOWLEDGED --> RESOLVED: Caregiver Confirms Vitals Stabilized
    
    AUTO_ESCALATED --> PHYSICIAN_REVIEW: Dispatched to Fallback On-Call Doctor
    PHYSICIAN_REVIEW --> RESOLVED: Clinical Intervention Completed
    
    ESCALATED --> RESOLVED: Physician Evaluation & Treatment Note
    
    RESOLVED --> [*]: Alert Closed & Audit Trail Sealed
```

---

## 3. Database Schema & Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ PATIENTS : manages
    PATIENTS ||--o{ VITAL_READINGS : streams
    PATIENTS ||--o{ DEVICES : assigned_to
    PATIENTS ||--o{ RISK_ASSESSMENTS : evaluates
    PATIENTS ||--o{ ALERTS : triggers
    PATIENTS ||--o{ MEDICATIONS : prescribed
    PATIENTS ||--o{ FORECASTS : projects
    PATIENTS ||--o{ CAREGIVER_ATTENDANCE : receives_care
    
    USERS {
        string id PK
        string email
        string full_name
        string role
        string phone
        string hashed_password
    }

    PATIENTS {
        string patient_id PK
        string full_name
        int age
        string gender
        string room_number
        json baseline_vitals
        string assigned_doctor_id
        string assigned_caregiver_id
    }

    VITAL_READINGS {
        string id PK
        string patient_id FK
        string device_id FK
        float heart_rate
        float oxygen_saturation
        float body_temperature
        float blood_pressure_systolic
        float blood_pressure_diastolic
        float respiratory_rate
        datetime timestamp
    }

    ALERTS {
        string id PK
        string patient_id FK
        string severity
        string status
        string reason
        string assigned_caregiver_id
        string delivery_status
        datetime ack_deadline
        float response_time_seconds
        json audit_trail
        json fallback_escalation_workflow
        datetime created_at
    }

    CAREGIVER_ATTENDANCE {
        string id PK
        string caregiver_id FK
        string patient_id FK
        string shift_type
        string status
        json check_in_location
        json check_out_location
        float duration_minutes
        datetime check_in_time
        datetime check_out_time
    }

    FORECASTS {
        string id PK
        string patient_id FK
        float deterioration_probability
        string risk_trajectory_rating
        json parameters
        json contributing_feature_weights
        datetime generated_at
    }
```

---

## 4. Hardware Gateway Resilience & Buffering Model

When home Wi-Fi or cellular connectivity degrades:
1. **Edge Accumulation**: The simulated sensor hardware stores readings locally in flash memory tagged with incrementing `client_sequence_id` integers.
2. **Reconnection Handshake**: When the network restores, the gateway sends a batch sync request (`POST /api/reliability/sync-buffer`).
3. **De-duplication Check**: Backend checks incoming sequence IDs against indexed storage; duplicate packets are discarded without throwing errors.
4. **Delayed Data Flagging**: Packets recorded > 300 seconds prior to arrival are ingested with a `delayed: true` flag to prevent historical readings from falsely skewing real-time alarm thresholds.
5. **Watchdog Verification**: Central telemetry monitors the last transmission heartbeat; if no packets arrive for > 15 seconds, a `StaleSensorAlert` is triggered.
