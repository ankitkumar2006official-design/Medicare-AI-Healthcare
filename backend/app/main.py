import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import db_manager, get_collection
from app.services.seed_data import seed_initial_data
from app.services.websocket_manager import ws_manager
from app.services.ingestion_service import ingest_vital_reading
from simulator.sensor_engine import sensor_engine

from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.vitals import router as vitals_router
from app.api.risk import router as risk_router
from app.api.alerts import router as alerts_router
from app.api.caregiver import router as caregiver_router
from app.api.devices import router as devices_router
from app.api.simulator import router as simulator_router
from app.api.medications import router as medications_router
from app.api.analytics import router as analytics_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("mediguard.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing MediGuard AI – Operation Ward Zero...")
    await db_manager.connect()
    await seed_initial_data()

    # Initialize Simulator
    patients_col = get_collection("patients")
    patients = await patients_col.find().to_list()
    patient_ids = [p["patient_id"] for p in patients]
    sensor_engine.initialize_patients(patient_ids)
    sensor_engine.set_ingestion_callback(ingest_vital_reading)

    if settings.SIMULATOR_AUTO_START:
        sensor_engine.start()
        logger.info("IoT Sensor Simulator background streaming task active.")

    yield

    # Shutdown sequence
    logger.info("Shutting down MediGuard AI...")
    sensor_engine.pause()
    await db_manager.close()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intelligent Home-to-Ward Telemetry & Clinical Early Warning Platform",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permits local dev & deployed clients
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST Routers
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(vitals_router)
app.include_router(risk_router)
app.include_router(alerts_router)
app.include_router(caregiver_router)
app.include_router(devices_router)
app.include_router(simulator_router)
app.include_router(medications_router)
app.include_router(analytics_router)

@app.get("/")
async def root():
    return {
        "system": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "database_type": db_manager.db_type,
        "simulator_active": sensor_engine.is_running,
        "docs_url": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "db_connected": db_manager.is_connected_to_mongo or (db_manager.db is not None),
        "db_mode": db_manager.db_type,
        "simulator_running": sensor_engine.is_running
    }

# Real-Time WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    user_info = await ws_manager.connect(websocket, token)
    try:
        while True:
            raw_text = await websocket.receive_text()
            # Client can send subscribe or ping events
            try:
                import json
                msg = json.loads(raw_text)
                action = msg.get("action")
                if action == "subscribe_patient":
                    pid = msg.get("patient_id")
                    if pid:
                        await ws_manager.subscribe_patient(websocket, pid)
                        await websocket.send_text(json.dumps({
                            "event": "subscribed",
                            "patient_id": pid,
                            "status": "ok"
                        }))
                elif action == "ping":
                    await websocket.send_text(json.dumps({"event": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection error: {e}")
        await ws_manager.disconnect(websocket)

