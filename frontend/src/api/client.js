import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mediguard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto logout if on login or landing
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/') {
        localStorage.removeItem('mediguard_token');
        localStorage.removeItem('mediguard_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (data) => api.post('/api/auth/register', data),
  getMe: () => api.get('/api/auth/me'),
  resetPassword: (email, new_password) => api.post('/api/auth/reset-password', { email, new_password }),
  listUsers: () => api.get('/api/auth/users'),
  updateUser: (userId, data) => api.put(`/api/auth/users/${userId}`, data),
};

export const patientAPI = {
  getPatients: (params) => api.get('/api/patients', { params }),
  getPatient: (id) => api.get(`/api/patients/${id}`),
  createPatient: (data) => api.post('/api/patients', data),
  updatePatient: (id, data) => api.put(`/api/patients/${id}`, data),
  deletePatient: (id) => api.delete(`/api/patients/${id}`),
  getDigitalTwin: (id) => api.get(`/api/patients/${id}/twin`),
  getNotes: (id) => api.get(`/api/patients/${id}/notes`),
  addNote: (id, data) => api.post(`/api/patients/${id}/notes`, data),
  getStabilityIndex: (id) => api.get(`/api/patients/${id}/stability-index`),
  assignCaregiver: (id, data) => api.post(`/api/patients/${id}/assign-caregiver`, data),
};

export const vitalsAPI = {
  getHistory: (patientId, limit = 50) => api.get(`/api/vitals/${patientId}`, { params: { limit } }),
  getLatest: (patientId) => api.get(`/api/vitals/${patientId}/latest`),
  ingest: (data) => api.post('/api/vitals', data),
};

export const riskAPI = {
  analyze: (patientId, vitals) => api.post('/api/risk/analyze', { patient_id: patientId, vitals }),
  getLatest: (patientId) => api.get(`/api/risk/${patientId}`),
  getHistory: (patientId, limit = 30) => api.get(`/api/risk/${patientId}/history`, { params: { limit } }),
  explain: (patientId, userQuery, alertId) => api.post(`/api/risk/${patientId}/explain`, { user_query: userQuery, alert_id: alertId }),
  getEvaluationMetrics: () => api.get('/api/risk/models/evaluation-metrics'),
};

export const alertAPI = {
  getAlerts: (params) => api.get('/api/alerts', { params }),
  getAlert: (id) => api.get(`/api/alerts/${id}`),
  acknowledge: (id, note) => api.post(`/api/alerts/${id}/acknowledge`, { note }),
  escalate: (id, urgentReason, doctorId) => api.post(`/api/alerts/${id}/escalate`, { urgent_reason: urgentReason, doctor_id: doctorId }),
  resolve: (id, resolutionNote) => api.post(`/api/alerts/${id}/resolve`, { resolution_note: resolutionNote }),
  checkEscalations: () => api.post('/api/alerts/check-escalations'),
  getAuditTrail: (id) => api.get(`/api/alerts/${id}/audit-trail`),
};

export const caregiverAttendanceAPI = {
  checkIn: (data) => api.post('/api/caregivers/attendance/check-in', data),
  checkOut: (data) => api.post('/api/caregivers/attendance/check-out', data),
  getHistory: (params) => api.get('/api/caregivers/attendance/history', { params }),
  logActivity: (data) => api.post('/api/caregivers/activity', data),
  getActivities: (params) => api.get('/api/caregivers/activity', { params }),
  getPerformance: (caregiverId) => api.get('/api/caregivers/analytics/performance', { params: { caregiver_id: caregiverId } }),
  getActiveRoster: () => api.get('/api/caregivers/roster'),
};

export const reliabilityAPI = {
  syncBuffer: (data) => api.post('/api/reliability/sync-buffer', data),
  getStaleSensors: (maxSilentSeconds) => api.get('/api/reliability/stale-sensors', { params: { max_silent_seconds: maxSilentSeconds } }),
  getHealthSnapshot: () => api.get('/api/reliability/health-snapshot'),
  getSyncLogs: (limit = 30) => api.get('/api/reliability/sync-logs', { params: { limit } }),
};

export const forecastAPI = {
  getForecast: (patientId) => api.get(`/api/forecasts/${patientId}`),
};

export const contextualAPI = {
  getContext: (patientId) => api.get(`/api/risk/${patientId}/contextual-intelligence`),
};

export const caregiverAPI = {
  logResponse: (data) => api.post('/api/responses', data),
  getResponses: (patientId) => api.get(`/api/responses/${patientId}`),
  getAllResponses: (limit = 50) => api.get('/api/responses', { params: { limit } }),
};

export const deviceAPI = {
  getDevices: () => api.get('/api/devices'),
  registerDevice: (data) => api.post('/api/devices', data),
  updateStatus: (deviceId, status, battery) => api.put(`/api/devices/${deviceId}/status`, { status, battery_level: battery }),
};

export const simulatorAPI = {
  getStatus: () => api.get('/api/simulator/status'),
  start: () => api.post('/api/simulator/start'),
  pause: () => api.post('/api/simulator/pause'),
  reset: () => api.post('/api/simulator/reset'),
  setScenario: (patientId, scenarioId) => api.post('/api/simulator/scenario', { patient_id: patientId, scenario_id: scenarioId }),
  setOverride: (patientId, vitals) => api.post('/api/simulator/override', { patient_id: patientId, vitals }),
  clearOverride: (patientId) => api.post('/api/simulator/override/clear', null, { params: { patient_id: patientId } }),
  setInterval: (seconds) => api.post('/api/simulator/interval', { interval_seconds: seconds }),
  simulateOffline: (patientId, offline = true) => api.post('/api/simulator/buffer/simulate-offline', { patient_id: patientId, offline }),
  getBufferStatus: () => api.get('/api/simulator/buffer/status'),
  reconnectAndSync: (patientId) => api.post(`/api/simulator/buffer/reconnect-and-sync?patient_id=${patientId}`),
};

export const medicationAPI = {
  getMedications: (patientId) => api.get(`/api/medications/${patientId}`),
  createMedication: (data) => api.post('/api/medications', data),
  administer: (medId) => api.put(`/api/medications/${medId}/administer`),
};

export const analyticsAPI = {
  getOverview: () => api.get('/api/analytics/overview'),
  getPatientAnalytics: (patientId) => api.get(`/api/analytics/patient/${patientId}`),
};

export default api;

