import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  Activity,
  BedDouble,
  Stethoscope,
  ChevronDown,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function EmergencyPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  
  // Selected Patient Modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const { can, user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, [search, priorityFilter, stateFilter]);

  const fetchPatients = async () => {
    try {
      const data = await api.getPatients({
        search: search || undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        state: stateFilter !== 'ALL' ? stateFilter : undefined
      });
      setPatients(data.patients);
    } catch (err) {
      addToast(err.message || 'Failed to fetch patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = async (id, newPriority) => {
    try {
      await api.updatePriority(id, newPriority);
      addToast(`Updated priority of ${id} to ${newPriority}`, 'success');
      fetchPatients();
    } catch (err) {
      addToast(err.message || 'Failed to update priority', 'error');
    }
  };

  const handleStateChange = async (id, newState) => {
    try {
      await api.updateProcessState(id, newState);
      addToast(`Updated state of ${id} to ${newState}`, 'success');
      fetchPatients();
    } catch (err) {
      addToast(err.message || 'Failed to update state', 'error');
    }
  };

  const handleOpenEdit = (patient) => {
    setSelectedPatient(patient);
    setEditFormData({ ...patient });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updatePatient(selectedPatient.id, editFormData);
      addToast(`Patient ${selectedPatient.id} updated successfully`, 'success');
      setIsEditModalOpen(false);
      fetchPatients();
    } catch (err) {
      addToast(err.message || 'Failed to save updates', 'error');
    }
  };

  const handleDeletePatient = async (id) => {
    try {
      await api.deletePatient(id);
      addToast(`Patient ${id} discharged and resources deallocated`, 'success');
      setDeleteConfirmId(null);
      fetchPatients();
    } catch (err) {
      addToast(err.message || 'Failed to discharge patient', 'error');
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'Critical':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800">Critical (P1)</span>;
      case 'High':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200 dark:border-orange-800">High (P2)</span>;
      case 'Medium':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Medium (P3)</span>;
      case 'Low':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Low (P4)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">{prio}</span>;
    }
  };

  const getStateBadge = (state) => {
    switch (state) {
      case 'NEW':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">NEW</span>;
      case 'READY':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">READY</span>;
      case 'RUNNING':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">RUNNING</span>;
      case 'WAITING':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">WAITING</span>;
      case 'BLOCKED':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse">BLOCKED</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">COMPLETED</span>;
      default:
        return <span>{state}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" />
            Emergency Patients Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Clinical registry of admitted cases modeled as OS processes with priority, states, and hardware bindings.
          </p>
        </div>

        {can('patient_records', 'WRITE') && (
          <Link
            to="/patient-registration"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 self-start"
          >
            <UserPlus className="w-4 h-4" />
            Admit New Emergency Case
          </Link>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name, PID, Condition, Doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Priority & State Filter Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Priority:</span>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical (P1)</option>
            <option value="High">High (P2)</option>
            <option value="Medium">Medium (P3)</option>
            <option value="Low">Low (P4)</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
            <span>Process State:</span>
          </div>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All States</option>
            <option value="NEW">NEW</option>
            <option value="READY">READY</option>
            <option value="RUNNING">RUNNING</option>
            <option value="WAITING">WAITING</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">PID & Patient</th>
                <th className="py-3.5 px-4">Emergency Condition</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">OS State</th>
                <th className="py-3.5 px-4">Assigned Resources</th>
                <th className="py-3.5 px-4">Doctor & Bed</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">Loading patients registry...</td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">No emergency patients match current filters.</td>
                </tr>
              ) : (
                patients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                    {/* PID & Patient */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">{p.id}</span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                          <div className="text-[11px] text-slate-400">{p.age}y &bull; {p.gender} &bull; {p.bloodGroup}</div>
                        </div>
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{p.emergencyType}</div>
                      <div className="text-[11px] text-slate-400 truncate">{p.symptoms}</div>
                    </td>

                    {/* Priority & Quick Switch */}
                    <td className="py-3.5 px-4">
                      {can('emergency_queue', 'UPDATE') ? (
                        <select
                          value={p.priority}
                          onChange={(e) => handlePriorityChange(p.id, e.target.value)}
                          className="text-xs font-semibold py-1 px-2 rounded-lg bg-transparent border border-slate-300 dark:border-slate-700 cursor-pointer focus:ring-1 focus:ring-teal-500"
                        >
                          <option value="Critical">Critical (P1)</option>
                          <option value="High">High (P2)</option>
                          <option value="Medium">Medium (P3)</option>
                          <option value="Low">Low (P4)</option>
                        </select>
                      ) : (
                        getPriorityBadge(p.priority)
                      )}
                    </td>

                    {/* Process State & Quick Switch */}
                    <td className="py-3.5 px-4">
                      {can('emergency_queue', 'UPDATE') ? (
                        <select
                          value={p.processState}
                          onChange={(e) => handleStateChange(p.id, e.target.value)}
                          className="text-xs font-mono font-semibold py-1 px-2 rounded-lg bg-transparent border border-slate-300 dark:border-slate-700 cursor-pointer"
                        >
                          <option value="NEW">NEW</option>
                          <option value="READY">READY</option>
                          <option value="RUNNING">RUNNING</option>
                          <option value="WAITING">WAITING</option>
                          <option value="BLOCKED">BLOCKED</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      ) : (
                        getStateBadge(p.processState)
                      )}
                    </td>

                    {/* Assigned Resources */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {p.allocatedResources && p.allocatedResources.length > 0 ? (
                          p.allocatedResources.map((res, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-medium border border-teal-200 dark:border-teal-800">
                              {res}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                        {p.waitingFor && p.waitingFor.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-medium border border-rose-200 dark:border-rose-800">
                            Waiting: {p.waitingFor.join(', ')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Doctor & Bed */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-500" />
                        <span>{p.assignedDoctor || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 text-[11px]">
                        <BedDouble className="w-3.5 h-3.5 text-sky-500" />
                        <span>{p.assignedBed || 'No Bed Assigned'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPatient(p)}
                          title="View Case Detail"
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {can('patient_records', 'UPDATE') && (
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Record"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {can('patient_records', 'DELETE') && (
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            title="Discharge Patient"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && !isEditModalOpen && (
        <Modal
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          title={`Clinical Case File: ${selectedPatient.id} (${selectedPatient.name})`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <span className="text-slate-400 block">Priority</span>
                <span className="font-bold">{selectedPatient.priority}</span>
              </div>
              <div>
                <span className="text-slate-400 block">OS Process State</span>
                <span className="font-mono font-bold text-teal-600">{selectedPatient.processState}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Burst Time</span>
                <span className="font-mono">{selectedPatient.burstTime} units</span>
              </div>
              <div>
                <span className="text-slate-400 block">Blood Group</span>
                <span className="font-bold">{selectedPatient.bloodGroup}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Diagnosis & Presentation</h4>
              <p className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong>Emergency:</strong> {selectedPatient.emergencyType}<br />
                <strong>Symptoms:</strong> {selectedPatient.symptoms}<br />
                <strong>Medical History:</strong> {selectedPatient.medicalHistory}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Resource Bindings</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">Assigned Doctor:</span>
                  <span className="font-semibold">{selectedPatient.assignedDoctor || 'None'}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">Assigned Bed:</span>
                  <span className="font-semibold">{selectedPatient.assignedBed || 'None'}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">Ambulance:</span>
                  <span className="font-semibold">{selectedPatient.assignedAmbulance || 'None'}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">Ventilator / OT:</span>
                  <span className="font-semibold">{selectedPatient.assignedVentilator || selectedPatient.assignedOT || 'None'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold text-slate-800 dark:text-slate-200"
              >
                Close File
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Patient Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Patient Record: ${selectedPatient.id}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Age</label>
                <input
                  type="number"
                  value={editFormData.age || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Emergency Condition</label>
              <input
                type="text"
                required
                value={editFormData.emergencyType || ''}
                onChange={(e) => setEditFormData({ ...editFormData, emergencyType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Priority</label>
                <select
                  value={editFormData.priority || 'Medium'}
                  onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Process State</label>
                <select
                  value={editFormData.processState || 'READY'}
                  onChange={(e) => setEditFormData({ ...editFormData, processState: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                >
                  <option value="NEW">NEW</option>
                  <option value="READY">READY</option>
                  <option value="RUNNING">RUNNING</option>
                  <option value="WAITING">WAITING</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-md shadow-teal-600/20"
              >
                Save Record Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Discharge / Delete Confirmation Modal */}
      {deleteConfirmId && (
        <Modal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          title="Confirm Patient Discharge"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>
                Discharging patient <strong>{deleteConfirmId}</strong> will terminate its OS process and immediately free its allocated beds, doctors, and monitors back to the hospital pool.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePatient(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-md shadow-rose-600/20"
              >
                Confirm Discharge
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
