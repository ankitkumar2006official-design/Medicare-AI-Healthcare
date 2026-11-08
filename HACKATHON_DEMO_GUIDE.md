# MediGuard AI – Operation Ward Zero: Hackathon Demo Guide
> **Interactive 5-Minute Demonstration Script for Judges and Reviewers**

---

## 🎬 Demo Overview

This step-by-step walkthrough demonstrates how **MediGuard AI** transforms an ordinary bedroom into a smart hospital ward via the **SENSE &rarr; UNDERSTAND &rarr; PREDICT &rarr; ALERT &rarr; RESPOND** paradigm.

---

### Step 1: Landing Page & Instant Role-Switching
1. Open `http://localhost:5173/` in your browser.
2. Note the clean, hospital-grade interface with the core **SENSE &rarr; RESPOND** architecture diagram.
3. Click **"Sign In as Caregiver"** on the top demo banner or quick card.
4. You are immediately logged in as **James Wilson, RN (Lead Caregiver)** with full JWT authorization.

---

### Step 2: Live ICU Telemetry Wall (SENSE & UNDERSTAND)
1. Navigate to **"Live Ward Telemetry"** (`/live`) from the sidebar.
2. Observe all 5 monitored patient beds updating in real time every 3 seconds via WebSockets.
3. Watch the continuous ECG rhythm strip canvas, live SpO2 pulse bars, and blood pressure indicators.
4. Click on **Marcus Rodriguez (PT-1002)** to inspect his real-time physiological drift.

---

### Step 3: Trigger a Clinical Scenario with the IoT Simulator Hub
1. Click the **"Simulator Hub"** button on the top right navigation bar to open the telemetry drawer.
2. Select **PT-1002 (Marcus Rodriguez)**.
3. Change his preset scenario from `Healthy` to **"Falling Oxygen Saturation"** (or use the manual slider to set SpO2 to `84%`).
4. Watch the central telemetry wall:
   - Within 3 seconds, SpO2 drops below 90%.
   - The card pulses red with a **CRITICAL HYPOXIA** alarm badge.
   - The synthetic IEC 60601-1-8 hospital chime sounds (if audio is unmuted).

---

### Step 4: Contextual Intelligence & Groq AI Assistant (PREDICT)
1. Click **"AI Risk Engine"** (`/ai-risk`) in the sidebar.
2. Inspect the **3-Layer Architecture**:
   - **Layer 1 (Deterministic Rules)**: Catches the critical redline violation (`SpO2 84.0% < 88.0% minimum`).
   - **Layer 2 (Isolation Forest)**: Flags the multi-dimensional anomaly with 88% confidence.
   - **Layer 3 (Risk Composite)**: Produces an overall risk score of 95/100.
3. Scroll to the **Contextual Intelligence Section**:
   - **Repeated Pattern Detection**: Highlights cyclic nocturnal desaturations.
   - **Medical History Modifiers**: Displays risk multipliers for Marcus's Post-CABG condition (+15pts).
   - **Decision Contributing Factors**: Shows percentage weights driving the alert.
4. Click **"Generate Clinical Explanation"**:
   - The **Groq LLaMA-3.3-70B AI Assistant** returns a structured, explainable breakdown with immediate bedside action protocols in under 1 second!

---

### Step 5: Predictive Analytics & 24–48 Hour Forecasting (PREDICT)
1. Click **"Predictive Forecasting"** (`/forecasts`) in the sidebar.
2. Select **PT-1002 (Marcus Rodriguez)**.
3. Review the **48-Hour Deterioration Risk Score (70%)** and **Trajectory Rating**.
4. Examine the **Autoregressive Trajectory Chart**:
   - Recharts renders the expected trend line plus the **shaded 95% confidence interval envelope**.
   - Review multi-horizon cards: **+6h, +12h, +24h, and +48h**.
5. Note the prominent **Experimental Non-Clinical Research Disclaimer** fulfilling medical safety compliance.

---

### Step 6: Alert Management, SLA Timers & Auto-Escalation (ALERT)
1. Navigate to **"Alert Management"** (`/alerts`).
2. Notice the new critical alert triggered for Marcus Rodriguez:
   - **Assigned Caregiver**: `James Wilson, RN`
   - **Delivery Status**: `Delivered to mobile via WebSocket`
   - **SLA Countdown Timer**: `60s deadline`
3. Click the **"Audit"** button on the right:
   - Inspect the **Full Response Audit Trail**: shows exact timestamps for trigger, delivery, and fallback escalation target (`Dr. Sarah Chen, MD`).
4. Click **"Check SLA Escalations"**:
   - Demonstrates the automated watchdog scanning for unacknowledged alerts and escalating breaches to the attending cardiologist.
5. Click **"Ack"** to acknowledge the alert and verify the caregiver response time is recorded.

---

### Step 7: Caregiver Attendance & GPS Geofencing (RESPOND)
1. Click **"Caregiver Attendance"** (`/attendance`) in the sidebar.
2. View the **GPS Geofence Status**:
   - Verified coordinates: `37.7749, -122.4194` (±4.2m accuracy).
   - Status: `VERIFIED: Inside Ward Zero Geofence perimeter`.
3. In the **Shift Terminal**:
   - Notice the live **Active Shift Elapsed Timer** counting seconds on duty.
   - Click **"Complete Shift & Check Out"** with handover notes.
   - Check in again with one click to see the active roster update immediately!

---

### Step 8: Caregiver Performance & Response Time Analytics
1. Click **"Caregiver Performance"** (`/caregiver-performance`) in the sidebar.
2. Review the **Average Acknowledgment Latency** card (e.g. `34.2 seconds`).
3. View the **SLA Compliance Rate** gauge (`96.8%`).
4. Inspect the **Response Latency Distribution Histogram** and **7-Day Trend Chart**.
5. Scroll down to the **Verified Bedside Activity Log** showing real timestamped interventions.

---

### Step 9: System Reliability & Offline Edge Buffering (RELIABILITY)
1. Click **"System Reliability"** (`/reliability`) in the sidebar.
2. Review the live system metrics: **Uptime, CPU %, RAM %, and active WebSocket clients**.
3. Under **Offline Edge Sensor Buffering & Reconnection Simulator**:
   - Select `PT-1002`.
   - Click **"Simulate Gateway Network Drop"**.
   - Watch the status switch to **OFFLINE (Buffering Telemetry)** as sensor readings accumulate locally in the hardware buffer.
   - Wait 10 seconds (buffer count climbs to 3-5 packets).
   - Click **"Flush Buffer & Sync"**.
   - An execution report pops up showing: **Transmitted, Ingested, and Zero Duplicates Rejection**.
4. Check the **Stale Sensor Watchdog** table and **Synchronization Audit Trail**.

---

### Step 10: Conclude & Show Verification Test Suite
1. Point to the automated test suite results:
   ```powershell
   python test_upgrades.py
   # 19/19 PASSED (100% pass rate)
   ```
2. Reiterate the seamless integration across **MongoDB Atlas, FastAPI, Groq AI, WebSockets, and React**.

