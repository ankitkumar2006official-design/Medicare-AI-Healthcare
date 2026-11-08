from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_collection
from app.auth import get_current_user, verify_patient_access
from app.models.risk import RiskAssessmentResponse
from app.ml.risk_scorer import risk_engine
from app.ml.gemini_assistant import gemini_assistant

router = APIRouter(prefix="/api/risk", tags=["AI Risk Engine"])

class AnalyzeRiskRequest(BaseModel):
    patient_id: str
    vitals: Dict[str, Any]

class ExplainRiskRequest(BaseModel):
    user_query: Optional[str] = None
    alert_id: Optional[str] = None

@router.post("/analyze")
async def analyze_risk(
    req: AnalyzeRiskRequest,
    current_user: dict = Depends(get_current_user)
):
    patient_col = get_collection("patients")
    patient = await patient_col.find_one({"patient_id": req.patient_id})
    baseline = patient.get("baseline_vitals") if patient else None

    result = risk_engine.evaluate_risk(
        patient_id=req.patient_id,
        current_vitals=req.vitals,
        baseline=baseline
    )
    return result

@router.get("/{patient_id}", response_model=Optional[RiskAssessmentResponse])
async def get_patient_latest_risk(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    authorized = await verify_patient_access(current_user, patient_id)
    if not authorized:
        raise HTTPException(status_code=403, detail="Unauthorized access to patient risk assessment.")

    risk_col = get_collection("risk_assessments")
    latest = await risk_col.find_one({"patient_id": patient_id}, sort=[("timestamp", -1)])
    if not latest:
        return None

    latest["id"] = str(latest.get("_id", ""))
    return RiskAssessmentResponse(**latest)

@router.get("/{patient_id}/history", response_model=List[RiskAssessmentResponse])
async def get_patient_risk_history(
    patient_id: str,
    limit: int = Query(30, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    authorized = await verify_patient_access(current_user, patient_id)
    if not authorized:
        raise HTTPException(status_code=403, detail="Unauthorized access to patient risk assessment.")

    risk_col = get_collection("risk_assessments")
    docs = await risk_col.find({"patient_id": patient_id})\
        .sort("timestamp", -1)\
        .limit(limit)\
        .to_list()

    for d in docs:
        d["id"] = str(d.get("_id", ""))

    return [RiskAssessmentResponse(**d) for d in docs]

@router.post("/{patient_id}/explain")
async def explain_patient_risk(
    patient_id: str,
    req: ExplainRiskRequest,
    current_user: dict = Depends(get_current_user)
):
    authorized = await verify_patient_access(current_user, patient_id)
    if not authorized:
        raise HTTPException(status_code=403, detail="Unauthorized access to patient risk explanation.")

    patient_col = get_collection("patients")
    vitals_col = get_collection("vital_readings")
    risk_col = get_collection("risk_assessments")
    alert_col = get_collection("alerts")

    patient = await patient_col.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    latest_vital = await vitals_col.find_one({"patient_id": patient_id}, sort=[("timestamp", -1)]) or {}
    latest_risk = await risk_col.find_one({"patient_id": patient_id}, sort=[("timestamp", -1)]) or {}

    alert_info = None
    if req.alert_id:
        alert_info = await alert_col.find_one({"_id": req.alert_id})

    explanation_res = await gemini_assistant.explain_vitals_and_alert(
        patient_name=patient.get("full_name", f"Patient {patient_id}"),
        vitals=latest_vital,
        risk_data=latest_risk,
        alert_info=alert_info,
        user_query=req.user_query
    )

    return explanation_res
