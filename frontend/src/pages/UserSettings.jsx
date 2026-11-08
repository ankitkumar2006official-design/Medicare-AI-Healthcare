import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import { Settings, User, Lock, Bell, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UserSettings() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(user.email, newPassword);
      setMessage({ type: 'success', text: 'Password has been successfully updated.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage({ type: 'error', text: 'Failed to update password.' });
    }
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-hospital-teal animate-pulse"></span>
          <span className="text-xs font-bold text-hospital-teal uppercase tracking-wider">User Account</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">User Settings & Preferences</h1>
        <p className="text-xs text-slate-500">Security Credentials, Role Authorization & Environment Configuration</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center space-x-2 ${
          message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <User className="w-4 h-4 text-hospital-teal" />
          <span>Profile Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-500 font-medium">Full Name</label>
            <div className="font-semibold text-slate-900 mt-0.5 text-sm">{user?.full_name || '--'}</div>
          </div>
          <div>
            <label className="text-slate-500 font-medium">Email Address</label>
            <div className="font-mono text-slate-900 mt-0.5 text-sm">{user?.email || '--'}</div>
          </div>
          <div>
            <label className="text-slate-500 font-medium">System Role</label>
            <div className="mt-0.5">
              <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-hospital-teal border border-teal-200">
                {user?.role || 'Guest'}
              </span>
            </div>
          </div>
          <div>
            <label className="text-slate-500 font-medium">Account Status</label>
            <div className="font-semibold text-emerald-600 mt-0.5 text-xs flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Active / Verified Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-hospital-teal" />
          <span>Security & Password Workflow</span>
        </h2>

        <form onSubmit={handlePasswordReset} className="max-w-md space-y-3 text-xs">
          <div>
            <label className="text-slate-600 font-medium">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-hospital-teal"
            />
          </div>

          <div>
            <label className="text-slate-600 font-medium">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-hospital-teal"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-hospital-navy hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Deployment & Environment Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-hospital-teal" />
          <span>Deployment Environment</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Frontend Host</span>
            <div className="font-semibold text-slate-800 mt-0.5">Vercel Production Target</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Backend Host</span>
            <div className="font-semibold text-slate-800 mt-0.5">Render FastAPI Service</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Database Target</span>
            <div className="font-semibold text-slate-800 mt-0.5">MongoDB Atlas (with Resilient Store)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
