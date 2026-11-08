@echo off
echo Starting MediGuard AI Standalone IoT Telemetry Transmitter...
python simulator/device_runner.py --patient PT-1002 --scenario falling_spo2 --interval 3.0 --count 50
pause

