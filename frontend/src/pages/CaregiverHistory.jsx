import React, { useState, useEffect } from 'react';
import { caregiverAPI, patientAPI } from '../api/client';
import { ClipboardList, User, Clock, CheckCircle2, AlertTriangle, PhoneCall, Filter, Search } from 'lucide-react';

export default function CaregiverHistory() {
  const [responses, setResponses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        caregiverAPI.getAllResponses(100),
        patientAPI.getPatients(),
      ]);
      setResponses(rRes.data);
      setPatients(pRes.data);
    } catch (err) {
      console.warn('Caregiver history error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredResponses = responses.filter((r) => {
    if (selectedPatient !== 'ALL' && r.patient_id !== selectedPatient) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-hospital-teal animate-pulse"></span>
          <span className="text-xs font-bold text-hospital-teal uppercase tracking-wider">Clinical Audit Log</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Caregiver Response History</h1>
        <p className="text-xs text-slate-500">Immutable Record of Bedside Observations, Patient Contacts & Escalations</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Filter by Patient:</span>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800"
          >
            <option value="ALL">All Patients</option>
            {patients.map((p) => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.patient_id} – {p.full_name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-mono text-slate-400">
          {filteredResponses.length} Logged Entries
        </span>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Caregiver</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Bedside Observation</th>
                <th className="px-4 py-3">Patient Contacted</th>
                <th className="px-4 py-3">Escalated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResponses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No caregiver actions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredResponses.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {r.caregiver_name}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">
                      {r.patient_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-hospital-teal font-semibold text-[11px] uppercase tracking-wider">
                        {r.action_type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-sm">
                      {r.observation}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.patient_contacted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {r.patient_contacted ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.escalated ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {r.escalated ? 'Escalated to MD' : 'Standard'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

