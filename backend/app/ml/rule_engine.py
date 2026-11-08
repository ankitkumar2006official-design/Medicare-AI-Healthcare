from typing import Dict, Any, List, Tuple
from app.models import AlertSeverity

# Clinically documented standard physiological alarm limits
DEFAULT_THRESHOLDS = {
    "spo2_critical_low": 88.0,
    "spo2_high_low": 91.0,
    "spo2_warn_low": 94.0,
    
    "hr_critical_high": 130.0,
    "hr_high": 110.0,
    "hr_critical_low": 45.0,
    "hr_low": 52.0,
    
    "temp_critical_high": 39.5,
    "temp_high": 38.3,
    "temp_low": 35.5,
    
    "bp_sys_critical_high": 175.0,
    "bp_sys_high": 150.0,
    "bp_sys_critical_low": 85.0,
    "bp_sys_low": 90.0,
    
    "bp_dia_critical_high": 105.0,
    "bp_dia_high": 95.0,
    "bp_dia_low": 55.0,
    
    "resp_critical_high": 28.0,
    "resp_high": 24.0,
    "resp_critical_low": 8.0,
    "resp_low": 10.0,
    
    "glucose_critical_low": 60.0,
    "glucose_low": 70.0,
    "glucose_high": 180.0,
    "glucose_critical_high": 250.0,
}

