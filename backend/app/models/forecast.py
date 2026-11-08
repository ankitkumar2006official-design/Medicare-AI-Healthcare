from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ForecastPoint(BaseModel):
    horizon_hours: float = 6.0
    hour_offset: Optional[float] = None
    target_timestamp: datetime = Field(default_factory=datetime.utcnow)
    predicted_value: float = 0.0
    confidence_lower: float = 0.0
    confidence_upper: float = 0.0
    lower_bound_95: Optional[float] = None
    upper_bound_95: Optional[float] = None
    confidence_spread: Optional[float] = None

class ParameterForecast(BaseModel):
    parameter: str
    unit: str
    current_value: float
    trajectory: str = "stable"  # "stable", "improving", "deteriorating", "fluctuating"
    points: List[ForecastPoint] = Field(default_factory=list)

class PredictiveDeteriorationAnalysis(BaseModel):
    patient_id: str
    patient_name: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    forecast_window_hours: int = 48
    deterioration_probability_24h: float = 15.0  # 0 to 100%
    deterioration_probability_48h: float = 25.0  # 0 to 100%
    deterioration_probability: Optional[float] = 25.0
    projected_risk_trend: str = "STABLE"
    risk_trajectory_rating: Optional[str] = "STABLE"
    contributing_factors: List[Dict[str, Any]] = Field(default_factory=list)
    contributing_feature_weights: Optional[Dict[str, float]] = Field(default_factory=dict)
    model_architecture: str = "Autoregressive Drift & Exponential Smoothing + Gradient Feature Weights"
    parameters: Dict[str, ParameterForecast] = Field(default_factory=dict)
    disclaimer: str = (
        "RESEARCH NOTICE: This 24–48 hour physiological forecast is experimental and generated using synthetic time-series trends. "
        "It is designed solely for trend visualization and proactive caregiver preparedness. It does not constitute a medically validated clinical diagnosis."
    )
    clinical_disclaimer: Optional[str] = None
