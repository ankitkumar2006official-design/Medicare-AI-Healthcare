import React, { useState, useEffect } from 'react';
import { deviceAPI, patientAPI } from '../api/client';
import { useWebSocket } from '../context/WebSocketContext';
import AlertBadge from '../components/AlertBadge';
import {
  Radio,
  BatteryCharging,
  Wifi,
  WifiOff,
  Cpu,
  RefreshCw,
  Plus,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function DeviceManagement({ onOpenSimulator }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useWebSocket();

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await deviceAPI.getDevices();
      setDevices(res.data);
    } catch (err) {
      console.warn('Device fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleToggleStatus = async (device) => {
    const nextStatus = device.status === 'online' ? 'offline' : 'online';
    try {
      await deviceAPI.updateStatus(device.device_id, nextStatus, device.battery_level);
      loadDevices();
    } catch {
      alert('Failed to update device telemetry status.');
    }
  };

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.length - onlineCount;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hospital-teal animate-pulse"></span>
            <span className="text-xs font-bold text-hospital-teal uppercase tracking-wider">IoT Telemetry Hardware</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Telemetry Device & Sensor Fleet</h1>
          <p className="text-xs text-slate-500">Bedside Telemetry Hubs, Battery Metrics, Firmware & Disconnection Diagnostics</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadDevices}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-xs flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onOpenSimulator}
            className="bg-hospital-navy hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-hospital-teal" />
            <span>Simulator Presets</span>
          </button>
        </div>
      </div>

      {/* Hardware Fleet KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registered Units</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{devices.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Online & Streaming</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{onlineCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Offline / Detached Leads</div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">{offlineCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sampling Rate</div>
          <div className="text-2xl font-bold font-mono text-hospital-teal mt-1">0.33 - 0.5 Hz</div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Registered Telemetry Units</h2>
          <span className="text-xs text-slate-500 font-mono">Firmware: v3.2.1-mguard</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Device ID</th>
                <th className="px-4 py-3">Assigned Patient</th>
                <th className="px-4 py-3">Hardware Type</th>
                <th className="px-4 py-3">Battery %</th>
                <th className="px-4 py-3">Last Telemetry Ping</th>
                <th className="px-4 py-3">Connection Status</th>
                <th className="px-4 py-3 text-right">Simulation Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {devices.map((d) => (
                <tr key={d.device_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {d.device_id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{d.patient_name || 'Unassigned'}</div>
                    <div className="text-[10px] font-mono text-slate-400">{d.patient_id}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {d.device_type}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">
                    <span className="flex items-center space-x-1">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{d.battery_level}%</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    {d.last_ping ? new Date(d.last_ping).toLocaleTimeString() : 'Just now'}
                  </td>
                  <td className="px-4 py-3">
                    <AlertBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(d)}
                      className={`px-3 py-1 rounded text-xs font-semibold shadow-sm transition-colors ${
                        d.status === 'online'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {d.status === 'online' ? 'Simulate Lead Off' : 'Re-attach Lead'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

