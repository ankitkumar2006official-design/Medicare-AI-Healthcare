import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Activity,
  Heart,
  Wind,
  Thermometer,
  Droplet,
  UserCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { patientAPI } from '../api/client';

export default function PhysiologicalStabilityMatrix({
  patientId,
  stabilityData,
  currentCaregiver,
  onCaregiverUpdated
}) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [caregiverIdInput, setCaregiverIdInput] = useState('');
  const [caregiverNameInput, setCaregiverNameInput] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(null);

  if (!stabilityData) {
    return null;
  }

  const {
    stability_score = 100.0,
    stability_category = 'Optimal Stability',
    trend_direction = 'stable',
    trend_delta = 0.0,
    mean_arterial_pressure,
    parameters = {},
    contributing_factors = []
  } = stabilityData;

  const getScoreColor = (score) => {
    if (score >= 88) return { text: 'text-emerald-600', bg: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (score >= 72) return { text: 'text-amber-600', bg: 'bg-amber-500', pill: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (score >= 50) return { text: 'text-orange-600', bg: 'bg-orange-500', pill: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { text: 'text-rose-600', bg: 'bg-rose-500', pill: 'bg-rose-100 text-rose-800 border-rose-200' };
  };

  const scoreTheme = getScoreColor(stability_score);

  const getTrendIcon = () => {
    if (trend_direction === 'improving') {
      return (
        <span className="flex items-center text-emerald-600 space-x-1 font-semibold text-xs">
          <TrendingUp className="w-4 h-4" />
          <span>Improving (+{trend_delta}%)</span>
        </span>
      );
    }
    if (trend_direction === 'deteriorating') {
      return (
        <span className="flex items-center text-rose-600 space-x-1 font-semibold text-xs">
          <TrendingDown className="w-4 h-4" />
          <span>Deteriorating ({trend_delta}%)</span>
        </span>
      );
    }
    return (
      <span className="flex items-center text-slate-500 space-x-1 font-medium text-xs">
        <Minus className="w-4 h-4" />
        <span>Steady / Stable</span>
      </span>
    );
  };

  const getParamIcon = (key) => {
    switch (key) {
      case 'heart_rate':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'oxygen_saturation':
        return <Activity className="w-4 h-4 text-sky-500" />;
      case 'blood_pressure_systolic':
        return <Droplet className="w-4 h-4 text-indigo-500" />;
      case 'respiratory_rate':
        return <Wind className="w-4 h-4 text-teal-500" />;
      case 'body_temperature':
        return <Thermometer className="w-4 h-4 text-amber-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'optimal':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">OPTIMAL</span>;
      case 'mild_deviation':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">MILD VARIANCE</span>;
      case 'moderate_deviation':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">MODERATE DEVIATION</span>;
      case 'critical_deviation':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">CRITICAL</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">NORMAL</span>;
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!caregiverIdInput.trim()) return;
    setAssigning(true);
    setAssignSuccess(null);
    try {
      const res = await patientAPI.assignCaregiver(patientId, {
        caregiver_id: caregiverIdInput.trim(),
        caregiver_name: caregiverNameInput.trim() || undefined,
        reason: 'Shift allocation via Digital Twin'
      });
      setAssignSuccess(res.data.message || 'Caregiver assigned successfully.');
      if (onCaregiverUpdated) {
        onCaregiverUpdated(caregiverNameInput || caregiverIdInput);
      }
      setTimeout(() => setShowAssignModal(false), 1200);
    } catch (err) {
      alert('Failed to re-assign caregiver.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
      {/* Top Header & Stability Gauge Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-hospital-teal" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Physiological Stability Index (PSI) & Comparative Baseline Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time biometric convergence analysis against personalized target zones and population baselines
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Dynamic PSI Score</div>
            <div className="flex items-baseline space-x-1.5 justify-end">
              <span className={`text-2xl font-black font-mono ${scoreTheme.text}`}>
                {stability_score.toFixed(1)}%
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${scoreTheme.pill}`}>
                {stability_category}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-200"
          >
            <UserCheck className="w-4 h-4 text-hospital-teal" />
            <span>{currentCaregiver ? `Caregiver: ${currentCaregiver}` : 'Assign Caregiver'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Key Vitals Meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Stability Reserve</span>
            <span className="font-mono text-slate-500">{stability_score.toFixed(1)} / 100</span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${scoreTheme.bg}`}
              style={{ width: `${Math.min(100, Math.max(0, stability_score))}%` }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Telemetry Trajectory</span>
            <div className="mt-0.5">{getTrendIcon()}</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Mean Arterial Pressure (MAP)</span>
            <span className="font-mono font-bold text-slate-800 text-sm">
              {mean_arterial_pressure ? `${mean_arterial_pressure} mmHg` : 'N/A'}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">(Target: 70-100 mmHg)</span>
          </div>
        </div>
      </div>

      {/* Comparative Baseline Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <th className="py-2.5 px-3">Physiological Parameter</th>
              <th className="py-2.5 px-3">Live Reading</th>
              <th className="py-2.5 px-3">Personalized Target Baseline</th>
              <th className="py-2.5 px-3">Population Standard</th>
              <th className="py-2.5 px-3">Deviation %</th>
              <th className="py-2.5 px-3">Clinical Evaluation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Object.entries(parameters).map(([key, item]) => (
              <tr key={key} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 px-3 font-medium text-slate-800 flex items-center space-x-2">
                  {getParamIcon(key)}
                  <span>{item.parameter}</span>
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                  {item.current_value.toFixed(1)}
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-600">
                  {item.target_baseline_range?.min !== undefined && item.target_baseline_range?.max !== undefined
                    ? `${item.target_baseline_range.min} - ${item.target_baseline_range.max}`
                    : `≥ ${item.target_baseline_range?.min || 95}`}
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-400">
                  {item.population_norm_range?.min} - {item.population_norm_range?.max}
                </td>
                <td className="py-2.5 px-3 font-mono font-semibold">
                  <span className={item.deviation_percentage > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                    {item.deviation_percentage > 0 ? `+${item.deviation_percentage}%` : '0%'}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(item.status)}
                    <span className="text-[11px] text-slate-500 hidden sm:inline truncate max-w-xs">
                      {item.clinical_note}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contributing Factors & Explainability Box */}
      <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-teal-900 uppercase">
          <Info className="w-4 h-4 text-hospital-teal" />
          <span>Clinical Explainability & Contributing Factors</span>
        </div>
        <ul className="text-xs text-slate-700 space-y-1 pl-5 list-disc">
          {contributing_factors.map((factor, idx) => (
            <li key={idx} className="leading-relaxed">
              {factor}
            </li>
          ))}
        </ul>
      </div>

      {/* Assign Caregiver Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-hospital-teal" />
                <h3 className="text-sm font-bold text-slate-900">Reassign Primary Caregiver</h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {assignSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{assignSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Caregiver User ID or Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CG-201 or caregiver@hospital.org"
                    value={caregiverIdInput}
                    onChange={(e) => setCaregiverIdInput(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-hospital-teal focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Caregiver Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nurse Elena Vance, RN"
                    value={caregiverNameInput}
                    onChange={(e) => setCaregiverNameInput(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-hospital-teal focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigning || !caregiverIdInput.trim()}
                    className="px-4 py-2 bg-hospital-navy text-white rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50"
                  >
                    {assigning ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
