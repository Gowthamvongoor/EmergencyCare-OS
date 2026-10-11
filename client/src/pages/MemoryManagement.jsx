import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  HardDrive,
  Cpu,
  Boxes,
  RotateCcw,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';

export default function MemoryManagement() {
  const [memoryState, setMemoryState] = useState(null);
  const [reqSize, setReqSize] = useState(8);
  const [patientId, setPatientId] = useState('PAT-SURGE');
  const [algorithm, setAlgorithm] = useState('First-Fit');
  const [loading, setLoading] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadMemoryState();
  }, []);

  const loadMemoryState = async () => {
    try {
      const data = await api.getMemoryState();
      setMemoryState(data);
    } catch (err) {
      addToast(err.message || 'Failed to load memory state', 'error');
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.allocateMemory(reqSize, patientId, algorithm);
      setMemoryState(res.state);
      addToast(`Allocated block ${res.allocatedBlock.id} using ${res.algorithm}! Internal Frag: ${res.internalFragmentation}u`, 'success');
    } catch (err) {
      addToast(err.message || 'Memory allocation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeallocate = async (blockId) => {
    try {
      const res = await api.deallocateMemory(blockId);
      setMemoryState(res.state);
      addToast(`Block ${blockId} freed into contiguous memory pool`, 'info');
    } catch (err) {
      addToast(err.message || 'Deallocation failed', 'error');
    }
  };

  const handleReset = async () => {
    try {
      const res = await api.resetMemory();
      setMemoryState(res);
      addToast('Hospital capacity partitions reset to baseline', 'info');
    } catch (err) {
      addToast(err.message || 'Reset failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <HardDrive className="w-6 h-6 text-teal-600" />
            Hospital Memory Management & Capacity Partitions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Models hospital wards and bed pools as contiguous memory partitions. Demonstrates dynamic placement (First-Fit, Best-Fit, Worst-Fit) and tracks internal vs external fragmentation.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition self-start flex items-center gap-1.5 text-xs font-semibold"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Partition Map
        </button>
      </div>

      {/* KPI Fragmentation Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-400 block uppercase">Total Ward Capacity</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {memoryState?.totalCapacity || 100}
          </span>
          <span className="text-[10px] text-slate-400 block font-sans">Capacity Units</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-teal-600 block uppercase font-bold">Allocated Units</span>
          <span className="text-2xl font-black text-teal-600">
            {memoryState?.totalAllocated || 55}
          </span>
          <span className="text-[10px] text-slate-400 block font-sans">{memoryState?.utilizationRate || 55}% Occupancy</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-amber-600 block uppercase font-bold">Internal Fragmentation</span>
          <span className="text-2xl font-black text-amber-600">
            {memoryState?.internalFragmentation || 10}
          </span>
          <span className="text-[10px] text-slate-400 block font-sans">Unused within blocks</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-rose-600 block uppercase font-bold">External Fragmentation</span>
          <span className="text-2xl font-black text-rose-600">
            {memoryState?.externalFragmentation || 35}
          </span>
          <span className="text-[10px] text-slate-400 block font-sans">Dispersed free slots</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-sky-600 block uppercase font-bold">Contiguous Free Pool</span>
          <span className="text-2xl font-black text-sky-600">
            {memoryState?.freeCapacity || 45}
          </span>
          <span className="text-[10px] text-slate-400 block font-sans">Total Unallocated</span>
        </div>
      </div>

      {/* Visual Memory Map (Partition Strip) */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            Contiguous Memory Allocation Strip (Hospital Address Space 0x00 &ndash; 0x64)
          </h3>
          <span className="text-xs font-mono text-slate-400">100 Units Contiguous Memory</span>
        </div>

        {/* Visual Bar representation */}
        <div className="w-full h-16 rounded-2xl overflow-hidden flex border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-inner">
          {memoryState?.partitions?.map(p => {
            const isOccupied = p.status === 'OCCUPIED';
            const widthPct = p.size; // out of 100

            return (
              <div
                key={p.id}
                style={{ width: `${widthPct}%` }}
                className={`relative h-full flex flex-col items-center justify-center text-white px-1 border-r border-white/20 last:border-r-0 transition group cursor-pointer ${
                  isOccupied ? 'bg-teal-600 dark:bg-teal-700' : 'bg-slate-400 dark:bg-slate-700 opacity-60'
                }`}
                title={`${p.name} (Size: ${p.size}u, Status: ${p.status})`}
              >
                <span className="text-[11px] font-mono font-bold truncate max-w-full drop-shadow-sm">
                  {p.id}
                </span>
                <span className="text-[9px] font-medium opacity-85 truncate max-w-full">
                  {isOccupied ? `${p.allocated}/${p.size}u` : `${p.size}u Free`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>0x0000 (Base)</span>
          <div className="flex items-center gap-4 text-xs font-sans">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-600"></span> Occupied Block</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-400"></span> Free Partition</span>
          </div>
          <span>0x0064 (Limit)</span>
        </div>
      </div>

      {/* Partitions List & Dynamic Allocator Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Partition Cards (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Hospital Memory Partitions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {memoryState?.partitions?.map(p => {
              const isOccupied = p.status === 'OCCUPIED';
              const internalFrag = isOccupied ? p.size - p.allocated : 0;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                    isOccupied
                      ? 'border-teal-400 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 text-slate-900 dark:text-slate-100'
                      : 'border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 font-mono text-xs">
                      <span className="font-bold text-teal-600 dark:text-teal-400">{p.id}</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isOccupied ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {p.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</h4>
                    <span className="text-[11px] font-mono text-slate-500 block mt-0.5">Partition Size: <strong>{p.size} units</strong></span>

                    {isOccupied && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Allocated Space:</span>
                          <span className="font-bold text-teal-600">{p.allocated} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Internal Frag:</span>
                          <span className="font-bold text-amber-600">{internalFrag} units wasted</span>
                        </div>
                        <div className="truncate text-slate-400 text-[10px] pt-1">
                          Tenant: {p.patientId}
                        </div>
                      </div>
                    )}
                  </div>

                  {isOccupied && (
                    <button
                      onClick={() => handleDeallocate(p.id)}
                      className="w-full py-1.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                    >
                      Deallocate & Free Partition
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Allocation Strategy Tester (1 col) */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-teal-600" />
              Dynamic Memory Allocator
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select allocation algorithm to test memory placement into available partitions.
            </p>

            <form onSubmit={handleAllocate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Required Capacity Units</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={reqSize}
                  onChange={(e) => setReqSize(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Placement Strategy Algorithm</label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  <option value="First-Fit">First-Fit (First sufficient block)</option>
                  <option value="Best-Fit">Best-Fit (Smallest sufficient block)</option>
                  <option value="Worst-Fit">Worst-Fit (Largest available block)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Patient Group Identifier</label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-md shadow-teal-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Boxes className="w-4 h-4" />
                Allocate Partition ({algorithm})
              </button>
            </form>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-[11px] text-slate-400 leading-relaxed">
            <strong>Theory:</strong> Best-fit minimizes internal fragmentation per allocation, while First-fit is fastest. Unused remnants result in internal fragmentation.
          </div>
        </div>

      </div>
    </div>
  );
}
