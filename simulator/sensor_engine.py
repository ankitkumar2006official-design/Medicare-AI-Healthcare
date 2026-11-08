import asyncio
import copy
import logging
import random
from datetime import datetime
from typing import Dict, Any, Optional, List, Callable
import uuid

from simulator.scenarios import SCENARIOS, ScenarioDefinition

logger = logging.getLogger("mediguard.simulator")

class PatientSimulatorState:
    def __init__(self, patient_id: str, scenario_id: str = "healthy"):
        self.patient_id = patient_id
        self.scenario_id = scenario_id
        self.manual_override: Dict[str, Any] = {}
        self.current_vitals: Dict[str, float] = {}
        self.step_count = 0
        self.reset_to_scenario(scenario_id)

    def reset_to_scenario(self, scenario_id: str):
        self.scenario_id = scenario_id
        self.step_count = 0
        self.manual_override = {}
        sc = SCENARIOS.get(scenario_id, SCENARIOS["healthy"])
        # Initial starting point
        if scenario_id == "sensor_disconnection":
            self.current_vitals = {
                "heart_rate": 0.0,
                "oxygen_saturation": 0.0,
                "body_temperature": 0.0,
                "blood_pressure_systolic": 0.0,
                "blood_pressure_diastolic": 0.0,
                "respiratory_rate": 0.0,
                "glucose_level": 0.0,
                "sensor_connected": False,
                "signal_quality": 0.0
            }
        else:
            # Start from healthy or midway and drift
            self.current_vitals = {
                "heart_rate": 72.0 + random.uniform(-2, 2),
                "oxygen_saturation": 98.0 + random.uniform(-0.5, 0.5),
                "body_temperature": 36.8 + random.uniform(-0.1, 0.1),
                "blood_pressure_systolic": 118.0 + random.uniform(-3, 3),
                "blood_pressure_diastolic": 76.0 + random.uniform(-2, 2),
                "respiratory_rate": 15.0 + random.uniform(-1, 1),
                "glucose_level": 98.0 + random.uniform(-3, 3),
                "sensor_connected": True,
                "signal_quality": 0.98
            }

    def step(self) -> Dict[str, Any]:
        self.step_count += 1
        sc = SCENARIOS.get(self.scenario_id, SCENARIOS["healthy"])

        if not sc.sensor_connected:
            return {
                "patient_id": self.patient_id,
                "device_id": f"DEV-{self.patient_id}",
                "heart_rate": 0.0,
                "oxygen_saturation": 0.0,
                "body_temperature": 0.0,
                "blood_pressure_systolic": 0.0,
                "blood_pressure_diastolic": 0.0,
                "respiratory_rate": 0.0,
                "glucose_level": None,
                "sensor_connected": False,
                "signal_quality": 0.0,
                "timestamp": datetime.utcnow()
            }

        # Calculate smooth physiological drift towards target scenario
        drift = min(sc.drift_rate, 0.35)
        noise = sc.noise_amplitude

        def smooth_drift(current_val: float, target_val: float, noise_scale: float) -> float:
            delta = (target_val - current_val) * drift
            jitter = random.gauss(0, noise_scale)
            return current_val + delta + jitter

        new_hr = smooth_drift(self.current_vitals["heart_rate"], sc.target_hr, noise * 0.8)
        new_spo2 = smooth_drift(self.current_vitals["oxygen_saturation"], sc.target_spo2, noise * 0.3)
        new_spo2 = min(max(new_spo2, 65.0), 100.0) # Physiological limits

        new_temp = smooth_drift(self.current_vitals["body_temperature"], sc.target_temp, noise * 0.05)
        new_bp_sys = smooth_drift(self.current_vitals["blood_pressure_systolic"], sc.target_bp_sys, noise * 1.0)
        new_bp_dia = smooth_drift(self.current_vitals["blood_pressure_diastolic"], sc.target_bp_dia, noise * 0.8)
        new_resp = smooth_drift(self.current_vitals["respiratory_rate"], sc.target_resp, noise * 0.4)
        new_glucose = smooth_drift(self.current_vitals["glucose_level"], sc.target_glucose, noise * 1.0)

        # Apply manual demonstration overrides if present
        if "heart_rate" in self.manual_override:
            new_hr = float(self.manual_override["heart_rate"])
        if "oxygen_saturation" in self.manual_override:
            new_spo2 = float(self.manual_override["oxygen_saturation"])
        if "body_temperature" in self.manual_override:
            new_temp = float(self.manual_override["body_temperature"])
        if "blood_pressure_systolic" in self.manual_override:
            new_bp_sys = float(self.manual_override["blood_pressure_systolic"])
        if "blood_pressure_diastolic" in self.manual_override:
            new_bp_dia = float(self.manual_override["blood_pressure_diastolic"])
        if "respiratory_rate" in self.manual_override:
            new_resp = float(self.manual_override["respiratory_rate"])
        if "glucose_level" in self.manual_override:
            new_glucose = float(self.manual_override["glucose_level"])

        self.current_vitals = {
            "heart_rate": round(new_hr, 1),
            "oxygen_saturation": round(new_spo2, 1),
            "body_temperature": round(new_temp, 1),
            "blood_pressure_systolic": round(new_bp_sys, 1),
            "blood_pressure_diastolic": round(new_bp_dia, 1),
            "respiratory_rate": round(new_resp, 1),
            "glucose_level": round(new_glucose, 1),
            "sensor_connected": True,
            "signal_quality": round(random.uniform(0.92, 0.99), 2)
        }

        packet = copy.deepcopy(self.current_vitals)
        packet["patient_id"] = self.patient_id
        packet["device_id"] = f"DEV-{self.patient_id}"
        packet["timestamp"] = datetime.utcnow()
        return packet


