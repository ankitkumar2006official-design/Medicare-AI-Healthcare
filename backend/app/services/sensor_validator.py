import logging
import math
from typing import Dict, Any, List, Tuple, Optional

logger = logging.getLogger("mediguard.validator")

# Physiological plausible human boundaries (Values outside are sensor artifacts)
PHYSIOLOGICAL_BOUNDS = {
    "heart_rate": {"min": 25.0, "max": 250.0, "max_delta_per_sec": 15.0},
    "oxygen_saturation": {"min": 50.0, "max": 100.0, "max_delta_per_sec": 4.0},
    "body_temperature": {"min": 31.0, "max": 43.5, "max_delta_per_sec": 0.3},
    "blood_pressure_systolic": {"min": 50.0, "max": 260.0, "max_delta_per_sec": 20.0},
    "blood_pressure_diastolic": {"min": 30.0, "max": 160.0, "max_delta_per_sec": 15.0},
    "respiratory_rate": {"min": 4.0, "max": 65.0, "max_delta_per_sec": 6.0},
}

class SensorDataValidator:
    """
    Hospital-grade IoT Telemetry Validation Engine.
    Filters out electrical noise, loose lead motion artifacts, and impossible
    transcutaneous sensor deviations before feeding AI/ML risk models.
    """

    @classmethod
    def validate_and_compute_sqi(
        cls,
        current_vitals: Dict[str, Any],
        previous_vitals: Optional[Dict[str, Any]] = None,
        time_delta_seconds: float = 3.0
    ) -> Tuple[Dict[str, Any], float, List[str]]:
        """
        Validates vital packet, computes Signal Quality Index (0.0 - 1.0),
        flags motion/placement artifacts, and returns sanitized vitals.
        """
        sanitized = dict(current_vitals)
        artifacts: List[str] = []
        quality_penalties = 0.0

        sensor_connected = current_vitals.get("sensor_connected", True)
        if not sensor_connected:
            return sanitized, 0.0, ["Sensor lead detached from patient"]

        dt = max(0.5, time_delta_seconds)

        # 1. Boundary plausibility checks
        for param, bounds in PHYSIOLOGICAL_BOUNDS.items():
            val = current_vitals.get(param)
            if val is None or not isinstance(val, (int, float)):
                continue

            val = float(val)
            if val < bounds["min"]:
                artifacts.append(f"Unphysiological low {param}: {val} < {bounds['min']}")
                quality_penalties += 0.35
                sanitized[param] = bounds["min"]
            elif val > bounds["max"]:
                artifacts.append(f"Unphysiological high {param}: {val} > {bounds['max']}")
                quality_penalties += 0.35
                sanitized[param] = bounds["max"]

        # 2. Blood pressure physiological consistency (Systolic > Diastolic + 10)
        sys_bp = sanitized.get("blood_pressure_systolic")
        dia_bp = sanitized.get("blood_pressure_diastolic")
        if sys_bp is not None and dia_bp is not None and sys_bp > 0 and dia_bp > 0:
            if sys_bp <= dia_bp:
                artifacts.append(f"Blood pressure inversion artifact: Sys ({sys_bp}) <= Dia ({dia_bp})")
                quality_penalties += 0.4
                sanitized["blood_pressure_systolic"] = dia_bp + 25.0

        # 3. Rate-of-Change Motion Artifact Detection (vs previous reading)
        if previous_vitals and previous_vitals.get("sensor_connected", True):
            for param, bounds in PHYSIOLOGICAL_BOUNDS.items():
                cur_val = sanitized.get(param)
                prev_val = previous_vitals.get(param)
                if cur_val is not None and prev_val is not None:
                    try:
                        delta = abs(float(cur_val) - float(prev_val))
                        rate = delta / dt
                        max_allowed = bounds["max_delta_per_sec"]
                        if rate > max_allowed:
                            artifacts.append(
                                f"Sudden delta jump in {param} ({round(rate, 1)}/s > {max_allowed}/s) - probable motion artifact"
                            )
                            quality_penalties += 0.25
                    except Exception:
                        pass

        # Compute Signal Quality Index (SQI)
        sqi = max(0.05, min(1.0, round(1.0 - quality_penalties, 2)))
        sanitized["signal_quality"] = sqi
        sanitized["is_artifact"] = len(artifacts) > 0
        sanitized["validation_artifacts"] = artifacts

        return sanitized, sqi, artifacts


sensor_validator = SensorDataValidator()
