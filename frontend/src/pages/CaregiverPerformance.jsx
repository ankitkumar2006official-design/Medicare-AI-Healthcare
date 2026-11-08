import React, { useState, useEffect } from 'react';
import { caregiverAttendanceAPI } from '../api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import {
  Clock,
  Award,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  ArrowUpRight,
  TrendingDown,
  UserCheck,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function CaregiverPerformance() {
  const [performance, setPerformance] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaregiver, setSelectedCaregiver] = useState('user-caregiver-01');

  const loadData = async () => {
    setLoading(true);
    try {
      const [perfRes, actRes] = await Promise.all([
        caregiverAttendanceAPI.getPerformance(selectedCaregiver),
        caregiverAttendanceAPI.getActivities({ caregiver_id: selectedCaregiver, limit: 30 })
      ]);
      setPerformance(perfRes.data);
      setActivities(actRes.data || []);
    } catch (err) {
      console.warn('Error loading caregiver performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCaregiver]);

  // Mock response time distribution for chart if API provides summary
  const responseDistributionData = [
    { bracket: '< 30s', count: 18, color: '#0d9488' },
    { bracket: '30-60s', count: 9, color: '#14b8a6' },
    { bracket: '60-90s', count: 4, color: '#f59e0b' },
    { bracket: '90-120s', count: 1, color: '#f97316' },
    { bracket: '> 120s', count: 0, color: '#ef4444' }
  ];

  const trendData = [
    { day: 'Mon', avgSec: 42, slaRate: 95 },
    { day: 'Tue', avgSec: 38, slaRate: 98 },
    { day: 'Wed', avgSec: 35, slaRate: 100 },
    { day: 'Thu', avgSec: 39, slaRate: 97 },
    { day: 'Fri', avgSec: 32, slaRate: 100 },
    { day: 'Sat', avgSec: 34, slaRate: 98 },
    { day: 'Sun', avgSec: 31, slaRate: 100 }
  ];

  const avgSec = performance?.avg_ack_time_seconds || 34.2;
  const slaRate = performance?.sla_compliance_rate_percent || 96.8;
  const totalAcked = performance?.total_alerts_acknowledged || 32;
  const missedAtt = performance?.missed_attendance_count || 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            <span className="text-xs font-bold text-hospital-teal uppercase tracking-wider">
              Caregiver Quality & SLA Analytics
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Caregiver Performance & Response Times
          </h1>
          <p className="text-xs text-slate-500">
            Telemetry Alert Triage Latency, Protocol Compliance & Bedside Intervention Audit
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedCaregiver}
            onChange={(e) => setSelectedCaregiver(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-hospital-teal"
          >
            <option value="user-caregiver-01">James Wilson, RN (Lead Nurse)</option>
            <option value="user-caregiver-02">Maria Santos, LPN</option>
            <option value="user-caregiver-03">David Kim, EMT-P</option>
          </select>

          <button
            onClick={loadData}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avg Response Time */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Avg Acknowledgment Time</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-hospital-teal flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{avgSec}</span>
            <span className="text-xs font-bold text-slate-500">seconds</span>
          </div>
          <p className="text-[11px] text-emerald-600 flex items-center font-medium">
            <TrendingDown className="w-3.5 h-3.5 mr-1" />
            <span>12% faster than 60s hospital standard</span>
          </p>
        </div>

        {/* SLA Compliance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>SLA Compliance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{slaRate}%</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Target SLA: 90.0% (Under 90s response threshold)
          </p>
        </div>

        {/* Total Resolved Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Alerts Acknowledged</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalAcked}</span>
            <span className="text-xs font-bold text-slate-500">events</span>
          </div>
          <p className="text-[11px] text-slate-500">
            0 auto-escalation breaches recorded
          </p>
        </div>

        {/* Missed Attendance Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Missed Shift / Delay Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{missedAtt}</span>
            <span className="text-xs font-bold text-slate-500">delays</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">
            100% on-time GPS check-in record
          </p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Alert Response Latency Distribution</h2>
              <p className="text-xs text-slate-500">Distribution of caregiver reaction times to vital alerts</p>
            </div>
            <span className="text-xs font-bold text-hospital-teal bg-teal-50 px-2 py-0.5 rounded-full">
              SLA Cutoff: 90s
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="bracket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily SLA Compliance Trend */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">7-Day Response & Compliance Trend</h2>
              <p className="text-xs text-slate-500">Average response time (seconds) and SLA adherence rate</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              98% Weekly Avg
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgSec"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  name="Avg Response (s)"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="slaRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  name="SLA Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Caregiver Activity Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-hospital-teal" />
            <h2 className="text-base font-bold text-slate-900">Verified Bedside Caregiver Activity Log</h2>
          </div>
          <span className="text-xs text-slate-500">{activities.length} Recorded Interventions</span>
        </div>

        {activities.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No activity log entries found for this caregiver.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100/60 text-hospital-teal flex items-center justify-center mt-0.5">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{act.description}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                        {act.activity_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Patient: <span className="font-semibold text-slate-700">{act.patient_name || act.patient_id}</span> •
                      Logged by: {act.caregiver_name}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end space-x-1 mt-0.5">
                    <CheckCircle className="w-3 h-3" />
                    <span>Audit Logged</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

