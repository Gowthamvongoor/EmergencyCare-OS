import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import {
  Ambulance,
  MapPin,
  Clock,
  Fuel,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Navigation
} from 'lucide-react';

export default function AmbulanceManagement() {
  const [ambulances, setAmbulances] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [dispatchData, setDispatchData] = useState({ patientId: '', location: '', destination: 'Metro General Emergency Dept' });

  const { can } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadAmbulances();
  }, []);

  const loadAmbulances = async () => {
    try {
      const [ambRes, patRes] = await Promise.all([
        api.getAmbulances(),
        api.getPatients()
      ]);
      setAmbulances(ambRes);
      setPatients(patRes.patients);
      const waiting = patRes.patients.find(p => ['WAITING', 'BLOCKED', 'READY'].includes(p.processState));
      if (waiting) {
        setDispatchData(prev => ({
          ...prev,
          patientId: waiting.id,
          location: `Emergency Site: Sector ${Math.floor(Math.random() * 10) + 1}`
        }));
      }
    } catch (err) {
      addToast(err.message || 'Failed to load ambulances', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDispatch = (amb = null) => {
    setSelectedAmbulance(amb);
    setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchData.patientId) return;

    try {
      const res = await api.dispatchAmbulance(
        selectedAmbulance?.id || null,
        dispatchData.patientId,
        dispatchData.location,
        dispatchData.destination
      );
      addToast(`Ambulance ${res.ambulance.id} dispatched! ETA: ${res.ambulance.eta} mins`, 'success');
      setIsDispatchModalOpen(false);
      loadAmbulances();
    } catch (err) {
      addToast(err.message || 'Failed to dispatch ambulance', 'error');
    }
  };

  const handleStatusChange = async (ambId, newStatus) => {
    try {
      await api.updateAmbulanceStatus(ambId, newStatus);
      addToast(`Ambulance ${ambId} status changed to ${newStatus}`, 'info');
      loadAmbulances();
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">AVAILABLE</span>;
      case 'DISPATCHED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">DISPATCHED</span>;
      case 'ON_ROUTE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 animate-pulse">ON_ROUTE</span>;
      case 'AT_HOSPITAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800">AT_HOSPITAL</span>;
      case 'MAINTENANCE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">MAINTENANCE</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Ambulance className="w-6 h-6 text-teal-600" />
            Emergency Ambulance Fleet & Dispatch Routing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time ambulance dispatching based on patient priority scheduling and simulated spatial distance ETA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAmbulances}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            title="Refresh Fleet"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {can('ambulance_dispatch', 'WRITE') && (
            <button
              onClick={() => handleOpenDispatch(null)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch Ambulance
            </button>
          )}
        </div>
      </div>

      {/* Simulated Map / Radar Screen Overview */}
      <div className="p-5 bg-slate-950 rounded-3xl border border-slate-800 text-slate-100 relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-teal-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Metro Emergency Sector GPS Radar (Simulated Map)
            </span>
          </div>
          <span className="text-[10px] font-mono text-teal-400 font-semibold px-2 py-0.5 rounded bg-teal-950/60 border border-teal-800">
            HOSPITAL BASE: (50, 70)
          </span>
        </div>

        {/* 2D Simulated Coordinate Plane */}
        <div className="relative w-full h-44 rounded-2xl bg-slate-900 border border-slate-800/80 overflow-hidden flex items-center justify-center">
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 divide-x divide-y divide-slate-800/50 pointer-events-none"></div>

          {/* Hospital Center Point */}
          <div className="absolute left-1/2 top-2/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
            <span className="w-4 h-4 rounded-full bg-rose-500 ring-4 ring-rose-500/30 flex items-center justify-center text-[8px] font-bold">H</span>
            <span className="text-[9px] font-mono font-bold text-rose-300 mt-1">Metro Hospital ED</span>
          </div>

          {/* Plot ambulances on radar */}
          {ambulances.map(a => {
            const x = a.coords ? a.coords.x : 50;
            const y = a.coords ? a.coords.y : 50;
            const isMoving = a.status === 'ON_ROUTE' || a.status === 'DISPATCHED';

            return (
              <div
                key={a.id}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-20"
              >
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-black ${
                  a.status === 'AVAILABLE' ? 'bg-emerald-400' :
                  a.status === 'MAINTENANCE' ? 'bg-slate-500' :
                  'bg-amber-400 ring-4 ring-amber-400/40 animate-pulse'
                }`}>
                  {a.id.replace('AMB-0', 'A')}
                </span>
                <span className="text-[9px] font-mono text-slate-300 group-hover:text-white bg-black/60 px-1 rounded mt-0.5 whitespace-nowrap">
                  {a.code} ({a.status})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ambulance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ambulances.map(a => (
          <div
            key={a.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs text-teal-600 dark:text-teal-400">{a.id}</span>
                {getStatusBadge(a.status)}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{a.code}</h3>
              <p className="text-xs text-slate-500">Driver: <strong>{a.driver}</strong></p>
            </div>

            {/* Location & Status Info */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{a.location}</span>
              </div>
              {a.assignedPatient && (
                <div className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">
                  Assigned: {a.assignedPatient}
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3 h-3 text-sky-500" />
                  ETA: <strong>{a.eta > 0 ? `${a.eta}m` : 'Arrived'}</strong>
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Fuel className="w-3 h-3 text-amber-500" />
                  Fuel: <strong>{a.fuel}%</strong>
                </span>
              </div>
            </div>

            {/* Status Transition Control Buttons */}
            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
              {a.status === 'AVAILABLE' ? (
                <button
                  onClick={() => handleOpenDispatch(a)}
                  className="w-full py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition"
                >
                  Dispatch to Patient
                </button>
              ) : a.status === 'DISPATCHED' ? (
                <button
                  onClick={() => handleStatusChange(a.id, 'ON_ROUTE')}
                  className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition"
                >
                  Mark On Route
                </button>
              ) : a.status === 'ON_ROUTE' ? (
                <button
                  onClick={() => handleStatusChange(a.id, 'AT_HOSPITAL')}
                  className="w-full py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition"
                >
                  Arrived at Hospital
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange(a.id, 'AVAILABLE')}
                  className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition"
                >
                  Return to Available Pool
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dispatch Modal */}
      {isDispatchModalOpen && (
        <Modal
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          title={`Dispatch Emergency Ambulance ${selectedAmbulance ? `(${selectedAmbulance.id})` : ''}`}
        >
          <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Select Patient Requiring Dispatch *</label>
              <select
                required
                value={dispatchData.patientId}
                onChange={(e) => setDispatchData({ ...dispatchData, patientId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.id} - {p.name} [{p.priority}] ({p.emergencyType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Accident / Incident Site Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Interstate Highway 80 Exit 22"
                value={dispatchData.location}
                onChange={(e) => setDispatchData({ ...dispatchData, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Destination Facility</label>
              <input
                type="text"
                value={dispatchData.destination}
                onChange={(e) => setDispatchData({ ...dispatchData, destination: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-md shadow-teal-600/20"
              >
                Confirm Dispatch
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
