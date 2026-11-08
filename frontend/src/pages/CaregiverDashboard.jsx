import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientAPI, alertAPI, caregiverAPI } from '../api/client';
import { useWebSocket } from '../context/WebSocketContext';
import AlertBadge from '../components/AlertBadge';
import {
  HeartHandshake,
  Bell,
  CheckCircle,
  AlertOctagon,
  ArrowUpRight,
  PhoneCall,
  ClipboardList,
  ChevronRight,
  Eye,
  Send
} from 'lucide-react';

export default function CaregiverDashboard() {
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const { latestVitals, latestRisks, activeAlerts } = useWebSocket();

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        patientAPI.getPatients(),
        alertAPI.getAlerts({ status: 'triggered', limit: 20 }),
      ]);
      setPatients(pRes.data);
      setAlerts(aRes.data);
    } catch (err) {
      console.warn('Caregiver dashboard load error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      await alertAPI.acknowledge(alertId, 'Caregiver bedside assessment initiated');
      loadData();
      setSelectedAlert(null);
    } catch (err) {
      alert('Failed to acknowledge alert');
    }
  };

  const handleEscalate = async (alertId) => {
    try {
      await alertAPI.escalate(alertId, actionNote || 'Vitals deteriorating rapidly; requested physician bedside visit');
      loadData();
      setSelectedAlert(null);
      setActionNote('');
    } catch (err) {
      alert('Failed to escalate alert');
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await alertAPI.resolve(alertId, actionNote || 'Patient stable; bedside observation completed');
      loadData();
      setSelectedAlert(null);
      setActionNote('');
    } catch (err) {
      alert('Failed to resolve alert');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hospital-teal animate-pulse"></span>
            <span className="text-xs font-bold text-hospital-teal uppercase tracking-wider">Nursing Station</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Caregiver Response Station</h1>
          <p className="text-xs text-slate-500">Real-Time Bedside Triage, Alert Acknowledgment & Observation Logging</p>
        </div>

        <Link
          to="/caregiver-history"
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
        >
          <ClipboardList className="w-4 h-4 text-hospital-teal" />
          <span>Caregiver Response Log</span>
        </Link>
      </div>

      {/* Priority Action Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-5 h-5 text-rose-600 animate-bounce" />
              <h2 className="text-sm font-bold text-rose-900">
                Action Required: {alerts.length} Unacknowledged Telemetry Alerts
              </h2>
            </div>
            <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
              High Priority
            </span>
          </div>

          <div className="space-y-2">
            {alerts.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="bg-white p-3 rounded-lg border border-rose-100 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{a.patient_name}</span>
                  <span className="ml-2 font-mono text-slate-400">({a.patient_id})</span>
                  <p className="text-rose-700 font-medium mt-0.5">{a.reason}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAcknowledge(a.id)}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => setSelectedAlert(a)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    Escalate to MD
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patients Needing Attention Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Assigned Patients Triage Matrix</h2>
            <p className="text-xs text-slate-500">Sorted dynamically by continuous AI risk category</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{patients.length} Monitored Beds</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Live HR</th>
                <th className="px-4 py-3">Live SpO2</th>
                <th className="px-4 py-3">Live Temp</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((p) => {
                const vitals = latestVitals[p.patient_id] || p.latest_vitals || {};
                const risk = latestRisks[p.patient_id] || p.latest_risk || {};
                const riskCat = risk.risk_category || 'stable';

                return (
                  <tr key={p.patient_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{p.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.patient_id}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">{p.room_number}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {vitals.heart_rate ? Math.round(vitals.heart_rate) : '--'} bpm
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      <span className={vitals.oxygen_saturation && vitals.oxygen_saturation < 92 ? 'text-rose-600' : 'text-slate-800'}>
                        {vitals.oxygen_saturation ? Math.round(vitals.oxygen_saturation) : '--'}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {vitals.body_temperature ? vitals.body_temperature.toFixed(1) : '--'}°C
                    </td>
                    <td className="px-4 py-3">
                      <AlertBadge category={riskCat} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/patients/${p.patient_id}`}
                        className="inline-flex items-center space-x-1 text-hospital-teal hover:text-teal-700 font-semibold"
                      >
                        <span>Open Twin</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalate / Response Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                Clinician Escalation
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Escalate Alert for {selectedAlert.patient_name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{selectedAlert.reason}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Observation / Reason for Escalation
              </label>
              <textarea
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Describe current patient symptoms, skin color, distress level..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => handleEscalate(selectedAlert.id)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Confirm Doctor Escalation</span>
              </button>
              <button
                onClick={() => setSelectedAlert(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

