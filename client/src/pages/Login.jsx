import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Activity, ShieldCheck, UserCheck, Stethoscope, HeartPulse, Radio } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      addToast(`Welcome back, ${user.name} (${user.role})!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  const demoAccounts = [
    {
      role: 'Admin',
      name: 'Dr. Sarah Mitchell',
      email: 'admin@hospital.com',
      pass: 'admin123',
      icon: ShieldCheck,
      color: 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
      badge: 'Full Access & Matrix Admin'
    },
    {
      role: 'Doctor',
      name: 'Dr. Robert Chen',
      email: 'doctor@hospital.com',
      pass: 'doctor123',
      icon: Stethoscope,
      color: 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
      badge: 'Patients, Queue & Records'
    },
    {
      role: 'Nurse',
      name: 'Nurse Elena Rodriguez',
      email: 'nurse@hospital.com',
      pass: 'nurse123',
      icon: HeartPulse,
      color: 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300',
      badge: 'Triage, Beds & Patient Care'
    },
    {
      role: 'Emergency Coordinator',
      name: 'David Vance',
      email: 'coordinator@hospital.com',
      pass: 'coordinator123',
      icon: Radio,
      color: 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
      badge: 'Dispatch, Queue & Resources'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10">
        
        {/* Left Column: Hospital OS Brand & Info */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              Healthcare OS Simulation Engine
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  EmergencyCare <span className="text-teal-400">OS</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono">Hospital & Resource Management</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mt-4">
              A comprehensive clinical prototype mapping fundamental <strong>Operating System concepts</strong> (Process Scheduling, Deadlock Detection, Banker's Algorithm, Mutex Synchronization, Bounded Buffers, and Protection Matrices) to real-time hospital emergency operations.
            </p>
          </div>

          {/* Quick Demo Role Selectors */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              1-Click Demo Profiles (Auto-fills Credentials):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map(acc => {
                const Icon = acc.icon;
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => selectDemoAccount(acc.email, acc.pass)}
                    className={`p-3 rounded-xl border text-left transition-all ${acc.color} ${
                      isSelected ? 'ring-2 ring-teal-400 scale-[1.02]' : 'opacity-80 hover:opacity-100 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold truncate">{acc.role}</span>
                    </div>
                    <span className="text-[11px] block opacity-85 truncate mt-0.5">{acc.email}</span>
                    <span className="text-[9px] block opacity-70 font-mono mt-0.5">{acc.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Form */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-center shadow-inner">
          <h2 className="text-lg font-bold text-white mb-1">Staff Secure Authentication</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your authorized medical credentials to sign in.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Official Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@hospital.com"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-teal-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Authenticating Session...
                  </span>
                ) : (
                  'Sign In to EmergencyCare OS'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
            Protected by RBAC & Protection Access Matrix &bull; v1.0.0
          </div>
        </div>

      </div>
    </div>
  );
}
