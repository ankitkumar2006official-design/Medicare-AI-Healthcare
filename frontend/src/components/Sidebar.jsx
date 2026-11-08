import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Stethoscope,
  HeartHandshake,
  UserCheck,
  Users,
  Activity,
  Cpu,
  AlertOctagon,
  FileText,
  Pill,
  Radio,
  BarChart3,
  Settings,
  ShieldAlert,
  Compass,
  Zap,
  HardDrive,
  TrendingUp
} from 'lucide-react';

export default function Sidebar() {
  const { user, isAdmin, isDoctor, isCaregiver, isPatient } = useAuth();

  const navItems = [
    // Role Hubs
    { to: '/dashboard/admin', label: 'Admin Dashboard', icon: LayoutDashboard, role: 'admin' },
    { to: '/dashboard/doctor', label: 'Doctor Dashboard', icon: Stethoscope, role: 'doctor' },
    { to: '/dashboard/caregiver', label: 'Caregiver Dashboard', icon: HeartHandshake, role: 'caregiver' },
    { to: '/dashboard/patient', label: 'Patient Dashboard', icon: UserCheck, role: 'patient' },

    // Clinical Ward Monitoring
    { to: '/live', label: 'Live Ward Telemetry', icon: Activity },
    { to: '/patients', label: 'Patient Directory', icon: Users },
    { to: '/ai-risk', label: 'AI Risk Engine', icon: Cpu },
    { to: '/alerts', label: 'Alert Management', icon: AlertOctagon },
    { to: '/forecasts', label: 'Predictive Forecasting', icon: TrendingUp },
    { to: '/attendance', label: 'Caregiver Attendance', icon: Compass },
    { to: '/caregiver-performance', label: 'Caregiver Performance', icon: Zap },
    { to: '/reliability', label: 'System Reliability', icon: HardDrive },
    { to: '/caregiver-history', label: 'Caregiver Response Log', icon: FileText },
    { to: '/medications', label: 'Medications & Reminders', icon: Pill },
    { to: '/devices', label: 'Telemetry Devices', icon: Radio },
    { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/settings', label: 'User & System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 space-y-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2">
          Role Dashboards
        </div>
        {navItems.slice(0, 4).map((item) => {
          // Check role visibility
          const isCurrentRole = user?.role === item.role;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-hospital-navy text-white shadow-sm'
                    : isCurrentRole
                    ? 'text-hospital-teal bg-teal-50/60 hover:bg-teal-100/50'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {isCurrentRole && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-hospital-teal"></span>
              )}
            </NavLink>
          );
        })}

        <div className="pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2">
          Ward Operations
        </div>
        {navItems.slice(4).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-hospital-teal text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Ward Telemetry Protocol Badge */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="text-[11px] font-semibold text-slate-700">MediGuard Guard-Link™</div>
        <div className="text-[10px] text-slate-500 mt-0.5">TLS 1.3 / WebSocket Telemetry</div>
        <div className="text-[10px] text-emerald-600 font-medium flex items-center space-x-1 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Zero-Drop Failover Active</span>
        </div>
      </div>
    </aside>
  );
}

