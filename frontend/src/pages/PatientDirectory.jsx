import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientAPI } from '../api/client';
import AlertBadge from '../components/AlertBadge';
import {
  Users,
  Search,
  UserPlus,
  ChevronRight,
  Filter,
  Activity,
  Heart,
  Stethoscope,
  X
} from 'lucide-react';

export default function PatientDirectory() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    patient_id: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
    full_name: '',
    age: 65,
    gender: 'Male',
    room_number: 'Ward A - Room 105',
    medical_history: ['Hypertension'],
    existing_conditions: ['Hypertension'],
    allergies: ['None'],
    emergency_contact: { name: 'Family', phone: '555-0100', relation: 'Spouse' },
    active_scenario: 'healthy',
  });

  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await patientAPI.getPatients({ search });
      setPatients(res.data);
    } catch (err) {
      console.warn('Patient directory fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, [search]);

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      await patientAPI.createPatient(newPatient);
      setShowModal(false);
      loadPatients();
    } catch (err) {
      alert('Failed to register patient: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hospital-teal animate-pulse"></span>
            <span className="text-xs font-bold text-hospital-teal uppercase tracking-wider">Ward Census</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Patient Directory</h1>
          <p className="text-xs text-slate-500">Master Roster, Clinical Digital Twins & Telemetry Configuration</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-hospital-teal hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, patient ID, or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-hospital-teal"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
          Showing {patients.length} Registered Patients
        </span>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Patient Profile</th>
                <th className="px-4 py-3">Room / Bed</th>
                <th className="px-4 py-3">Primary Diagnosis</th>
                <th className="px-4 py-3">Known Allergies</th>
                <th className="px-4 py-3">Telemetry Scenario</th>
                <th className="px-4 py-3">Current Risk</th>
                <th className="px-4 py-3 text-right">Digital Twin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((p) => (
                <tr key={p.patient_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{p.full_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {p.patient_id} &bull; {p.age} yrs &bull; {p.gender}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.room_number}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                    {p.medical_history?.join(', ') || 'None recorded'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.allergies?.join(', ') || 'No known allergies'}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {p.active_scenario || 'healthy'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <AlertBadge category={p.latest_risk?.risk_category || 'stable'} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/patients/${p.patient_id}`}
                      className="inline-flex items-center space-x-1 text-hospital-teal hover:text-teal-700 font-semibold"
                    >
                      <span>Open Twin</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Register New Ward Patient</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold">Patient ID</label>
                  <input
                    type="text"
                    required
                    value={newPatient.patient_id}
                    onChange={(e) => setNewPatient({ ...newPatient, patient_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newPatient.full_name}
                    onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                    placeholder="e.g. Johnathan Miller"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold">Age</label>
                  <input
                    type="number"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold">Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold">Room</label>
                  <input
                    type="text"
                    value={newPatient.room_number}
                    onChange={(e) => setNewPatient({ ...newPatient, room_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold">Primary Medical Conditions (comma separated)</label>
                <input
                  type="text"
                  value={newPatient.medical_history.join(', ')}
                  onChange={(e) => setNewPatient({ ...newPatient, medical_history: e.target.value.split(',').map((s) => s.trim()) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                  placeholder="e.g. Atrial Fibrillation, COPD"
                />
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-hospital-teal hover:bg-teal-700 text-white font-semibold py-2 rounded-lg text-xs"
                >
                  Confirm Registration
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

