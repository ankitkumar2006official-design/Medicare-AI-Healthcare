import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from app.database import get_collection

logger = logging.getLogger("mediguard.digital_twin")

POPULATION_NORMS = {
    "heart_rate": {"min": 60.0, "max": 100.0, "target": 75.0, "unit": "bpm"},
    "oxygen_saturation": {"min": 95.0, "max": 100.0, "target": 98.0, "unit": "%"},
    "blood_pressure_systolic": {"min": 90.0, "max": 120.0, "target": 110.0, "unit": "mmHg"},
    "blood_pressure_diastolic": {"min": 60.0, "max": 80.0, "target": 75.0, "unit": "mmHg"},
    "respiratory_rate": {"min": 12.0, "max": 20.0, "target": 16.0, "unit": "bpm"},
    "body_temperature": {"min": 36.5, "max": 37.5, "target": 37.0, "unit": "°C"},
}

class DigitalTwinService:
    def compute_stability_index(
        self,
        patient_id: str,
        vitals: Optional[Dict[str, Any]],
        baseline: Optional[Dict[str, Any]],
        recent_vitals: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Calculates a dynamic, clinically-weighted Physiological Stability Index (PSI, 0.0-100.0%)
        comparing real-time telemetry against personalized baseline targets and population norms.
        """
        if not vitals:
            return {
                "patient_id": patient_id,
                "stability_score": 100.0,
                "stability_category": "Optimal Stability",
                "trend_direction": "stable",
                "trend_delta": 0.0,
                "mean_arterial_pressure": None,
                "parameters": {},
                "contributing_factors": ["No recent telemetry readings detected."],
                "timestamp": datetime.utcnow()
            }

        base = baseline or {}
        param_details = {}
        contributing_factors = []
        weighted_scores = []

        # --- 1. Oxygen Saturation (SpO2) [Weight: 30%] ---
        spo2 = vitals.get("oxygen_saturation")
        spo2_min = float(base.get("spo2_min", 95.0))
        if spo2 is not None:
            spo2_norm = POPULATION_NORMS["oxygen_saturation"]
            if spo2 >= spo2_min:
                spo2_score = 100.0
                spo2_dev = 0.0
                spo2_status = "optimal"
                spo2_note = f"Oxygen saturation {spo2:.1f}% satisfies target baseline (≥{spo2_min:.0f}%)."
            else:
                spo2_dev = round(((spo2_min - spo2) / spo2_min) * 100.0, 1)
                # Severe penalization for hypoxemia
                penalty = spo2_dev * 5.0
                if spo2 < 90.0:
                    penalty += 25.0
                spo2_score = max(0.0, 100.0 - penalty)
                if spo2 < 90.0:
                    spo2_status = "critical_deviation"
                    spo2_note = f"Critical hypoxia: SpO2 {spo2:.1f}% is significantly below safety floor ({spo2_min:.0f}%)."
                    contributing_factors.append(f"SpO2 {spo2:.1f}% indicates acute hypoxemia (target ≥{spo2_min:.0f}%).")
                elif spo2 < spo2_min:
                    spo2_status = "moderate_deviation"
                    spo2_note = f"Desaturation: SpO2 {spo2:.1f}% is {spo2_dev}% below patient target ({spo2_min:.0f}%)."
                    contributing_factors.append(f"SpO2 {spo2:.1f}% dropped below configured baseline of {spo2_min:.0f}%.")
                else:
                    spo2_status = "mild_deviation"
                    spo2_note = f"Mild SpO2 variance ({spo2:.1f}%)."

            param_details["oxygen_saturation"] = {
                "parameter": "Oxygen Saturation (SpO2)",
                "current_value": float(spo2),
                "target_baseline_range": {"min": spo2_min, "max": 100.0},
                "population_norm_range": {"min": spo2_norm["min"], "max": spo2_norm["max"]},
                "deviation_percentage": spo2_dev,
                "status": spo2_status,
                "clinical_note": spo2_note
            }
            weighted_scores.append((spo2_score, 0.30))

        # --- 2. Heart Rate [Weight: 25%] ---
        hr = vitals.get("heart_rate")
        hr_min = float(base.get("heart_rate_min", 60.0))
        hr_max = float(base.get("heart_rate_max", 100.0))
        if hr is not None:
            hr_norm = POPULATION_NORMS["heart_rate"]
            if hr_min <= hr <= hr_max:
                hr_score = 100.0
                hr_dev = 0.0
                hr_status = "optimal"
                hr_note = f"Heart rate {hr:.0f} bpm is well-regulated within baseline ({hr_min:.0f}-{hr_max:.0f} bpm)."
            elif hr < hr_min:
                hr_dev = round(((hr_min - hr) / hr_min) * 100.0, 1)
                hr_score = max(0.0, 100.0 - (hr_dev * 2.8))
                hr_status = "critical_deviation" if hr < 48 else "moderate_deviation"
                hr_note = f"Bradycardia detected: {hr:.0f} bpm (baseline min {hr_min:.0f} bpm)."
                contributing_factors.append(f"Bradycardia: Heart rate {hr:.0f} bpm below lower threshold ({hr_min:.0f} bpm).")
            else:
                hr_dev = round(((hr - hr_max) / hr_max) * 100.0, 1)
                hr_score = max(0.0, 100.0 - (hr_dev * 2.8))
                hr_status = "critical_deviation" if hr > 130 else "moderate_deviation"
                hr_note = f"Tachycardia detected: {hr:.0f} bpm (baseline max {hr_max:.0f} bpm)."
                contributing_factors.append(f"Tachycardia: Heart rate {hr:.0f} bpm above upper threshold ({hr_max:.0f} bpm).")

            param_details["heart_rate"] = {
                "parameter": "Heart Rate",
                "current_value": float(hr),
                "target_baseline_range": {"min": hr_min, "max": hr_max},
                "population_norm_range": {"min": hr_norm["min"], "max": hr_norm["max"]},
                "deviation_percentage": hr_dev,
                "status": hr_status,
                "clinical_note": hr_note
            }
            weighted_scores.append((hr_score, 0.25))

        # --- 3. Blood Pressure & MAP [Weight: 20%] ---
        sys_bp = vitals.get("blood_pressure_systolic")
        dia_bp = vitals.get("blood_pressure_diastolic", 80.0)
        sys_min = float(base.get("bp_sys_min", 90.0))
        sys_max = float(base.get("bp_sys_max", 120.0))
        map_val = None
        if sys_bp is not None:
            if dia_bp is not None:
                map_val = round((2.0 * float(dia_bp) + float(sys_bp)) / 3.0, 1)

            if sys_min <= sys_bp <= sys_max:
                bp_score = 100.0
                bp_dev = 0.0
                bp_status = "optimal"
                bp_note = f"Arterial pressure {sys_bp:.0f}/{dia_bp:.0f} mmHg is within target zone."
            elif sys_bp < sys_min:
                bp_dev = round(((sys_min - sys_bp) / sys_min) * 100.0, 1)
                bp_score = max(0.0, 100.0 - (bp_dev * 2.5))
                bp_status = "critical_deviation" if sys_bp < 80 else "moderate_deviation"
                bp_note = f"Hypotension: Systolic {sys_bp:.0f} mmHg (baseline min {sys_min:.0f} mmHg)."
                contributing_factors.append(f"Hypotension: Systolic BP {sys_bp:.0f} mmHg indicates underperfusion risk.")
            else:
                bp_dev = round(((sys_bp - sys_max) / sys_max) * 100.0, 1)
                bp_score = max(0.0, 100.0 - (bp_dev * 2.2))
                bp_status = "critical_deviation" if sys_bp > 160 else "mild_deviation"
                bp_note = f"Hypertension: Systolic {sys_bp:.0f} mmHg exceeds ceiling ({sys_max:.0f} mmHg)."
                contributing_factors.append(f"Hypertension: Systolic BP {sys_bp:.0f} mmHg exceeds threshold ({sys_max:.0f} mmHg).")

            param_details["blood_pressure_systolic"] = {
                "parameter": "Systolic Blood Pressure",
                "current_value": float(sys_bp),
                "target_baseline_range": {"min": sys_min, "max": sys_max},
                "population_norm_range": {"min": 90.0, "max": 120.0},
                "deviation_percentage": bp_dev,
                "status": bp_status,
                "clinical_note": bp_note
            }
            weighted_scores.append((bp_score, 0.20))

        # --- 4. Respiratory Rate [Weight: 15%] ---
        rr = vitals.get("respiratory_rate")
        rr_min = float(base.get("resp_rate_min", 12.0))
        rr_max = float(base.get("resp_rate_max", 20.0))
        if rr is not None:
            rr_norm = POPULATION_NORMS["respiratory_rate"]
            if rr_min <= rr <= rr_max:
                rr_score = 100.0
                rr_dev = 0.0
                rr_status = "optimal"
                rr_note = f"Ventilatory rate {rr:.0f} bpm within normal boundaries ({rr_min:.0f}-{rr_max:.0f} bpm)."
            elif rr < rr_min:
                rr_dev = round(((rr_min - rr) / rr_min) * 100.0, 1)
                rr_score = max(0.0, 100.0 - (rr_dev * 3.0))
                rr_status = "moderate_deviation"
                rr_note = f"Bradypnea: {rr:.0f} bpm (target min {rr_min:.0f} bpm)."
                contributing_factors.append(f"Bradypnea: Respiratory rate {rr:.0f} bpm indicates hypoventilation.")
            else:
                rr_dev = round(((rr - rr_max) / rr_max) * 100.0, 1)
                rr_score = max(0.0, 100.0 - (rr_dev * 3.0))
                rr_status = "critical_deviation" if rr > 28 else "moderate_deviation"
                rr_note = f"Tachypnea: {rr:.0f} bpm (target max {rr_max:.0f} bpm)."
                contributing_factors.append(f"Tachypnea: Respiratory rate {rr:.0f} bpm indicates respiratory distress.")

            param_details["respiratory_rate"] = {
                "parameter": "Respiratory Rate",
                "current_value": float(rr),
                "target_baseline_range": {"min": rr_min, "max": rr_max},
                "population_norm_range": {"min": rr_norm["min"], "max": rr_norm["max"]},
                "deviation_percentage": rr_dev,
                "status": rr_status,
                "clinical_note": rr_note
            }
            weighted_scores.append((rr_score, 0.15))

        # --- 5. Body Temperature [Weight: 10%] ---
        temp = vitals.get("body_temperature")
        t_min = float(base.get("temp_min", 36.1))
        t_max = float(base.get("temp_max", 37.2))
        if temp is not None:
            t_norm = POPULATION_NORMS["body_temperature"]
            if t_min <= temp <= t_max:
                t_score = 100.0
                t_dev = 0.0
                t_status = "optimal"
                t_note = f"Core temperature {temp:.1f}°C is normothermic."
            elif temp < t_min:
                t_dev = round(((t_min - temp) / t_min) * 100.0, 1)
                t_score = max(0.0, 100.0 - (t_dev * 5.0))
                t_status = "moderate_deviation"
                t_note = f"Hypothermia: {temp:.1f}°C (baseline min {t_min:.1f}°C)."
                contributing_factors.append(f"Hypothermia: Core temperature {temp:.1f}°C below {t_min:.1f}°C.")
            else:
                t_dev = round(((temp - t_max) / t_max) * 100.0, 1)
                t_score = max(0.0, 100.0 - (t_dev * 6.0))
                t_status = "critical_deviation" if temp >= 39.0 else "mild_deviation"
                t_note = f"Pyrexia/Fever: {temp:.1f}°C (baseline ceiling {t_max:.1f}°C)."
                contributing_factors.append(f"Pyrexia: Core temperature {temp:.1f}°C exceeds threshold ({t_max:.1f}°C).")

            param_details["body_temperature"] = {
                "parameter": "Body Temperature",
                "current_value": float(temp),
                "target_baseline_range": {"min": t_min, "max": t_max},
                "population_norm_range": {"min": t_norm["min"], "max": t_norm["max"]},
                "deviation_percentage": t_dev,
                "status": t_status,
                "clinical_note": t_note
            }
            weighted_scores.append((t_score, 0.10))

        # Calculate composite score
        if weighted_scores:
            total_weight = sum(w for _, w in weighted_scores)
            stability_score = round(sum(s * w for s, w in weighted_scores) / total_weight, 1)
        else:
            stability_score = 100.0

        # Classification category
        if stability_score >= 88.0:
            category = "Optimal Stability"
        elif stability_score >= 72.0:
            category = "Mild Strain"
        elif stability_score >= 50.0:
            category = "Moderate Instability"
        else:
            category = "Critical Decompensation"

        # Trajectory trend computation
        trend_direction = "stable"
        trend_delta = 0.0
        if recent_vitals and len(recent_vitals) >= 3:
            past_vital = recent_vitals[0]
            past_res = self.compute_stability_index(patient_id, past_vital, baseline, None)
            past_score = past_res["stability_score"]
            trend_delta = round(stability_score - past_score, 1)
            if trend_delta >= 2.0:
                trend_direction = "improving"
            elif trend_delta <= -2.0:
                trend_direction = "deteriorating"

        if not contributing_factors:
            contributing_factors.append("All vital signs within clinician target baseline boundaries.")

        return {
            "patient_id": patient_id,
            "stability_score": stability_score,
            "stability_category": category,
            "trend_direction": trend_direction,
            "trend_delta": trend_delta,
            "mean_arterial_pressure": map_val,
            "parameters": param_details,
            "contributing_factors": contributing_factors,
            "timestamp": datetime.utcnow()
        }

    async def get_patient_digital_twin(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """
        Assembles comprehensive Digital Twin profile:
        - Patient demographics & clinical history
        - Baseline vitals
        - Current telemetry snapshot & sensor connection status
        - 24-reading vital time-series for trend curves
        - Historical risk trajectory
        - Active alerts & caregiver response logs
        - Real-time Physiological Stability Index (PSI) & baseline comparison
        """
        patient_col = get_collection("patients")
        vitals_col = get_collection("vital_readings")
        risk_col = get_collection("risk_assessments")
        alert_col = get_collection("alerts")
        device_col = get_collection("devices")
        responses_col = get_collection("caregiver_responses")

        patient = await patient_col.find_one({"patient_id": patient_id})
        if not patient:
            return None

        # Fetch recent historical vitals (last 30 points)
        recent_vitals = await vitals_col.find({"patient_id": patient_id})\
            .sort("timestamp", -1)\
            .limit(30)\
            .to_list()
        recent_vitals.reverse() # Chronological

        latest_vital = recent_vitals[-1] if recent_vitals else None

        # Fetch latest risk assessment
        latest_risk = await risk_col.find_one({"patient_id": patient_id})
        risk_history = await risk_col.find({"patient_id": patient_id})\
            .sort("timestamp", -1)\
            .limit(10)\
            .to_list()
        risk_history.reverse()

        # Fetch active alerts
        active_alerts = await alert_col.find({
            "patient_id": patient_id,
            "status": {"$in": ["triggered", "acknowledged", "escalated"]}
        }).sort("created_at", -1).to_list()

        # Fetch device status
        device = await device_col.find_one({"patient_id": patient_id})

        # Fetch recent caregiver interactions
        recent_responses = await responses_col.find({"patient_id": patient_id})\
            .sort("timestamp", -1)\
            .limit(5)\
            .to_list()

        # Calculate baseline comparison statistics and Stability Index
        baseline = patient.get("baseline_vitals", {})
        stability_index = self.compute_stability_index(
            patient_id=patient_id,
            vitals=latest_vital,
            baseline=baseline,
            recent_vitals=recent_vitals
        )

        baseline_comparison = {}
        if latest_vital:
            for k in ["heart_rate", "oxygen_saturation", "body_temperature", "blood_pressure_systolic", "respiratory_rate"]:
                val = latest_vital.get(k)
                if val is not None:
                    b_min = baseline.get(f"{k}_min")
                    b_max = baseline.get(f"{k}_max")
                    in_range = True
                    if b_min is not None and val < b_min:
                        in_range = False
                    if b_max is not None and val > b_max:
                        in_range = False
                    baseline_comparison[k] = {
                        "current_value": val,
                        "in_range": in_range,
                        "min_baseline": b_min,
                        "max_baseline": b_max
                    }

        return {
            "patient_id": patient_id,
            "full_name": patient.get("full_name"),
            "age": patient.get("age"),
            "gender": patient.get("gender"),
            "room_number": patient.get("room_number"),
            "medical_history": patient.get("medical_history", []),
            "existing_conditions": patient.get("existing_conditions", []),
            "allergies": patient.get("allergies", []),
            "emergency_contact": patient.get("emergency_contact", {}),
            "assigned_doctor_id": patient.get("assigned_doctor_id"),
            "assigned_caregiver_id": patient.get("assigned_caregiver_id"),
            "baseline_vitals": baseline,
            "active_scenario": patient.get("active_scenario", "healthy"),
            "is_monitored": patient.get("is_monitored", True),
            "device": device,
            "latest_vitals": latest_vital,
            "vital_time_series": recent_vitals,
            "baseline_comparison": baseline_comparison,
            "stability_index": stability_index,
            "latest_risk": latest_risk,
            "risk_history": risk_history,
            "active_alerts": active_alerts,
            "recent_caregiver_responses": recent_responses,
            "twin_sync_timestamp": datetime.utcnow()
        }


digital_twin_service = DigitalTwinService()


