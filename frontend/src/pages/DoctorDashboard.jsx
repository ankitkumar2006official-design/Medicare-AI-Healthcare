import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientAPI, alertAPI } from '../api/client';
import { useWebSocket } from '../context/WebSocketContext';
import AlertBadge from '../components/AlertBadge';
import {
  Stethoscope,
  Heart,
  Activity,
  Wind,
  Thermometer,
  ArrowRight,
  AlertTriangle,
  FileEdit,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { latestVitals, latestRisks } = useWebSocket();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, aRes] = await Promise.all([
          patientAPI.getPatients(),
          alertAPI.getAlerts({ limit: 10 }),
        ]);
        setPatients(pRes.data);
        setAlerts(aRes.data);
      } catch (err) {
        console.warn('Doctor dashboard error:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hospital-teal animate-pulse"></span>
            <span className="text-xs font-bold text-hospital-teal uppercase tracking-wider">Clinical Station</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Doctor Telemetry Dashboard</h1>
          <p className="text-xs text-slate-500">Continuous Cardiopulmonary Monitoring & Physiological Trajectories</p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/live"
            className="bg-hospital-teal hover:bg-teal-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
          >
            <Activity className="w-4 h-4" />
            <span>Open Telemetry Wall</span>
          </Link>
        </div>
      </div>

      {/* Ward Telemetry Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Assigned Ward Patients ({patients.length})
          </h2>
          <span className="text-xs text-slate-500">Live 3s Telemetry Feed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((p) => {
            const vitals = latestVitals[p.patient_id] || p.latest_vitals || {};
            const risk = latestRisks[p.patient_id] || p.latest_risk || {};
            const riskCategory = risk.risk_category || 'stable';
            const riskScore = risk.risk_score || 5;

            const isCritical = riskCategory === 'critical';
            const isWarning = riskCategory === 'high' || riskCategory === 'moderate';

            return (
              <div
                key={p.patient_id}
                className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
                  isCritical ? 'border-rose-300 ring-1 ring-rose-500/20' : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-base">{p.full_name}</span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {p.patient_id}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{p.age} yrs &bull; {p.gender} &bull; {p.room_number}</div>
                  </div>
                  <AlertBadge category={riskCategory} />
                </div>

                {/* Primary Diagnosis */}
                <div className="mt-2.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-1">
                  <strong>Condition:</strong> {p.medical_history?.[0] || 'Under Observation'}
                </div>

                {/* Live Vitals Grid */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center justify-center space-x-1">
                      <Heart className="w-3 h-3 text-rose-500" />
                      <span>HR</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                      {vitals.heart_rate ? Math.round(vitals.heart_rate) : '--'}
                      <span className="text-[9px] font-normal text-slate-500 ml-0.5">bpm</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center justify-center space-x-1">
                      <Activity className="w-3 h-3 text-sky-500" />
                      <span>SpO2</span>
                    </div>
                    <div className={`text-lg font-bold font-mono mt-0.5 ${
                      vitals.oxygen_saturation && vitals.oxygen_saturation < 90 ? 'text-rose-600' : 'text-slate-900'
                    }`}>
                      {vitals.oxygen_saturation ? Math.round(vitals.oxygen_saturation) : '--'}
                      <span className="text-[9px] font-normal text-slate-500 ml-0.5">%</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center justify-center space-x-1">
                      <Thermometer className="w-3 h-3 text-amber-500" />
                      <span>Temp</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                      {vitals.body_temperature ? vitals.body_temperature.toFixed(1) : '--'}
                      <span className="text-[9px] font-normal text-slate-500 ml-0.5">°C</span>
                    </div>
                  </div>
                </div>

                {/* Risk score bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Risk Score:</span>
                    <span className="font-mono font-bold text-slate-900">{riskScore}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        riskScore >= 75 ? 'bg-rose-500' : riskScore >= 45 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(riskScore, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="mt-4 pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Scenario: {p.active_scenario || 'healthy'}
                  </span>
                  <Link
                    to={`/patients/${p.patient_id}`}
                    className="text-xs font-semibold text-hospital-teal hover:text-teal-700 flex items-center space-x-1"
                  >
                    <span>View Digital Twin</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Alerts Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Clinical Telemetry Alerts
            </h2>
            <p className="text-xs text-slate-500">Prioritized by severity for physician evaluation</p>
          </div>
          <Link to="/alerts" className="text-xs font-semibold text-hospital-teal hover:underline">
            View All Alerts &rarr;
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {alerts.slice(0, 5).map((a) => (
            <div key={a.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <AlertBadge severity={a.severity} />
                <div>
                  <span className="font-bold text-slate-900">{a.patient_name}</span>
                  <span className="text-slate-500 ml-2">&bull; {a.reason}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-slate-400">
                <span className="font-mono text-[11px]">{new Date(a.created_at).toLocaleTimeString()}</span>
                <AlertBadge status={a.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

