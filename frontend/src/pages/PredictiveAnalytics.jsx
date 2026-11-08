import React, { useState, useEffect } from 'react';
import { forecastAPI, patientAPI, riskAPI } from '../api/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  ShieldAlert,
  Info,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  Activity,
  CheckCircle,
  HelpCircle,
  Cpu,
  Award,
  BarChart2
} from 'lucide-react';

export default function PredictiveAnalytics() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('PT-1002');
  const [forecast, setForecast] = useState(null);
  const [selectedVital, setSelectedVital] = useState('oxygen_saturation');
  const [evalMetrics, setEvalMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const [resP, resM] = await Promise.all([
          patientAPI.getPatients(),
          riskAPI.getEvaluationMetrics()
        ]);
        setPatients(resP.data || []);
        setEvalMetrics(resM.data);
      } catch (err) {
        console.warn('Error fetching predictive data:', err);
      }
    };
    loadPatients();
  }, []);

  const loadForecast = async (pid) => {
    setLoading(true);
    try {
      const res = await forecastAPI.getForecast(pid);
      setForecast(res.data);
    } catch (err) {
      console.warn('Error fetching forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadForecast(selectedPatientId);
    }
  }, [selectedPatientId]);

  const vitalMeta = {
    oxygen_saturation: { label: 'SpO2 Oxygen Saturation', unit: '%', threshold: 90, domain: [75, 100], color: '#0d9488' },
    heart_rate: { label: 'Heart Rate', unit: 'BPM', threshold: 100, domain: [50, 150], color: '#e11d48' },
    body_temperature: { label: 'Body Temperature', unit: '°C', threshold: 38.0, domain: [35, 41], color: '#f59e0b' },
    respiratory_rate: { label: 'Respiratory Rate', unit: '/min', threshold: 24, domain: [8, 35], color: '#8b5cf6' }
  };

  const currentVitalConfig = vitalMeta[selectedVital] || vitalMeta.oxygen_saturation;
  const paramForecast = forecast?.parameters?.[selectedVital];

  // Prepare chart series from forecast points
  const chartPoints = paramForecast?.points?.map((pt) => ({
    hour: `+${pt.hour_offset}h`,
    predicted: pt.predicted_value,
    lower: pt.lower_bound_95,
    upper: pt.upper_bound_95,
    confidence_spread: pt.confidence_spread
  })) || [];

  const deteriorationScore = forecast?.deterioration_probability || 0;
  const isHighRisk = deteriorationScore > 65;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Research Disclaimer Banner (MANDATORY REQUIREMENT) */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
            Experimental Predictive Intelligence (Non-Clinical Validation Notice)
          </h4>
          <p className="text-xs text-amber-800 leading-relaxed">
            {forecast?.clinical_disclaimer ||
              'This 24–48 hour autoregressive forecasting module is designed for physiological trend simulation and research demonstration. Output predictions must not be used as clinical diagnostic advice or as a substitute for physician judgment.'}
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hospital-teal animate-pulse"></span>
            <span className="text-xs font-bold text-hospital-teal uppercase tracking-wider">
              24–48 Hour Physiological Trajectory Modeling
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Predictive Health Analytics & Forecasting
          </h1>
          <p className="text-xs text-slate-500">
            Multi-Horizon Autoregressive Drift, Deterioration Probability & 95% Confidence Bounds
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-600">Patient:</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-hospital-teal"
          >
            {patients.map((p) => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.patient_id} – {p.full_name}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadForecast(selectedPatientId)}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Trajectory Rating & Probability Meter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Deterioration Probability Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              48-Hour Deterioration Risk
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                isHighRisk ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {forecast?.risk_trajectory_rating?.replace('_', ' ') || 'CALCULATING'}
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-slate-900">{deteriorationScore}%</span>
            <span className="text-xs font-bold text-slate-500">probability score</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isHighRisk ? 'bg-rose-500' : deteriorationScore > 40 ? 'bg-amber-500' : 'bg-hospital-teal'
              }`}
              style={{ width: `${deteriorationScore}%` }}
            />
          </div>

          <p className="text-xs text-slate-600">
            {isHighRisk
              ? 'Warning: Autoregressive model detects compound physiological divergence toward acute destabilization.'
              : 'Physiological parameters projected to oscillate within safe home recovery margins.'}
          </p>
        </div>

        {/* Contributing Feature Weights */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-hospital-teal" />
              <span>Predictive Feature Importance Weights</span>
            </h2>
            <span className="text-xs text-slate-400">Explainable Model Drivers</span>
          </div>

          <div className="space-y-3">
            {forecast?.contributing_feature_weights &&
              Object.entries(forecast.contributing_feature_weights).map(([feat, wt]) => (
                <div key={feat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 capitalize">{feat.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-slate-500">{Math.round(wt * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-hospital-teal h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, wt * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Main Forecast Chart Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Autoregressive Trajectory & Confidence Horizons (48h)
            </h2>
            <p className="text-xs text-slate-500">
              Solid line indicates expected trend; shaded envelope reflects 95% uncertainty dispersion
            </p>
          </div>

          {/* Parameter Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {Object.keys(vitalMeta).map((k) => (
              <button
                key={k}
                onClick={() => setSelectedVital(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedVital === k
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {vitalMeta[k].label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Forecast Recharts Display */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentVitalConfig.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={currentVitalConfig.color} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis domain={currentVitalConfig.domain} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <ReferenceLine
                y={currentVitalConfig.threshold}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: `Safety Threshold (${currentVitalConfig.threshold}${currentVitalConfig.unit})`,
                  fill: '#ef4444',
                  fontSize: 10,
                  position: 'insideTopRight'
                }}
              />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="transparent"
                fill="url(#confidenceGrad)"
                name="Upper 95% Bound"
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="transparent"
                fill="#ffffff"
                name="Lower 95% Bound"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke={currentVitalConfig.color}
                strokeWidth={3}
                name={`Projected ${currentVitalConfig.label}`}
                dot={{ r: 4, fill: currentVitalConfig.color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Multi-Horizon Breakdown Cards (+6h, +12h, +24h, +48h) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {chartPoints.map((pt) => (
            <div key={pt.hour} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Horizon {pt.hour}</span>
              <div className="text-xl font-bold font-mono text-slate-900">
                {pt.predicted}
                <span className="text-xs font-normal text-slate-500 ml-1">{currentVitalConfig.unit}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                95% CI: [{pt.lower} – {pt.upper}]
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* AI/ML Model Benchmark & Evaluation Section */}
      {evalMetrics && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-hospital-teal" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  AI/ML Model Benchmarking & Statistical Evaluation
                </h2>
                <p className="text-xs text-slate-500">
                  Empirical performance metrics evaluated against labeled clinical physiological test sets
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              {evalMetrics.anomaly_detector?.clinical_benchmark_status || 'EXCELLENT'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Detection Accuracy</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">
                {evalMetrics.anomaly_detector?.accuracy}%
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Recall / Sensitivity</span>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">
                {evalMetrics.anomaly_detector?.recall_sensitivity}%
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Precision</span>
              <p className="text-xl font-extrabold text-hospital-teal mt-1">
                {evalMetrics.anomaly_detector?.precision}%
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">F1-Score</span>
              <p className="text-xl font-extrabold text-indigo-600 mt-1">
                {evalMetrics.anomaly_detector?.f1_score}%
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">SpO2 Forecast MAE</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">
                {evalMetrics.forecasting_engine?.parameters?.oxygen_saturation?.mean_absolute_error}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

