@echo off
echo ===================================================
echo 1. Running Core Telemetry & Ingestion Test Suite...
echo ===================================================
python -u backend/test_runner.py

echo.
echo ===================================================
echo 2. Running Operation Ward Zero Upgrade Test Suite...
echo ===================================================
python -u test_upgrades.py

pause

