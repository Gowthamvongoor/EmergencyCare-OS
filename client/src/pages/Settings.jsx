import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import Modal from '../components/Modal';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  RotateCcw,
  ShieldCheck,
  HardDrive,
  Cpu,
  User,
  AlertTriangle,
  Server
} from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetDatabase = async () => {
    setResetting(true);
    try {
      await api.resetDatabase();
      addToast('Database successfully reset to initial demo state!', 'success');
      setIsResetModalOpen(false);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      addToast(err.message || 'Failed to reset database', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-teal-600" />
          System Settings & Environment Configuration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Adjust kernel preferences, monitor active session profile, and restore factory demo data.
        </p>
      </div>

      {/* Active User Profile Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <User className="w-4 h-4 text-teal-600" />
          Active Authenticated Session
        </h3>

        <div className="flex items-center gap-4">
          <span className="text-4xl">{user?.avatar || '👨‍⚕️'}</span>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">{user?.name}</h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
              <span>{user?.email}</span>
              <span>&bull;</span>
              <span className="text-teal-600 dark:text-teal-400 font-bold">{user?.role}</span>
              <span>&bull;</span>
              <span>{user?.department}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Display & Appearance Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          Interface Display & Appearance
        </h3>

        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Color Theme Preference</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Toggle between Clinical Day mode and Low-Light Night Shift mode</p>
          </div>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          </button>
        </div>
      </div>

      {/* Architecture & Server Environment Info */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Server className="w-4 h-4 text-teal-600" />
          Server & Runtime Architecture
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">API Backend</span>
            <span className="font-bold text-teal-600">Node.js Express v4</span>
            <span className="text-slate-400 text-[10px] block mt-0.5 font-sans">Port 5000 REST Engine</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Client Runtime</span>
            <span className="font-bold text-sky-600">React 18 & Vite 5</span>
            <span className="text-slate-400 text-[10px] block mt-0.5 font-sans">Tailwind CSS + Recharts</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Persistence Engine</span>
            <span className="font-bold text-purple-600">Local JSON Store</span>
            <span className="text-slate-400 text-[10px] block mt-0.5 font-sans">Atomic Thread-Safe Sync</span>
          </div>
        </div>
      </div>

      {/* Database Reset Danger Zone */}
      {user?.role === 'Admin' && (
        <div className="p-6 bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Administrative Maintenance (Demo Reset)
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Factory Reset System Database</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Restores all 22 patients, 10 doctors, 20 beds, 8 ambulances, and initial Banker's matrices to original seed state.
              </p>
            </div>

            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition flex items-center gap-1.5 self-start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Database to Demo State
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isResetModalOpen && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title="Confirm Factory Demo Reset"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Are you sure you want to reset the entire database? All newly added patients, beds, and custom allocations will be returned to initial seed state.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetDatabase}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-md shadow-rose-600/20"
              >
                {resetting ? 'Resetting Store...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
