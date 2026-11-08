import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { Activity, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('doctor@mediguard.ai');
  const [password, setPassword] = useState('DoctorPass123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/dashboard/admin');
      else if (user.role === 'doctor') navigate('/dashboard/doctor');
      else if (user.role === 'caregiver') navigate('/dashboard/caregiver');
      else navigate('/dashboard/patient');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    }
    setLoading(false);
  };

  const handleSelectDemo = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-hospital-navy text-hospital-teal mx-auto flex items-center justify-center shadow-sm">
            <Activity className="w-6 h-6 text-hospital-teal" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">Sign in to MediGuard AI</h2>
          <p className="mt-1 text-xs text-slate-500">Operation Ward Zero Hospital Portal</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-hospital-teal focus:bg-white"
                placeholder="name@mediguard.ai"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-hospital-teal focus:bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-hospital-navy hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm shadow-md transition-colors flex items-center justify-center space-x-1.5"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Access Telemetry Portal</span>
                <ArrowRight className="w-4 h-4 text-hospital-teal" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Fill Buttons */}
        <div className="pt-4 border-t border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-2.5">
            1-Click Demo Credentials
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                type="button"
                key={cred.role}
                onClick={() => handleSelectDemo(cred)}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  email === cred.email
                    ? 'border-hospital-teal bg-teal-50 text-hospital-teal font-semibold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="font-bold text-[11px] uppercase tracking-wider">{cred.label.split(' ')[0]}</div>
                <div className="text-[10px] text-slate-500 truncate">{cred.email}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Need an account?{' '}
          <Link to="/register" className="font-semibold text-hospital-teal hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
