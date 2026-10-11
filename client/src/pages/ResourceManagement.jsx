import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import {
  Boxes,
  Plus,
  Edit2,
  BedDouble,
  Activity,
  Ambulance,
  Stethoscope,
  HeartPulse,
  Wind,
  ShieldAlert,
  Clock,
  TrendingUp
} from 'lucide-react';

export default function ResourceManagement() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRes, setSelectedRes] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newResData, setNewResData] = useState({ name: '', total: 10, unit: 'Units' });
  const [editResData, setEditResData] = useState({ total: 0, available: 0 });

  const { can, user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const data = await api.getResources();
      setResources(data);
    } catch (err) {
      addToast(err.message || 'Failed to load resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (id) => {
    if (id.includes('ICU') || id.includes('GEN')) return BedDouble;
    if (id.includes('DOC')) return Stethoscope;
    if (id.includes('NUR')) return HeartPulse;
    if (id.includes('AMB')) return Ambulance;
    if (id.includes('OT')) return Activity;
    if (id.includes('VENT')) return Wind;
    return ShieldAlert;
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      await api.createResource(newResData);
      addToast(`Resource category ${newResData.name} added successfully`, 'success');
      setIsAddModalOpen(false);
      setNewResData({ name: '', total: 10, unit: 'Units' });
      loadResources();
    } catch (err) {
      addToast(err.message || 'Failed to create resource', 'error');
    }
  };

  const handleUpdateResource = async (e) => {
    e.preventDefault();
    try {
      await api.updateResource(selectedRes.id, editResData);
      addToast(`Updated limits for ${selectedRes.name}`, 'success');
      setIsEditModalOpen(false);
      loadResources();
    } catch (err) {
      addToast(err.message || 'Failed to update resource', 'error');
    }
  };

  const openEditModal = (res) => {
    setSelectedRes(res);
    setEditResData({ total: res.total, available: res.available });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-teal-600" />
            Hospital Resource Management & Hardware Pool
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of multi-instance hospital resources (Beds, Doctors, Ventilators, OTs, Ambulances) modeled as OS system resources.
          </p>
        </div>

        {can('resource_allocation', 'WRITE') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" />
            Add Hardware / Resource
          </button>
        )}
      </div>

      {/* Resource Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {resources.map(r => {
          const Icon = getIcon(r.id);
          const utilPct = r.utilization !== undefined ? r.utilization : (r.total > 0 ? Math.round(((r.total - r.available) / r.total) * 100) : 0);
          const isCriticalScarcity = r.available <= 1 && r.total > 1;

          return (
            <div
              key={r.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm transition-all ${
                isCriticalScarcity
                  ? 'border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-500/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isCriticalScarcity ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400' : 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{r.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">{r.id}</span>
                  </div>
                </div>

                {can('resource_allocation', 'UPDATE') && (
                  <button
                    onClick={() => openEditModal(r)}
                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    title="Edit Capacity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">{r.total}</span>
                </div>
                <div>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 block uppercase font-bold">Avail</span>
                  <span className="text-base font-bold text-teal-600 dark:text-teal-400">{r.available}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Allocated</span>
                  <span className="text-base font-bold text-slate-700 dark:text-slate-300">{r.allocated || (r.total - r.available)}</span>
                </div>
              </div>

              {/* Utilization Bar */}
              <div className="mt-3.5">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Utilization</span>
                  <span className={`font-mono font-bold ${utilPct > 80 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                    {utilPct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${utilPct}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      utilPct > 85 ? 'bg-rose-500' : utilPct > 65 ? 'bg-amber-500' : 'bg-teal-500'
                    }`}
                  />
                </div>
              </div>

              {/* Waiting Patients badge */}
              {r.waiting > 0 && (
                <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-semibold border border-rose-200 dark:border-rose-900">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{r.waiting} Processes Blocked Waiting</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Resource Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Hospital Resource / Hardware Category"
        >
          <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Resource Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Negative Pressure Isolation Rooms"
                value={newResData.name}
                onChange={(e) => setNewResData({ ...newResData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Total Unit Capacity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newResData.total}
                  onChange={(e) => setNewResData({ ...newResData, total: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Measurement Unit</label>
                <input
                  type="text"
                  placeholder="Rooms, Devices, Bays"
                  value={newResData.unit}
                  onChange={(e) => setNewResData({ ...newResData, unit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-md shadow-teal-600/20"
              >
                Create Resource
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Resource Modal */}
      {isEditModalOpen && selectedRes && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Update Hardware Limits: ${selectedRes.name}`}
        >
          <form onSubmit={handleUpdateResource} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div>
                <label className="block text-slate-400 mb-1 font-sans">Total Physical Units</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editResData.total}
                  onChange={(e) => setEditResData({ ...editResData, total: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-sans">Available Free Units</label>
                <input
                  type="number"
                  min="0"
                  max={editResData.total}
                  required
                  value={editResData.available}
                  onChange={(e) => setEditResData({ ...editResData, available: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-md shadow-teal-600/20"
              >
                Save Limits
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
