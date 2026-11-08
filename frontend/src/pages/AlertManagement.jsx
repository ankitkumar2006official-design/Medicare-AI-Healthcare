import React, { useState, useEffect } from 'react';
import { alertAPI } from '../api/client';
import { useWebSocket } from '../context/WebSocketContext';
import { useAlertSound } from '../context/AlertSoundContext';
import AlertBadge from '../components/AlertBadge';
import {
  AlertOctagon,
  Bell,
  CheckCircle,
  ArrowUpRight,
  Filter,
  Search,
  Volume2,
  VolumeX,
  Clock,
  ShieldAlert,
  XCircle
} from 'lucide-react';

export default function AlertManagement() {
  const [alerts, setAlerts] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const { isMuted, toggleMute } = useAlertSound();
  const { activeAlerts } = useWebSocket();

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await alertAPI.getAlerts({ limit: 100 });
      setAlerts(res.data);
    } catch (err) {
      console.warn('Failed to load alerts:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, [activeAlerts]);

  const handleAcknowledge = async (id) => {
    try {
      await alertAPI.acknowledge(id, 'Acknowledged via central alert management desk');
      loadAlerts();
    } catch {
      alert('Failed to acknowledge alert');
    }
  };

  const handleEscalate = async (id) => {
    const reason = prompt('Reason for urgent physician escalation:', 'Telemetry indicates acute deterioration');
    if (reason) {
      try {
        await alertAPI.escalate(id, reason);
        loadAlerts();
      } catch {
        alert('Failed to escalate alert');
      }
    }
  };

  const handleResolve = async (id) => {
    const note = prompt('Resolution note / caregiver assessment:', 'Patient vitals restabilized within normal parameters');
    if (note) {
      try {
        await alertAPI.resolve(id, note);
        loadAlerts();
      } catch {
        alert('Failed to resolve alert');
      }
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity.toUpperCase() !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status.toUpperCase() !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Hospital Alarm Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Alert & Alarm Management</h1>
          <p className="text-xs text-slate-500">Prioritized Clinical Alerts, Escalation Protocols & Audit Tracking</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg border text-xs flex items-center space-x-1.5 transition-colors ${
              isMuted ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-teal-50 text-hospital-teal border-teal-200'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="font-semibold">{isMuted ? 'Alarm Audio Muted' : 'Alarm Audio ON'}</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                severityFilter === s
                  ? 'bg-hospital-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          {['ALL', 'TRIGGERED', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-hospital-teal text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Reason / Clinical Trigger</th>
                <th className="px-4 py-3">Recommended Protocol</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No alerts matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <AlertBadge severity={a.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{a.patient_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{a.patient_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{a.reason}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Vital: {a.trigger_vital}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">
                      {a.recommended_action}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {new Date(a.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3">
                      <AlertBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {a.status === 'triggered' && (
                        <button
                          onClick={() => handleAcknowledge(a.id)}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold shadow-sm"
                        >
                          Ack
                        </button>
                      )}
                      {a.status !== 'resolved' && (
                        <>
                          <button
                            onClick={() => handleEscalate(a.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold shadow-sm"
                          >
                            Escalate
                          </button>
                          <button
                            onClick={() => handleResolve(a.id)}
                            className="bg-slate-700 hover:bg-slate-800 text-white px-2.5 py-1 rounded text-[11px] font-semibold shadow-sm"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

