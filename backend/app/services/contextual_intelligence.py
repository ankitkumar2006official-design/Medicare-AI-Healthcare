from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import logging

from app.database import get_collection

logger = logging.getLogger("mediguard.contextual")

class ContextualIntelligenceEngine:
    """
    Fuses real-time vitals, historical trend curves, patient medical history,
    allergies, recent clinician/caregiver notes, and repeated pattern detection
    into actionable contextual insights.
    """

    async def analyze_patient_context(
        self,
        patient_id: str,
        current_vitals: Dict[str, Any]
    ) -> Dict[str, Any]:
        patient_col = get_collection("patients")
        vitals_col = get_collection("vital_readings")
        notes_col = get_collection("clinical_notes")
        act_col = get_collection("caregiver_activity")
        alerts_col = get_collection("alerts")

        patient = await patient_col.find_one({"patient_id": patient_id}) or {}
        patient_name = patient.get("full_name", f"Patient {patient_id}")
        medical_history = patient.get("medical_history", [])
        allergies = patient.get("allergies", [])
        baseline = patient.get("baseline_vitals", {})

        # Fetch recent historical readings (last 20 readings)
        recent_vitals = await vitals_col.find({"patient_id": patient_id})\
            .sort("timestamp", -1)\
            .limit(20)\
            .to_list()

        # Fetch recent clinical notes & caregiver observations
        recent_notes = await notes_col.find({"patient_id": patient_id})\
            .sort("timestamp", -1)\
            .limit(5)\
            .to_list()

        recent_activities = await act_col.find({"patient_id": patient_id})\
            .sort("timestamp", -1)\
            .limit(5)\
            .to_list()

        # Fetch recent alerts (last 24 hours)
        recent_alerts = await alerts_col.find({"patient_id": patient_id})\
            .sort("created_at", -1)\
            .limit(5)\
            .to_list()

        # -----------------------------------------------------------------
        # 1. Repeated Abnormal Pattern Detection
        # -----------------------------------------------------------------
        repeated_patterns = []
        if len(recent_vitals) >= 5:
            # Count hypoxia dips (SpO2 < 92%)
            hypoxia_dips = sum(1 for v in recent_vitals if (v.get("oxygen_saturation") or 100) < 92.0)
            if hypoxia_dips >= 3:
                repeated_patterns.append({
                    "pattern": "Recurrent Oxygen Desaturation (Hypoxic Burden)",
                    "occurrences": hypoxia_dips,
                    "sample_window": len(recent_vitals),
                    "clinical_significance": "Frequent desaturations suggest episodic airway obstruction, bronchospasm, or intermittent hypoventilation."
                })

            # Count tachycardic episodes (HR > 100 BPM)
            tachy_episodes = sum(1 for v in recent_vitals if (v.get("heart_rate") or 0) > 100.0)
            if tachy_episodes >= 3:
                repeated_patterns.append({
                    "pattern": "Persistent Tachycardic Runs",
                    "occurrences": tachy_episodes,
                    "sample_window": len(recent_vitals),
                    "clinical_significance": "Sustained tachycardia elevates myocardial oxygen demand, especially concerning in underlying cardiac disease."
                })

            # Blood pressure volatility
            sys_values = [v.get("blood_pressure_systolic") for v in recent_vitals if v.get("blood_pressure_systolic")]
            if len(sys_values) >= 5 and (max(sys_values) - min(sys_values)) > 35:
                repeated_patterns.append({
                    "pattern": "Labile Blood Pressure Volatility (>35 mmHg swing)",
                    "occurrences": round(max(sys_values) - min(sys_values), 1),
                    "sample_window": len(recent_vitals),
                    "clinical_significance": "Significant arterial pressure swings may indicate autonomic dysfunction, acute distress, or medication titration effects."
                })

        # -----------------------------------------------------------------
        # 2. Medical History Contextual Risk Modifiers
        # -----------------------------------------------------------------
        history_context = []
        spo2 = current_vitals.get("oxygen_saturation") or 98.0
        hr = current_vitals.get("heart_rate") or 75.0
        bp_sys = current_vitals.get("blood_pressure_systolic") or 120.0

        for cond in medical_history:
            cond_lower = cond.lower()
            if "copd" in cond_lower or "asthma" in cond_lower:
                if spo2 < 93.0:
                    history_context.append(f"History of {cond}: High vulnerability to respiratory fatigue when SpO2 < 93%.")
            if "infarction" in cond_lower or "cardiac" in cond_lower or "heart" in cond_lower:
                if hr > 95.0 or bp_sys > 140.0:
                    history_context.append(f"Cardiovascular History ({cond}): Elevated HR/BP creates ischemic risk on compromised myocardium.")
            if "hypertension" in cond_lower and bp_sys > 145.0:
                history_context.append(f"History of {cond}: Current systolic {bp_sys} mmHg exceeds target threshold.")
            if "diabetes" in cond_lower:
                history_context.append(f"Metabolic History ({cond}): Requires monitoring for autonomic neuropathy and glycemic instability.")

        # -----------------------------------------------------------------
        # 3. Contributing Factors & Explainability Breakdown
        # -----------------------------------------------------------------
        contributing_factors = []
        base_hr_max = baseline.get("heart_rate_max", 100.0)
        base_spo2_min = baseline.get("spo2_min", 94.0)
        base_sys_max = baseline.get("bp_sys_max", 130.0)

        if hr > base_hr_max:
            contributing_factors.append({
                "parameter": "Heart Rate",
                "current": f"{hr:.0f} BPM",
                "baseline_limit": f"{base_hr_max:.0f} BPM",
                "impact_weight_percent": 35.0,
                "reason": f"Elevated by +{hr - base_hr_max:.0f} BPM above target limit."
            })
        if spo2 < base_spo2_min:
            contributing_factors.append({
                "parameter": "Oxygen Saturation (SpO2)",
                "current": f"{spo2:.1f}%",
                "baseline_limit": f"{base_spo2_min:.0f}%",
                "impact_weight_percent": 45.0,
                "reason": f"Critical sub-baseline saturation deficit of {base_spo2_min - spo2:.1f}%."
            })
        if bp_sys > base_sys_max:
            contributing_factors.append({
                "parameter": "Systolic Blood Pressure",
                "current": f"{bp_sys:.0f} mmHg",
                "baseline_limit": f"{base_sys_max:.0f} mmHg",
                "impact_weight_percent": 20.0,
                "reason": f"Hypertensive deviation of +{bp_sys - base_sys_max:.0f} mmHg."
            })

        # Notes summary
        notes_summary = [
            {"author": n.get("author_name"), "category": n.get("category"), "content": n.get("content") or n.get("note"), "date": n.get("timestamp")}
            for n in recent_notes
        ]

        return {
            "patient_id": patient_id,
            "patient_name": patient_name,
            "medical_history": medical_history,
            "known_allergies": allergies,
            "repeated_abnormal_patterns": repeated_patterns,
            "clinical_history_insights": history_context,
            "contributing_factors": contributing_factors,
            "recent_clinician_notes": notes_summary,
            "analyzed_at": datetime.utcnow()
        }

contextual_engine = ContextualIntelligenceEngine()

