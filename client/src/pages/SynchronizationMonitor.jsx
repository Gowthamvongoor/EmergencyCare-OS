import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Lock,
  Unlock,
  Users,
  Play,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Activity,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function SynchronizationMonitor() {
  const [resource, setResource] = useState('ICU-05');
  const [lockState, setLockState] = useState(null);
  const [raceResults, setRaceResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    fetchLockState();
  }, [resource]);

  const fetchLockState = async () => {
    try {
      const data = await api.getSyncState(resource);
      setLockState(data);
    } catch (err) {
      console.error('Failed to get lock state:', err);
    }
  };

  const handleSimulateRaceCondition = async () => {
    setLoading(true);
    try {
      const res = await api.testRaceCondition(resource);
      setRaceResults(res.results);
      setLockState(res.finalState);
      addToast(`Race condition simulated on ${resource}: 3 concurrent requests serialized`, 'warning');
    } catch (err) {
      addToast(err.message || 'Simulation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcquire = async () => {
    setLoading(true);
    try {
      const res = await api.acquireLock(resource, 'PAT-1001', {
        id: user.id,
        name: user.name,
        role: user.role,
        patientId: 'PAT-1001'
      });
      if (res.success) {
        addToast(`Critical section lock acquired on ${resource} by ${user.name}`, 'success');
      } else {
        addToast(`Lock conflict on ${resource}! Placed in waiting queue position #${res.queuePosition}`, 'warning');
      }
      fetchLockState();
    } catch (err) {
      addToast(err.message || 'Failed to acquire lock', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    setLoading(true);
    try {
      const res = await api.releaseLock(resource);
      if (res.status === 'PROMOTED_NEXT') {
        addToast(`Lock released on ${resource}. Next requester in queue (${res.currentHolder.name}) promoted to lock holder!`, 'info');
      } else {
        addToast(`Lock released on ${resource}. Resource is now IDLE / FREE.`, 'success');
      }
      fetchLockState();
    } catch (err) {
      addToast(err.message || 'Failed to release lock', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Lock className="w-6 h-6 text-teal-600" />
            Process Synchronization & Mutex Locking Monitor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Demonstrates OS mutual exclusion and critical sections on contested hospital resources (e.g. ICU-05, OT-01) preventing race conditions.
          </p>
        </div>

        {/* Resource Selector & Race Test Button */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ICU-05">ICU Bed: ICU-05</option>
            <option value="ICU-02">ICU Bed: ICU-02</option>
            <option value="OT-01">Theatre: OT-01</option>
            <option value="VENT-01">Ventilator: VENT-01</option>
          </select>

          <button
            onClick={handleSimulateRaceCondition}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            Simulate 3-User Race Condition
          </button>
        </div>
      </div>

      {/* Primary Mutex Status Banner */}
      {lockState && (
        <div
          className={`p-6 rounded-3xl border shadow-lg transition-all animate-in fade-in duration-200 ${
            lockState.isLocked
              ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-rose-500/10'
              : 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 shadow-emerald-500/10'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${lockState.isLocked ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                {lockState.isLocked ? <Lock className="w-7 h-7" /> : <Unlock className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                    {lockState.resourceKey}
                  </span>
                  <span className="text-base font-black tracking-tight">
                    {lockState.isLocked ? 'MUTEX LOCKED &bull; CRITICAL SECTION OCCUPIED' : 'MUTEX LOCK RELEASED &bull; RESOURCE IDLE'}
                  </span>
                </div>
                <p className="text-xs mt-1 opacity-90">
                  {lockState.isLocked ? (
                    <>
                      Exclusive lock currently held by <strong>{lockState.holder?.name}</strong> ({lockState.holder?.role}) for patient {lockState.holder?.patientId} since {lockState.holder?.acquiredAt}.
                    </>
                  ) : (
                    'Resource is available. First requesting process will immediately enter critical section without blocking.'
                  )}
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {lockState.isLocked ? (
                <button
                  onClick={handleRelease}
                  disabled={loading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-rose-600/20 transition flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Release Mutex Lock
                </button>
              ) : (
                <button
                  onClick={handleAcquire}
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Acquire Mutex Lock
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Waiting Queue & Race Condition Trace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Lock Waiting Queue */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              Mutex Waiting Queue (FIFO Blocked Processes)
            </h3>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {lockState?.waitingQueue?.length || 0} Blocked
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Processes trying to allocate {resource} while locked are queued in strict First-In, First-Out sequence without race hazards.
          </p>

          <div className="space-y-2.5 pt-2">
            {!lockState?.waitingQueue || lockState.waitingQueue.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                No requesters currently blocked in lock queue.
              </div>
            ) : (
              lockState.waitingQueue.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{item.name}</h4>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400">
                        {item.role} &bull; Requested for {item.patientId}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    Enqueued: {item.enqueuedAt}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Card: Race Condition Simulator Results */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Simultaneous Contention Scenario (3-User Race)
            </h3>
            <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-semibold">
              atomic compare-and-swap
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Simulates: <strong>Doctor A</strong>, <strong>Doctor B</strong>, and <strong>Emergency Coordinator</strong> simultaneously attempting to allocate <strong>{resource}</strong> at 0ms interval.
          </p>

          <div className="space-y-2.5 pt-2">
            {!raceResults ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                Click <strong>"Simulate 3-User Race Condition"</strong> above to trigger atomic competition.
              </div>
            ) : (
              raceResults.map((r, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                    r.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {r.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">{r.candidate.name}</span>
                      <span className="text-[11px] block opacity-75">{r.candidate.role}</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                    {r.details}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Lock Audit Log / Event Stream */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          Mutex Lock / Critical Section Audit Stream
        </h3>
        <div className="space-y-1.5 font-mono text-xs max-h-48 overflow-y-auto pr-2 divide-y divide-slate-100 dark:divide-slate-800">
          {!lockState?.history || lockState.history.length === 0 ? (
            <p className="text-slate-400 italic py-2">No synchronization events recorded yet.</p>
          ) : (
            lockState.history.map((h, i) => (
              <div key={i} className="py-2 flex items-start justify-between gap-4">
                <div className="flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    h.action === 'ACQUIRED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' :
                    h.action === 'RELEASED' ? 'bg-slate-200 dark:bg-slate-800 text-slate-700' :
                    h.action === 'PROMOTED' ? 'bg-sky-100 dark:bg-sky-950 text-sky-700' :
                    'bg-amber-100 dark:bg-amber-950 text-amber-700'
                  }`}>
                    {h.action}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{h.message}</span>
                </div>
                <span className="text-slate-400 text-[11px] shrink-0">{h.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
