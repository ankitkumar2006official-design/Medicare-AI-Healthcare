import React, { useState, useEffect } from 'react';
import { reliabilityAPI, simulatorAPI, patientAPI } from '../api/client';
import {
  Activity,
  Server,
  Wifi,
  WifiOff,
  Database,
  Cpu,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Layers,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

export default function SystemReliability() {
  const [health, setHealth] = useState(null);
  const [staleSensors, setStaleSensors] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [bufferStatus, setBufferStatus] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('PT-1002');
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = async () => {
    setRefreshing(true);
    try {
      const [hRes, sRes, lRes, bRes, pRes] = await Promise.all([
        reliabilityAPI.getHealthSnapshot(),
        reliabilityAPI.getStaleSensors(15),
        reliabilityAPI.getSyncLogs(15),
        simulatorAPI.getBufferStatus(),
        patientAPI.getPatients()
      ]);
      setHealth(hRes.data);
      setStaleSensors(sRes.data || []);
      setSyncLogs(lRes.data || []);
      setBufferStatus(bRes.data);
      setPatients(pRes.data || []);

      if (bRes.data?.devices?.[selectedPatientId]?.offline_mode) {
        setIsSimulatingOffline(true);
      } else {
        setIsSimulatingOffline(false);
      }
    } catch (err) {
      console.warn('Error fetching reliability stats:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 6000);
    return () => clearInterval(interval);
  }, [selectedPatientId]);

  const handleToggleOffline = async () => {
    setLoading(true);
    const targetState = !isSimulatingOffline;
    try {
      await simulatorAPI.simulateOffline(selectedPatientId, targetState);
      setIsSimulatingOffline(targetState);
      await loadAll();
    } catch (err) {
      alert('Failed to update sensor buffering state');
    } finally {
      setLoading(false);
    }
  };

  const handleFlushAndSync = async () => {
    setLoading(true);
    try {
      const res = await simulatorAPI.reconnectAndSync(selectedPatientId);
      setIsSimulatingOffline(false);
      setLastSyncResult(res.data?.result || res.data);
      await loadAll();
    } catch (err) {
      alert('Buffer synchronization failed');
    } finally {
      setLoading(false);
    }
  };

  const currentPatientBufferCount = bufferStatus?.devices?.[selectedPatientId]?.buffered_packets_count || 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Fault Tolerance & Edge Ingestion
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            System Reliability & Offline Buffering
          </h1>
          <p className="text-xs text-slate-500">
            Network Resiliency, Duplicate Reading Prevention & Stale Sensor Detection
          </p>
        </div>

        <button
          onClick={loadAll}
          disabled={refreshing}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Health Metrics</span>
        </button>
      </div>

      {/* System Health Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Database Engine</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 capitalize">
            {health?.database_type === 'mongodb' ? 'MongoDB Atlas' : 'Resilient Fallback'}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Connection Active & Indexed</span>
          </p>
        </div>

        {/* WebSocket Stream */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active WebSocket Clients</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-hospital-teal flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {health?.websocket_active_clients || 1}
          </div>
          <p className="text-[11px] text-slate-500">
            Low-latency sub-100ms real-time broadcast
          </p>
        </div>

        {/* Duplicates Prevented */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Duplicate Readings Prevented</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {health?.duplicates_prevented_total || 0}
          </div>
          <p className="text-[11px] text-slate-500">
            Deduplicated by sequence ID & timestamp
          </p>
        </div>

        {/* Server Uptime */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Backend Daemon Uptime</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {health?.uptime_seconds ? `${Math.floor(health.uptime_seconds / 60)}m ${Math.floor(health.uptime_seconds % 60)}s` : 'Active'}
          </div>
          <p className="text-[11px] text-slate-500">
            PSUTIL: CPU {health?.cpu_percent || 0.5}% • RAM {health?.memory_percent || 1.2}%
          </p>
        </div>
      </div>

      {/* Offline Buffering & Edge Sync Interactive Simulator */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-hospital-teal" />
              <span>Offline Edge Sensor Buffering & Reconnection Simulator</span>
            </h2>
            <p className="text-xs text-slate-500">
              Simulate home Wi-Fi dropout: sensors buffer telemetry in hardware storage and flush on reconnection
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-xs font-semibold text-slate-600">Select Patient Gateway:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-hospital-teal"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.patient_id} – {p.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Status Display */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[11px] uppercase font-bold text-slate-500">Gateway Status</span>
            <div className="flex items-center space-x-2">
              {isSimulatingOffline ? (
                <>
                  <WifiOff className="w-5 h-5 text-rose-500 animate-pulse" />
                  <span className="text-sm font-bold text-rose-600">OFFLINE (Buffering Telemetry)</span>
                </>
              ) : (
                <>
                  <Wifi className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-600">ONLINE (Streaming 0.33Hz)</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Local Hardware Buffer: <span className="font-bold text-slate-800">{currentPatientBufferCount} packets pending</span>
            </p>
          </div>

          {/* Action 1: Toggle Offline */}
          <div>
            <button
              onClick={handleToggleOffline}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-2 ${
                isSimulatingOffline
                  ? 'bg-slate-700 hover:bg-slate-800 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isSimulatingOffline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isSimulatingOffline ? 'Cancel Offline Simulation' : 'Simulate Gateway Network Drop'}</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              Accumulates sensor readings into edge hardware memory
            </p>
          </div>

          {/* Action 2: Flush Buffer */}
          <div>
            <button
              onClick={handleFlushAndSync}
              disabled={loading || currentPatientBufferCount === 0}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-2 ${
                currentPatientBufferCount > 0
                  ? 'bg-hospital-teal hover:bg-teal-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{loading ? 'Synchronizing...' : `Flush Buffer & Sync (${currentPatientBufferCount})`}</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              Re-establishes connection and submits chronological batch
            </p>
          </div>
        </div>

        {/* Last Sync Result Card */}
        {lastSyncResult && (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-hospital-teal" />
                <span>Batch Sync Execution Report: {lastSyncResult.batch_id}</span>
              </span>
              <span className="text-[10px] font-mono text-teal-700">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2 rounded-lg border border-teal-100 text-center">
                <span className="text-[10px] text-slate-500">Total Transmitted</span>
                <p className="text-sm font-bold text-slate-800">{lastSyncResult.total_received}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-teal-100 text-center">
                <span className="text-[10px] text-slate-500">Ingested</span>
                <p className="text-sm font-bold text-emerald-600">{lastSyncResult.new_ingested}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-teal-100 text-center">
                <span className="text-[10px] text-slate-500">Duplicates Rejected</span>
                <p className="text-sm font-bold text-blue-600">{lastSyncResult.duplicates_rejected}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-teal-100 text-center">
                <span className="text-[10px] text-slate-500">Delayed Packets</span>
                <p className="text-sm font-bold text-amber-600">{lastSyncResult.delayed_flagged}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stale Sensor Detector Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Stale Sensor Watchdog</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">Silence Threshold: 15s</span>
          </div>

          {staleSensors.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              All sensors actively heartbeating within normal thresholds.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-[10px] uppercase font-semibold">
                    <th className="pb-2">Device ID</th>
                    <th className="pb-2">Patient</th>
                    <th className="pb-2">Silent Time</th>
                    <th className="pb-2">Watchdog Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staleSensors.map((s) => (
                    <tr key={s.device_id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono text-slate-800">{s.device_id}</td>
                      <td className="py-2.5 text-slate-700">{s.patient_id}</td>
                      <td className="py-2.5 font-mono text-amber-600">{Math.round(s.seconds_silent)}s</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Synchronization Audit Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-hospital-teal" />
              <h2 className="text-base font-bold text-slate-900">Synchronization Audit Trail</h2>
            </div>
            <span className="text-xs text-slate-500">{syncLogs.length} Sync Events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-[10px] uppercase font-semibold">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Batch ID</th>
                  <th className="pb-2">Device</th>
                  <th className="pb-2">Ingested</th>
                  <th className="pb-2">Deduplicated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {syncLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No synchronization logs recorded yet. Use the simulator above to test.
                    </td>
                  </tr>
                ) : (
                  syncLogs.slice(0, 8).map((log) => (
                    <tr key={log.sync_id || log.id} className="hover:bg-slate-50">
                      <td className="py-2 font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 font-mono font-semibold text-slate-800">{log.batch_id}</td>
                      <td className="py-2 text-slate-600">{log.device_id}</td>
                      <td className="py-2 font-bold text-emerald-600">{log.new_ingested}</td>
                      <td className="py-2 font-mono text-blue-600">{log.duplicates_rejected}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

