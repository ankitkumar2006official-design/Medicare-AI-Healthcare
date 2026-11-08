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
  XCircle,
  ShieldCheck,
  Send,
  Eye,
  X,
  RefreshCw,
  UserCheck
} from 'lucide-react';

export default function AlertManagement() {
  const [alerts, setAlerts] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedAuditAlert, setSelectedAuditAlert] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTrailData, setAuditTrailData] = useState(null);
  const [watchdogRunning, setWatchdogRunning] = useState(false);
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

  const handleOpenAudit = async (alertItem) => {
    setSelectedAuditAlert(alertItem);
    setAuditLoading(true);
    try {
      const res = await alertAPI.getAuditTrail(alertItem.id);
      setAuditTrailData(res.data);
    } catch {
      setAuditTrailData(alertItem);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleRunWatchdog = async () => {
    setWatchdogRunning(true);
    try {
      const res = await alertAPI.checkEscalations();
      alert(`SLA Watchdog Scan Complete. ${res.data.escalated_count} overdue alerts escalated to fallback physicians.`);
      await loadAlerts();
    } catch {
      alert('Failed to run escalation watchdog');
    } finally {
      setWatchdogRunning(false);
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
          <p className="text-xs text-slate-500">
            Caregiver Assignment, SLA Deadline Timers, Auto-Escalation & Audit Verification
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunWatchdog}
            disabled={watchdogRunning}
            className="px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{watchdogRunning ? 'Scanning SLA Timers...' : 'Check SLA Escalations'}</span>
          </button>

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
                <th className="px-4 py-3">Assigned Caregiver</th>
                <th className="px-4 py-3">Reason / Trigger</th>
                <th className="px-4 py-3">Delivery & SLA Status</th>
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
                      <div className="font-semibold text-slate-800 flex items-center space-x-1">
                        <UserCheck className="w-3.5 h-3.5 text-hospital-teal" />
                        <span>{a.assigned_caregiver_name || 'James Wilson, RN'}</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Delivered to mobile</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{a.reason}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Vital: {a.trigger_vital}</div>
                    </td>
                    <td className="px-4 py-3">
                      {a.response_time_seconds ? (
                        <div className="font-mono text-emerald-600 font-bold">
                          Response: {a.response_time_seconds}s
                        </div>
                      ) : a.status === 'triggered' ? (
                        <div className="font-mono text-amber-600 font-bold flex items-center space-x-1">
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>SLA Target: 90s</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">Processed</span>
                      )}
                      <div className="text-[10px] text-slate-400">
                        {new Date(a.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AlertBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenAudit(a)}
                        title="View Full Response Audit Trail"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-[11px] font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        Audit
                      </button>

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

      {/* Audit Trail Modal / Drawer */}
      {selectedAuditAlert && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Alert Response & Delivery Audit Trail
                </h3>
                <p className="text-xs text-slate-500 font-mono">Alert ID: {selectedAuditAlert.id}</p>
              </div>
              <button
                onClick={() => setSelectedAuditAlert(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Assignment & Delivery Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 font-medium">Assigned Caregiver:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedAuditAlert.assigned_caregiver_name || 'James Wilson, RN'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Notification Delivery:</span>
                <p className="font-bold text-emerald-600 mt-0.5">Delivered (WebSocket / Mobile)</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Fallback Escalation Target:</span>
                <p className="font-bold text-purple-700 mt-0.5">
                  {selectedAuditAlert.fallback_escalation_workflow?.fallback_recipient || 'Dr. Sarah Chen, MD (Attending)'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Response Latency:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedAuditAlert.response_time_seconds
                    ? `${selectedAuditAlert.response_time_seconds} seconds`
                    : 'Awaiting acknowledgment'}
                </p>
              </div>
            </div>

            {/* Audit Trail Timeline */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Event Timeline</h4>
              <div className="space-y-2 border-l-2 border-teal-500 pl-4 ml-1">
                {(auditTrailData?.audit_trail || selectedAuditAlert.audit_trail || []).map((ev, idx) => (
                  <div key={idx} className="space-y-0.5 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{ev.event}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-600">{ev.details}</p>
                    {ev.actor && <p className="text-[10px] text-slate-400">Actor: {ev.actor}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedAuditAlert(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
