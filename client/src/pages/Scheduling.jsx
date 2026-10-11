import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import GanttChart from '../components/GanttChart';
import { useToast } from '../context/ToastContext';
import {
  GitBranch,
  Play,
  Clock,
  CheckCircle2,
  Sliders,
  TrendingDown,
  Cpu,
  Activity,
  BarChart2,
  Info
} from 'lucide-react';

export default function Scheduling() {
  const [algorithm, setAlgorithm] = useState('priority'); // 'priority', 'fcfs', 'round-robin'
  const [quantum, setQuantum] = useState(2);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    runAlgorithm();
  }, [algorithm, quantum]);

  const runAlgorithm = async () => {
    setLoading(true);
    try {
      const data = await api.getScheduling(algorithm, quantum);
      setResults(data);
    } catch (err) {
      addToast(err.message || 'Scheduling execution failed', 'error');
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
            <GitBranch className="w-6 h-6 text-teal-600" />
            OS CPU Scheduling Simulator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulates emergency patient treatment on clinical CPU cores using authentic algorithmic logic: Priority Preemption, FCFS, and Time-Sliced Round Robin.
          </p>
        </div>

        <button
          onClick={runAlgorithm}
          disabled={loading}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center gap-2 self-start"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {loading ? 'Executing Engine...' : 'Run Scheduling Algorithm'}
        </button>
      </div>

      {/* Algorithm Control Panel */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Algorithm Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select CPU Scheduling Algorithm
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'priority', name: 'Priority Scheduling', desc: 'Critical P1 > High P2 > Medium P3 > Low P4' },
                { id: 'fcfs', name: 'First-Come, First-Served (FCFS)', desc: 'Arrival order strictly' },
                { id: 'round-robin', name: 'Round Robin (Preemptive)', desc: 'Time-sliced equal quantum sharing' }
              ].map(algo => (
                <button
                  key={algo.id}
                  onClick={() => setAlgorithm(algo.id)}
                  className={`px-4 py-2.5 rounded-xl border text-xs text-left transition ${
                    algorithm === algo.id
                      ? 'bg-teal-50 dark:bg-teal-950/80 border-teal-500 text-teal-800 dark:text-teal-200 ring-2 ring-teal-500/20 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>{algo.name}</div>
                  <div className="text-[10px] opacity-75 font-normal">{algo.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Round Robin Time Quantum Slider */}
          {algorithm === 'round-robin' && (
            <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 min-w-[220px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-teal-600" />
                  Time Quantum (q)
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-600 text-white">
                  {quantum} units
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={quantum}
                onChange={(e) => setQuantum(parseInt(e.target.value, 10))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-teal-700 dark:text-teal-300 mt-1 font-mono">
                <span>1 unit (Fast context switch)</span>
                <span>8 units (Near FCFS)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Aggregate KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Average Waiting Time (AWT)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-teal-600 dark:text-teal-400 font-mono">
              {results?.avgWaitingTime || 0}
            </span>
            <span className="text-xs text-slate-500 font-mono">time units</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Mean duration in Ready queue</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Average Turnaround Time (TAT)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-sky-600 dark:text-sky-400 font-mono">
              {results?.avgTurnaroundTime || 0}
            </span>
            <span className="text-xs text-slate-500 font-mono">time units</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Completion Time &minus; Arrival Time</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Average Response Time (ART)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {results?.avgResponseTime || 0}
            </span>
            <span className="text-xs text-slate-500 font-mono">time units</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">First doctor intervention delay</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Pipeline Duration
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono">
              {results?.totalTime || 0}
            </span>
            <span className="text-xs text-slate-500 font-mono">units</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total simulation clock ticks</p>
        </div>
      </div>

      {/* Interactive Gantt Chart Timeline */}
      <GanttChart
        gantt={results?.gantt || []}
        totalTime={results?.totalTime || 20}
        algorithmName={results?.algorithm || 'Scheduling Timeline'}
      />

      {/* Detailed Per-Process Scheduling Calculations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-teal-600" />
              Calculated Process Metrics (Proof of Algorithmic Logic)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formulas: Turnaround = Completion &minus; Arrival | Waiting = Turnaround &minus; Burst | Response = Start &minus; Arrival
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">PID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Priority (Value)</th>
                <th className="py-3 px-4 text-center">Arrival (AT)</th>
                <th className="py-3 px-4 text-center">Burst (BT)</th>
                <th className="py-3 px-4 text-center">Start (ST)</th>
                <th className="py-3 px-4 text-center">Completion (CT)</th>
                <th className="py-3 px-4 text-center text-sky-600 dark:text-sky-400">Turnaround (TAT)</th>
                <th className="py-3 px-4 text-center text-teal-600 dark:text-teal-400">Waiting (WT)</th>
                <th className="py-3 px-4 text-center text-purple-600 dark:text-purple-400">Response (RT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {!results?.metrics || results.metrics.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">No scheduled processes.</td>
                </tr>
              ) : (
                results.metrics.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-teal-600">{p.id}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">{p.name}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                        p.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                        p.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {p.priority} ({p.priorityValue})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{p.arrivalTime}</td>
                    <td className="py-3 px-4 text-center font-bold">{p.burstTime}</td>
                    <td className="py-3 px-4 text-center">{p.startTime}</td>
                    <td className="py-3 px-4 text-center">{p.completionTime}</td>
                    <td className="py-3 px-4 text-center font-bold text-sky-600 dark:text-sky-400">{p.turnaroundTime}</td>
                    <td className="py-3 px-4 text-center font-bold text-teal-600 dark:text-teal-400">{p.waitingTime}</td>
                    <td className="py-3 px-4 text-center font-bold text-purple-600 dark:text-purple-400">{p.responseTime}</td>
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
