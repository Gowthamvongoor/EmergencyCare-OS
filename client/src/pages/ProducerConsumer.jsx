import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Repeat,
  Plus,
  Minus,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Activity,
  Users,
  Sliders,
  Clock
} from 'lucide-react';

export default function ProducerConsumer() {
  const [simState, setSimState] = useState(null);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchState();
  }, []);

  // Auto-simulation interval
  useEffect(() => {
    let interval = null;
    if (isAutoRunning) {
      interval = setInterval(async () => {
        // Randomly produce or consume
        const rand = Math.random();
        if (rand > 0.45) {
          try { await api.produceCase(); } catch (e) {}
        } else {
          try { await api.consumeCase(); } catch (e) {}
        }
        fetchState();
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isAutoRunning]);

  const fetchState = async () => {
    try {
      const data = await api.getProducerConsumerState();
      setSimState(data);
    } catch (err) {
      console.error('Failed to get PC state:', err);
    }
  };

  const handleProduce = async () => {
    setLoading(true);
    try {
      const res = await api.produceCase();
      setSimState(res.state);
      addToast(`Reception produced case: ${res.item.name} (${res.item.condition})`, 'success');
    } catch (err) {
      addToast(err.message || 'Buffer overflow! Reception blocked.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConsume = async () => {
    setLoading(true);
    try {
      const res = await api.consumeCase();
      setSimState(res.state);
      addToast(`Treatment consumed case: ${res.item.name}`, 'info');
    } catch (err) {
      addToast(err.message || 'Buffer empty! Treatment team blocked.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleCapacityChange = async (newCap) => {
    try {
      const res = await api.setBufferCapacity(newCap);
      setSimState(res);
      addToast(`Bounded buffer resized to ${newCap} slots`, 'info');
    } catch (err) {
      addToast(err.message || 'Failed to update capacity', 'error');
    }
  };

  const handleReset = async () => {
    try {
      const res = await api.resetProducerConsumer();
      setSimState(res);
      setIsAutoRunning(false);
      addToast('Producer-Consumer simulation reset', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to reset', 'error');
    }
  };

  const capacity = simState?.capacity || 6;
  const buffer = simState?.buffer || [];
  const semaphores = simState?.semaphores || { mutex: 1, empty: 3, full: 3 };
  const stats = simState?.stats || { producedCount: 3, consumedCount: 0, occupancyRate: 50 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Repeat className="w-6 h-6 text-teal-600" />
            Producer–Consumer Problem (Bounded Buffer & Semaphores)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Demonstrates classic OS process synchronization. <strong>Producer</strong> (Emergency Reception) admits cases into a bounded triage queue; <strong>Consumer</strong> (Treatment Unit) dequeues patients for doctor intervention.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoRunning(!isAutoRunning)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 ${
              isAutoRunning
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
            }`}
          >
            {isAutoRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isAutoRunning ? 'Pause Auto-Simulation' : 'Start Auto-Simulation'}
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Semaphore & Buffer Invariant Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Semaphore mutex (Binary)
          </span>
          <span className="font-mono text-3xl font-black text-teal-600 dark:text-teal-400">
            {semaphores.mutex}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Critical Section Guard</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Semaphore empty (Counting)
          </span>
          <span className="font-mono text-3xl font-black text-sky-600 dark:text-sky-400">
            {semaphores.empty}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Free Bounded Slots</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Semaphore full (Counting)
          </span>
          <span className="font-mono text-3xl font-black text-purple-600 dark:text-purple-400">
            {semaphores.full}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Occupied Patient Slots</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Buffer Occupancy
          </span>
          <span className={`font-mono text-3xl font-black ${stats.occupancyRate >= 100 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}>
            {stats.occupancyRate}%
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">{buffer.length} of {capacity} items</span>
        </div>
      </div>

      {/* Overflow & Underflow Warning Banners */}
      {simState?.isFull && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
          <div className="text-xs">
            <strong>BUFFER FULL (QUEUE OVERFLOW):</strong> Emergency Reception (Producer) is blocked on <code className="font-mono font-bold">wait(empty)</code>! Incoming ambulances must hold until treatment teams consume cases.
          </div>
        </div>
      )}

      {simState?.isEmpty && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs">
            <strong>BUFFER EMPTY (QUEUE UNDERFLOW):</strong> Treatment Department (Consumer) is idle and blocked on <code className="font-mono font-bold">wait(full)</code>! Doctors are awaiting incoming emergency presentations.
          </div>
        </div>
      )}

      {/* Interactive Producer - Buffer - Consumer Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        
        {/* Producer Box: Reception (1 col) */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-center space-y-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-2">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Producer: Reception</h3>
            <p className="text-[11px] text-slate-500 mt-1">Admits incoming emergency patients</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-xs">
            <span className="text-slate-400 block text-[10px] uppercase">Produced Count</span>
            <span className="text-xl font-bold text-teal-600 dark:text-teal-400">{stats.producedCount} cases</span>
          </div>

          <button
            onClick={handleProduce}
            disabled={loading || simState?.isFull}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-600/20 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Produce Emergency Case
          </button>
        </div>

        {/* Center: Bounded Buffer Slots (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-teal-600" />
              Bounded Emergency Buffer ({buffer.length}/{capacity} Slots)
            </h3>

            {/* Capacity Slider */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500">Buffer Size:</span>
              <select
                value={capacity}
                onChange={(e) => handleCapacityChange(parseInt(e.target.value, 10))}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                <option value={4}>4 Slots</option>
                <option value={6}>6 Slots (Default)</option>
                <option value={8}>8 Slots</option>
                <option value={10}>10 Slots</option>
              </select>
            </div>
          </div>

          {/* Visual Buffer Slot Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {Array.from({ length: capacity }).map((_, slotIdx) => {
              const item = buffer[slotIdx];
              const isOccupied = !!item;

              return (
                <div
                  key={slotIdx}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[90px] ${
                    isOccupied
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 shadow-sm'
                      : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold">Slot #{slotIdx + 1}</span>
                    <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                  </div>

                  {isOccupied ? (
                    <div className="my-auto">
                      <div className="font-bold text-xs truncate text-slate-900 dark:text-white">{item.name}</div>
                      <div className="text-[10px] opacity-75 truncate">{item.condition}</div>
                    </div>
                  ) : (
                    <div className="my-auto text-center text-[11px] italic text-slate-400">
                      Empty Slot
                    </div>
                  )}

                  <div className="text-[9px] font-mono opacity-60">
                    {isOccupied ? item.id : 'Free (empty++)'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Consumer Box: Treatment Department (1 col) */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-center space-y-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-2">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Consumer: Treatment</h3>
            <p className="text-[11px] text-slate-500 mt-1">Dequeues cases for urgent doctor care</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-xs">
            <span className="text-slate-400 block text-[10px] uppercase">Processed Count</span>
            <span className="text-xl font-bold text-sky-600 dark:text-sky-400">{stats.consumedCount} cases</span>
          </div>

          <button
            onClick={handleConsume}
            disabled={loading || simState?.isEmpty}
            className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-600/20 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Minus className="w-4 h-4" />
            Consume Emergency Case
          </button>
        </div>

      </div>

      {/* Event Stream Log */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          Semaphore & Queue Execution Log
        </h3>
        <div className="space-y-1.5 font-mono text-xs max-h-44 overflow-y-auto pr-2 divide-y divide-slate-100 dark:divide-slate-800">
          {!simState?.recentLogs || simState.recentLogs.length === 0 ? (
            <p className="text-slate-400 italic py-2">No producer-consumer events recorded yet.</p>
          ) : (
            simState.recentLogs.map(log => (
              <div key={log.id} className="py-2 flex items-start justify-between gap-4">
                <div className="flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    log.level === 'SUCCESS' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' :
                    log.level === 'WARNING' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{log.message}</span>
                </div>
                <span className="text-slate-400 text-[11px] shrink-0">{log.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
