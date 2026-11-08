import pytest
from app.services.sensor_validator import sensor_validator

def test_clean_vital_signal():
    clean_vitals = {
        "heart_rate": 72.0,
        "oxygen_saturation": 98.0,
        "body_temperature": 36.8,
        "blood_pressure_systolic": 120.0,
        "blood_pressure_diastolic": 80.0,
        "respiratory_rate": 16.0,
        "sensor_connected": True
    }
    sanitized, sqi, artifacts = sensor_validator.validate_and_compute_sqi(clean_vitals)
    assert sqi >= 0.95
    assert len(artifacts) == 0
    assert sanitized["heart_rate"] == 72.0
    assert sanitized["is_artifact"] is False

def test_unphysiological_spo2_boundary():
    glitched_vitals = {
        "heart_rate": 80.0,
        "oxygen_saturation": 108.5,  # Impossible transcutaneous reading
        "sensor_connected": True
    }
    sanitized, sqi, artifacts = sensor_validator.validate_and_compute_sqi(glitched_vitals)
    assert sqi < 1.0
    assert sanitized["oxygen_saturation"] == 100.0  # Clamped to physiological max
    assert any("oxygen_saturation" in a for a in artifacts)
    assert sanitized["is_artifact"] is True

def test_blood_pressure_inversion():
    inverted_bp = {
        "blood_pressure_systolic": 70.0,
        "blood_pressure_diastolic": 90.0,  # Diastolic > Systolic is impossible
        "sensor_connected": True
    }
    sanitized, sqi, artifacts = sensor_validator.validate_and_compute_sqi(inverted_bp)
    assert sqi < 0.7
    assert sanitized["blood_pressure_systolic"] > sanitized["blood_pressure_diastolic"]
    assert any("inversion" in a for a in artifacts)

def test_sudden_motion_jump_artifact():
    prev = {"heart_rate": 70.0, "sensor_connected": True}
    curr = {"heart_rate": 140.0, "sensor_connected": True}  # 70 BPM jump in 2 seconds
    sanitized, sqi, artifacts = sensor_validator.validate_and_compute_sqi(curr, prev, time_delta_seconds=2.0)
    assert sqi < 0.8
    assert any("motion artifact" in a for a in artifacts)

def test_detached_sensor():
    detached = {"sensor_connected": False}
    sanitized, sqi, artifacts = sensor_validator.validate_and_compute_sqi(detached)
    assert sqi == 0.0
    assert len(artifacts) == 1
    assert "detached" in artifacts[0].lower()
