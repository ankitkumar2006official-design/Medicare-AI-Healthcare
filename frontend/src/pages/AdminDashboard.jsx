import React, { useState, useEffect } from 'react';
import { analyticsAPI, authAPI, patientAPI } from '../api/client';
import { useWebSocket } from '../context/WebSocketContext';
import AlertBadge from '../components/AlertBadge';
import {
  Users,
  ShieldCheck,
  Radio,
  AlertTriangle,
  Activity,
  Sliders,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search
} from 'lucide-react';

export default function AdminDashboard({ onOpenSimulator }) {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isConnected, recentEvents } = useWebSocket();

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, uRes, pRes] = await Promise.all([
        analyticsAPI.getOverview(),
        authAPI.listUsers(),
        patientAPI.getPatients(),
      ]);
      setOverview(ovRes.data);
      setUsers(uRes.data);
      setPatients(pRes.data);
    } catch (err) {
      console.warn('Admin dashboard load error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Administration Hub</h1>
          <p className="text-xs text-slate-500 mt-1">Ward Zero Platform Governance, Telemetry Health & RBAC</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onOpenSimulator}
            className="bg-hospital-navy hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-hospital-teal" />
            <span>IoT Simulator Hub</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Patients', val: overview?.total_patients ?? '--', icon: Users, color: 'text-slate-900' },
          { label: 'Stable Patients', val: overview?.stable_patients ?? '--', icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Attention Needed', val: overview?.patients_requiring_attention ?? '--', icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'Critical Alerts', val: overview?.critical_simulated_alerts ?? '--', icon: AlertTriangle, color: 'text-rose-600' },
          { label: 'Active Sensors', val: overview?.active_sensors ?? '--', icon: Radio, color: 'text-teal-600' },
          { label: 'Unack Alerts', val: overview?.unacknowledged_alerts ?? '--', icon: Clock, color: 'text-indigo-600' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">{card.label}</span>
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <div className={`text-2xl font-bold font-mono tracking-tight ${card.color}`}>
                {card.val}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Management Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">User Access Control & Roles</h2>
              <p className="text-xs text-slate-500">Manage registered clinicians, caregivers, and patients</p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-hospital-teal"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">User</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5">Assigned Patients</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {u.assigned_patient_ids?.length > 0
                        ? u.assigned_patient_ids.join(', ')
                        : 'System Wide'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live System Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col h-96">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Real-Time Event Stream</h3>
              <p className="text-xs text-slate-500">Live WebSocket Telemetry Packets</p>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pt-3">
            {recentEvents.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-12">
                Listening for live telemetry and alert events...
              </div>
            ) : (
              recentEvents.map((ev, i) => (
                <div key={i} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono font-semibold uppercase text-slate-700">{ev.type}</span>
                    <span>{ev.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-600 truncate font-mono text-[11px]">
                    Patient: {ev.patient_id || 'System'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
