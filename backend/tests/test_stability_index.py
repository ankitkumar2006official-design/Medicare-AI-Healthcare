import pytest
from app.services.digital_twin import digital_twin_service, POPULATION_NORMS

def test_stability_index_optimal_vitals():
    vitals = {
        "heart_rate": 74.0,
        "oxygen_saturation": 98.5,
        "blood_pressure_systolic": 115.0,
        "blood_pressure_diastolic": 76.0,
        "respiratory_rate": 16.0,
        "body_temperature": 36.8
    }
    baseline = {
        "heart_rate_min": 60.0,
        "heart_rate_max": 100.0,
        "spo2_min": 95.0,
        "bp_sys_min": 90.0,
        "bp_sys_max": 120.0,
        "resp_rate_min": 12.0,
        "resp_rate_max": 20.0,
        "temp_min": 36.1,
        "temp_max": 37.2
    }
    res = digital_twin_service.compute_stability_index("PT-1001", vitals, baseline)
    assert res["stability_score"] >= 95.0
    assert res["stability_category"] == "Optimal Stability"
    assert "oxygen_saturation" in res["parameters"]
    assert res["parameters"]["oxygen_saturation"]["status"] == "optimal"
    assert res["mean_arterial_pressure"] == round((2.0 * 76.0 + 115.0) / 3.0, 1)

def test_stability_index_critical_hypoxia():
    vitals = {
        "heart_rate": 115.0,
        "oxygen_saturation": 86.0, # Critical hypoxia
        "blood_pressure_systolic": 145.0,
        "blood_pressure_diastolic": 92.0,
        "respiratory_rate": 28.0,
        "body_temperature": 38.6
    }
    baseline = {
        "heart_rate_min": 60.0,
        "heart_rate_max": 100.0,
        "spo2_min": 95.0,
        "bp_sys_min": 90.0,
        "bp_sys_max": 120.0,
        "resp_rate_min": 12.0,
        "resp_rate_max": 20.0,
        "temp_min": 36.1,
        "temp_max": 37.2
    }
    res = digital_twin_service.compute_stability_index("PT-1002", vitals, baseline)
    assert res["stability_score"] < 65.0
    assert res["stability_category"] in ["Moderate Instability", "Critical Decompensation"]
    assert res["parameters"]["oxygen_saturation"]["status"] == "critical_deviation"
    assert any("hypoxemia" in f.lower() or "hypoxia" in f.lower() for f in res["contributing_factors"])

def test_stability_index_trajectory_trend():
    past_vitals = [
        {
            "heart_rate": 125.0,
            "oxygen_saturation": 88.0,
            "blood_pressure_systolic": 150.0,
            "blood_pressure_diastolic": 95.0,
            "respiratory_rate": 26.0,
            "body_temperature": 38.8
        },
        {
            "heart_rate": 110.0,
            "oxygen_saturation": 91.0,
            "blood_pressure_systolic": 140.0,
            "blood_pressure_diastolic": 90.0,
            "respiratory_rate": 22.0,
            "body_temperature": 38.0
        },
        {
            "heart_rate": 80.0,
            "oxygen_saturation": 97.0,
            "blood_pressure_systolic": 120.0,
            "blood_pressure_diastolic": 80.0,
            "respiratory_rate": 16.0,
            "body_temperature": 36.9
        }
    ]
    current_vital = past_vitals[-1]
    res = digital_twin_service.compute_stability_index("PT-1003", current_vital, {}, past_vitals)
    assert res["trend_direction"] == "improving"
    assert res["trend_delta"] > 0

def test_stability_index_empty_vitals():
    res = digital_twin_service.compute_stability_index("PT-EMPTY", None, None)
    assert res["stability_score"] == 100.0
    assert res["trend_direction"] == "stable"
    assert len(res["parameters"]) == 0
