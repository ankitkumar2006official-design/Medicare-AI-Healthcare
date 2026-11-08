import asyncio
import json
import logging
from typing import Dict, List, Set, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

from app.auth import decode_access_token
from app.models import UserRole

logger = logging.getLogger("mediguard.ws")

class ConnectionManager:
    def __init__(self):
        # Store active connections: ws -> user_dict
        self.active_connections: Dict[WebSocket, dict] = {}
        # Patient specific room mapping: patient_id -> set of WebSockets
        self.patient_subscriptions: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, token: Optional[str] = None) -> Optional[dict]:
        await websocket.accept()
        user_info = None
        if token:
            try:
                payload = decode_access_token(token)
                user_info = {
                    "user_id": payload.get("sub"),
                    "role": payload.get("role", "caregiver"),
                    "email": payload.get("email"),
                    "assigned_patient_ids": payload.get("assigned_patient_ids", [])
                }
            except Exception as e:
                logger.warning(f"WebSocket auth token invalid: {e}")
                user_info = {"role": "guest", "user_id": "guest"}
        else:
            user_info = {"role": "guest", "user_id": "guest"}

        async with self._lock:
            self.active_connections[websocket] = user_info

        logger.info(f"WebSocket client connected: {user_info.get('email', 'guest')}")
        return user_info

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                del self.active_connections[websocket]
            for pid, subs in self.patient_subscriptions.items():
                subs.discard(websocket)
        logger.info("WebSocket client disconnected.")

    async def subscribe_patient(self, websocket: WebSocket, patient_id: str):
        async with self._lock:
            if patient_id not in self.patient_subscriptions:
                self.patient_subscriptions[patient_id] = set()
            self.patient_subscriptions[patient_id].add(websocket)

    def is_authorized_for_patient(self, user_info: dict, patient_id: Optional[str]) -> bool:
        if not patient_id:
            return True
        role = user_info.get("role")
        # Admin, doctor, caregiver or guest in demo mode can see monitoring
        if role in [UserRole.ADMIN.value, UserRole.DOCTOR.value, "guest"]:
            return True
        assigned = user_info.get("assigned_patient_ids", [])
        if role == UserRole.CAREGIVER.value:
            return True if not assigned else (patient_id in assigned)
        if role == UserRole.PATIENT.value:
            return (patient_id in assigned) or (user_info.get("patient_id") == patient_id)
        return True

    async def broadcast_event(self, event_type: str, data: Any, patient_id: Optional[str] = None):
        """Broadcasts event strictly to authorized connected clients."""
        payload = {
            "event": event_type,
            "data": data,
            "patient_id": patient_id
        }
        text_data = json.dumps(payload, default=str)

        dead_sockets: List[WebSocket] = []
        async with self._lock:
            sockets_to_send = list(self.active_connections.items())

        for ws, user_info in sockets_to_send:
            try:
                if self.is_authorized_for_patient(user_info, patient_id):
                    await ws.send_text(text_data)
            except Exception as e:
                logger.warning(f"Error sending to websocket: {e}")
                dead_sockets.append(ws)

        if dead_sockets:
            async with self._lock:
                for ws in dead_sockets:
                    self.active_connections.pop(ws, None)
                    for pid, subs in self.patient_subscriptions.items():
                        subs.discard(ws)


ws_manager = ConnectionManager()

