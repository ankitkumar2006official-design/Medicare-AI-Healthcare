import pytest
from app.ml.rule_engine import ClinicalRuleEngine
from app.ml.anomaly_detector import VitalAnomalyDetector
from app.ml.risk_scorer import RiskAssessmentEngine
from app.models import RiskCategory

def test_layer1_clinical_rules_hypoxia():
    engine = ClinicalRuleEngine()
    # Normal vitals
    normal_vitals = {
        "heart_rate": 72.0,
        "oxygen_saturation": 98.0,
        "body_temperature": 36.6,
        "blood_pressure_systolic": 118.0,
        "blood_pressure_diastolic": 76.0,
        "respiratory_rate": 15.0
    }
    sev, violations, triggers = engine.evaluate(normal_vitals)
    assert sev == "none"
    assert len(violations) == 0

    # Critical Hypoxia SpO2 = 84%
    hypoxic_vitals = normal_vitals.copy()
    hypoxic_vitals["oxygen_saturation"] = 84.0
    sev, violations, triggers = engine.evaluate(hypoxic_vitals)
    assert sev == "critical"
    assert any("CRITICAL HYPOXIA" in v for v in violations)

def test_layer2_isolation_forest_anomaly_detection():
    detector = VitalAnomalyDetector()
    assert detector.is_trained is True

    # Normal reading
    normal = {
        "heart_rate": 74.0,
        "oxygen_saturation": 98.2,
        "body_temperature": 36.7,
        "blood_pressure_systolic": 120.0,
        "blood_pressure_diastolic": 78.0,
        "respiratory_rate": 15.0,
        "glucose_level": 95.0
    }
    is_anom, score, devs = detector.predict(normal)
    assert score < 0.65 # Normal score should be low

    # Extreme multivariable outlier
    outlier = {
        "heart_rate": 165.0,
        "oxygen_saturation": 81.0,
        "body_temperature": 40.5,
        "blood_pressure_systolic": 210.0,
        "blood_pressure_diastolic": 120.0,
        "respiratory_rate": 38.0,
        "glucose_level": 340.0
    }
    is_anom_outlier, score_outlier, devs_outlier = detector.predict(outlier)
    assert is_anom_outlier is True
    assert score_outlier > 0.65

def test_layer3_risk_assessment_safety_invariant():
    risk_engine = RiskAssessmentEngine()
    
    # Severe tachycardia + low BP
    critical_packet = {
        "heart_rate": 145.0,
        "oxygen_saturation": 86.0,
        "body_temperature": 39.2,
        "blood_pressure_systolic": 80.0,
        "blood_pressure_diastolic": 50.0,
        "respiratory_rate": 32.0,
        "glucose_level": 110.0
    }
    result = risk_engine.evaluate_risk("PT-1001", critical_packet)
    assert result["risk_category"] == RiskCategory.CRITICAL.value
    assert result["risk_score"] >= 90.0
    assert len(result["detected_abnormalities"]) > 0

