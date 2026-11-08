import sys
import os
import time

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.tests.test_auth import test_password_hashing, test_jwt_generation_and_decoding
from app.tests.test_risk_ml import (
    test_layer1_clinical_rules_hypoxia,
    test_layer2_isolation_forest_anomaly_detection,
    test_layer3_risk_assessment_safety_invariant
)
from app.tests.test_vitals import test_vital_ingestion_and_pipeline
from app.tests.test_alerts import test_alert_lifecycle

def run_all_tests():
    print("==================================================")
    print("   MediGuard AI – Verification Test Suite         ")
    print("==================================================")
    tests = [
        ("Auth: Password Hashing (Bcrypt)", test_password_hashing),
        ("Auth: JWT Generation & Role Decoding", test_jwt_generation_and_decoding),
        ("ML Layer 1: Clinical Safety Rules (Hypoxia/Critical)", test_layer1_clinical_rules_hypoxia),
        ("ML Layer 2: Isolation Forest Anomaly Detection", test_layer2_isolation_forest_anomaly_detection),
        ("ML Layer 3: Risk Assessment Composite & Safety Invariant", test_layer3_risk_assessment_safety_invariant),
        ("Telemetry: Vital Reading Ingestion & Pipeline", test_vital_ingestion_and_pipeline),
        ("Alerts: Alert Lifecycle, Ack, Escalate & Resolve", test_alert_lifecycle),
    ]

    passed = 0
    failed = 0
    for name, func in tests:
        t0 = time.time()
        try:
            func()
            elapsed = (time.time() - t0) * 1000
            print(f" [PASS] {name} ({elapsed:.1f}ms)")
            passed += 1
        except Exception as e:
            elapsed = (time.time() - t0) * 1000
            print(f" [FAIL] {name} ({elapsed:.1f}ms): {e}")
            import traceback
            traceback.print_exc()
            failed += 1

    print("==================================================")
    print(f"Result: {passed} passed, {failed} failed.")
    print("==================================================")
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