class ClinicalRuleEngine:
    def __init__(self, thresholds: Dict[str, float] = None):
        self.thresholds = thresholds or DEFAULT_THRESHOLDS

    def evaluate(self, vitals: Dict[str, Any], baseline: Dict[str, Any] = None) -> Tuple[str, List[str], List[Dict[str, Any]]]:
        """
        Evaluates incoming patient vitals against configured thresholds and personalized baselines.
        Returns:
            highest_severity: 'none' | 'low' | 'moderate' | 'high' | 'critical'
            violations: list of human-readable clinical warnings
            actionable_triggers: list of structured trigger items
        """
        violations = []
        triggers = []
        severity_rank = {"none": 0, "low": 1, "moderate": 2, "high": 3, "critical": 4}
        current_max = "none"

        def add_violation(vital_name: str, value: Any, message: str, sev: str, action: str):
            nonlocal current_max
            violations.append(message)
            triggers.append({
                "vital": vital_name,
                "value": value,
                "severity": sev,
                "reason": message,
                "recommended_action": action
            })
            if severity_rank[sev] > severity_rank[current_max]:
                current_max = sev

        # 1. SpO2 evaluation
        spo2 = vitals.get("oxygen_saturation")
        if spo2 is not None:
            spo2_baseline_min = (baseline or {}).get("spo2_min", self.thresholds["spo2_warn_low"])
            if spo2 < self.thresholds["spo2_critical_low"]:
                add_violation(
                    "oxygen_saturation", spo2,
                    f"CRITICAL HYPOXIA: SpO2 {spo2:.1f}% is critically below safety minimum ({self.thresholds['spo2_critical_low']}%)",
                    "critical", "Initiate supplemental high-flow oxygen immediately and contact emergency physician."
                )
            elif spo2 < self.thresholds["spo2_high_low"] or spo2 < (spo2_baseline_min - 4):
                add_violation(
                    "oxygen_saturation", spo2,
                    f"SIGNIFICANT HYPOXEMIA: SpO2 {spo2:.1f}% is significantly depressed",
                    "high", "Check patient airway, confirm oxygen cannula positioning, and alert on-call doctor."
                )
            elif spo2 < spo2_baseline_min:
                add_violation(
                    "oxygen_saturation", spo2,
                    f"Mild oxygen saturation dip: SpO2 {spo2:.1f}% below baseline ({spo2_baseline_min}%)",
                    "low", "Check sensor placement and monitor trends for 5 minutes."
                )

        # 2. Heart Rate evaluation
        hr = vitals.get("heart_rate")
        if hr is not None:
            hr_min = (baseline or {}).get("heart_rate_min", self.thresholds["hr_low"])
            hr_max = (baseline or {}).get("heart_rate_max", self.thresholds["hr_high"])

            if hr >= self.thresholds["hr_critical_high"]:
                add_violation(
                    "heart_rate", hr,
                    f"SEVERE TACHYCARDIA: Heart rate {hr:.0f} BPM exceeds critical limit ({self.thresholds['hr_critical_high']} BPM)",
                    "critical", "Perform rapid bedside 12-lead ECG, assess hemodynamics, and request emergency consult."
                )
            elif hr <= self.thresholds["hr_critical_low"]:
                add_violation(
                    "heart_rate", hr,
                    f"SEVERE BRADYCARDIA: Heart rate {hr:.0f} BPM is critically depressed",
                    "critical", "Assess patient consciousness, check radial pulse manually, prepare atropine / emergency response."
                )
            elif hr > hr_max:
                add_violation(
                    "heart_rate", hr,
                    f"Elevated heart rate: {hr:.0f} BPM above baseline threshold ({hr_max:.0f} BPM)",
                    "moderate", "Verify patient pain level, hydration, and check for signs of infection."
                )
            elif hr < hr_min:
                add_violation(
                    "heart_rate", hr,
                    f"Low heart rate: {hr:.0f} BPM below baseline threshold ({hr_min:.0f} BPM)",
                    "low", "Record observation and verify patient resting state."
                )

        # 3. Body Temperature
        temp = vitals.get("body_temperature")
        if temp is not None:
            if temp >= self.thresholds["temp_critical_high"]:
                add_violation(
                    "body_temperature", temp,
                    f"HYPERPYREXIA: Body temperature {temp:.1f}°C is critically elevated",
                    "high", "Apply active physical cooling measures, obtain blood cultures, and notify physician."
                )
            elif temp >= self.thresholds["temp_high"]:
                add_violation(
                    "body_temperature", temp,
                    f"Febrile state: Body temperature {temp:.1f}°C indicates pyrexia",
                    "moderate", "Administer prescribed antipyretic medication and increase fluid intake."
                )
            elif temp < self.thresholds["temp_low"]:
                add_violation(
                    "body_temperature", temp,
                    f"Hypothermia alert: Core body temperature {temp:.1f}°C is dangerously low",
                    "moderate", "Apply warm blankets, ensure room temperature regulation."
                )

        # 4. Blood Pressure
        bp_sys = vitals.get("blood_pressure_systolic")
        bp_dia = vitals.get("blood_pressure_diastolic")
        if bp_sys is not None and bp_dia is not None:
            if bp_sys >= self.thresholds["bp_sys_critical_high"] or bp_dia >= self.thresholds["bp_dia_critical_high"]:
                add_violation(
                    "blood_pressure", f"{bp_sys:.0f}/{bp_dia:.0f}",
                    f"HYPERTENSIVE CRISIS RISK: BP {bp_sys:.0f}/{bp_dia:.0f} mmHg severely elevated",
                    "critical", "Assess for end-organ symptoms (headache, chest pain, vision changes); urgent clinician evaluation required."
                )
            elif bp_sys <= self.thresholds["bp_sys_critical_low"]:
                add_violation(
                    "blood_pressure", f"{bp_sys:.0f}/{bp_dia:.0f}",
                    f"CRITICAL HYPOTENSION: Systolic BP {bp_sys:.0f} mmHg indicates hemodynamic compromise",
                    "critical", "Place patient in supine position, check IV access, immediate medical attention."
                )
            elif bp_sys > self.thresholds["bp_sys_high"] or bp_dia > self.thresholds["bp_dia_high"]:
                add_violation(
                    "blood_pressure", f"{bp_sys:.0f}/{bp_dia:.0f}",
                    f"Hypertension alert: BP {bp_sys:.0f}/{bp_dia:.0f} mmHg exceeds acceptable target",
                    "moderate", "Confirm cuff fit, re-test in 10 minutes, check scheduled anti-hypertensives."
                )

        # 5. Respiratory Rate
        resp = vitals.get("respiratory_rate")
        if resp is not None:
            if resp >= self.thresholds["resp_critical_high"]:
                add_violation(
                    "respiratory_rate", resp,
                    f"TACHYPNEA / RESPIRATORY DISTRESS: {resp:.0f} breaths/min is dangerously elevated",
                    "critical", "Elevate bed head to 45°, assess work of breathing, prepare respiratory support."
                )
            elif resp <= self.thresholds["resp_critical_low"]:
                add_violation(
                    "respiratory_rate", resp,
                    f"RESPIRATORY DEPRESSION: {resp:.0f} breaths/min is critically low",
                    "critical", "Immediate airway assessment and stimulus; review recent sedative administration."
                )
            elif resp > self.thresholds["resp_high"]:
                add_violation(
                    "respiratory_rate", resp,
                    f"Elevated respiratory rate: {resp:.0f} breaths/min",
                    "moderate", "Check oxygen delivery and auscultate breath sounds."
                )

        # 6. Combinatorial Multi-Abnormality Check
        # e.g., Tachycardia + Tachypnea + Fever = High risk of Sepsis / Decompensation
        if (hr and hr > 95) and (resp and resp > 22) and (temp and temp > 38.0):
            add_violation(
                "multi_system", "HR+RR+TEMP",
                "MULTIPLE VITAL INSTABILITY: Concurrent tachycardia, tachypnea, and pyrexia suggest systemic response",
                "high", "Initiate systemic inflammatory screening protocol and notify attending doctor."
            )

        # Elevated HR + Dropping SpO2 = Acute cardiopulmonary strain
        if (hr and hr > 100) and (spo2 and spo2 < 92):
            add_violation(
                "multi_system", "HR+SPO2",
                "CARDIOPULMONARY STRAIN: Elevated heart rate with inadequate oxygen saturation",
                "high", "Check oxygen source and patient position; alert clinical team."
            )

        return current_max, violations, triggers


clinical_rules = ClinicalRuleEngine()

