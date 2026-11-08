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

    logger.info("Demo dataset verification and seeding complete.")

