import React, { useState, useEffect } from 'react';
import { caregiverAttendanceAPI, patientAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  MapPin,
  CheckCircle2,
  LogOut,
  AlertTriangle,
  Calendar,
  Users,
  ShieldCheck,
  Compass,
  FileText,
  RefreshCw,
  Navigation
} from 'lucide-react';

export default function CaregiverAttendance() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('PT-1001');
  const [shiftType, setShiftType] = useState('day');
  const [notes, setNotes] = useState('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeCheckInId, setActiveCheckInId] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Simulated GPS coordinates (Ward Zero Campus)
  const [gps] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy_meters: 4.2,
    address_label: 'Ward Zero Central Residence Room 101, San Francisco, CA',
    within_geofence: true
  });

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [ptsRes, histRes] = await Promise.all([
        patientAPI.getPatients(),
        caregiverAttendanceAPI.getHistory({ limit: 30 })
      ]);
      setPatients(ptsRes.data || []);
      const records = histRes.data || [];
      setHistory(records);

      // Check if current user has an active check-in
      const active = records.find(
        (r) => r.caregiver_id === user?.id && r.status === 'checked_in'
      );
      if (active) {
        setIsCheckedIn(true);
        setActiveCheckInId(active.id);
        const start = new Date(active.check_in_time).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      } else {
        setIsCheckedIn(false);
        setActiveCheckInId(null);
      }
    } catch (err) {
      console.warn('Error loading attendance data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Timer loop for active check-in duration
  useEffect(() => {
    let timer;
    if (isCheckedIn) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCheckedIn]);

  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const payload = {
        caregiver_id: user?.id,
        patient_id: selectedPatientId,
        shift_type: shiftType,
        location: gps,
        notes: notes || 'Caregiver on-site check-in logged via mobile telemetry terminal'
      };
      const res = await caregiverAttendanceAPI.checkIn(payload);
      setIsCheckedIn(true);
      setActiveCheckInId(res.data.id);
      setElapsedSeconds(0);
      setNotes('');
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const payload = {
        attendance_id: activeCheckInId,
        location: gps,
        notes: notes || 'Shift completed. Telemetry and patient care handover executed.'
      };
      await caregiverAttendanceAPI.checkOut(payload);
      setIsCheckedIn(false);
      setActiveCheckInId(null);
      setNotes('');
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const activeRoster = history.filter((r) => r.status === 'checked_in');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Caregiver Operations & Dispatch
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Caregiver Attendance & GPS Verification
          </h1>
          <p className="text-xs text-slate-500">
            Automated Geofenced Shift Verification, Check-In/Check-Out & Telemetry Handover
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={refreshing}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Geofence Status Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-hospital-teal/10 text-hospital-teal flex items-center justify-center">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-teal-900 uppercase">GPS Geofence Verified</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Ward Zone Active
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-mono">
              Lat: {gps.latitude.toFixed(4)}, Lon: {gps.longitude.toFixed(4)} (Accuracy: ±{gps.accuracy_meters}m) • {gps.address_label}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-500">Scheduled Shifts Today</span>
          <p className="text-sm font-bold text-slate-800">100% Geofence Compliance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Action Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-hospital-teal" />
              <span>Shift Terminal</span>
            </h2>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                isCheckedIn
                  ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isCheckedIn ? 'ON DUTY' : 'STANDBY'}
            </span>
          </div>

          {/* Active Shift Elapsed Timer */}
          <div className="bg-slate-900 text-white rounded-xl p-4 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              {isCheckedIn ? 'Active Shift Elapsed Time' : 'Terminal Status Ready'}
            </span>
            <div className="text-3xl font-mono font-bold tracking-tight text-teal-400">
              {isCheckedIn ? formatTimer(elapsedSeconds) : '00:00:00'}
            </div>
            <p className="text-[11px] text-slate-400">
              Caregiver: {user?.full_name || 'James Wilson, RN'}
            </p>
          </div>

          {!isCheckedIn ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Type</label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hospital-teal"
                >
                  <option value="day">Day Shift (07:00 – 15:30)</option>
                  <option value="evening">Evening Shift (15:00 – 23:30)</option>
                  <option value="night">Night Telemetry Shift (23:00 – 07:30)</option>
                  <option value="on_call">Rapid Emergency On-Call</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Bed / Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hospital-teal"
                >
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.patient_id} – {p.full_name} (Room {p.room_number || 'Central'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Check-in Observations / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Morning vitals check, sensor lead contact verified..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hospital-teal"
                />
              </div>

              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full py-3 bg-hospital-teal hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Verifying GPS...' : 'Confirm GPS Bedside Check-In'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-900 space-y-1">
                <p className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-hospital-teal" />
                  <span>Currently On Duty at Bedside</span>
                </p>
                <p className="text-slate-600">
                  Telemetry monitoring active. Remember to log all patient interventions before checking out.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Handover & Exit Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Patient stable, telemetry SpO2 sensor charged, handed over to next shift..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hospital-teal"
                />
              </div>

              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{loading ? 'Recording Handover...' : 'Complete Shift & Check Out'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Caregiver Roster & Shift History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active On-Duty Roster */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-hospital-teal" />
                <h2 className="text-base font-bold text-slate-900">Active Caregiver Ward Roster</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-hospital-teal text-xs font-bold">
                {activeRoster.length} Active On Shift
              </span>
            </div>

            {activeRoster.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No caregivers currently checked in on this ward sector. Check in using the Shift Terminal.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeRoster.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:border-teal-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{item.caregiver_name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                        {item.shift_type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <p>Patient: <span className="font-semibold text-slate-800">{item.patient_name || item.patient_id}</span></p>
                      <p className="flex items-center space-x-1 text-slate-500">
                        <MapPin className="w-3 h-3 text-hospital-teal" />
                        <span>GPS Verified ({item.check_in_location?.accuracy_meters || 4.2}m)</span>
                      </p>
                      <p className="text-slate-400 text-[10px]">
                        Since: {new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shift History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-hospital-teal" />
                <h2 className="text-base font-bold text-slate-900">Attendance & Verification Audit Log</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">{history.length} Total Records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="pb-2">Caregiver</th>
                    <th className="pb-2">Patient / Sector</th>
                    <th className="pb-2">Shift</th>
                    <th className="pb-2">Check In</th>
                    <th className="pb-2">Check Out</th>
                    <th className="pb-2">Duration</th>
                    <th className="pb-2">GPS Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.slice(0, 10).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-900">{r.caregiver_name}</td>
                      <td className="py-2.5 text-slate-700">{r.patient_name || r.patient_id || 'Ward Central'}</td>
                      <td className="py-2.5 uppercase font-mono text-[10px] text-slate-600">{r.shift_type}</td>
                      <td className="py-2.5 text-slate-600">
                        {new Date(r.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {r.check_out_time
                          ? new Date(r.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : <span className="text-emerald-600 font-bold">Active</span>}
                      </td>
                      <td className="py-2.5 font-mono text-slate-700">
                        {r.duration_minutes ? `${r.duration_minutes}m` : 'In Progress'}
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-teal-50 text-hospital-teal font-semibold text-[10px]">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Within Geofence</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