class SensorEngineManager:
    def __init__(self, interval_seconds: float = 3.0):
        self.interval_seconds = interval_seconds
        self.is_running = False
        self.patient_states: Dict[str, PatientSimulatorState] = {}
        self._task: Optional[asyncio.Task] = None
        self._ingestion_callback: Optional[Callable] = None

    def initialize_patients(self, patient_ids: List[str]):
        default_scenarios = {
            "PT-1001": "healthy",
            "PT-1002": "falling_spo2",
            "PT-1003": "respiratory_distress",
            "PT-1004": "high_fever",
            "PT-1005": "elevated_heart_rate"
        }
        for pid in patient_ids:
            if pid not in self.patient_states:
                scenario = default_scenarios.get(pid, "healthy")
                self.patient_states[pid] = PatientSimulatorState(pid, scenario)

    def set_ingestion_callback(self, cb: Callable):
        self._ingestion_callback = cb

    def set_scenario(self, patient_id: str, scenario_id: str):
        if scenario_id not in SCENARIOS:
            raise ValueError(f"Unknown scenario: {scenario_id}")
        if patient_id not in self.patient_states:
            self.patient_states[patient_id] = PatientSimulatorState(patient_id, scenario_id)
        else:
            self.patient_states[patient_id].reset_to_scenario(scenario_id)
        logger.info(f"Simulator: Patient {patient_id} switched to scenario '{scenario_id}'")

    def set_manual_override(self, patient_id: str, overrides: Dict[str, Any]):
        if patient_id in self.patient_states:
            self.patient_states[patient_id].manual_override.update(overrides)

    def clear_manual_override(self, patient_id: str):
        if patient_id in self.patient_states:
            self.patient_states[patient_id].manual_override = {}

    def start(self):
        if not self.is_running:
            self.is_running = True
            self._task = asyncio.create_task(self._run_loop())
            logger.info("Sensor simulator engine started.")

    def pause(self):
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
        logger.info("Sensor simulator engine paused.")

    def reset_all(self):
        for state in self.patient_states.values():
            state.reset_to_scenario(state.scenario_id)
        logger.info("Sensor simulator reset to scenario baselines.")

    async def _run_loop(self):
        while self.is_running:
            try:
                for patient_id, state in list(self.patient_states.items()):
                    packet = state.step()
                    if self._ingestion_callback:
                        try:
                            await self._ingestion_callback(packet)
                        except Exception as e:
                            logger.error(f"Error in sensor ingestion callback for {patient_id}: {e}")
                await asyncio.sleep(self.interval_seconds)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Simulator loop error: {e}")
                await asyncio.sleep(self.interval_seconds)


sensor_engine = SensorEngineManager()
