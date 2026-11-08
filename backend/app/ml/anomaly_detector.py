import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.ensemble import IsolationForest

logger = logging.getLogger("mediguard.ml.anomaly")

FEATURE_NAMES = [
    "heart_rate",
    "oxygen_saturation",
    "body_temperature",
    "blood_pressure_systolic",
    "blood_pressure_diastolic",
    "respiratory_rate",
    "glucose_level"
]

FEATURE_MEANS = {
    "heart_rate": 75.0,
    "oxygen_saturation": 98.0,
    "body_temperature": 36.7,
    "blood_pressure_systolic": 118.0,
    "blood_pressure_diastolic": 76.0,
    "respiratory_rate": 15.0,
    "glucose_level": 105.0
}

FEATURE_STDS = {
    "heart_rate": 10.0,
    "oxygen_saturation": 1.2,
    "body_temperature": 0.35,
    "blood_pressure_systolic": 10.0,
    "blood_pressure_diastolic": 7.0,
    "respiratory_rate": 2.5,
    "glucose_level": 18.0
}

class VitalAnomalyDetector:
    def __init__(self, contamination: float = 0.04):
        self.contamination = contamination
        self.model: IsolationForest = IsolationForest(
            n_estimators=50,
            contamination=contamination,
            random_state=42,
            n_jobs=1
        )
        self.is_trained = False
        self._train_initial_model()

    def _generate_synthetic_baseline_corpus(self, n_samples: int = 1000) -> np.ndarray:
        """Generates realistic correlated synthetic vitals for unsupervised baseline learning."""
        np.random.seed(42)
        hr = np.random.normal(FEATURE_MEANS["heart_rate"], FEATURE_STDS["heart_rate"], n_samples)
        spo2 = np.clip(np.random.normal(FEATURE_MEANS["oxygen_saturation"], FEATURE_STDS["oxygen_saturation"], n_samples), 94.0, 100.0)
        temp = np.random.normal(FEATURE_MEANS["body_temperature"], FEATURE_STDS["body_temperature"], n_samples)
        bp_sys = np.random.normal(FEATURE_MEANS["blood_pressure_systolic"], FEATURE_STDS["blood_pressure_systolic"], n_samples)
        bp_dia = np.random.normal(FEATURE_MEANS["blood_pressure_diastolic"], FEATURE_STDS["blood_pressure_diastolic"], n_samples)
        resp = np.random.normal(FEATURE_MEANS["respiratory_rate"], FEATURE_STDS["respiratory_rate"], n_samples)
        glucose = np.random.normal(FEATURE_MEANS["glucose_level"], FEATURE_STDS["glucose_level"], n_samples)

        data = np.column_stack([hr, spo2, temp, bp_sys, bp_dia, resp, glucose])
        return data

    def _train_initial_model(self):
        try:
            X = self._generate_synthetic_baseline_corpus()
            self.model.fit(X)
            self.is_trained = True
            logger.info("Isolation Forest anomaly detector initialized and trained successfully.")
        except Exception as e:
            logger.error(f"Failed to train Isolation Forest: {e}")
            self.is_trained = False

    def predict(self, vitals: Dict[str, Any]) -> Tuple[bool, float, Dict[str, float]]:
        """
        Runs Isolation Forest anomaly detection on vital readings.
        Returns:
            is_anomaly: bool (True if outlier)
            anomaly_score: float (0.0 to 1.0, where 1.0 is highest anomaly)
            deviations: dict of per-feature standardized deviation magnitudes
        """
        # Vectorize features with graceful defaults
        row = []
        deviations = {}
        for feat in FEATURE_NAMES:
            val = vitals.get(feat)
            if val is None:
                val = FEATURE_MEANS[feat]
            else:
                try:
                    val = float(val)
                except (ValueError, TypeError):
                    val = FEATURE_MEANS[feat]
            row.append(val)
            # Compute standardized Z-deviation from normal mean
            mean = FEATURE_MEANS[feat]
            std = FEATURE_STDS[feat]
            dev = abs(val - mean) / (std if std > 0 else 1.0)
            deviations[feat] = round(dev, 2)

        if not self.is_trained:
            # Fallback heuristic if ML model fails
            max_dev = max(deviations.values())
            is_anom = max_dev > 2.8
            score = min(max_dev / 4.0, 1.0)
            return is_anom, round(score, 3), deviations

        try:
            X = np.array([row])
            # decision_function: lower means more abnormal
            dec = self.model.decision_function(X)[0]
            pred = self.model.predict(X)[0] # -1 = anomaly, 1 = normal

            # Map decision function roughly into 0.0 (normal) to 1.0 (abnormal)
            # dec is typically around 0.15 for normal, down to -0.3 for strong anomaly
            norm_score = float(np.clip(1.0 - (dec + 0.25) / 0.45, 0.0, 1.0))
            is_anomaly = bool(pred == -1 or norm_score > 0.65)

            return is_anomaly, round(norm_score, 3), deviations
        except Exception as e:
            logger.warning(f"Error during anomaly prediction: {e}")
            return False, 0.0, deviations


anomaly_detector = VitalAnomalyDetector()
