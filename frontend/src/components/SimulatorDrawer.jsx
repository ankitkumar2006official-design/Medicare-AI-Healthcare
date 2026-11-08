import React, { useState, useEffect } from 'react';
import { simulatorAPI } from '../api/client';
import { Play, Pause, RotateCcw, X, Sliders, Zap, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

export default function SimulatorDrawer({ isOpen, onClose, patients = [] }) {
  const [status, setStatus] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('PT-1001');
  const [selectedScenario, setSelectedScenario] = useState('healthy');
  const [manualVitals, setManualVitals] = useState({
    heart_rate: 75,
    oxygen_saturation: 98,
    body_temperature: 36.8,
    blood_pressure_systolic: 120,
    blood_pressure_diastolic: 80,
    respiratory_rate: 16,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await simulatorAPI.getStatus();
      setStatus(res.data);
    } catch (err) {
      console.warn('Failed to load simulator status:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleStart = async () => {
    setLoading(true);
    try {
      await simulatorAPI.start();
      setMessage({ type: 'success', text: 'IoT Sensor Simulator stream running.' });
      fetchStatus();
    } catch {
      setMessage({ type: 'error', text: 'Failed to start simulator.' });
    }
    setLoading(false);
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      await simulatorAPI.pause();
      setMessage({ type: 'info', text: 'IoT Sensor Simulator paused.' });
      fetchStatus();
    } catch {
      setMessage({ type: 'error', text: 'Failed to pause simulator.' });
    }
    setLoading(false);
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await simulatorAPI.reset();
      setMessage({ type: 'success', text: 'All patient sensor feeds reset to baseline.' });
      fetchStatus();
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset simulator.' });
    }
    setLoading(false);
  };

  const handleApplyScenario = async () => {
    setLoading(true);
    try {
      await simulatorAPI.setScenario(selectedPatientId, selectedScenario);
      setMessage({ type: 'success', text: `Applied ${selectedScenario} to ${selectedPatientId}.` });
      fetchStatus();
    } catch {
      setMessage({ type: 'error', text: 'Failed to apply scenario.' });
    }
    setLoading(false);
  };

  const handleApplyOverride = async () => {
    setLoading(true);
    try {
      await simulatorAPI.setOverride(selectedPatientId, manualVitals);
      setMessage({ type: 'success', text: `Manual vitals applied to ${selectedPatientId}. Check live dashboard!` });
      fetchStatus();
    } catch {
      setMessage({ type: 'error', text: 'Failed to apply manual vitals.' });
    }
    setLoading(false);
  };

  const handleClearOverride = async () => {
    setLoading(true);
    try {
      await simulatorAPI.clearOverride(selectedPatientId);
      setMessage({ type: 'info', text: `Cleared manual overrides for ${selectedPatientId}.` });
      fetchStatus();
    } catch {
      setMessage({ type: 'error', text: 'Failed to clear overrides.' });
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200">
        {/* Header */}
        <div className="bg-hospital-navy text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className={`w-5 h-5 ${status?.is_running ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <div>
              <h2 className="text-base font-bold">IoT Sensor Simulator Hub</h2>
              <p className="text-xs text-slate-300">Continuous Physiological Stream Generator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {message && (
            <div className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
              message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              'bg-sky-50 text-sky-700 border border-sky-200'
            }`}>
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-2">×</button>
            </div>
          )}

          {/* Master Stream Controls */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Master Stream Controls</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={loading || status?.is_running}
                onClick={handleStart}
                className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2 px-3 rounded-lg text-xs shadow-sm transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Telemetry</span>
              </button>

              <button
                disabled={loading || !status?.is_running}
                onClick={handlePause}
                className="flex items-center justify-center space-x-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium py-2 px-3 rounded-lg text-xs shadow-sm transition-colors"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </button>

              <button
                disabled={loading}
                onClick={handleReset}
                className="flex items-center justify-center space-x-1.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-2 px-3 rounded-lg text-xs shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
            <div className="mt-2.5 text-[11px] text-slate-500 flex justify-between">
              <span>Status: <strong className={status?.is_running ? 'text-emerald-600' : 'text-slate-500'}>{status?.is_running ? 'Streaming Active' : 'Paused'}</strong></span>
              <span>Sampling rate: <strong className="text-slate-700">{status?.interval_seconds || 3.0}s</strong></span>
            </div>
          </div>

          {/* Patient Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Select Patient Telemetry Feed
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-hospital-teal"
            >
              {(patients.length > 0 ? patients : [
                { patient_id: 'PT-1001', full_name: 'Eleanor Vance (PT-1001)' },
                { patient_id: 'PT-1002', full_name: 'Marcus Rodriguez (PT-1002)' },
                { patient_id: 'PT-1003', full_name: 'Beatrice Campbell (PT-1003)' },
                { patient_id: 'PT-1004', full_name: 'David Chen (PT-1004)' },
                { patient_id: 'PT-1005', full_name: 'Aisha Patel (PT-1005)' }
              ]).map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.patient_id} – {p.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Clinical Scenarios (1-7) */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Preset Clinical Scenarios (1–7)
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                7 Scenarios
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {[
                { id: 'healthy', name: 'Scenario 1: Healthy Patient', desc: 'Normal rhythmic HRV vitals within safe baselines' },
                { id: 'falling_spo2', name: 'Scenario 2: Falling Oxygen Saturation', desc: 'SpO2 drifts downwards to 85% with tachypnea' },
                { id: 'elevated_heart_rate', name: 'Scenario 3: Elevated Heart Rate', desc: 'Supraventricular tachycardia, HR climbs to 142 BPM' },
                { id: 'high_fever', name: 'Scenario 4: High Fever & Pyrexia', desc: 'Temperature climbs to 39.5°C with compensatory pulse' },
                { id: 'respiratory_distress', name: 'Scenario 5: Respiratory Distress', desc: 'Resp rate increases to 32 bpm; hypoxemic load' },
                { id: 'multiple_abnormalities', name: 'Scenario 6: Multiple Vital Abnormalities', desc: 'Crisis: Hypotension 82/52, SpO2 86%, Temp 39.4°C' },
                { id: 'sensor_disconnection', name: 'Scenario 7: Sensor Disconnection', desc: 'Telemetry lead off: signal quality 0, offline alarm' },
              ].map((sc) => (
                <label
                  key={sc.id}
                  className={`flex items-start p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                    selectedScenario === sc.id
                      ? 'bg-teal-50/70 border-hospital-teal ring-1 ring-hospital-teal'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="scenario_radio"
                    value={sc.id}
                    checked={selectedScenario === sc.id}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="mt-0.5 text-hospital-teal focus:ring-hospital-teal"
                  />
                  <div className="ml-2.5">
                    <div className="font-semibold text-slate-800">{sc.name}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{sc.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleApplyScenario}
              disabled={loading}
              className="w-full bg-hospital-teal hover:bg-teal-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-xs shadow-sm transition-colors"
            >
              Apply Scenario to {selectedPatientId}
            </button>
          </div>

          {/* Interactive Manual Override */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1">
                <Sliders className="w-3.5 h-3.5 text-hospital-teal" />
                <span>Live Demonstration Manual Overrides</span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Directly inject exact vital values into the AI Risk engine and observation pipeline.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 text-[11px] font-medium">Heart Rate (BPM)</label>
                <input
                  type="number"
                  value={manualVitals.heart_rate}
                  onChange={(e) => setManualVitals({ ...manualVitals, heart_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-hospital-teal"
                />
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-medium">SpO2 (%)</label>
                <input
                  type="number"
                  value={manualVitals.oxygen_saturation}
                  onChange={(e) => setManualVitals({ ...manualVitals, oxygen_saturation: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-hospital-teal"
                />
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-medium">Core Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={manualVitals.body_temperature}
                  onChange={(e) => setManualVitals({ ...manualVitals, body_temperature: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-hospital-teal"
                />
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-medium">Resp Rate (bpm)</label>
                <input
                  type="number"
                  value={manualVitals.respiratory_rate}
                  onChange={(e) => setManualVitals({ ...manualVitals, respiratory_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-hospital-teal"
                />
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-medium">Sys BP (mmHg)</label>
                <input
                  type="number"
                  value={manualVitals.blood_pressure_systolic}
                  onChange={(e) => setManualVitals({ ...manualVitals, blood_pressure_systolic: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-hospital-teal"
                />
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-medium">Dia BP (mmHg)</label>
                <input
                  type="number"
                  value={manualVitals.blood_pressure_diastolic}
                  onChange={(e) => setManualVitals({ ...manualVitals, blood_pressure_diastolic: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-hospital-teal"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={handleApplyOverride}
                disabled={loading}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium py-1.5 rounded-lg text-xs transition-colors"
              >
                Inject Vitals
              </button>
              <button
                onClick={handleClearOverride}
                disabled={loading}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-1.5 px-3 rounded-lg text-xs transition-colors"
              >
                Clear Override
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs transition-colors"
          >
            Close Simulator Hub
          </button>
        </div>
      </div>
    </div>
  );
}

