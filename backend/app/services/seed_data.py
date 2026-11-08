import logging
from datetime import datetime, timedelta
import uuid

from app.auth import hash_password
from app.database import get_collection
from app.models import UserRole, DeviceStatus

logger = logging.getLogger("mediguard.seed")

DEMO_USERS = [
    {
        "_id": "user-admin-01",
        "email": "admin@mediguard.ai",
        "full_name": "Dr. Arthur Pendelton (System Administrator)",
        "role": UserRole.ADMIN.value,
        "phone": "+1-800-555-0101",
        "is_active": True,
        "assigned_patient_ids": ["PT-1001", "PT-1002", "PT-1003", "PT-1004", "PT-1005"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "_id": "user-doctor-01",
        "email": "doctor@mediguard.ai",
        "full_name": "Dr. Sarah Chen, MD (Cardiologist)",
        "role": UserRole.DOCTOR.value,
        "phone": "+1-800-555-0102",
        "is_active": True,
        "assigned_patient_ids": ["PT-1001", "PT-1002", "PT-1003", "PT-1004", "PT-1005"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "_id": "user-caregiver-01",
        "email": "caregiver@mediguard.ai",
        "full_name": "James Wilson, RN (Lead Home Caregiver)",
        "role": UserRole.CAREGIVER.value,
        "phone": "+1-800-555-0103",
        "is_active": True,
        "assigned_patient_ids": ["PT-1001", "PT-1002", "PT-1003", "PT-1004", "PT-1005"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "_id": "user-patient-01",
        "email": "patient@mediguard.ai",
        "full_name": "Eleanor Vance (Patient)",
        "role": UserRole.PATIENT.value,
        "phone": "+1-800-555-0104",
        "is_active": True,
        "patient_id": "PT-1001",
        "assigned_patient_ids": ["PT-1001"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
]

DEMO_PATIENTS = [
    {
        "patient_id": "PT-1001",
        "full_name": "Eleanor Vance",
        "age": 74,
        "gender": "Female",
        "room_number": "Ward A - Suite 101",
        "medical_history": ["Congestive Heart Failure Stage B", "Chronic Essential Hypertension", "Mild Osteoarthritis"],
        "existing_conditions": ["CHF", "Hypertension"],
        "allergies": ["Penicillin", "Sulfa drugs"],
        "emergency_contact": {"name": "Robert Vance (Son)", "phone": "+1-555-0199", "relation": "Son"},
        "assigned_doctor_id": "user-doctor-01",
        "assigned_caregiver_id": "user-caregiver-01",
        "baseline_vitals": {
            "heart_rate_min": 60.0,
            "heart_rate_max": 90.0,
            "spo2_min": 94.0,
            "temp_min": 36.2,
            "temp_max": 37.3,
            "bp_sys_min": 110.0,
            "bp_sys_max": 135.0,
            "bp_dia_min": 70.0,
            "bp_dia_max": 85.0,
            "resp_rate_min": 12.0,
            "resp_rate_max": 18.0,
            "glucose_min": 80.0,
            "glucose_max": 130.0
        },
        "is_monitored": True,
        "active_scenario": "healthy",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "patient_id": "PT-1002",
        "full_name": "Marcus Rodriguez",
        "age": 58,
        "gender": "Male",
        "room_number": "Ward A - Suite 102",
        "medical_history": ["Post-Operative CABG x3 (Day 6)", "Type 2 Diabetes Mellitus", "Hyperlipidemia"],
        "existing_conditions": ["Post-CABG", "Type 2 Diabetes"],
        "allergies": ["Codeine"],
        "emergency_contact": {"name": "Maria Rodriguez (Spouse)", "phone": "+1-555-0182", "relation": "Spouse"},
        "assigned_doctor_id": "user-doctor-01",
        "assigned_caregiver_id": "user-caregiver-01",
        "baseline_vitals": {
            "heart_rate_min": 65.0,
            "heart_rate_max": 95.0,
            "spo2_min": 95.0,
            "temp_min": 36.4,
            "temp_max": 37.4,
            "bp_sys_min": 105.0,
            "bp_sys_max": 130.0,
            "bp_dia_min": 65.0,
            "bp_dia_max": 85.0,
            "resp_rate_min": 14.0,
            "resp_rate_max": 20.0,
            "glucose_min": 90.0,
            "glucose_max": 160.0
        },
        "is_monitored": True,
        "active_scenario": "falling_spo2",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "patient_id": "PT-1003",
        "full_name": "Beatrice Campbell",
        "age": 82,
        "gender": "Female",
        "room_number": "Ward B - Suite 201",
        "medical_history": ["Severe COPD GOLD 3", "Home Oxygen Therapy (2L/min)", "Osteoporosis"],
        "existing_conditions": ["COPD", "Hypoxemia"],
        "allergies": ["Latex", "Aspirin"],
        "emergency_contact": {"name": "Claire Campbell (Daughter)", "phone": "+1-555-0144", "relation": "Daughter"},
        "assigned_doctor_id": "user-doctor-01",
        "assigned_caregiver_id": "user-caregiver-01",
        "baseline_vitals": {
            "heart_rate_min": 70.0,
            "heart_rate_max": 100.0,
            "spo2_min": 88.0,
            "temp_min": 36.0,
            "temp_max": 37.2,
            "bp_sys_min": 115.0,
            "bp_sys_max": 140.0,
            "bp_dia_min": 70.0,
            "bp_dia_max": 88.0,
            "resp_rate_min": 16.0,
            "resp_rate_max": 24.0,
            "glucose_min": 80.0,
            "glucose_max": 140.0
        },
        "is_monitored": True,
        "active_scenario": "respiratory_distress",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "patient_id": "PT-1004",
        "full_name": "David Chen",
        "age": 46,
        "gender": "Male",
        "room_number": "Ward B - Suite 202",
        "medical_history": ["Right Lower Lobe Bacterial Pneumonia", "Asthma (Mild Persistent)"],
        "existing_conditions": ["Pneumonia", "Fever"],
        "allergies": ["None known"],
        "emergency_contact": {"name": "Linda Chen (Sister)", "phone": "+1-555-0173", "relation": "Sister"},
        "assigned_doctor_id": "user-doctor-01",
        "assigned_caregiver_id": "user-caregiver-01",
        "baseline_vitals": {
            "heart_rate_min": 60.0,
            "heart_rate_max": 90.0,
            "spo2_min": 95.0,
            "temp_min": 36.5,
            "temp_max": 37.2,
            "bp_sys_min": 110.0,
            "bp_sys_max": 125.0,
            "bp_dia_min": 70.0,
            "bp_dia_max": 80.0,
            "resp_rate_min": 12.0,
            "resp_rate_max": 18.0,
            "glucose_min": 75.0,
            "glucose_max": 120.0
        },
        "is_monitored": True,
        "active_scenario": "high_fever",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "patient_id": "PT-1005",
        "full_name": "Aisha Patel",
        "age": 67,
        "gender": "Female",
        "room_number": "Ward C - Suite 301",
        "medical_history": ["Paroxysmal Atrial Fibrillation", "Chronic Kidney Disease Stage 3", "Hypothyroidism"],
        "existing_conditions": ["A-Fib", "CKD Stage 3"],
        "allergies": ["Iodinated Radiocontrast", "Cephalosporins"],
        "emergency_contact": {"name": "Tariq Patel (Son)", "phone": "+1-555-0112", "relation": "Son"},
        "assigned_doctor_id": "user-doctor-01",
        "assigned_caregiver_id": "user-caregiver-01",
        "baseline_vitals": {
            "heart_rate_min": 60.0,
            "heart_rate_max": 90.0,
            "spo2_min": 95.0,
            "temp_min": 36.1,
            "temp_max": 37.1,
            "bp_sys_min": 115.0,
            "bp_sys_max": 135.0,
            "bp_dia_min": 70.0,
            "bp_dia_max": 85.0,
            "resp_rate_min": 12.0,
            "resp_rate_max": 18.0,
            "glucose_min": 85.0,
            "glucose_max": 135.0
        },
        "is_monitored": True,
        "active_scenario": "elevated_heart_rate",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
]

DEMO_MEDICATIONS = [
    {
        "patient_id": "PT-1001",
        "name": "Lisinopril",
        "dosage": "10 mg",
        "frequency": "Once daily",
        "scheduled_times": ["08:00"],
        "route": "Oral",
        "instructions": "Take in the morning with food",
        "start_date": "2026-01-01",
        "prescribed_by": "Dr. Sarah Chen, MD",
        "reminder_status": "active"
    },
    {
        "patient_id": "PT-1001",
        "name": "Furosemide (Lasix)",
        "dosage": "20 mg",
        "frequency": "Once daily",
        "scheduled_times": ["08:00"],
        "route": "Oral",
        "instructions": "Take in the morning to prevent nocturia",
        "start_date": "2026-01-01",
        "prescribed_by": "Dr. Sarah Chen, MD",
        "reminder_status": "active"
    },
    {
        "patient_id": "PT-1002",
        "name": "Metformin",
        "dosage": "500 mg",
        "frequency": "Twice daily",
        "scheduled_times": ["08:00", "20:00"],
        "route": "Oral",
        "instructions": "Take with meals",
        "start_date": "2026-01-01",
        "prescribed_by": "Dr. Sarah Chen, MD",
        "reminder_status": "active"
    },
    {
        "patient_id": "PT-1003",
        "name": "Tiotropium (Spiriva)",
        "dosage": "18 mcg",
        "frequency": "Once daily inhalation",
        "scheduled_times": ["09:00"],
        "route": "Inhalation",
        "instructions": "Rinse mouth after inhalation",
        "start_date": "2026-01-01",
        "prescribed_by": "Dr. Sarah Chen, MD",
        "reminder_status": "active"
    },
    {
        "patient_id": "PT-1004",
        "name": "Amoxicillin-Clavulanate",
        "dosage": "875/125 mg",
        "frequency": "Every 12 hours",
        "scheduled_times": ["08:00", "20:00"],
        "route": "Oral",
        "instructions": "Complete full 10-day antibiotic course",
        "start_date": "2026-01-01",
        "prescribed_by": "Dr. Sarah Chen, MD",
        "reminder_status": "active"
    },
    {
        "patient_id": "PT-1005",
        "name": "Metoprolol Succinate",
        "dosage": "50 mg",
        "frequency": "Once daily",
        "scheduled_times": ["08:00"],
        "route": "Oral",
        "instructions": "Monitor pulse before administration",
        "start_date": "2026-01-01",
        "prescribed_by": "Dr. Sarah Chen, MD",
        "reminder_status": "active"
    }
]

async def seed_initial_data():
    """Seeds default accounts, patients, devices, and medication schedules."""
    user_col = get_collection("users")
    patient_col = get_collection("patients")
    device_col = get_collection("devices")
    med_col = get_collection("medications")

    # 1. Seed Users
    default_passwords = {
        "admin@mediguard.ai": "AdminPass123!",
        "doctor@mediguard.ai": "DoctorPass123!",
        "caregiver@mediguard.ai": "CaregiverPass123!",
        "patient@mediguard.ai": "PatientPass123!"
    }
    for u in DEMO_USERS:
        existing = await user_col.find_one({"email": u["email"]})
        if not existing:
            u_doc = u.copy()
            u_doc["hashed_password"] = hash_password(default_passwords[u["email"]])
            await user_col.insert_one(u_doc)
            logger.info(f"Seeded user: {u['email']} ({u['role']})")

    # 2. Seed Patients
    for p in DEMO_PATIENTS:
        existing = await patient_col.find_one({"patient_id": p["patient_id"]})
        if not existing:
            await patient_col.insert_one(p.copy())
            logger.info(f"Seeded patient: {p['patient_id']} - {p['full_name']}")

    # 3. Seed Devices
    for p in DEMO_PATIENTS:
        dev_id = f"DEV-{p['patient_id']}"
        existing = await device_col.find_one({"device_id": dev_id})
        if not existing:
            dev_doc = {
                "device_id": dev_id,
                "device_type": "Multi-Parameter Bedside Telemetry Unit",
                "patient_id": p["patient_id"],
                "patient_name": p["full_name"],
                "status": DeviceStatus.ONLINE.value,
                "battery_level": 97.5,
                "firmware_version": "v3.2.1-mguard",
                "sampling_rate_hz": 0.5,
                "last_ping": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await device_col.insert_one(dev_doc)

    # 4. Seed Medications
    for m in DEMO_MEDICATIONS:
        existing = await med_col.find_one({"patient_id": m["patient_id"], "name": m["name"]})
        if not existing:
            m_doc = m.copy()
            m_doc["created_at"] = datetime.utcnow()
            m_doc["updated_at"] = datetime.utcnow()
            await med_col.insert_one(m_doc)

    # 5. Seed Caregiver Attendance and Activity
    att_col = get_collection("caregiver_attendance")
    act_col = get_collection("caregiver_activity")
    att_count = await att_col.count_documents({})
    if att_count == 0:
        now = datetime.utcnow()
        att_docs = [
            {
                "_id": "att-seed-01",
                "id": "att-seed-01",
                "caregiver_id": "user-caregiver-01",
                "caregiver_name": "James Wilson, RN",
                "patient_id": "PT-1001",
                "patient_name": "Eleanor Vance",
                "shift_type": "day",
                "status": "checked_in",
                "check_in_time": now - timedelta(hours=3, minutes=15),
                "check_out_time": None,
                "duration_minutes": 195,
                "check_in_location": {
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "accuracy_meters": 4.5,
                    "address_label": "Ward Zero Resident Bedroom 101, San Francisco, CA",
                    "within_geofence": True
                },
                "check_out_location": None,
                "scheduled_check_in": now - timedelta(hours=3, minutes=30),
                "is_missed_or_late": False,
                "notes": "Morning vitals verification and telemetry sensor lead placement completed.",
                "created_at": now - timedelta(hours=3, minutes=15)
            },
            {
                "_id": "att-seed-02",
                "id": "att-seed-02",
                "caregiver_id": "user-caregiver-01",
                "caregiver_name": "James Wilson, RN",
                "patient_id": "PT-1002",
                "patient_name": "Marcus Rodriguez",
                "shift_type": "night",
                "status": "checked_out",
                "check_in_time": now - timedelta(hours=27),
                "check_out_time": now - timedelta(hours=19),
                "duration_minutes": 480,
                "check_in_location": {
                    "latitude": 37.7750,
                    "longitude": -122.4190,
                    "accuracy_meters": 3.8,
                    "address_label": "Ward Zero Resident Room 102, San Francisco, CA",
                    "within_geofence": True
                },
                "check_out_location": {
                    "latitude": 37.7751,
                    "longitude": -122.4192,
                    "accuracy_meters": 5.1,
                    "address_label": "Ward Zero Resident Room 102, San Francisco, CA",
                    "within_geofence": True
                },
                "scheduled_check_in": now - timedelta(hours=27),
                "is_missed_or_late": False,
                "notes": "Night shift telemetry observation logged without incident.",
                "created_at": now - timedelta(hours=27)
            }
        ]
        for a in att_docs:
            await att_col.insert_one(a)
        logger.info("Seeded initial caregiver attendance records.")

    act_count = await act_col.count_documents({})
    if act_count == 0:
        now = datetime.utcnow()
        act_docs = [
            {
                "_id": "act-seed-01",
                "id": "act-seed-01",
                "caregiver_id": "user-caregiver-01",
                "caregiver_name": "James Wilson, RN",
                "patient_id": "PT-1001",
                "patient_name": "Eleanor Vance",
                "activity_type": "bedside_visit",
                "description": "Routine vital sign auscultation & SpO2 sensor calibration",
                "timestamp": now - timedelta(minutes=45),
                "metadata": {"bp_manual": "122/82", "spo2_verified": 98}
            },
            {
                "_id": "act-seed-02",
                "id": "act-seed-02",
                "caregiver_id": "user-caregiver-01",
                "caregiver_name": "James Wilson, RN",
                "patient_id": "PT-1002",
                "patient_name": "Marcus Rodriguez",
                "activity_type": "alert_acknowledged",
                "description": "Rapid triage bedside response for telemetry hypoxia trigger",
                "timestamp": now - timedelta(hours=1, minutes=10),
                "metadata": {"alert_id": "ALT-DEMO-01", "response_time_seconds": 32}
            },
            {
                "_id": "act-seed-03",
                "id": "act-seed-03",
                "caregiver_id": "user-caregiver-01",
                "caregiver_name": "James Wilson, RN",
                "patient_id": "PT-1001",
                "patient_name": "Eleanor Vance",
                "activity_type": "medication_administered",
                "description": "Administered scheduled morning dose of Lisinopril 10mg PO",
                "timestamp": now - timedelta(hours=2, minutes=30),
                "metadata": {"medication": "Lisinopril", "dosage": "10mg"}
            }
        ]
        for act in act_docs:
            await act_col.insert_one(act)
        logger.info("Seeded initial caregiver activity log entries.")

    logger.info("Demo dataset verification and seeding complete.")

