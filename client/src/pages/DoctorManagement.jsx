import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import {
  UserCheck,
  Stethoscope,
  HeartPulse,
  Clock,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Phone,
  ShieldCheck,
  Ban
} from 'lucide-react';

export default function DoctorManagement() {
  const [staffData, setStaffData] = useState({ doctors: [], nurses: [], summary: {} });
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' or 'nurses'
  const [loading, setLoading] = useState(true);
  
  // Assign Doctor Modal
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const { can } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const [stfRes, patRes] = await Promise.all([
        api.getStaff(),
        api.getPatients()
      ]);
      setStaffData(stfRes);
      setPatients(patRes.patients);
      const unassigned = patRes.patients.find(p => !p.assignedDoctor);
      if (unassigned) setSelectedPatientId(unassigned.id);
    } catch (err) {
      addToast(err.message || 'Failed to load medical staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (docId, newStatus) => {
    try {
      await api.updateDoctorStatus(docId, newStatus);
      addToast(`Status updated to ${newStatus}`, 'success');
      loadStaff();
    } catch (err) {
      addToast(err.message || 'Failed to change status', 'error');
    }
  };

  const handleOpenAssign = (doc) => {
    // Strictly prevent assigning OFF_DUTY doctor!
    if (doc.status === 'OFF_DUTY') {
      addToast(`Access Restriction: Cannot assign ${doc.name} because they are OFF_DUTY!`, 'error');
      return;
    }
    setSelectedDoc(doc);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoc || !selectedPatientId) return;

    try {
      await api.assignDoctor(selectedDoc.id, selectedPatientId);
      addToast(`Assigned ${selectedDoc.name} to patient ${selectedPatientId}`, 'success');
      setIsAssignModalOpen(false);
      loadStaff();
    } catch (err) {
      addToast(err.message || 'Failed to assign doctor', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">AVAILABLE</span>;
      case 'BUSY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">BUSY</span>;
      case 'ON_BREAK':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">ON_BREAK</span>;
      case 'OFF_DUTY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">OFF_DUTY</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const doctors = staffData.doctors || [];
  const nurses = staffData.nurses || [];
  const summary = staffData.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-teal-600" />
            Medical Staff & Doctor Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manages clinical personnel workloads and enforces scheduler rules (e.g. strict prohibition of assigning OFF_DUTY physicians).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStaff}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            title="Refresh Staff"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'doctors' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}
            >
              Physicians ({doctors.length})
            </button>
            <button
              onClick={() => setActiveTab('nurses')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'nurses' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}
            >
              Nursing Staff ({nurses.length})
            </button>
          </div>
        </div>
      </div>

      {/* Staff Overview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Available Doctors</span>
          <span className="font-mono text-2xl font-black text-emerald-600">{summary.availableDoctors || 3} of {summary.totalDoctors || 10}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Ready for Resuscitation</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Active / Busy Doctors</span>
          <span className="font-mono text-2xl font-black text-amber-600">{summary.busyDoctors || 5}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Assigned to Critical Cases</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Off-Duty Personnel</span>
          <span className="font-mono text-2xl font-black text-rose-600">{summary.offDutyDoctors || 1}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Guarded Against Assignment</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nursing Triage Staff</span>
          <span className="font-mono text-2xl font-black text-teal-600">{summary.totalNurses || 15}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{summary.availableNurses || 5} Float Available</span>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'doctors' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map(doc => {
            const isOffDuty = doc.status === 'OFF_DUTY';

            return (
              <div
                key={doc.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                  isOffDuty ? 'border-rose-200 dark:border-rose-950/60 opacity-75' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">{doc.id}</span>
                    {getStatusBadge(doc.status)}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-500" />
                    {doc.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.department} &bull; <strong className="text-slate-700 dark:text-slate-300">{doc.specialization}</strong></p>
                </div>

                {/* Workload Meter */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                    <span className="text-slate-500">Current Workload</span>
                    <span className={`font-bold ${doc.workload > 80 ? 'text-rose-500' : 'text-teal-600 dark:text-teal-400'}`}>
                      {doc.workload}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${doc.workload}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        doc.workload > 80 ? 'bg-rose-500' : doc.workload > 60 ? 'bg-amber-500' : 'bg-teal-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Assigned Patients */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assigned Cases</span>
                  {doc.assignedPatients?.length > 0 ? (
                    <div className="flex flex-wrap gap-1 font-mono">
                      {doc.assignedPatients.map(pid => (
                        <span key={pid} className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 text-[10px] font-bold">
                          {pid}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">No active clinical assignments</span>
                  )}
                </div>

                {/* Action Controls */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                  {/* Status Dropdown */}
                  <select
                    value={doc.status}
                    onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                    className="text-xs font-semibold py-1.5 px-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="BUSY">BUSY</option>
                    <option value="ON_BREAK">ON_BREAK</option>
                    <option value="OFF_DUTY">OFF_DUTY</option>
                  </select>

                  <button
                    onClick={() => handleOpenAssign(doc)}
                    disabled={isOffDuty}
                    className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition disabled:opacity-40 disabled:hover:bg-teal-600 flex items-center gap-1.5"
                    title={isOffDuty ? 'Physician is OFF_DUTY' : 'Assign to Patient'}
                  >
                    {isOffDuty ? <Ban className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    Assign
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Nurses Tab */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase">
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Nurse Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Shift</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4">Assigned Beds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {nurses.map(nur => (
                <tr key={nur.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-600">{nur.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                    {nur.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{nur.department}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{nur.shift} Shift</td>
                  <td className="py-3.5 px-4">{getStatusBadge(nur.status)}</td>
                  <td className="py-3.5 px-4 font-mono">
                    {nur.assignedBeds?.length > 0 ? nur.assignedBeds.join(', ') : <span className="text-slate-400 italic">None</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Doctor Modal */}
      {isAssignModalOpen && selectedDoc && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assign ${selectedDoc.name} to Patient`}
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-teal-50 dark:bg-teal-950/60 rounded-xl text-teal-800 dark:text-teal-200">
              Assigning physician: <strong>{selectedDoc.name}</strong> ({selectedDoc.specialization}). Current workload will update accordingly.
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Select Target Patient *</label>
              <select
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.id} - {p.name} [{p.priority}] ({p.emergencyType})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-md shadow-teal-600/20"
              >
                Confirm Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
