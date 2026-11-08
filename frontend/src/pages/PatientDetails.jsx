import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { patientAPI, vitalsAPI } from '../api/client';
import { useWebSocket } from '../context/WebSocketContext';
import VitalGauge from '../components/VitalGauge';
import VitalChart from '../components/VitalChart';
import AlertBadge from '../components/AlertBadge';
import {
  Activity,
  Heart,
  Wind,
  Thermometer,
  Droplet,
  User,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronLeft,
  Settings,
  Pill,
  Save,
  CheckCircle2
} from 'lucide-react';

export default function PatientDetails() {
  const { id } = useParams();
  const [twin, setTwin] = useState(null);
  const [vitalHistory, setVitalHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('telemetry');
  const [editingBaseline, setEditingBaseline] = useState(false);
  const [baselineForm, setBaselineForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { latestVitals, latestRisks, subscribePatient } = useWebSocket();

  const loadData = async () => {
    try {
      const [twinRes, vitalsRes] = await Promise.all([
        patientAPI.getDigitalTwin(id),
        vitalsAPI.getHistory(id, 40),
      ]);
      setTwin(twinRes.data);
      setBaselineForm(twinRes.data?.baseline_vitals || {});
      const rev = [...(vitalsRes.data || [])];
      rev.reverse();
      setVitalHistory(rev);
    } catch (err) {
      console.warn('Digital twin error:', err);
    }
  };

  useEffect(() => {
    loadData();
    subscribePatient(id);
  }, [id]);

  // Merge real-time updates
  useEffect(() => {
    if (latestVitals[id]) {
      setVitalHistory((prev) => [...prev.slice(-39), latestVitals[id]]);
    }
  }, [latestVitals, id]);

  const handleSaveBaseline = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patientAPI.updatePatient(id, { baseline_vitals: baselineForm });
      setEditingBaseline(false);
      loadData();
    } catch {
      alert('Failed to update patient baseline vitals.');
    }
    setSaving(false);
  };

  if (!twin) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Assembling Patient Digital Twin Telemetry...
      </div>
    );
  }

  const currentVitals = latestVitals[id] || twin.latest_vitals || {};
  const currentRisk = latestRisks[id] || twin.latest_risk || {};
  const baseline = twin.baseline_vitals || {};

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back button & Patient Header */}
      <div>
        <Link
          to="/patients"
          className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 font-semibold mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Patient Directory</span>
        </Link>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-hospital-teal flex items-center justify-center font-bold text-lg border border-teal-100">
              {twin.full_name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900">{twin.full_name}</h1>
                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {twin.patient_id}
                </span>
                <AlertBadge category={currentRisk.risk_category || 'stable'} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {twin.age} yrs &bull; {twin.gender} &bull; {twin.room_number} &bull; Condition: {twin.medical_history?.[0] || 'Under Observation'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setEditingBaseline(!editingBaseline)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{editingBaseline ? 'Close Baseline Config' : 'Configure Baseline'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Baseline Configuration Drawer / Section */}
      {editingBaseline && (
        <div className="bg-teal-50/50 border border-teal-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-hospital-teal" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                Clinician Configured Baseline Physiological Limits
              </h2>
            </div>
            <span className="text-[11px] text-teal-700">Digital Twin Target Zones</span>
          </div>

          <form onSubmit={handleSaveBaseline} className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-slate-600 font-medium">HR Min / Max (bpm)</label>
              <div className="flex space-x-1 mt-1">
                <input
                  type="number"
                  value={baselineForm.heart_rate_min}
                  onChange={(e) => setBaselineForm({ ...baselineForm, heart_rate_min: parseFloat(e.target.value) })}
                  className="w-1/2 p-1.5 bg-white border border-slate-300 rounded font-mono"
                />
                <input
                  type="number"
                  value={baselineForm.heart_rate_max}
                  onChange={(e) => setBaselineForm({ ...baselineForm, heart_rate_max: parseFloat(e.target.value) })}
                  className="w-1/2 p-1.5 bg-white border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-medium">SpO2 Target Min (%)</label>
              <input
                type="number"
                value={baselineForm.spo2_min}
                onChange={(e) => setBaselineForm({ ...baselineForm, spo2_min: parseFloat(e.target.value) })}
                className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono mt-1"
              />
            </div>

            <div>
              <label className="text-slate-600 font-medium">Systolic BP Min / Max</label>
              <div className="flex space-x-1 mt-1">
                <input
                  type="number"
                  value={baselineForm.bp_sys_min}
                  onChange={(e) => setBaselineForm({ ...baselineForm, bp_sys_min: parseFloat(e.target.value) })}
                  className="w-1/2 p-1.5 bg-white border border-slate-300 rounded font-mono"
                />
                <input
                  type="number"
                  value={baselineForm.bp_sys_max}
                  onChange={(e) => setBaselineForm({ ...baselineForm, bp_sys_max: parseFloat(e.target.value) })}
                  className="w-1/2 p-1.5 bg-white border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-medium">Resp Rate Min / Max</label>
              <div className="flex space-x-1 mt-1">
                <input
                  type="number"
                  value={baselineForm.resp_rate_min}
                  onChange={(e) => setBaselineForm({ ...baselineForm, resp_rate_min: parseFloat(e.target.value) })}
                  className="w-1/2 p-1.5 bg-white border border-slate-300 rounded font-mono"
                />
                <input
                  type="number"
                  value={baselineForm.resp_rate_max}
                  onChange={(e) => setBaselineForm({ ...baselineForm, resp_rate_max: parseFloat(e.target.value) })}
                  className="w-1/2 p-1.5 bg-white border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div className="sm:col-span-4 flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBaseline(false)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-hospital-teal text-white font-semibold flex items-center space-x-1 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Baseline Values</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Live Vital Sign Telemetry Gauges */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Real-Time Physiological Telemetry Snapshot
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <VitalGauge
            type="heart_rate"
            label="Heart Rate"
            value={currentVitals.heart_rate ? Math.round(currentVitals.heart_rate) : '--'}
            unit="BPM"
            minBaseline={baseline.heart_rate_min}
            maxBaseline={baseline.heart_rate_max}
            isCritical={currentVitals.heart_rate > 125 || currentVitals.heart_rate < 48}
          />
          <VitalGauge
            type="spo2"
            label="SpO2 Saturation"
            value={currentVitals.oxygen_saturation ? Math.round(currentVitals.oxygen_saturation) : '--'}
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
                : '--/--'
            }
            unit="mmHg"
            minBaseline={baseline.bp_sys_min}
            maxBaseline={baseline.bp_sys_max}
          />
          <VitalGauge
            type="temp"
            label="Body Temp"
            value={currentVitals.body_temperature ? currentVitals.body_temperature.toFixed(1) : '--'}
            unit="°C"
            minBaseline={baseline.temp_min}
            maxBaseline={baseline.temp_max}
            isCritical={currentVitals.body_temperature >= 39.4}
            isWarning={currentVitals.body_temperature >= 38.0}
          />
          <VitalGauge
            type="resp"
            label="Respiratory"
            value={currentVitals.respiratory_rate ? Math.round(currentVitals.respiratory_rate) : '--'}
            unit="bpm"
            minBaseline={baseline.resp_rate_min}
            maxBaseline={baseline.resp_rate_max}
            isCritical={currentVitals.respiratory_rate > 28}
          />
        </div>
      </div>

      {/* Historical Telemetry Recharts Curves */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Dynamic Telemetry Trend Curves
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <VitalChart
            title="Heart Rate History (BPM)"
            data={vitalHistory}
            dataKey="heart_rate"
            color="#E11D48"
            unit="BPM"
            minTarget={baseline.heart_rate_min}
            maxTarget={baseline.heart_rate_max}
            yDomain={[40, 160]}
          />
          <VitalChart
            title="Oxygen Saturation SpO2 (%)"
            data={vitalHistory}
            dataKey="oxygen_saturation"
            color="#0D9488"
            unit="%"
            minTarget={baseline.spo2_min}
            maxTarget={100}
            yDomain={[75, 100]}
          />
          <VitalChart
            title="Body Temperature (°C)"
            data={vitalHistory}
            dataKey="body_temperature"
            color="#F59E0B"
            unit="°C"
            minTarget={baseline.temp_min}
            maxTarget={baseline.temp_max}
            yDomain={[35, 41]}
          />
          <VitalChart
            title="Blood Pressure Trends (Systolic / Diastolic mmHg)"
            data={vitalHistory}
            dataKey="blood_pressure_systolic"
            dataKey2="blood_pressure_diastolic"
            color="#6366F1"
            color2="#A855F7"
            unit="mmHg"
            minTarget={baseline.bp_sys_min}
            maxTarget={baseline.bp_sys_max}
            yDomain={[50, 190]}
          />
        </div>
      </div>
    </div>
  );
}

