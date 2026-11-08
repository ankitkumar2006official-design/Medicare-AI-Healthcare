from datetime import datetime
from typing import Dict, Any, List, Optional
from app.models import RiskCategory
from app.ml.rule_engine import clinical_rules
from app.ml.anomaly_detector import anomaly_detector

class RiskAssessmentEngine:
    """
    Synthesizes:
    - Layer 1: Rule-based clinical safety engine
    - Layer 2: Scikit-learn Isolation Forest unsupervised anomaly detector
    - Patient baseline vital deviation
    - Recent rate of change / trend slopes
    """

    def calculate_trend_delta(self, current: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, float]:
        deltas = {}
        if not history:
            return deltas
        # Compare with reading from ~15-30 seconds ago
        past_idx = min(len(history) - 1, 4)
        past = history[past_idx]

        for k in ["heart_rate", "oxygen_saturation", "body_temperature", "blood_pressure_systolic", "respiratory_rate"]:
            curr_v = current.get(k)
            past_v = past.get(k)
            if curr_v is not None and past_v is not None:
                try:
                    deltas[k] = round(float(curr_v) - float(past_v), 1)
                except Exception:
                    pass
        return deltas

    def evaluate_risk(
        self,
        patient_id: str,
        current_vitals: Dict[str, Any],
        baseline: Optional[Dict[str, Any]] = None,
        vital_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        baseline = baseline or {}
        vital_history = vital_history or []

        # 1. Layer 1: Clinical Rules
        highest_rule_sev, rule_violations, triggers = clinical_rules.evaluate(current_vitals, baseline)

        # 2. Layer 2: Machine Learning Anomaly Detection
        is_anomaly, anomaly_score, feature_deviations = anomaly_detector.predict(current_vitals)

        # 3. Trend analysis
        deltas = self.calculate_trend_delta(current_vitals, vital_history)

        # 4. Synthesize Risk Score (0 - 100)
        # Base score from rule violations
        severity_base_points = {
            "none": 5.0,
            "low": 25.0,
            "moderate": 50.0,
            "high": 75.0,
            "critical": 92.0
        }
        score = severity_base_points.get(highest_rule_sev, 5.0)

        # Add ML anomaly factor (up to +18 points if high anomaly)
        ml_contribution = anomaly_score * 18.0
        score += ml_contribution

        # Add Trend Deterioration factor
        trend_penalties = 0.0
        contributing_factors = []
        if deltas.get("oxygen_saturation", 0) <= -2.0:
            trend_penalties += 8.0
            contributing_factors.append(f"Rapid SpO2 drop ({deltas['oxygen_saturation']}% in recent readings)")
        if deltas.get("heart_rate", 0) >= 15.0:
            trend_penalties += 6.0
            contributing_factors.append(f"Rapid heart rate acceleration (+{deltas['heart_rate']} BPM)")
        if deltas.get("respiratory_rate", 0) >= 4.0:
            trend_penalties += 6.0
            contributing_factors.append(f"Accelerating respiratory rate (+{deltas['respiratory_rate']} breaths/min)")

        score += trend_penalties
        score = min(max(round(score, 1), 0.0), 100.0)

        # CRITICAL SAFETY INVARIANT: Rule-based critical cannot be downgraded by ML
        if highest_rule_sev == "critical":
            score = max(score, 90.0)
            category = RiskCategory.CRITICAL
            recommended_escalation = "URGENT: Immediate caregiver bedside intervention and physician emergency escalation"
        elif highest_rule_sev == "high" or score >= 70.0:
            category = RiskCategory.HIGH
            recommended_escalation = "HIGH PRIORITY: Rapid caregiver bedside visit and on-call physician notification"
        elif highest_rule_sev == "moderate" or score >= 45.0 or is_anomaly:
            category = RiskCategory.MODERATE
            recommended_escalation = "MODERATE: Caregiver alert; recheck patient vitals and record observation within 15 minutes"
        elif highest_rule_sev == "low" or score >= 20.0:
            category = RiskCategory.LOW
            recommended_escalation = "LOW: Routine monitoring; record telemetry observation at next scheduled rounds"
        else:
            category = RiskCategory.STABLE
            recommended_escalation = "NORMAL: Continuous background telemetry active; patient stable within baseline limits"

        # Populate contributing factors
        for v in rule_violations:
            if v not in contributing_factors:
                contributing_factors.append(v)

        if is_anomaly:
            contributing_factors.append(
                f"Statistical vital vector anomaly detected (Anomaly confidence: {int(anomaly_score * 100)}%)"
            )

        # Top deviated features
        sorted_devs = sorted(feature_deviations.items(), key=lambda x: x[1], reverse=True)
        top_devs = [f"{k.replace('_', ' ').capitalize()} (+{v}σ)" for k, v in sorted_devs[:2] if v >= 1.5]
        if top_devs:
            contributing_factors.append("Top anomalous physiological dimensions: " + ", ".join(top_devs))

        return {
            "patient_id": patient_id,
            "risk_category": category.value,
            "risk_score": score,
            "detected_abnormalities": rule_violations,
            "contributing_factors": contributing_factors,
            "recommended_escalation": recommended_escalation,
            "rule_violations": rule_violations,
            "anomaly_metrics": {
                "is_anomaly": is_anomaly,
                "anomaly_score": anomaly_score,
                "feature_deviations": feature_deviations
            },
            "triggers": triggers,
            "vital_snapshot": current_vitals,
            "timestamp": datetime.utcnow()
        }


risk_engine = RiskAssessmentEngine()

