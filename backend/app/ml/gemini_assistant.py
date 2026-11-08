import logging
import os
from typing import Dict, Any, Optional
import httpx

from app.config import settings

logger = logging.getLogger("mediguard.gemini")

SAFETY_DISCLAIMER = (
    "CLINICAL NOTICE: MediGuard AI telemetry insights are intended for decision-support and physiological trend tracking. "
    "This system does not substitute for independent clinical judgment, medical diagnosis, or emergency protocols. "
    "In acute distress, follow hospital escalation and emergency response procedures immediately."
)

class GeminiHealthAssistant:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    async def explain_vitals_and_alert(
        self,
        patient_name: str,
        vitals: Dict[str, Any],
        risk_data: Dict[str, Any],
        alert_info: Optional[Dict[str, Any]] = None,
        user_query: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates explainable natural-language patient insight using Google Gemini if available,
        or deterministic clinical logic fallback.
        """
        # If API key is configured, call Gemini API
        if self.api_key:
            try:
                explanation = await self._call_gemini_api(patient_name, vitals, risk_data, alert_info, user_query)
                return {
                    "source": "gemini_pro",
                    "explanation": explanation,
                    "disclaimer": SAFETY_DISCLAIMER
                }
            except Exception as e:
                logger.warning(f"Gemini API request failed ({e}); switching to deterministic clinical NLP fallback.")

        # Robust deterministic clinical NLP engine
        fallback_text = self._generate_deterministic_explanation(patient_name, vitals, risk_data, alert_info, user_query)
        return {
            "source": "clinical_deterministic_nlp",
            "explanation": fallback_text,
            "disclaimer": SAFETY_DISCLAIMER
        }

    async def _call_gemini_api(
        self,
        patient_name: str,
        vitals: Dict[str, Any],
        risk_data: Dict[str, Any],
        alert_info: Optional[Dict[str, Any]],
        user_query: Optional[str]
    ) -> str:
        prompt = f"""
You are MediGuard AI's Clinical Telemetry Assistant.
Patient: {patient_name}
Current Vitals:
- Heart Rate: {vitals.get('heart_rate')} BPM
- Oxygen Saturation (SpO2): {vitals.get('oxygen_saturation')}%
- Body Temperature: {vitals.get('body_temperature')} °C
- Blood Pressure: {vitals.get('blood_pressure_systolic')}/{vitals.get('blood_pressure_diastolic')} mmHg
- Respiratory Rate: {vitals.get('respiratory_rate')} breaths/min

Risk Category: {risk_data.get('risk_category')}
Risk Score: {risk_data.get('risk_score')}/100
Detected Abnormalities: {risk_data.get('detected_abnormalities', [])}
Alert Context: {alert_info or 'Routine monitoring'}
User Inquiry: {user_query or 'Provide a clinical summary and caregiver instructions.'}

STRICT SAFETY CONSTRAINTS:
1. Prioritize acute safety first. If risk is High or Critical, emphasize immediate bedside checks and physician alert.
2. DO NOT formulate definitive medical diagnoses.
3. DO NOT prescribe or alter medications.
4. Explain clearly in concise professional language why the telemetry readings prompted this risk status.
Keep response to 3 clear paragraphs with bullet points for recommended caregiver steps.
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 600
            }
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip()
            else:
                raise Exception(f"Gemini API returned status {resp.status_code}: {resp.text}")

    def _generate_deterministic_explanation(
        self,
        patient_name: str,
        vitals: Dict[str, Any],
        risk_data: Dict[str, Any],
        alert_info: Optional[Dict[str, Any]],
        user_query: Optional[str]
    ) -> str:
        risk_cat = risk_data.get("risk_category", "stable").upper()
        score = risk_data.get("risk_score", 10.0)
        abnormalities = risk_data.get("detected_abnormalities", [])
        
        paragraphs = []
        # Paragraph 1: Clinical telemetry summary
        if risk_cat in ["CRITICAL", "HIGH"]:
            paragraphs.append(
                f"**URGENT TELEMETRY ALERT for {patient_name}**: The patient is in a **{risk_cat}** risk state (Risk Score: {score}/100). "
                f"The clinical safety engine detected significant physiological deviation requiring prompt medical evaluation."
            )
        elif risk_cat == "MODERATE":
            paragraphs.append(
                f"**TELEMETRY NOTICE for {patient_name}**: The patient has entered a **MODERATE** risk category (Risk Score: {score}/100). "
                f"Mild-to-moderate deviations from baseline telemetry have been detected that warrant bedside verification."
            )
        else:
            paragraphs.append(
                f"**STABLE STATUS for {patient_name}**: Current vitals are well-aligned with the patient's target baseline profile (Risk Score: {score}/100). "
                f"Continuous IoT ward telemetry is operational with no acute rule violations."
            )

        # Paragraph 2: Vital Breakdown & Cause Analysis
        if abnormalities:
            bullets = "\n".join([f"• {a}" for a in abnormalities])
            paragraphs.append(f"**Key Telemetry Triggers & Observations:**\n{bullets}")
        else:
            paragraphs.append(
                f"• Heart Rate: {vitals.get('heart_rate', '--')} BPM (Normal target)\n"
                f"• Oxygen Saturation: {vitals.get('oxygen_saturation', '--')}% (Adequate tissue perfusion)\n"
                f"• Blood Pressure: {vitals.get('blood_pressure_systolic', '--')}/{vitals.get('blood_pressure_diastolic', '--')} mmHg\n"
                f"• Core Temperature: {vitals.get('body_temperature', '--')}°C | Resp Rate: {vitals.get('respiratory_rate', '--')} bpm"
            )

        # Paragraph 3: Recommended Action Plan for Caregiver
        if risk_cat == "CRITICAL":
            paragraphs.append(
                "**Action Protocol (Immediate):**\n"
                "1. Perform immediate bedside physical assessment: airway, breathing, circulation, consciousness.\n"
                "2. Escalate immediately to attending physician / activate emergency protocol.\n"
                "3. Ensure oxygen delivery device is securely placed and functioning.\n"
                "4. Acknowledge alert and log bedside observations in MediGuard."
            )
        elif risk_cat == "HIGH":
            paragraphs.append(
                "**Action Protocol (Urgent):**\n"
                "1. Attend to patient bedside within 5 minutes.\n"
                "2. Validate telemetry readings manually (manual pulse and blood pressure check).\n"
                "3. Review recent medication administration and hydration.\n"
                "4. Escalate to doctor if vitals remain abnormal upon second reading."
            )
        elif risk_cat == "MODERATE":
            paragraphs.append(
                "**Action Protocol (Standard):**\n"
                "1. Verify sensor contact and cable positioning.\n"
                "2. Check if patient was recently active or experiencing discomfort.\n"
                "3. Re-evaluate vitals in 10-15 minutes and log notes."
            )
        else:
            paragraphs.append(
                "**Action Protocol (Routine):**\n"
                "Continue standard telemetry monitoring. Next scheduled caregiver medication review remains on schedule."
            )

        return "\n\n".join(paragraphs)


gemini_assistant = GeminiHealthAssistant()
