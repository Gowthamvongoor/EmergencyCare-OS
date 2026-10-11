import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  RotateCcw,
  Zap,
  Terminal,
  Activity,
  Check,
  X
} from 'lucide-react';

export default function SystemTesting() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    runSuite();
  }, []);

  const runSuite = async () => {
    setLoading(true);
    try {
      const res = await api.runAllTests();
      setTestResults(res);
      addToast(`Executed ${res.totalTests} tests. Pass Rate: ${res.passRate}`, 'success');
    } catch (err) {
      addToast(err.message || 'Test runner failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestDoubleBedAllocation = async () => {
    try {
      // Attempt double booking of occupied bed ICU-01
      await api.allocateBed('ICU-01', 'PAT-1020');
      addToast('Error: Double allocation was NOT prevented!', 'error');
    } catch (err) {
      addToast(`Guard Verified: Double allocation rejected! (${err.message})`, 'success');
    }
  };

  const handleTestOffDutyDoctor = async () => {
    try {
      // Attempt to assign off-duty doctor DOC-110 (Dr. Leonard McCoy)
      await api.assignDoctor('DOC-110', 'PAT-1020');
      addToast('Error: Off-duty doctor was assigned!', 'error');
    } catch (err) {
      addToast(`Guard Verified: Off-duty doctor assignment blocked! (${err.message})`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FlaskConical className="w-6 h-6 text-teal-600" />
            Automated OS Algorithm & Regression Test Suite
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Validates algorithmic integrity across CPU Priority Scheduling, Banker's Algorithm, Mutex Serialization, Buffer Invariants, and Protection Matrix RBAC.
          </p>
        </div>

        <button
          onClick={runSuite}
          disabled={loading}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 self-start"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {loading ? 'Running Suite...' : 'RUN ALL SYSTEM TESTS'}
        </button>
      </div>

      {/* Test Suite Summary KPI Cards */}
      {testResults && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] text-slate-400 block uppercase">Total Test Cases</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{testResults.totalTests}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] text-emerald-600 block uppercase font-bold">Passed</span>
            <span className="text-2xl font-black text-emerald-600">{testResults.passed}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] text-rose-600 block uppercase font-bold">Failed</span>
            <span className="text-2xl font-black text-rose-600">{testResults.failed}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] text-teal-600 block uppercase font-bold">Pass Rate</span>
            <span className="text-2xl font-black text-teal-600">{testResults.passRate}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] text-slate-400 block uppercase">Duration</span>
            <span className="text-2xl font-black text-sky-600">{testResults.durationMs}ms</span>
          </div>
        </div>
      )}

      {/* Manual Edge-Case Attack & Guard Verifiers */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Interactive OS Boundary & Safety Guard Verifiers
        </h3>
        <p className="text-xs text-slate-500">
          Click below to intentionally trigger edge cases and verify that the kernel rejects invalid actions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Double Bed Allocation Guard</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Attempts to allocate an already-occupied ICU bed (ICU-01) to a second patient. Must return HTTP 409 Conflict.
              </p>
            </div>
            <button
              onClick={handleTestDoubleBedAllocation}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold self-start"
            >
              Test Double Allocation Guard
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Off-Duty Doctor Assignment Guard</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Attempts to assign Dr. Leonard McCoy (who is OFF_DUTY) to an emergency patient. Must be rejected.
              </p>
            </div>
            <button
              onClick={handleTestOffDutyDoctor}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold self-start"
            >
              Test Off-Duty Assignment Guard
            </button>
          </div>
        </div>
      </div>

      {/* Test Cases Execution Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Automated Algorithmic Verification Report
          </h3>
          <span className="text-xs text-slate-400 font-mono">10 Test Assertions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Test ID</th>
                <th className="py-3 px-4">Module / Category</th>
                <th className="py-3 px-4">Assertion & Test Name</th>
                <th className="py-3 px-4">Expected Condition</th>
                <th className="py-3 px-4">Actual Measured Output</th>
                <th className="py-3 px-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {!testResults?.tests || testResults.tests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Loading test suite...</td>
                </tr>
              ) : (
                testResults.tests.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-600">{t.id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{t.name}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] max-w-xs">{t.expected}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300 max-w-xs">{t.actual}</td>
                    <td className="py-3 px-4 text-right">
                      {t.status === 'PASSED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <Check className="w-3 h-3" /> PASSED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <X className="w-3 h-3" /> FAILED
                        </span>
                      )}
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
