import React, { useState, useEffect } from 'react';
import { analyticsAPI, patientAPI } from '../api/client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { BarChart3, Download, FileText, Calendar, Filter, Activity, Users, ShieldAlert } from 'lucide-react';

export default function ReportsAnalytics() {
  const [overview, setOverview] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ovRes, pRes] = await Promise.all([
          analyticsAPI.getOverview(),
          patientAPI.getPatients(),
        ]);
        setOverview(ovRes.data);
        setPatients(pRes.data);
      } catch (err) {
        console.warn('Analytics report error:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const riskDistribution = [
    { name: 'Stable', value: overview?.stable_patients || 3, color: '#10B981' },
    { name: 'Moderate / Warning', value: overview?.patients_requiring_attention || 1, color: '#F59E0B' },
    { name: 'Critical Emergency', value: overview?.critical_patients || 1, color: '#EF4444' },
  ];

  const hourlyAlarmData = [
    { hour: '00:00', alarms: 1 },
    { hour: '04:00', alarms: 0 },
    { hour: '08:00', alarms: 3 },
    { hour: '12:00', alarms: 4 },
    { hour: '16:00', alarms: 2 },
    { hour: '20:00', alarms: 5 },
  ];

  const handleExportReport = () => {
    const reportText = `MediGuard AI - Operation Ward Zero Telemetry Report\nGenerated: ${new Date().toISOString()}\nTotal Beds Monitored: ${patients.length}\nStable Patients: ${overview?.stable_patients}\nCritical Alerts: ${overview?.critical_simulated_alerts}\nActive IoT Sensors: ${overview?.active_sensors}\n`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediguard-ward-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hospital-teal animate-pulse"></span>
            <span className="text-xs font-bold text-hospital-teal uppercase tracking-wider">Hospital Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Ward Reports & Clinical Analytics</h1>
          <p className="text-xs text-slate-500">Population Physiological Risk Trajectories & Telemetry Ingestion Metrics</p>
        </div>

        <button
          onClick={handleExportReport}
          className="bg-hospital-navy hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
        >
          <Download className="w-4 h-4 text-hospital-teal" />
          <span>Export Clinical Summary (TXT)</span>
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-80">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Ward Risk Category Distribution</h2>
          <p className="text-xs text-slate-500 mb-3">Breakdown of current patient acuity scores</p>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '0.5rem', fontSize: '0.75rem' }}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 24-hr Alarm Frequency Trends */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-80">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Simulated Alarm Incidents (24-Hour)</h2>
          <p className="text-xs text-slate-500 mb-3">Temporal distribution of critical and warning telemetry alerts</p>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyAlarmData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '0.5rem', fontSize: '0.75rem' }}
                />
                <Bar dataKey="alarms" fill="#0D9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ward Sensor Metrics Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Hospital Ward Capacity & Telemetry Throughput</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-semibold">Total Ward Beds Monitored</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{patients.length} Beds</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">100% telemetry coverage</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-semibold">Total Telemetry Packets Ingested</div>
            <div className="text-2xl font-bold font-mono text-teal-600 mt-1">
              {overview?.readings_ingested_last_24h || 1240}+
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Continuous 3s streaming cadence</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-semibold">Average Caregiver Acknowledgment Time</div>
            <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">42 seconds</div>
            <div className="text-[11px] text-slate-400 mt-1">Simulated bedside responsiveness</div>
          </div>
        </div>
      </div>
    </div>
  );
}

