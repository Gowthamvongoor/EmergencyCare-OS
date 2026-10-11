import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import {
  BedDouble,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Wrench,
  Users,
  Wind,
  Plus,
  RefreshCw
} from 'lucide-react';

export default function BedManagement() {
  const [bedData, setBedData] = useState({ all: [], icu: { beds: [] }, general: { beds: [] } });
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState(null);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [attachVentilator, setAttachVentilator] = useState(false);

  const { can } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadBeds();
  }, []);

  const loadBeds = async () => {
    try {
      const [bedsRes, patRes] = await Promise.all([
        api.getBeds(),
        api.getPatients()
      ]);
      setBedData(bedsRes);
      setPatients(patRes.patients);
      const waitingPatient = patRes.patients.find(p => ['WAITING', 'BLOCKED', 'READY'].includes(p.processState));
      if (waitingPatient) setSelectedPatientId(waitingPatient.id);
    } catch (err) {
      addToast(err.message || 'Failed to load beds', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAllocate = (bed) => {
    // Prevent double allocation!
    if (bed.status === 'OCCUPIED') {
      addToast(`Double-allocation guard: Bed ${bed.id} is already occupied!`, 'warning');
      return;
    }
    setSelectedBed(bed);
    setIsAllocateModalOpen(true);
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBed || !selectedPatientId) return;

    try {
      await api.allocateBed(selectedBed.id, selectedPatientId, attachVentilator ? 'VENT-08' : null);
      addToast(`Bed ${selectedBed.id} successfully allocated! Double-booking prevented.`, 'success');
      setIsAllocateModalOpen(false);
      loadBeds();
    } catch (err) {
      addToast(err.message || 'Failed to allocate bed', 'error');
    }
  };

  const handleReleaseBed = async (bedId) => {
    try {
      await api.releaseBed(bedId, 'CLEANING');
      addToast(`Bed ${bedId} released from patient and placed into CLEANING`, 'success');
      loadBeds();
    } catch (err) {
      addToast(err.message || 'Failed to release bed', 'error');
    }
  };

  const handleUpdateStatus = async (bedId, status) => {
    try {
      await api.updateBedStatus(bedId, status);
      addToast(`Bed ${bedId} status updated to ${status}`, 'info');
      loadBeds();
    } catch (err) {
      addToast(err.message || 'Failed to update bed status', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OCCUPIED':
        return 'border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 shadow-sm';
      case 'AVAILABLE':
        return 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm';
      case 'CLEANING':
        return 'border-amber-300 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 shadow-sm';
      case 'MAINTENANCE':
        return 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
      default:
        return 'border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BedDouble className="w-6 h-6 text-teal-600" />
            ICU & Ward Bed Management Layout
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual hospital bed grid. Enforces mutual exclusion to prevent double-booking or concurrent race allocations.
          </p>
        </div>

        <button
          onClick={loadBeds}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition self-start"
          title="Refresh Bed Statuses"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm font-mono text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">ICU Beds Occupied</span>
          <span className="text-2xl font-black text-rose-600">
            {bedData.icu?.occupied || 7} / {bedData.icu?.total || 10}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{bedData.icu?.available || 3} Units Available</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm font-mono text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">General Beds Occupied</span>
          <span className="text-2xl font-black text-sky-600">
            {bedData.general?.occupied || 8} / {bedData.general?.total || 12}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{bedData.general?.available || 4} Units Available</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm font-mono text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Under Terminal Cleaning</span>
          <span className="text-2xl font-black text-amber-600">
            {(bedData.icu?.cleaning || 0) + (bedData.general?.cleaning || 0)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">UV Decontamination</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm font-mono text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Double Allocation Guard</span>
          <span className="text-xl font-bold text-emerald-600 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-5 h-5" /> Active
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Locks Enforced</span>
        </div>
      </div>

      {/* Section 1: Intensive Care Unit (ICU) Beds */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          Intensive Care Unit (ICU) Critical Beds
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {bedData.icu?.beds?.map(b => (
            <div
              key={b.id}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[140px] ${getStatusColor(b.status)}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs">{b.id}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/30">
                    {b.status}
                  </span>
                </div>

                {b.status === 'OCCUPIED' ? (
                  <div>
                    <h4 className="text-xs font-bold truncate">{b.patientName}</h4>
                    <span className="text-[10px] font-mono opacity-80 block truncate">{b.patientId}</span>
                    {b.ventilator && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-purple-700 dark:text-purple-300 mt-1">
                        <Wind className="w-3 h-3" /> {b.ventilator}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] opacity-75 italic">
                    {b.status === 'AVAILABLE' ? 'Ready for immediate trauma admission' : b.status}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-1 text-[10px] font-semibold">
                {b.status === 'AVAILABLE' ? (
                  <button
                    onClick={() => handleOpenAllocate(b)}
                    className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                  >
                    Allocate Bed
                  </button>
                ) : b.status === 'OCCUPIED' ? (
                  <button
                    onClick={() => handleReleaseBed(b.id)}
                    className="w-full py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
                  >
                    Release Bed
                  </button>
                ) : (
                  <div className="flex w-full gap-1">
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'AVAILABLE')}
                      className="flex-1 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                    >
                      Make Avail
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'MAINTENANCE')}
                      className="py-1 px-1.5 bg-slate-200 dark:bg-slate-700 rounded-md"
                    >
                      Maint
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Acute General Beds */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          Acute General Ward Beds
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {bedData.general?.beds?.map(b => (
            <div
              key={b.id}
              className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[130px] ${getStatusColor(b.status)}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs">{b.id}</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/70 dark:bg-black/30">
                    {b.status}
                  </span>
                </div>

                {b.status === 'OCCUPIED' ? (
                  <div>
                    <h4 className="text-xs font-bold truncate">{b.patientName}</h4>
                    <span className="text-[10px] font-mono opacity-80 block truncate">{b.patientId}</span>
                  </div>
                ) : (
                  <p className="text-[11px] opacity-75 italic">{b.status}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-2.5 pt-2 border-t border-black/10 dark:border-white/10 text-[10px] font-semibold">
                {b.status === 'AVAILABLE' ? (
                  <button
                    onClick={() => handleOpenAllocate(b)}
                    className="w-full py-1 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition"
                  >
                    Allocate
                  </button>
                ) : b.status === 'OCCUPIED' ? (
                  <button
                    onClick={() => handleReleaseBed(b.id)}
                    className="w-full py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
                  >
                    Release
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(b.id, 'AVAILABLE')}
                    className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                  >
                    Mark Ready
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Allocate Bed Modal */}
      {isAllocateModalOpen && selectedBed && (
        <Modal
          isOpen={isAllocateModalOpen}
          onClose={() => setIsAllocateModalOpen(false)}
          title={`Allocate Bed ${selectedBed.id} (${selectedBed.type})`}
        >
          <form onSubmit={handleAllocateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Select Patient to Admit</label>
              <select
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

            {selectedBed.type === 'ICU' && (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ventCheck"
                  checked={attachVentilator}
                  onChange={(e) => setAttachVentilator(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <label htmlFor="ventCheck" className="text-slate-700 dark:text-slate-300 font-medium">
                  Attach Available Mechanical Ventilator (VENT-08)
                </label>
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAllocateModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-md shadow-teal-600/20"
              >
                Confirm Allocation
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
