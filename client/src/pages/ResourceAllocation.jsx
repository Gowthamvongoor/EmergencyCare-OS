import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Cpu,
  RefreshCw,
  Unlock,
  AlertCircle
} from 'lucide-react';

export default function ResourceAllocation() {
  const [patients, setPatients] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [requestedResources, setRequestedResources] = useState([]);
  const [allocationStatus, setAllocationStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const { can } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [patRes, resRes] = await Promise.all([
        api.getPatients(),
        api.getResources()
      ]);
      setPatients(patRes.patients);
      setResources(resRes);
      if (patRes.patients.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patRes.patients[0].id);
        setRequestedResources(patRes.patients[0].requiredResources || ['Doctor']);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load allocation data', 'error');
    }
  };

  const handlePatientSelect = (pId) => {
    setSelectedPatientId(pId);
    setAllocationStatus(null);
    const pat = patients.find(p => p.id === pId);
    if (pat) {
      setRequestedResources(pat.requiredResources || ['Doctor']);
    }
  };

  const toggleResource = (rName) => {
    setRequestedResources(prev =>
      prev.includes(rName) ? prev.filter(r => r !== rName) : [...prev, rName]
    );
  };

  const handleAllocate = async () => {
    if (!selectedPatientId || requestedResources.length === 0) {
      addToast('Please select a patient and at least one resource', 'warning');
      return;
    }

    setLoading(true);
    setAllocationStatus(null);

    try {
      const res = await api.allocateResources(selectedPatientId, requestedResources);
      setAllocationStatus({
        type: 'SUCCESS',
        message: res.message,
        patient: res.patient
      });
      addToast(res.message, 'success');
      loadData();
    } catch (err) {
      const data = err.data || {};
      setAllocationStatus({
        type: 'RESOURCE_UNAVAILABLE',
        message: err.message,
        unavailable: data.unavailable || ['Contended Resource'],
        patient: data.patient
      });
      addToast(err.message, 'error');
      loadData();
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!selectedPatientId) return;
    setLoading(true);
    try {
      const res = await api.releaseResources(selectedPatientId);
      setAllocationStatus({
        type: 'RELEASED',
        message: 'All held resources successfully returned to hospital pool',
        patient: res.patient
      });
      addToast('Resources released', 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to release resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-teal-600" />
            Smart Resource Allocation Workbench
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulates dynamic OS resource requests. Evaluates availability before allocation. If contested, sets patient process to <strong>BLOCKED</strong> state.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition self-start"
          title="Refresh Resources"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Allocation Status Notification Banner */}
      {allocationStatus && (
        <div
          className={`p-5 rounded-2xl border transition-all animate-in fade-in duration-200 ${
            allocationStatus.type === 'RESOURCE_UNAVAILABLE'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-md shadow-rose-500/10'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 shadow-md shadow-emerald-500/10'
          }`}
        >
          <div className="flex items-start gap-3">
            {allocationStatus.type === 'RESOURCE_UNAVAILABLE' ? (
              <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <h3 className="font-bold text-sm tracking-tight mb-1">
                {allocationStatus.type === 'RESOURCE_UNAVAILABLE'
                  ? 'RESOURCE UNAVAILABLE: PROCESS BLOCKED'
                  : 'RESOURCE ALLOCATION SUCCESSFUL'}
              </h3>
              <p className="leading-relaxed">{allocationStatus.message}</p>
              {allocationStatus.unavailable && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="font-semibold text-rose-700 dark:text-rose-300">Missing Hardware/Personnel:</span>
                  {allocationStatus.unavailable.map(u => (
                    <span key={u} className="px-2 py-0.5 rounded bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-mono font-bold">
                      {u}
                    </span>
                  ))}
                  <span className="text-[11px] text-slate-500 font-mono ml-2">
                    &bull; Process state transitioned to <strong>BLOCKED</strong> awaiting mutex/resource release.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Allocation Workbench: 2-Column Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Select Patient & Request Resources (2 spans) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              1. Select Target Emergency Patient (Process)
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientSelect(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.name} [{p.priority} Priority] &bull; State: {p.processState} &bull; Cond: {p.emergencyType}
                </option>
              ))}
            </select>
          </div>

          {/* Current Process Card Info */}
          {currentPatient && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Process State</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{currentPatient.processState}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Priority</span>
                <span className="font-bold text-rose-600">{currentPatient.priority}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Held Resources</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {currentPatient.allocatedResources?.length > 0 ? currentPatient.allocatedResources.join(', ') : 'None'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Waiting For</span>
                <span className="font-semibold text-rose-500">
                  {currentPatient.waitingFor?.length > 0 ? currentPatient.waitingFor.join(', ') : 'None'}
                </span>
              </div>
            </div>
          )}

          {/* Checkboxes for Requested Resources */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              2. Select Resources to Request / Allocate
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                'ICU Bed',
                'General Bed',
                'Doctor',
                'Nurse',
                'Ventilator',
                'Operation Theatre',
                'Emergency Room',
                'Ambulance'
              ].map(rName => {
                const isSelected = requestedResources.includes(rName);
                const catalog = resources.find(r => r.name.toLowerCase().includes(rName.toLowerCase()) || rName.toLowerCase().includes(r.name.toLowerCase()));
                const freeCount = catalog ? catalog.available : 0;
                const isAvailable = freeCount > 0;

                return (
                  <div
                    key={rName}
                    onClick={() => toggleResource(rName)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold">{rName}</span>
                      <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">{isAvailable ? 'In Stock' : 'Exhausted'}</span>
                      <span className={`font-bold ${isAvailable ? 'text-teal-600 dark:text-teal-400' : 'text-rose-500'}`}>
                        {freeCount} Free
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRelease}
              disabled={loading || !currentPatient || (currentPatient.allocatedResources?.length === 0)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition disabled:opacity-40 flex items-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Release Held Resources
            </button>

            <button
              type="button"
              onClick={handleAllocate}
              disabled={loading || requestedResources.length === 0}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-600/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              {loading ? 'Evaluating Allocation...' : 'Request & Allocate Resources'}
            </button>
          </div>
        </div>

        {/* Right Column: Live Pool Availability Sidebar */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-teal-600" />
              Hardware Pool State (Live Vector)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Available resource instances available for allocation.
            </p>

            <div className="space-y-3 font-mono text-xs">
              {resources.map(r => (
                <div key={r.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                  <span className="font-sans font-medium text-slate-800 dark:text-slate-200 truncate">{r.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400">{r.total - r.available}/{r.total}</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${r.available > 0 ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'}`}>
                      {r.available} Free
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-normal">
            <strong>OS Allocation Rule:</strong> If all requested resources are free, locks are acquired and process moves to RUNNING. If any single resource instance is unavailable, allocation is halted and process moves to BLOCKED.
          </div>
        </div>

      </div>
    </div>
  );
}
