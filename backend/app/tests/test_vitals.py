import asyncio
import pytest
from app.services.ingestion_service import ingest_vital_reading
from app.database import db_manager, get_collection

def test_vital_ingestion_and_pipeline():
    async def _run():
        await db_manager.connect()
        
        # Ingest synthetic reading
        packet = {
            "patient_id": "PT-TEST-01",
            "device_id": "DEV-TEST-01",
            "heart_rate": 75.0,
            "oxygen_saturation": 98.0,
            "body_temperature": 36.8,
            "blood_pressure_systolic": 118.0,
            "blood_pressure_diastolic": 76.0,
            "respiratory_rate": 16.0,
            "glucose_level": 92.0,
            "sensor_connected": True
        }
        result = await ingest_vital_reading(packet)
        assert result["vital_id"] is not None
        assert result["risk_category"] == "stable"

        # Verify document in DB
        vital_col = get_collection("vital_readings")
        saved = await vital_col.find_one({"patient_id": "PT-TEST-01"})
        assert saved is not None
        assert saved["heart_rate"] == 75.0

    asyncio.run(_run())
