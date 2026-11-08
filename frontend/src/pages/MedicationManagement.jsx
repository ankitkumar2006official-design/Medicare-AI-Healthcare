import React, { useState, useEffect } from 'react';
import { patientAPI, medicationAPI } from '../api/client';
import { Pill, Plus, Check, Clock, Calendar, User, Search, AlertCircle, X } from 'lucide-react';

export default function MedicationManagement() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('PT-1001');
  const [medications, setMedications] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '10 mg',
    frequency: 'Once daily',
    scheduled_times: ['08:00'],
    route: 'Oral',
    instructions: 'Take with full glass of water',
    prescribed_by: 'Dr. Sarah Chen, MD',
  });
  const [loading, setLoading] = useState(true);

  const loadPatients = async () => {
    try {
      const res = await patientAPI.getPatients();
      setPatients(res.data);
    } catch (err) {
      console.warn('Medication load patients error:', err);
    }
  };

  const loadMeds = async (pid) => {
    setLoading(true);
    try {
      const res = await medicationAPI.getMedications(pid);
      setMedications(res.data);
    } catch (err) {
      console.warn('Medication load error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadMeds(selectedPatientId);
    }
  }, [selectedPatientId]);

  const handleAdminister = async (id) => {
    try {
      await medicationAPI.administer(id);
      loadMeds(selectedPatientId);
    } catch {
      alert('Failed to log administration.');
    }
  };

  const handleCreateMed = async (e) => {
    e.preventDefault();
    try {
      await medicationAPI.createMedication({
        ...newMed,
        patient_id: selectedPatientId,
      });
      setShowAddModal(false);
      loadMeds(selectedPatientId);
    } catch {
      alert('Failed to schedule medication.');
    }
  };

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hospital-teal animate-pulse"></span>
            <span className="text-xs font-bold text-hospital-teal uppercase tracking-wider">Clinical Pharmacology</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Medication & Reminder Management</h1>
          <p className="text-xs text-slate-500">Scheduled Dosages, Bedside Intake Verification & Audit Logs</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-hospital-teal hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Prescription Schedule</span>
        </button>
      </div>

      {/* Patient Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600">Select Patient:</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800"
          >
            {patients.map((p) => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.patient_id} – {p.full_name} ({p.room_number})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Primary condition:{' '}
          <strong className="text-slate-800">{selectedPatient?.medical_history?.[0] || 'Under Observation'}</strong>
        </div>
      </div>

      {/* Medications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medications.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            No active medication regimens recorded for {selectedPatient?.full_name || selectedPatientId}.
          </div>
        ) : (
          medications.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-hospital-teal flex items-center justify-center">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{m.name}</h3>
                      <p className="text-xs text-slate-500">{m.dosage} &bull; {m.route}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                    {m.frequency}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div><strong>Scheduled Times:</strong> {m.scheduled_times?.join(', ')}</div>
                  <div className="mt-1"><strong>Instructions:</strong> {m.instructions}</div>
                  <div className="mt-1 text-[11px] text-slate-400">Prescribed by: {m.prescribed_by}</div>
                </div>
              </div>

              {/* Status and Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  {m.last_administered_at ? (
                    <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Administered at {new Date(m.last_administered_at).toLocaleTimeString()}</span>
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pending Scheduled Dose</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAdminister(m.id)}
                  className="bg-hospital-navy hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-colors"
                >
                  Confirm Intake
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add Medication Regimen</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMed} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold">Medication Name</label>
                <input
                  type="text"
                  required
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  placeholder="e.g. Lisinopril, Metformin"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold">Dosage</label>
                  <input
                    type="text"
                    required
                    value={newMed.dosage}
                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold">Frequency</label>
                  <input
                    type="text"
                    required
                    value={newMed.frequency}
                    onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold">Administration Route</label>
                <select
                  value={newMed.route}
                  onChange={(e) => setNewMed({ ...newMed, route: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                >
                  <option value="Oral">Oral</option>
                  <option value="Intravenous (IV)">Intravenous (IV)</option>
                  <option value="Inhalation">Inhalation</option>
                  <option value="Subcutaneous">Subcutaneous</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold">Instructions</label>
                <input
                  type="text"
                  value={newMed.instructions}
                  onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                />
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-hospital-teal hover:bg-teal-700 text-white font-semibold py-2 rounded-lg text-xs"
                >
                  Save Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
