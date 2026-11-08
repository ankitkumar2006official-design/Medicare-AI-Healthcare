import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlertSound } from '../context/AlertSoundContext';
import { useWebSocket } from '../context/WebSocketContext';
import { Activity, Bell, Volume2, VolumeX, LogOut, Sliders, User, ShieldAlert } from 'lucide-react';

export default function Navbar({ onOpenSimulator }) {
  const { user, logout } = useAuth();
  const { isMuted, toggleMute } = useAlertSound();
  const { isConnected, activeAlerts } = useWebSocket();
  const navigate = useNavigate();

  const unackCount = activeAlerts.filter((a) => a.status === 'triggered').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-hospital-navy flex items-center justify-center text-hospital-teal shadow-sm">
                <Activity className="w-5 h-5 text-hospital-teal" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-base text-slate-900 tracking-tight">MediGuard</span>
                  <span className="text-hospital-teal font-extrabold text-base">AI</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 -mt-0.5">
                  Operation Ward Zero
                </div>
              </div>
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3">
            {/* Audio Mute Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Telemetry alarms muted (Click to unmute)' : 'Telemetry audio active (Click to mute)'}
              className={`p-2 rounded-lg border text-xs flex items-center space-x-1.5 transition-colors ${
                isMuted
                  ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  : 'bg-teal-50 text-hospital-teal border-teal-200 hover:bg-teal-100'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-hospital-teal" />}
              <span className="hidden sm:inline font-medium">{isMuted ? 'Muted' : 'Sound ON'}</span>
            </button>

            {/* IoT Simulator Trigger */}
            <button
              onClick={onOpenSimulator}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs flex items-center space-x-1.5 transition-colors"
              title="Open IoT Telemetry Simulator"
            >
              <Sliders className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline font-medium">IoT Simulator</span>
            </button>

            {/* Alerts Bell */}
            <Link
              to="/alerts"
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Active Telemetry Alerts"
            >
              <Bell className="w-5 h-5" />
              {unackCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[9px] font-bold text-white items-center justify-center">
                    {unackCount}
                  </span>
                </span>
              )}
            </Link>

            {/* User Profile Pill & Role Badge */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">{user.full_name || user.email}</div>
                  <div className="text-[10px] font-medium uppercase text-hospital-teal tracking-wide">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-medium bg-hospital-teal hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

