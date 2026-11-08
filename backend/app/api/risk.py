from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_collection
from app.auth import get_current_user, verify_patient_access
from app.models.risk import RiskAssessmentResponse
from app.ml.risk_scorer import risk_engine
from app.ml.groq_assistant import groq_assistant
from app.services.contextual_intelligence import ContextualIntelligenceEngine

router = APIRouter(prefix="/api/risk", tags=["AI Risk Engine"])
contextual_engine = ContextualIntelligenceEngine()

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

    explanation_res = await groq_assistant.explain_vitals_and_alert(
        patient_name=patient.get("full_name", f"Patient {patient_id}"),
        vitals=latest_vital,
        risk_data=latest_risk,
        alert_info=alert_info,
        user_query=req.user_query
    )

    return explanation_res

@router.get("/{patient_id}/contextual-intelligence")
async def get_patient_contextual_intelligence(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    authorized = await verify_patient_access(current_user, patient_id)
    if not authorized:
        raise HTTPException(status_code=403, detail="Unauthorized access to patient context.")

    vitals_col = get_collection("vital_readings")
    latest_vital = await vitals_col.find_one({"patient_id": patient_id}, sort=[("timestamp", -1)]) or {}

    analysis = await contextual_engine.analyze_patient_context(
        patient_id=patient_id,
        current_vitals=latest_vital
    )
    return analysis

@router.get("/models/evaluation-metrics")
async def get_ml_model_evaluation_metrics(
    current_user: dict = Depends(get_current_user)
):
    """
    Returns quantitative evaluation benchmarks for the Scikit-learn Isolation Forest
    anomaly detection engine and 24-48h Autoregressive physiological forecasting model.
    """
    from app.ml.model_evaluator import model_evaluator
    if_metrics = model_evaluator.evaluate_isolation_forest(n_test_samples=400)
    forecast_metrics = model_evaluator.evaluate_forecasting_error()
    return {
        "anomaly_detector": if_metrics,
        "forecasting_engine": forecast_metrics,
        "evaluated_at": datetime.utcnow().isoformat()
    }



