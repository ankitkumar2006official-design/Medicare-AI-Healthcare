from dataclasses import dataclass, field
from typing import Dict, Any, Optional

@dataclass
class ScenarioDefinition:
    id: str
    name: str
    description: str
    target_hr: float
    target_spo2: float
    target_temp: float
    target_bp_sys: float
    target_bp_dia: float
    target_resp: float
    target_glucose: float
    noise_amplitude: float
    drift_rate: float
    sensor_connected: bool = True
    missing_data_prob: float = 0.0

SCENARIOS: Dict[str, ScenarioDefinition] = {
    "healthy": ScenarioDefinition(
        id="healthy",
        name="Scenario 1: Healthy Patient",
        description="Vitals remain comfortably within normal physiological baseline with natural rhythmic HRV variance.",
        target_hr=72.0,
        target_spo2=98.5,
        target_temp=36.7,
        target_bp_sys=118.0,
        target_bp_dia=76.0,
        target_resp=15.0,
        target_glucose=95.0,
        noise_amplitude=0.8,
        drift_rate=0.02
    ),
    "falling_spo2": ScenarioDefinition(
        id="falling_spo2",
        name="Scenario 2: Falling Oxygen Saturation",
        description="Gradual hypoxemic deterioration; SpO2 drifts from 97% down towards 84% with compensatory mild tachycardia.",
        target_hr=104.0,
        target_spo2=86.0,
        target_temp=36.9,
        target_bp_sys=128.0,
        target_bp_dia=82.0,
        target_resp=22.0,
        target_glucose=105.0,
        noise_amplitude=1.0,
        drift_rate=0.15
    ),
    "elevated_heart_rate": ScenarioDefinition(
        id="elevated_heart_rate",
        name="Scenario 3: Elevated Heart Rate (Tachycardia / AFib)",
        description="Sudden onset supraventricular tachycardia; heart rate accelerates to 135–150 BPM.",
        target_hr=142.0,
        target_spo2=95.0,
        target_temp=36.8,
        target_bp_sys=136.0,
        target_bp_dia=88.0,
        target_resp=20.0,
        target_glucose=100.0,
        noise_amplitude=2.5,
        drift_rate=0.20
    ),
    "high_fever": ScenarioDefinition(
        id="high_fever",
        name="Scenario 4: High Fever & Hyperpyrexia",
        description="Acute pyrexia escalation; body temperature reaches 39.6°C accompanied by flushing and elevated pulse.",
        target_hr=118.0,
        target_spo2=95.5,
        target_temp=39.5,
        target_bp_sys=124.0,
        target_bp_dia=74.0,
        target_resp=21.0,
        target_glucose=115.0,
        noise_amplitude=0.4,
        drift_rate=0.10
    ),
    "respiratory_distress": ScenarioDefinition(
        id="respiratory_distress",
        name="Scenario 5: Respiratory Distress",
        description="Severe tachypnea; respiratory rate climbs to 32 breaths/min with dropping oxygen saturation and elevated blood pressure.",
        target_hr=112.0,
        target_spo2=89.0,
        target_temp=37.1,
        target_bp_sys=148.0,
        target_bp_dia=94.0,
        target_resp=32.0,
        target_glucose=110.0,
        noise_amplitude=1.2,
        drift_rate=0.18
    ),
    "multiple_abnormalities": ScenarioDefinition(
        id="multiple_abnormalities",
        name="Scenario 6: Multiple Vital Abnormalities (Septic Shock / Crisis)",
        description="Critical multi-system decompensation: severe hypotension, tachycardia, hyperthermia, and acute hypoxemia.",
        target_hr=132.0,
        target_spo2=86.5,
        target_temp=39.4,
        target_bp_sys=82.0,
        target_bp_dia=52.0,
        target_resp=30.0,
        target_glucose=175.0,
        noise_amplitude=2.0,
        drift_rate=0.25
    ),
    "sensor_disconnection": ScenarioDefinition(
        id="sensor_disconnection",
        name="Scenario 7: Sensor Disconnection / Lead Off",
        description="Telemetry sensor leads detached or telemetry unit disconnected; signal quality zero, missing vital packets.",
        target_hr=0.0,
        target_spo2=0.0,
        target_temp=0.0,
        target_bp_sys=0.0,
        target_bp_dia=0.0,
        target_resp=0.0,
        target_glucose=0.0,
        noise_amplitude=0.0,
        drift_rate=0.0,
        sensor_connected=False,
        missing_data_prob=1.0
    )
}
