import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientAPI, analyticsAPI } from '../api/client';
import { useWebSocket } from '../context/WebSocketContext';
import AlertBadge from '../components/AlertBadge';
import {
  Activity,
  Heart,
  Wind,
  Thermometer,
  Droplet,
  Search,
  Filter,
  Radio,
  Sliders,
  ChevronRight,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function LiveMonitoring({ onOpenSimulator }) {
  const [patients, setPatients] = useState([]);
  const [overview, setOverview] = useState(null);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { latestVitals, latestRisks, isConnected } = useWebSocket();

  const loadData = async () => {
    try {
      const [pRes, ovRes] = await Promise.all([
        patientAPI.getPatients(),
        analyticsAPI.getOverview(),
      ]);
      setPatients(pRes.data);
      setOverview(ovRes.data);
    } catch (err) {
      console.warn('Live monitoring fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000); // Background refresh
    return () => clearInterval(timer);
  }, []);

  const filteredPatients = patients.filter((p) => {
    const risk = latestRisks[p.patient_id] || p.latest_risk || {};
    const cat = (risk.risk_category || 'stable').toUpperCase();

    if (selectedRiskFilter !== 'ALL' && cat !== selectedRiskFilter) {
      return false;
    }

    if (searchQuery) {
      const matchName = p.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchId = p.patient_id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRoom = p.room_number?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchName || matchId || matchRoom;
    }

    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Hospital Ward Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hospital-teal animate-pulse"></span>
            <span className="text-xs font-bold text-hospital-teal uppercase tracking-wider">
              Central ICU / Telemetry Station
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Live Ward Patient Wall</h1>
          <p className="text-xs text-slate-500">Continuous 3-Second IoT Sensor Telemetry & Anomaly Processing</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 shadow-sm">
            {isConnected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-rose-500" />}
            <span className="font-semibold">{isConnected ? 'Continuous Stream' : 'Reconnecting...'}</span>
          </div>

          <button
            onClick={onOpenSimulator}
            className="bg-hospital-navy hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-hospital-teal" />
            <span>Simulator Hub</span>
          </button>
        </div>
      </div>

      {/* Ward Telemetry Summary KPI Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { label: 'Total Beds', val: overview?.total_patients ?? patients.length, color: 'text-slate-900' },
          { label: 'Stable', val: overview?.stable_patients ?? '--', color: 'text-emerald-600' },
          { label: 'Warning', val: overview?.patients_requiring_attention ?? '--', color: 'text-amber-600' },
          { label: 'Critical Alert', val: overview?.critical_simulated_alerts ?? '--', color: 'text-rose-600' },
          { label: 'Active Sensors', val: overview?.active_sensors ?? '--', color: 'text-teal-600' },
          { label: 'Disconnected', val: overview?.disconnected_sensors ?? '--', color: 'text-slate-500' },
          { label: 'Unack Alerts', val: overview?.unacknowledged_alerts ?? '--', color: 'text-purple-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</div>
            <div className={`text-xl font-bold font-mono tracking-tight mt-0.5 ${kpi.color}`}>
              {kpi.val}
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter Risk:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'STABLE'].map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setSelectedRiskFilter(filterKey)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedRiskFilter === filterKey
                  ? 'bg-hospital-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filterKey}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by patient, ID, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-hospital-teal"
          />
        </div>
      </div>

      {/* Patient Telemetry Cards Wall */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPatients.map((p) => {
          const vitals = latestVitals[p.patient_id] || p.latest_vitals || {};
          const risk = latestRisks[p.patient_id] || p.latest_risk || {};
          const riskCategory = (risk.risk_category || 'stable').toLowerCase();
          const riskScore = risk.risk_score || 5;
          const abnormalities = risk.detected_abnormalities || [];

          const isCritical = riskCategory === 'critical';
          const isWarning = riskCategory === 'high' || riskCategory === 'moderate';
          const isDisconnected = vitals.sensor_connected === false;

          return (
            <div
              key={p.patient_id}
              className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${
                isCritical
                  ? 'border-rose-400 ring-2 ring-rose-500/30 bg-rose-50/20'
                  : isWarning
                  ? 'border-amber-300 ring-1 ring-amber-500/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-base">{p.full_name}</span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {p.patient_id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {p.room_number} &bull; {p.age} yrs &bull; {p.gender}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <AlertBadge category={isDisconnected ? 'offline' : riskCategory} />
                  <span className="text-[10px] font-mono text-slate-400">
                    Risk: <strong className="text-slate-700">{riskScore}</strong>/100
                  </span>
                </div>
              </div>

              {/* Vitals Telemetry Monitor Grid */}
              <div className="p-4 space-y-3 flex-1">
                {isDisconnected ? (
                  <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200 font-semibold">
                    <Radio className="w-6 h-6 mx-auto mb-1 animate-ping text-rose-500" />
                    <span>TELEMETRY LEADS DETACHED / SENSOR OFFLINE</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Heart Rate */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                        <span className="flex items-center space-x-1">
                          <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                          <span>Heart Rate</span>
                        </span>
                        <span className="text-[9px] font-mono">BPM</span>
                      </div>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {vitals.heart_rate ? Math.round(vitals.heart_rate) : '--'}
                      </div>
                    </div>

                    {/* SpO2 */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                        <span className="flex items-center space-x-1">
                          <Activity className="w-3.5 h-3.5 text-sky-500" />
                          <span>Oxygen SpO2</span>
                        </span>
                        <span className="text-[9px] font-mono">%</span>
                      </div>
                      <div className={`text-2xl font-bold font-mono ${
                        vitals.oxygen_saturation && vitals.oxygen_saturation < 91 ? 'text-rose-600' : 'text-slate-900'
                      }`}>
                        {vitals.oxygen_saturation ? Math.round(vitals.oxygen_saturation) : '--'}
                      </div>
                    </div>

                    {/* Blood Pressure */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                        <span className="flex items-center space-x-1">
                          <Droplet className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Blood Pressure</span>
                        </span>
                        <span className="text-[9px] font-mono">mmHg</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {vitals.blood_pressure_systolic
                          ? `${Math.round(vitals.blood_pressure_systolic)}/${Math.round(vitals.blood_pressure_diastolic || 80)}`
                          : '--/--'}
                      </div>
                    </div>

                    {/* Temperature & Resp */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                        <span className="flex items-center space-x-1">
                          <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                          <span>Temp / Resp</span>
                        </span>
                      </div>
                      <div className="text-base font-bold font-mono text-slate-900">
                        {vitals.body_temperature ? `${vitals.body_temperature.toFixed(1)}°C` : '--'}
                        <span className="text-xs font-normal text-slate-500 ml-1">
                          | {vitals.respiratory_rate ? Math.round(vitals.respiratory_rate) : '--'} bpm
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detected Abnormality Alert Warning */}
                {abnormalities.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-[11px] text-rose-800 font-medium">
                    <span className="font-bold">Clinical Flag: </span>
                    <span>{abnormalities[0]}</span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-mono">
                  Scenario: {p.active_scenario || 'healthy'}
                </span>
                <Link
                  to={`/patients/${p.patient_id}`}
                  className="font-semibold text-hospital-teal hover:text-teal-700 flex items-center space-x-1"
                >
                  <span>Patient Digital Twin</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
