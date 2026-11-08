from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models import RiskCategory

class AnomalyResult(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    feature_deviations: Dict[str, float] = Field(default_factory=dict)

class RiskAssessmentBase(BaseModel):
    patient_id: str
    risk_category: RiskCategory
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Risk score 0 (stable) to 100 (critical)")
    detected_abnormalities: List[str] = Field(default_factory=list)
    contributing_factors: List[str] = Field(default_factory=list)
    recommended_escalation: str
    rule_violations: List[str] = Field(default_factory=list)
    anomaly_metrics: Optional[AnomalyResult] = None
    natural_language_summary: Optional[str] = None
    vital_snapshot: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class RiskAssessmentResponse(RiskAssessmentBase):
    id: str

