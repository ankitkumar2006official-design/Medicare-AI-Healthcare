import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertSoundProvider } from './context/AlertSoundContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { patientAPI } from './api/client';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-bold text-slate-100">Telemetry Interface Recovering</h2>
            <p className="text-xs text-slate-400">
              An unexpected interface state was detected. Click below to refresh the clinical workspace.
            </p>
            <div className="text-left bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-300 overflow-x-auto">
              {this.state.error?.message || 'Runtime exception caught'}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('mediguard_token');
                localStorage.removeItem('mediguard_user');
                window.location.href = '/';
              }}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg"
            >
              Reset Session & Return to Safety Station
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DemoBanner from './components/DemoBanner';
import SimulatorDrawer from './components/SimulatorDrawer';
import ProtectedRoute from './components/ProtectedRoute';

// 17 Required Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import CaregiverDashboard from './pages/CaregiverDashboard';
import PatientDashboard from './pages/PatientDashboard';
import PatientDirectory from './pages/PatientDirectory';
import PatientDetails from './pages/PatientDetails';
import LiveMonitoring from './pages/LiveMonitoring';
import AIRiskAnalysis from './pages/AIRiskAnalysis';
import AlertManagement from './pages/AlertManagement';
import CaregiverHistory from './pages/CaregiverHistory';
import MedicationManagement from './pages/MedicationManagement';
import DeviceManagement from './pages/DeviceManagement';
import ReportsAnalytics from './pages/ReportsAnalytics';
import UserSettings from './pages/UserSettings';
import CaregiverAttendance from './pages/CaregiverAttendance';
import CaregiverPerformance from './pages/CaregiverPerformance';
import SystemReliability from './pages/SystemReliability';
import PredictiveAnalytics from './pages/PredictiveAnalytics';

function AppLayout({ children, onOpenSimulator }) {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isLanding || isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <DemoBanner onOpenSimulator={onOpenSimulator} />
        {!isLanding && <Navbar onOpenSimulator={onOpenSimulator} />}
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-hospital-grayBg">
      <DemoBanner onOpenSimulator={onOpenSimulator} />
      <Navbar onOpenSimulator={onOpenSimulator} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function MainRoutes({ onOpenSimulator }) {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage onOpenSimulator={onOpenSimulator} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Role Dashboards */}
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard onOpenSimulator={onOpenSimulator} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/doctor"
        element={
          <ProtectedRoute allowedRoles={['doctor', 'admin']}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/caregiver"
        element={
          <ProtectedRoute allowedRoles={['caregiver', 'doctor', 'admin']}>
            <CaregiverDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/patient"
        element={
          <ProtectedRoute allowedRoles={['patient', 'caregiver', 'doctor', 'admin']}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      {/* Clinical Ward Monitoring & Management */}
      <Route
        path="/live"
        element={
          <ProtectedRoute>
            <LiveMonitoring onOpenSimulator={onOpenSimulator} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <PatientDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <ProtectedRoute>
            <PatientDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-risk"
        element={
          <ProtectedRoute>
            <AIRiskAnalysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AlertManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/caregiver-history"
        element={
          <ProtectedRoute>
            <CaregiverHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medications"
        element={
          <ProtectedRoute>
            <MedicationManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/devices"
        element={
          <ProtectedRoute>
            <DeviceManagement onOpenSimulator={onOpenSimulator} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <UserSettings />
          </ProtectedRoute>
        }
      />

      {/* Operation Ward Zero Advanced Capabilities */}
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <CaregiverAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/caregiver-performance"
        element={
          <ProtectedRoute>
            <CaregiverPerformance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reliability"
        element={
          <ProtectedRoute>
            <SystemReliability />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forecasts"
        element={
          <ProtectedRoute>
            <PredictiveAnalytics />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await patientAPI.getPatients();
        setPatientsList(res.data);
      } catch {
        // Fallback
      }
    };
    fetchPatients();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AlertSoundProvider>
            <WebSocketProvider>
              <AppLayout onOpenSimulator={() => setIsSimulatorOpen(true)}>
                <MainRoutes onOpenSimulator={() => setIsSimulatorOpen(true)} />
              </AppLayout>

              <SimulatorDrawer
                isOpen={isSimulatorOpen}
                onClose={() => setIsSimulatorOpen(false)}
                patients={patientsList}
              />
            </WebSocketProvider>
          </AlertSoundProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

