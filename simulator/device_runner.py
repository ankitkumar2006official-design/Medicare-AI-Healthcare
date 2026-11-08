#!/usr/bin/env python3
"""
MediGuard AI – Standalone IoT Device Telemetry Transmitter
Simulates realistic medical telemetry devices transmitting readings to the FastAPI backend.
"""

import sys
import os
import time
import argparse
import requests
import random
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from simulator.scenarios import SCENARIOS
from simulator.sensor_engine import PatientSimulatorState

def run_standalone_device(
    backend_url: str = "http://localhost:8000",
    patient_id: str = "PT-1001",
    scenario_id: str = "healthy",
    interval: float = 3.0,
    iterations: int = 50
):
    print(f"=== MediGuard AI: Starting Standalone IoT Device Telemetry ===")
    print(f"Target Backend: {backend_url}")
    print(f"Patient ID:     {patient_id}")
    print(f"Scenario:       {SCENARIOS.get(scenario_id, SCENARIOS['healthy']).name}")
    print(f"Interval:       {interval}s")
    print("----------------------------------------------------------------")

    state = PatientSimulatorState(patient_id, scenario_id)
    vitals_endpoint = f"{backend_url}/api/vitals"

    count = 0
    try:
        while iterations <= 0 or count < iterations:
            packet = state.step()
            # Convert timestamp to ISO format
            packet["timestamp"] = datetime.utcnow().isoformat()
            
            try:
                resp = requests.post(vitals_endpoint, json=packet, timeout=4.0)
                if resp.status_code == 201:
                    data = resp.json().get("result", {})
                    print(
                        f"[{datetime.now().strftime('%H:%M:%S')}] Packet #{state.step_count} Sent | "
                        f"HR: {packet['heart_rate']:>5.1f} BPM | SpO2: {packet['oxygen_saturation']:>5.1f}% | "
                        f"BP: {packet['blood_pressure_systolic']:>3.0f}/{packet['blood_pressure_diastolic']:>3.0f} | "
                        f"Risk: {data.get('risk_category', 'N/A').upper():<8} (Score: {data.get('risk_score', '--')})"
                    )
                else:
                    print(f"Failed to post reading: HTTP {resp.status_code} - {resp.text}")
            except Exception as e:
                print(f"Network error connecting to backend: {e}")

            count += 1
            time.sleep(interval)

    except KeyboardInterrupt:
        print("\nTelemetry transmitter stopped by user.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MediGuard AI IoT Telemetry Simulator")
    parser.add_argument("--url", default="http://localhost:8000", help="FastAPI backend URL")
    parser.add_argument("--patient", default="PT-1001", help="Patient ID (e.g. PT-1001, PT-1002)")
    parser.add_argument("--scenario", default="healthy", choices=list(SCENARIOS.keys()), help="Clinical Scenario")
    parser.add_argument("--interval", type=float, default=3.0, help="Sampling interval in seconds")
    parser.add_argument("--count", type=int, default=20, help="Number of packets to send (0 = infinite)")
    args = parser.parse_args()

    run_standalone_device(
        backend_url=args.url,
        patient_id=args.patient,
        scenario_id=args.scenario,
        interval=args.interval,
        iterations=args.count
    )

