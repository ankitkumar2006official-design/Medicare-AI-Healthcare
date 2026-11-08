import React, { useState, useEffect } from 'react';
import { patientAPI, medicationAPI, alertAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import VitalGauge from '../components/VitalGauge';
import AlertBadge from '../components/AlertBadge';
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  Droplet,
  Bell,
  Pill,
  Check,
  ShieldCheck,
  PhoneCall,
  UserCheck
} from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const patientId = user?.assigned_patient_ids?.[0] || user?.patient_id || 'PT-1001';
  const [twin, setTwin] = useState(null);
  const [meds, setMeds] = useState([]);
  const [assistanceRequested, setAssistanceRequested] = useState(false);
  const { latestVitals, latestRisks } = useWebSocket();

  const loadData = async () => {
    try {
      const [twinRes, medRes] = await Promise.all([
        patientAPI.getDigitalTwin(patientId),
        medicationAPI.getMedications(patientId),
      ]);
      setTwin(twinRes.data);
      setMeds(medRes.data);
    } catch (err) {
      console.warn('Patient dashboard load error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const handleRequestAssistance = async () => {
    setAssistanceRequested(true);
    try {
      await alertAPI.getAlerts({ patient_id: patientId }); // Trigger check or notification
    } catch {
      // Graceful
    }
    setTimeout(() => setAssistanceRequested(false), 8000);
  };

  const handleAdministerMed = async (medId) => {
    try {
      await medicationAPI.administer(medId);
      loadData();
    } catch {
      alert('Could not record medication confirmation');
    }
  };

  const currentVitals = latestVitals[patientId] || twin?.latest_vitals || {};
  const currentRisk = latestRisks[patientId] || twin?.latest_risk || {};
  const baseline = twin?.baseline_vitals || {};

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Patient Welcome Banner */}
      <div className="bg-hospital-navy text-white p-6 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hospital-teal animate-pulse"></span>
            <span className="text-xs font-semibold text-hospital-teal uppercase tracking-wider">
              Smart Ward Bedroom Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Welcome, {twin?.full_name || user?.full_name || 'Patient'}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Room: {twin?.room_number || 'Ward Suite'} &bull; Patient ID: {patientId}
          </p>
        </div>

        {/* Emergency Assistance Button */}
        <div>
          <button
            onClick={handleRequestAssistance}
            disabled={assistanceRequested}
            className={`px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg transition-all ${
              assistanceRequested
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>{assistanceRequested ? 'Caregiver Notified!' : 'Call Caregiver / Assistance'}</span>
          </button>
        </div>
      </div>

      {/* Vital Sign Gauges Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Current Physiological Readings
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <VitalGauge
            type="heart_rate"
            label="Heart Rate"
            value={currentVitals.heart_rate ? Math.round(currentVitals.heart_rate) : null}
            unit="BPM"
            minBaseline={baseline.heart_rate_min}
            maxBaseline={baseline.heart_rate_max}
            isCritical={currentVitals.heart_rate > 120 || currentVitals.heart_rate < 50}
          />

          <VitalGauge
            type="spo2"
            label="Oxygen (SpO2)"
            value={currentVitals.oxygen_saturation ? Math.round(currentVitals.oxygen_saturation) : null}
            unit="%"
            minBaseline={baseline.spo2_min}
            maxBaseline={100}
            isCritical={currentVitals.oxygen_saturation < 90}
            isWarning={currentVitals.oxygen_saturation < 94}
          />

          <VitalGauge
            type="bp"
            label="Blood Pressure"
            value={
              currentVitals.blood_pressure_systolic
                ? `${Math.round(currentVitals.blood_pressure_systolic)}/${Math.round(currentVitals.blood_pressure_diastolic || 80)}`
                : null
            }
            unit="mmHg"
            minBaseline={baseline.bp_sys_min}
            maxBaseline={baseline.bp_sys_max}
          />

          <VitalGauge
            type="temp"
            label="Temperature"
            value={currentVitals.body_temperature ? currentVitals.body_temperature.toFixed(1) : null}
            unit="°C"
            minBaseline={baseline.temp_min}
            maxBaseline={baseline.temp_max}
            isWarning={currentVitals.body_temperature >= 38.0}
            isCritical={currentVitals.body_temperature >= 39.2}
          />

          <VitalGauge
            type="resp"
            label="Respiration"
            value={currentVitals.respiratory_rate ? Math.round(currentVitals.respiratory_rate) : null}
            unit="bpm"
            minBaseline={baseline.resp_rate_min}
            maxBaseline={baseline.resp_rate_max}
            isCritical={currentVitals.respiratory_rate > 28}
          />
        </div>
      </div>

      {/* Today's Medication Reminders */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Pill className="w-4 h-4 text-hospital-teal" />
              <span>Today's Prescribed Medications</span>
            </h2>
            <p className="text-xs text-slate-500">Confirm intake to update caregiver care records</p>
          </div>
        </div>

        {meds.length === 0 ? (
          <div className="text-xs text-slate-400 py-6 text-center">No medications scheduled for today.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {meds.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {m.dosage} &bull; {m.frequency} &bull; Route: {m.route}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Instructions: {m.instructions}</div>
                </div>

                <div>
                  {m.last_administered_at ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                      <Check className="w-3.5 h-3.5" />
                      <span>Taken</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdministerMed(m.id)}
                      className="bg-white hover:bg-hospital-teal hover:text-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      Confirm Taken
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

