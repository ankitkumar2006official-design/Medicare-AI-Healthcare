import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-hospital-teal border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium text-slate-500">Authenticating MediGuard Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If patient, redirect to patient dashboard, else to live
    if (user.role === 'patient') return <Navigate to="/dashboard/patient" replace />;
    if (user.role === 'caregiver') return <Navigate to="/dashboard/caregiver" replace />;
    if (user.role === 'doctor') return <Navigate to="/dashboard/doctor" replace />;
    if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
    return <Navigate to="/live" replace />;
  }

  return children;
}

