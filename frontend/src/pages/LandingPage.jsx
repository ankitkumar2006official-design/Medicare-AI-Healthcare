import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import {
  Activity,
  ShieldCheck,
  Cpu,
  BellRing,
  HeartHandshake,
  ArrowRight,
  Radio,
  Sliders,
  CheckCircle2,
  Lock,
  Stethoscope
} from 'lucide-react';

export default function LandingPage({ onOpenSimulator }) {
  const [loggingInRole, setLoggingInRole] = useState(null);
  const { switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (roleKey) => {
    setLoggingInRole(roleKey);
    try {
      await switchDemoRole(roleKey);
      if (roleKey === 'admin') navigate('/dashboard/admin');
      else if (roleKey === 'doctor') navigate('/dashboard/doctor');
      else if (roleKey === 'caregiver') navigate('/dashboard/caregiver');
      else navigate('/dashboard/patient');
    } catch (err) {
      console.error('Quick login error:', err);
    } finally {
      setLoggingInRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="bg-hospital-navy text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0D9488_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-hospital-teal/20 border border-hospital-teal/30 px-3.5 py-1.5 rounded-full text-hospital-tealLight text-xs font-semibold mb-6">
            <Radio className="w-3.5 h-3.5 animate-pulse text-hospital-tealLight" />
            <span>Operation Ward Zero &bull; Hackathon Prototype</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            MediGuard <span className="text-hospital-teal">AI</span>
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-slate-300 font-medium max-w-3xl mx-auto">
            Transforming Ordinary Patient Bedrooms into Simulated Smart Hospital Wards.
          </p>

          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Continuous synthetic IoT sensor streaming, 3-layer AI risk detection with Scikit-learn Isolation Forest,
            intelligent caregiver alert escalation, and comprehensive patient digital twins.
          </p>

          {/* SENSE -> UNDERSTAND -> PREDICT -> ALERT -> RESPOND Flow */}
          <div className="mt-10 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-semibold">
            {[
              { step: 'SENSE', desc: 'IoT Sensor Stream', icon: Activity },
              { step: 'UNDERSTAND', desc: 'Digital Twin Baselines', icon: Stethoscope },
              { step: 'PREDICT', desc: 'ML Anomaly Engine', icon: Cpu },
              { step: 'ALERT', desc: 'Triaged Alarms', icon: BellRing },
              { step: 'RESPOND', desc: 'Caregiver Actions', icon: HeartHandshake },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="w-7 h-7 mx-auto rounded-lg bg-hospital-teal/20 text-hospital-teal flex items-center justify-center mb-1.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-hospital-teal tracking-wide">{s.step}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Hero CTAs */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/live"
              className="bg-hospital-teal hover:bg-teal-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-teal-900/30 text-sm flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Launch Live Telemetry Wall</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={onOpenSimulator}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-6 py-3 rounded-xl text-sm flex items-center space-x-2 transition-all"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Configure IoT Simulator</span>
            </button>
          </div>
        </div>
      </section>

      {/* Demo Accounts Quick-Login Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="text-center mb-6">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              1-Click Demo Accounts (Local & Hackathon Testing)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select any role below to instantly authenticate and experience role-based healthcare workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEMO_CREDENTIALS.map((cred) => (
              <div
                key={cred.role}
                className="border border-slate-200 rounded-xl p-4 hover:border-hospital-teal hover:shadow-md transition-all flex flex-col justify-between bg-slate-50/50"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-hospital-teal">
                      {cred.role}
                    </span>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">{cred.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{cred.label}</p>
                  <p className="text-[11px] font-mono text-slate-600 mt-2 bg-slate-100 p-1 rounded">
                    {cred.email}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={loggingInRole !== null}
                  onClick={() => handleQuickLogin(cred.role)}
                  className="mt-4 w-full bg-white hover:bg-hospital-teal hover:text-white border border-slate-300 hover:border-hospital-teal text-slate-700 font-semibold py-2 px-3 rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  {loggingInRole === cred.role ? (
                    <span>Entering {cred.role}...</span>
                  ) : (
                    <>
                      <span>Sign in as {cred.role}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900">End-to-End Clinical Ward Capabilities</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl mx-auto">
            Engineered with strict separation of safety-critical rule execution and unsupervised anomaly detection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-hospital-teal flex items-center justify-center mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">IoT Vital Simulator</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Streams continuous multi-parameter telemetry every 2–5s across 7 clinical scenarios: falling oxygen, high fever, supraventricular tachycardia, respiratory distress, and sensor detachment.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">3-Layer AI/ML Risk Engine</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Combines deterministic clinical safety limits with Scikit-learn Isolation Forest unsupervised anomaly detection. Critical safety alarms can never be overridden by low ML risk scores.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Alert & Caregiver Loop</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Synthesized audio alarm chimes (IEC 60601-1-8 standard), structured caregiver acknowledgment, observation logging, physician escalation, and full immutable audit logging.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>MediGuard AI &bull; Operation Ward Zero Healthcare Prototype &bull; Designed for Clinical Simulation</p>
      </footer>
    </div>
  );
}

