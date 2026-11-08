import pytest
from app.ml.model_evaluator import model_evaluator

def test_isolation_forest_benchmark():
    metrics = model_evaluator.evaluate_isolation_forest(n_test_samples=200)
    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall_sensitivity" in metrics
    assert "f1_score" in metrics
    assert metrics["test_sample_size"] == 200
    assert metrics["accuracy"] >= 80.0
    assert metrics["f1_score"] >= 80.0
    assert metrics["clinical_benchmark_status"] == "EXCELLENT"

def test_forecasting_error_metrics():
    fc_metrics = model_evaluator.evaluate_forecasting_error()
    assert "parameters" in fc_metrics
    assert "oxygen_saturation" in fc_metrics["parameters"]
    assert "heart_rate" in fc_metrics["parameters"]
    spo2_metrics = fc_metrics["parameters"]["oxygen_saturation"]
    assert spo2_metrics["mean_absolute_error"] < 1.0  # SpO2 MAE under 1%
    assert spo2_metrics["root_mean_squared_error"] < 1.5
