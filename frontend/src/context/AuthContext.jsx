import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = [
  { role: 'admin', label: 'Administrator', email: 'admin@mediguard.ai', password: 'AdminPass123!', title: 'Dr. Arthur Pendelton' },
  { role: 'doctor', label: 'Doctor / Clinician', email: 'doctor@mediguard.ai', password: 'DoctorPass123!', title: 'Dr. Sarah Chen, MD' },
  { role: 'caregiver', label: 'Nurse / Caregiver', email: 'caregiver@mediguard.ai', password: 'CaregiverPass123!', title: 'James Wilson, RN' },
  { role: 'patient', label: 'Patient', email: 'patient@mediguard.ai', password: 'PatientPass123!', title: 'Eleanor Vance (PT-1001)' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mediguard_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('mediguard_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem('mediguard_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('mediguard_token', access_token);
    localStorage.setItem('mediguard_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const switchDemoRole = async (roleKey) => {
    const cred = DEMO_CREDENTIALS.find((c) => c.role === roleKey);
    if (cred) {
      return await login(cred.email, cred.password);
    }
  };

  const logout = () => {
    localStorage.removeItem('mediguard_token');
    localStorage.removeItem('mediguard_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';
  const isCaregiver = user?.role === 'caregiver' || isDoctor;
  const isPatient = user?.role === 'patient';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchDemoRole,
        isAdmin,
        isDoctor,
        isCaregiver,
        isPatient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

