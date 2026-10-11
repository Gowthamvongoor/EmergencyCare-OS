import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  User,
  Scissors,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function OperationTheatres() {
  const [ots, setOts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedOt, setSelectedOt] = useState(null);
  const [scheduleData, setScheduleData] = useState({ patientId: '', surgeryType: '', leadSurgeon: '', estDurationHours: 3 });

  const { can } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadOts();
  }, []);

  const loadOts = async () => {
    try {
      const [otRes, patRes] = await Promise.all([
        api.getOTs(),
        api.getPatients()
      ]);
      setOts(otRes);
      setPatients(patRes.patients);
      const crit = patRes.patients.find(p => p.priority === 'Critical' && !p.assignedOT);
      if (crit) {
        setScheduleData({
          patientId: crit.id,
          surgeryType: crit.emergencyType,
          leadSurgeon: crit.assignedDoctor || 'Dr. Angela Rossi',
          estDurationHours: 3
        });
      }
    } catch (err) {
      addToast(err.message || 'Failed to load OTs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSchedule = (ot) => {
    setSelectedOt(ot);
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleData.patientId) return;

    try {
      const res = await api.scheduleOT({
        otId: selectedOt?.id || null,
        ...scheduleData
      });
      addToast(`Surgery scheduled in ${res.ot.id} with priority ${res.ot.priority}`, 'success');
      setIsScheduleModalOpen(false);
      loadOts();
    } catch (err) {
      addToast(err.message || 'Failed to schedule OT', 'error');
    }
  };

  const handleRelease = async (otId) => {
    try {
      await api.releaseOT(otId, 'CLEANING');
      addToast(`Operation Theatre ${otId} released and set to CLEANING`, 'success');
      loadOts();
    } catch (err) {
      addToast(err.message || 'Failed to release OT', 'error');
    }
  };

  const handleStatusChange = async (otId, status) => {
    try {
      await api.updateBedStatus(otId, status); // or api.releaseOT
      addToast(`OT ${otId} status changed to ${status}`, 'info');
      loadOts();
    } catch (err) {
      addToast(err.message || 'Failed to update OT', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-teal-600" />
            Operation Theatre (OT) Surgical Scheduling
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Priority-driven surgical theatre management. Critical trauma surgeries preempt routine scheduled procedures.
          </p>
        </div>

        <button
          onClick={loadOts}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition self-start"
          title="Refresh Theatres"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Theatres Layout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ots.map(ot => {
          const isBusy = ot.status === 'IN USE';
          const isAvailable = ot.status === 'AVAILABLE';

          return (
            <div
              key={ot.id}
              className={`p-6 rounded-3xl border-2 shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                isBusy
                  ? 'border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30'
                  : isAvailable
                  ? 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{ot.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isBusy ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse' :
                      isAvailable ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                      'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}>
                      {ot.status}
                    </span>
                  </div>

                  {ot.priority && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300">
                      Priority: {ot.priority}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{ot.name}</h3>

                {isBusy ? (
                  <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Procedure</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{ot.surgeryType}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block">Lead Surgeon:</span>
                        <span className="font-semibold text-teal-600 dark:text-teal-400">{ot.leadSurgeon}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Patient PID:</span>
                        <span className="font-mono font-bold">{ot.currentPatient}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                      <span>Started: {new Date(ot.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>Est End: {new Date(ot.estCompletion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-2 italic">
                    {isAvailable ? 'Sterile environment ready for emergency or elective intervention.' : 'Undergoing terminal disinfection & sterilization.'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold">
                {isAvailable ? (
                  <button
                    onClick={() => handleOpenSchedule(ot)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Scissors className="w-4 h-4" />
                    Schedule Emergency Operation
                  </button>
                ) : isBusy ? (
                  <button
                    onClick={() => handleRelease(ot.id)}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Surgery Complete (Release & Disinfect)
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(ot.id, 'AVAILABLE')}
                    className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition"
                  >
                    Mark Ready & Sterile
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule OT Modal */}
      {isScheduleModalOpen && (
        <Modal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          title={`Schedule Emergency Surgery in ${selectedOt ? selectedOt.id : 'Available OT'}`}
        >
          <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Select Patient *</label>
              <select
                required
                value={scheduleData.patientId}
                onChange={(e) => {
                  const p = patients.find(pt => pt.id === e.target.value);
                  setScheduleData({
                    ...scheduleData,
                    patientId: e.target.value,
                    surgeryType: p ? p.emergencyType : scheduleData.surgeryType,
                    leadSurgeon: p?.assignedDoctor || scheduleData.leadSurgeon
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.id} - {p.name} [{p.priority} Priority] ({p.emergencyType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Surgical Procedure Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Exploratory Laparotomy, Craniotomy"
                value={scheduleData.surgeryType}
                onChange={(e) => setScheduleData({ ...scheduleData, surgeryType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Lead Surgeon</label>
                <input
                  type="text"
                  value={scheduleData.leadSurgeon}
                  onChange={(e) => setScheduleData({ ...scheduleData, leadSurgeon: e.target.value })}
                  placeholder="Dr. Angela Rossi"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Estimated Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={scheduleData.estDurationHours}
                  onChange={(e) => setScheduleData({ ...scheduleData, estDurationHours: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-md shadow-teal-600/20"
              >
                Book Operation Theatre
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
