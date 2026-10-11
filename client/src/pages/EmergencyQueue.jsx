import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Cpu,
  ArrowRight,
  Clock,
  AlertCircle,
  Activity,
  BedDouble,
  Stethoscope,
  Wind,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Filter
} from 'lucide-react';

export default function EmergencyQueue() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('pipeline'); // 'pipeline' or 'table'
  const [selectedStateFilter, setSelectedStateFilter] = useState('ALL');

  const { can } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data.patients);
    } catch (err) {
      addToast(err.message || 'Failed to fetch queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStateTransition = async (patientId, targetState) => {
    try {
      await api.updateProcessState(patientId, targetState);
      addToast(`Process ${patientId} moved to ${targetState}`, 'success');
      fetchQueue();
    } catch (err) {
      addToast(err.message || 'State transition failed', 'error');
    }
  };

  const states = [
    { key: 'NEW', name: 'NEW', desc: 'Arrived at Triage Desk', color: 'border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
    { key: 'READY', name: 'READY', desc: 'In Ready Queue for Doctor', color: 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
    { key: 'RUNNING', name: 'RUNNING', desc: 'Under Active Resuscitation', color: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
    { key: 'WAITING', name: 'WAITING', desc: 'Waiting for Diagnostic I/O', color: 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
    { key: 'BLOCKED', name: 'BLOCKED', desc: 'Resource Contention / Lack', color: 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300', dot: 'bg-rose-500 animate-ping' },
    { key: 'COMPLETED', name: 'COMPLETED', desc: 'Discharged / Stabilized', color: 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' }
  ];

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">P1 &bull; Critical</span>;
      case 'High': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">P2 &bull; High</span>;
      case 'Medium': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">P3 &bull; Medium</span>;
      case 'Low': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">P4 &bull; Low</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-teal-600" />
            Emergency Process Queue (Process State Lifecycle)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualizes hospital emergency patients as Operating System processes transitioning through the 6-state OS lifecycle: NEW &rarr; READY &rarr; RUNNING &rarr; WAITING &rarr; BLOCKED &rarr; COMPLETED.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchQueue}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            title="Refresh Process State Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1.5 rounded-lg transition ${viewMode === 'pipeline' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}
            >
              OS State Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}
            >
              Process Table
            </button>
          </div>
        </div>
      </div>

      {/* OS Process State Machine Explanation Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          OS Process State Transition Flow
        </h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            NEW (Admitted)
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            READY (Queue)
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            RUNNING (CPU Core / Doctor)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">&harr;</span>
            <div className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              WAITING (Lab / Imaging)
            </div>
            <span className="text-slate-400">/</span>
            <div className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              BLOCKED (Contended Bed/OT)
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            COMPLETED (Discharge)
          </div>
        </div>
      </div>

      {/* Kanban / Pipeline View */}
      {viewMode === 'pipeline' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {states.map(stateObj => {
            const statePatients = patients.filter(p => p.processState === stateObj.key);

            return (
              <div
                key={stateObj.key}
                className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm min-w-[240px] max-h-[75vh]"
              >
                {/* Column Header */}
                <div className={`p-3.5 border-b rounded-t-2xl flex items-center justify-between ${stateObj.color}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stateObj.dot}`}></span>
                    <span className="text-xs font-bold font-mono uppercase tracking-wider">{stateObj.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/30">
                    {statePatients.length}
                  </span>
                </div>

                {/* Column Body / Cards List */}
                <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                  {statePatients.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400 italic">
                      No processes in {stateObj.name}
                    </div>
                  ) : (
                    statePatients.map(p => (
                      <div
                        key={p.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition"
                      >
                        {/* PID & Priority */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">{p.id}</span>
                          {getPriorityBadge(p.priority)}
                        </div>

                        {/* Patient Name & Emergency Type */}
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">{p.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{p.emergencyType}</p>

                        {/* Hardware & Doctor details */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 text-[10px]">
                          {p.assignedDoctor && (
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <Stethoscope className="w-3 h-3 text-teal-500 shrink-0" />
                              <span className="truncate">{p.assignedDoctor}</span>
                            </div>
                          )}
                          {p.assignedBed && (
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <BedDouble className="w-3 h-3 text-sky-500 shrink-0" />
                              <span className="truncate">{p.assignedBed}</span>
                            </div>
                          )}
                          {p.waitingFor && p.waitingFor.length > 0 && (
                            <div className="text-rose-500 font-medium">
                              Blocked on: {p.waitingFor.join(', ')}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-slate-400 font-mono pt-1">
                            <span>Burst: {p.burstTime}u</span>
                            <span>Remain: {p.remainingTime}u</span>
                          </div>
                        </div>

                        {/* State Transition Actions */}
                        {can('emergency_queue', 'UPDATE') && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">Move:</span>
                            <select
                              value={p.processState}
                              onChange={(e) => handleStateTransition(p.id, e.target.value)}
                              className="text-[10px] font-semibold py-0.5 px-1.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 cursor-pointer"
                            >
                              <option value="NEW">NEW</option>
                              <option value="READY">READY</option>
                              <option value="RUNNING">RUNNING</option>
                              <option value="WAITING">WAITING</option>
                              <option value="BLOCKED">BLOCKED</option>
                              <option value="COMPLETED">COMPLETED</option>
                            </select>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">PID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Current OS State</th>
                <th className="py-3 px-4">Burst / Remaining</th>
                <th className="py-3 px-4">Assigned Core / Doctor</th>
                <th className="py-3 px-4">Contended Resource</th>
                <th className="py-3 px-4 text-right">Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-teal-600">{p.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{p.name}</td>
                  <td className="py-3 px-4">{getPriorityBadge(p.priority)}</td>
                  <td className="py-3 px-4 font-mono font-semibold">{p.processState}</td>
                  <td className="py-3 px-4 font-mono">{p.burstTime}u / {p.remainingTime}u</td>
                  <td className="py-3 px-4">{p.assignedDoctor || 'Unassigned'}</td>
                  <td className="py-3 px-4 text-rose-500 font-medium">
                    {p.waitingFor && p.waitingFor.length > 0 ? p.waitingFor.join(', ') : 'None (Allocated)'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={p.processState}
                      onChange={(e) => handleStateTransition(p.id, e.target.value)}
                      className="text-xs font-semibold py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 cursor-pointer"
                    >
                      <option value="NEW">NEW</option>
                      <option value="READY">READY</option>
                      <option value="RUNNING">RUNNING</option>
                      <option value="WAITING">WAITING</option>
                      <option value="BLOCKED">BLOCKED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
