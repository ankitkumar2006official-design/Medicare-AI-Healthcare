import React, { useState, useEffect } from 'react';
import { patientAPI, riskAPI, contextualAPI } from '../api/client';
import { useWebSocket } from '../context/WebSocketContext';
import AlertBadge from '../components/AlertBadge';
import {
  Cpu,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Send,
  AlertTriangle,
  Activity,
  Layers,
  ChevronRight,
  Info,
  Clock,
  HeartPulse,
  BrainCircuit,
  FileText
} from 'lucide-react';

export default function AIRiskAnalysis() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('PT-1002');
  const [riskData, setRiskData] = useState(null);
  const [contextData, setContextData] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [userQuery, setUserQuery] = useState('');
  const [loadingExpl, setLoadingExpl] = useState(false);
  const { latestRisks, latestVitals } = useWebSocket();

  useEffect(() => {
    const load = async () => {
      try {
        const pRes = await patientAPI.getPatients();
        setPatients(pRes.data);
      } catch (err) {
        console.warn('AI risk patient fetch error:', err);
      }
    };
    load();
  }, []);

  const loadRiskAndContext = async (pid) => {
    try {
      const [rRes, cRes] = await Promise.all([
        riskAPI.getLatest(pid),
        contextualAPI.getContext(pid)
      ]);
      setRiskData(rRes.data);
      setContextData(cRes.data);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadRiskAndContext(selectedPatientId);
      setExplanation(null);
    }
  }, [selectedPatientId]);

  const handleAskAssistant = async (e) => {
    e?.preventDefault();
    setLoadingExpl(true);
    try {
      const res = await riskAPI.explain(selectedPatientId, userQuery);
      setExplanation(res.data);
    } catch {
      alert('Could not generate clinical explanation');
    }
    setLoadingExpl(false);
  };

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId);
  const currentRisk = latestRisks[selectedPatientId] || riskData || selectedPatient?.latest_risk || {};
  const currentVitals = latestVitals[selectedPatientId] || selectedPatient?.latest_vitals || {};
  const anomalyMetrics = currentRisk.anomaly_metrics || {};

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-hospital-teal animate-pulse"></span>
          <span className="text-xs font-bold text-hospital-teal uppercase tracking-wider">
            Machine Learning Diagnostics
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
          3-Layer AI/ML Risk Detection Engine
        </h1>
        <p className="text-xs text-slate-500">
          Deterministic Safety Thresholds &bull; Scikit-learn Isolation Forest Anomaly Detection &bull; Groq LLaMA-3 Assistant
        </p>
      </div>

      {/* Patient Selector Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Target Patient:
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-hospital-teal"
          >
            {patients.map((p) => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.patient_id} – {p.full_name} ({p.medical_history?.[0] || 'Patient'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">Active AI Assessment:</span>
          <AlertBadge category={currentRisk.risk_category || 'stable'} />
        </div>
      </div>

      {/* 3-Layer Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Layer 1: Clinical Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
              Layer 1 &bull; Deterministic
            </span>
            <ShieldCheck className="w-4 h-4 text-hospital-teal" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Rule-Based Clinical Safety</h3>
          <p className="text-xs text-slate-500">
            Rigid physiological boundaries for hypoxia, extreme tachycardia, hyperpyrexia, and malignant hypertension.
          </p>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700">Safety Rule Violations:</div>
            {currentRisk.rule_violations?.length > 0 ? (
              currentRisk.rule_violations.map((v, i) => (
                <div key={i} className="text-[11px] p-2 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                  {v}
                </div>
              ))
            ) : (
              <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100 font-medium">
                No clinical safety limit violations detected.
              </div>
            )}
          </div>
        </div>

        {/* Layer 2: Isolation Forest Anomaly Detection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
              Layer 2 &bull; ML Engine
            </span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Scikit-learn Isolation Forest</h3>
          <p className="text-xs text-slate-500">
            Unsupervised multidimensional anomaly detection trained on healthy baseline corpora.
          </p>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Anomaly Detected:</span>
              <span className={`font-bold ${anomalyMetrics.is_anomaly ? 'text-rose-600' : 'text-emerald-600'}`}>
                {anomalyMetrics.is_anomaly ? 'YES (Outlier Pattern)' : 'NO (Normal Variance)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Anomaly Confidence:</span>
              <span className="font-mono font-bold text-slate-800">
                {Math.round((anomalyMetrics.anomaly_score || 0) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Layer 3: Risk Assessment Composite */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
              Layer 3 &bull; Synthesis
            </span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Composite Clinical Risk</h3>
          <p className="text-xs text-slate-500">
            Integrates rule limits + ML anomaly + rate of change trends into unified score (0-100).
          </p>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Risk Score:</span>
              <span className="text-2xl font-bold font-mono text-slate-900">
                {currentRisk.risk_score || 5}/100
              </span>
            </div>
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <strong>Escalation:</strong> {currentRisk.recommended_escalation || 'Routine telemetry monitoring'}
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Intelligence & Contributing Factors Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Contextual Intelligence & Contributing Risk Factors
              </h2>
              <p className="text-xs text-slate-500">
                Fuses real-time vitals, medical history, caregiver observations & repeated abnormal patterns
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
            Context Engine v2.4 Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Repeated Pattern Detection */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Repeated Abnormal Pattern Detection
            </span>
            {contextData?.repeated_patterns?.length > 0 ? (
              <div className="space-y-1.5">
                {contextData.repeated_patterns.map((pat, idx) => (
                  <div key={idx} className="p-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-medium">
                    <span className="font-bold">{pat.pattern_type.replace(/_/g, ' ')}:</span> {pat.description}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No repeated cyclic desaturations or tachycardia clustering detected.</p>
            )}
          </div>

          {/* Chronic Condition Modifiers */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Medical History Vulnerability Modifiers
            </span>
            {contextData?.chronic_modifiers?.length > 0 ? (
              <div className="space-y-1.5">
                {contextData.chronic_modifiers.map((mod, idx) => (
                  <div key={idx} className="p-2 bg-purple-50 text-purple-900 border border-purple-200 rounded-lg text-xs font-medium flex justify-between">
                    <span className="capitalize">{mod.condition}</span>
                    <span className="font-bold font-mono">+{mod.vulnerability_weight}pts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No high-risk comorbid vulnerability escalators active.</p>
            )}
          </div>

          {/* Contributing Feature Weights */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Decision Contributing Factors Breakdown
            </span>
            {contextData?.contributing_factors ? (
              <div className="space-y-1 text-xs">
                {Object.entries(contextData.contributing_factors).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-0.5 border-b border-slate-100 last:border-none">
                    <span className="text-slate-600 capitalize">{k.replace(/_/g, ' ')}:</span>
                    <span className="font-mono font-bold text-slate-800">{Math.round(v * 100)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Standard vital variance baseline weighting.</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant Explanation Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-hospital-teal flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Groq LLaMA-3 & Deterministic Clinical Assistant
              </h2>
              <p className="text-xs text-slate-500">
                Ultra-fast explainable telemetry breakdown & caregiver bedside recommendations (Groq LLaMA-3.3-70B)
              </p>
            </div>
          </div>

          <button
            onClick={() => handleAskAssistant()}
            disabled={loadingExpl}
            className="bg-hospital-teal hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center space-x-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loadingExpl ? 'Analyzing with Groq...' : 'Generate Clinical Explanation'}</span>
          </button>
        </div>

        {/* Custom Query Input */}
        <form onSubmit={handleAskAssistant} className="flex space-x-2">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Ask Groq AI assistant about this patient's vitals, trend risks, or recommended actions..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-hospital-teal"
          />
          <button
            type="submit"
            disabled={loadingExpl}
            className="bg-hospital-navy text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center space-x-1"
          >
            <Send className="w-3.5 h-3.5 text-hospital-teal" />
            <span>Ask</span>
          </button>
        </form>

        {/* Explanation Output */}
        {explanation && (
          <div className="mt-4 p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-600">Engine Source: {explanation.source}</span>
              <span className="font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="whitespace-pre-line leading-relaxed text-slate-800 font-sans">
              {explanation.explanation}
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] flex items-start space-x-2 mt-4">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{explanation.disclaimer}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

