import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Boxes,
  ArrowRight,
  GitCommit,
  Terminal,
  RefreshCw,
  Zap,
  Sliders
} from 'lucide-react';

export default function DeadlockMonitor() {
  const [scenario, setScenario] = useState('live'); // 'live' or 'deadlock_demo'
  const [matrixData, setMatrixData] = useState(null);
  const [ragData, setRagData] = useState(null);
  const [bankerResult, setBankerResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Recovery Action Form State
  const [recoveryAction, setRecoveryAction] = useState('PREEMPT');
  const [victimProcessId, setVictimProcessId] = useState('');
  const [targetResourceId, setTargetResourceId] = useState('Doctor');
  const [newResourceId, setNewResourceId] = useState('Nurse');

  const { can } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadDeadlockData();
  }, [scenario]);

  const loadDeadlockData = async () => {
    setLoading(true);
    try {
      if (scenario === 'live') {
        const [mRes, rRes] = await Promise.all([
          api.getMatrices(),
          api.getRAG()
        ]);
        setMatrixData(mRes);
        setRagData(rRes);
        if (mRes.processes && mRes.processes.length > 0) {
          setVictimProcessId(mRes.processes[0].id);
        }
      } else {
        // Run deadlock scenario Banker check directly
        const bRes = await api.runBankers(null, 'deadlock_demo');
        setMatrixData(bRes.matrixData);
        setBankerResult(bRes);
        setRagData({
          hasCycles: true,
          cycles: [['PAT-P1', 'Doctor', 'PAT-P2', 'Nurse', 'PAT-P1']],
          isDeadlocked: true
        });
        setVictimProcessId('PAT-P3');
      }
    } catch (err) {
      addToast(err.message || 'Failed to load deadlock matrices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunBankers = async () => {
    setLoading(true);
    try {
      const res = await api.runBankers(null, scenario === 'deadlock_demo' ? 'deadlock_demo' : null);
      setBankerResult(res);
      if (res.isSafe) {
        addToast('Banker’s check complete: SAFE STATE verified', 'success');
      } else {
        addToast('Banker’s check complete: UNSAFE STATE / Potential Deadlock detected', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Banker’s algorithm failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRecovery = async () => {
    try {
      const res = await api.recoverDeadlock(
        recoveryAction,
        victimProcessId,
        targetResourceId,
        newResourceId
      );
      addToast(res.message, 'success');
      // Re-run Banker's to demonstrate safety restoration!
      setScenario('live');
      loadDeadlockData();
      handleRunBankers();
    } catch (err) {
      addToast(err.message || 'Recovery action failed', 'error');
    }
  };

  const resourceTypes = matrixData?.resourceTypes || ['Doctor', 'Nurse', 'ICU Bed', 'Ventilator', 'Operation Theatre'];
  const processes = matrixData?.processes || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-teal-600" />
            Deadlock Detection & Banker's Algorithm Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Models hospital emergencies as OS resource systems. Computes Allocation, Max, Available, and Need matrices with safe sequence verification and RAG circular wait resolution.
          </p>
        </div>

        {/* Scenario Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setScenario('live'); setBankerResult(null); }}
              className={`px-3 py-1.5 rounded-lg transition ${scenario === 'live' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}
            >
              Live Hospital State
            </button>
            <button
              onClick={() => { setScenario('deadlock_demo'); }}
              className={`px-3 py-1.5 rounded-lg transition ${scenario === 'deadlock_demo' ? 'bg-white dark:bg-slate-900 shadow-sm text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}
            >
              Simulate Deadlock State
            </button>
          </div>

          <button
            onClick={handleRunBankers}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {loading ? 'Executing Engine...' : 'RUN BANKER\'S ALGORITHM'}
          </button>
        </div>
      </div>

      {/* Banker's Safety Output Status Banner */}
      {bankerResult && (
        <div
          className={`p-6 rounded-3xl border shadow-lg transition-all animate-in fade-in duration-200 ${
            bankerResult.isSafe
              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 shadow-emerald-500/10'
              : 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-rose-500/15'
          }`}
        >
          <div className="flex items-start gap-4">
            {bankerResult.isSafe ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 animate-bounce" />
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <span className={`text-base font-black tracking-tight ${bankerResult.isSafe ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
                  {bankerResult.isSafe ? 'SAFE STATE ✓' : 'UNSAFE STATE ⚠ POTENTIAL DEADLOCK DETECTED'}
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-bold">
                  {bankerResult.isSafe ? 'No Deadlock Possible' : 'Circular Contention'}
                </span>
              </div>

              {bankerResult.isSafe ? (
                <div className="font-mono text-xs sm:text-sm font-semibold flex flex-wrap items-center gap-2">
                  <span>Safe Execution Sequence:</span>
                  <div className="flex items-center gap-1.5 bg-emerald-200/60 dark:bg-emerald-900/60 px-3 py-1 rounded-xl">
                    {bankerResult.safeSequence.map((p, idx) => (
                      <React.Fragment key={p.id}>
                        <span className="text-emerald-950 dark:text-emerald-100 font-bold">{p.id}</span>
                        {idx < bankerResult.safeSequence.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="font-mono text-xs text-rose-800 dark:text-rose-200">
                  <p>System entered an unsafe state! The following processes are deadlocked and cannot complete with available resources:</p>
                  <div className="mt-1 font-bold text-rose-600 dark:text-rose-300">
                    {bankerResult.deadlockedProcesses?.map(p => `${p.id} (${p.name})`).join(' &bull; ')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Banker's Algorithm Execution Step Trace Log */}
          {bankerResult.stepLog && bankerResult.stepLog.length > 0 && (
            <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider block mb-2 opacity-80">
                Banker's Algorithm Step Trace:
              </span>
              <div className="space-y-1 font-mono text-[11px] opacity-90 max-h-36 overflow-y-auto pr-2">
                {bankerResult.stepLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-bold opacity-60">Step {log.step}:</span>
                    <span>{log.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Available Resources Vector Display */}
      {matrixData && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-teal-600" />
              Available Resources Vector [Available Vector]
            </h3>
            <span className="text-xs text-slate-500 font-mono">Work = Available</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
            {resourceTypes.map(r => (
              <div key={r} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-xs font-sans text-slate-500 block truncate">{r}</span>
                <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                  {matrixData.available[r] !== undefined ? matrixData.available[r] : 0}
                </span>
                <span className="text-[10px] text-slate-400 block font-sans">units free</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banker's Algorithm 3-Matrix Display: Allocation, Max, Need */}
      {matrixData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Matrix 1: Allocation Matrix */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              Allocation Matrix [Held Resources]
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">Resources currently allocated to each process</p>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="py-2 text-left">Process</th>
                    {resourceTypes.map(r => (
                      <th key={r} className="py-2 px-1 truncate max-w-[60px]" title={r}>{r.substring(0, 4)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {processes.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 text-left font-bold text-slate-800 dark:text-slate-200">{p.id}</td>
                      {resourceTypes.map(r => (
                        <td key={r} className="py-2 px-1 text-slate-600 dark:text-slate-300">
                          {matrixData.allocation[p.id]?.[r] || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matrix 2: Maximum Matrix */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Maximum Matrix [Peak Demands]
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">Maximum resources declared by each patient</p>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="py-2 text-left">Process</th>
                    {resourceTypes.map(r => (
                      <th key={r} className="py-2 px-1 truncate max-w-[60px]" title={r}>{r.substring(0, 4)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {processes.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 text-left font-bold text-slate-800 dark:text-slate-200">{p.id}</td>
                      {resourceTypes.map(r => (
                        <td key={r} className="py-2 px-1 text-slate-600 dark:text-slate-300">
                          {matrixData.max[p.id]?.[r] || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matrix 3: Need Matrix (Max - Allocation) */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Need Matrix [Max &minus; Allocation]
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">Remaining resources required to complete treatment</p>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="py-2 text-left">Process</th>
                    {resourceTypes.map(r => (
                      <th key={r} className="py-2 px-1 truncate max-w-[60px]" title={r}>{r.substring(0, 4)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {processes.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 text-left font-bold text-slate-800 dark:text-slate-200">{p.id}</td>
                      {resourceTypes.map(r => (
                        <td key={r} className={`py-2 px-1 font-bold ${
                          (matrixData.need[p.id]?.[r] || 0) > (matrixData.available[r] || 0)
                            ? 'text-rose-500'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {matrixData.need[p.id]?.[r] || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Deadlock Monitor & Resource Dependency Graph (RAG) */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-rose-500" />
              Resource Allocation Graph (RAG) Dependency Tracker
            </h3>
            <p className="text-xs text-slate-500">
              Detects circular wait dependencies: (Patient holds Resource &rarr; waiting for another Resource held by second Patient).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
              ragData?.hasCycles
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${ragData?.hasCycles ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></span>
              {ragData?.hasCycles ? 'CIRCULAR WAIT DETECTED' : 'RAG ACYCLIC (NO CYCLES)'}
            </span>
          </div>
        </div>

        {/* Visual Dependency Chain Example Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Dependency Flow Trace:
          </span>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 font-bold border border-teal-300 dark:border-teal-800">
              Patient P1
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
              waiting for ICU Bed
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="px-3 py-1.5 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 font-bold border border-teal-300 dark:border-teal-800">
              allocated to Patient P2
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
              waiting for Doctor
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-800">
              allocated to Patient P1 (CYCLE!)
            </div>
          </div>
        </div>

        {/* Deadlock Recovery Actions Panel */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            Deadlock Recovery Strategy Execution
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Execute clinical preemption or reallocation to break circular wait dependencies.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Recovery Strategy</label>
              <select
                value={recoveryAction}
                onChange={(e) => setRecoveryAction(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="PREEMPT">Preempt Resource (Rollback)</option>
                <option value="REASSIGN">Reassign Substitute Resource</option>
                <option value="CANCEL_REQUEST">Cancel Low-Priority Request</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Target Process (Victim)</label>
              <select
                value={victimProcessId}
                onChange={(e) => setVictimProcessId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              >
                {processes.map(p => (
                  <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Contended Resource</label>
              <select
                value={targetResourceId}
                onChange={(e) => setTargetResourceId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {resourceTypes.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleExecuteRecovery}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Execute Recovery Action
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
