import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Activity,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Siren,
  X
} from 'lucide-react';

export default function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const notifications = [
    { id: 1, title: 'Critical Patient Admitted', desc: 'PAT-1006 requires urgent AAA intervention in OT-03', time: '2m ago', type: 'critical' },
    { id: 2, title: 'ICU Bed Capacity Alert', desc: 'ICU occupancy reached 82%. 3 units remaining.', time: '14m ago', type: 'warning' },
    { id: 3, title: 'Ambulance AMB-04 Dispatched', desc: 'Unit Alfa-4 en route to Highway 101 Ex 42', time: '25m ago', type: 'info' }
  ];

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Hospital Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Hospital Operating Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Hospital Status: LEVEL 1 TRAUMA ACTIVE</span>
        </div>
      </div>

      {/* Middle/Right: Live Clock & Action Badges */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>{formattedDate}</span>
          <span className="font-bold text-slate-900 dark:text-white">{formattedTime}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in duration-100">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Emergency Alerts
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer">
                    <div className="flex items-start gap-2.5">
                      {n.type === 'critical' ? (
                        <Siren className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      ) : n.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <Activity className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{n.desc}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current User Role Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <span className="text-lg">{user?.avatar || '👩‍⚕️'}</span>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              {user?.name?.split(' ')[1] || user?.name || 'User'}
            </span>
            <span className="block text-[10px] font-medium text-teal-600 dark:text-teal-400 leading-tight">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
