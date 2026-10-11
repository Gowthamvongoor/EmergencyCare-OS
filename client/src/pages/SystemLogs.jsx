import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Terminal,
  ShieldCheck,
  Filter,
  RefreshCw,
  Search,
  AlertTriangle,
  Info,
  AlertCircle,
  Clock,
  User,
  Activity,
  Download
} from 'lucide-react';

export default function SystemLogs() {
  const [logType, setLogType] = useState('system'); // 'system' or 'audit'
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [systemLogs, setSystemLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [counts, setCounts] = useState({ total: 0, info: 0, warning: 0, error: 0, security: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const { addToast } = useToast();

  useEffect(() => {
    loadLogs();
  }, [levelFilter, logType]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      if (logType === 'system') {
        const data = await api.getSystemLogs(levelFilter);
        setSystemLogs(data.logs);
        setCounts(data.counts);
      } else {
        const data = await api.getAuditLogs();
        setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case 'INFO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">INFO</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">WARNING</span>;
      case 'ERROR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">ERROR</span>;
      case 'SECURITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">SECURITY</span>;
      default:
        return <span>{level}</span>;
    }
  };

  const filteredSystemLogs = systemLogs.filter(l =>
    !search || l.message.toLowerCase().includes(search.toLowerCase()) || l.subsystem?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(a =>
    !search || a.actor.toLowerCase().includes(search.toLowerCase()) || a.action.toLowerCase().includes(search.toLowerCase()) || a.target?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Terminal className="w-6 h-6 text-teal-600" />
            Operating System Kernel & Clinical Audit Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry stream recording process state transitions, resource allocations, mutex locks, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setLogType('system')}
              className={`px-3 py-1.5 rounded-lg transition ${logType === 'system' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}
            >
              OS Kernel Logs
            </button>
            <button
              onClick={() => setLogType('audit')}
              className={`px-3 py-1.5 rounded-lg transition ${logType === 'audit' ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}
            >
              Hospital Audit Trail
            </button>
          </div>

          <button
            onClick={loadLogs}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Counters (Only in system logs mode) */}
      {logType === 'system' && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
          <div
            onClick={() => setLevelFilter('ALL')}
            className={`p-3 rounded-2xl border cursor-pointer transition ${
              levelFilter === 'ALL' ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="text-[10px] text-slate-400 block uppercase">Total Events</span>
            <span className="text-xl font-bold">{counts.total}</span>
          </div>

          <div
            onClick={() => setLevelFilter('INFO')}
            className={`p-3 rounded-2xl border cursor-pointer transition ${
              levelFilter === 'INFO' ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="text-[10px] text-sky-600 dark:text-sky-400 block uppercase">INFO</span>
            <span className="text-xl font-bold text-sky-600 dark:text-sky-400">{counts.info}</span>
          </div>

          <div
            onClick={() => setLevelFilter('WARNING')}
            className={`p-3 rounded-2xl border cursor-pointer transition ${
              levelFilter === 'WARNING' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block uppercase">WARNING</span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{counts.warning}</span>
          </div>

          <div
            onClick={() => setLevelFilter('ERROR')}
            className={`p-3 rounded-2xl border cursor-pointer transition ${
              levelFilter === 'ERROR' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="text-[10px] text-rose-600 dark:text-rose-400 block uppercase">ERROR</span>
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{counts.error}</span>
          </div>

          <div
            onClick={() => setLevelFilter('SECURITY')}
            className={`p-3 rounded-2xl border cursor-pointer transition ${
              levelFilter === 'SECURITY' ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="text-[10px] text-purple-600 dark:text-purple-400 block uppercase">SECURITY</span>
            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{counts.security}</span>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={logType === 'system' ? "Filter messages by keyword or PID..." : "Filter by Doctor, Action, Target..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {logType === 'system' ? filteredSystemLogs.length : filteredAuditLogs.length} events
        </span>
      </div>

      {/* Log Feed */}
      <div className="bg-slate-950 text-slate-200 p-6 rounded-3xl border border-slate-800 shadow-xl overflow-hidden font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] text-slate-400 mb-4">
          <span>STREAM: /dev/kmsg &bull; stdout & stderr multiplex</span>
          <span>BUFFER: RING_200</span>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-2 divide-y divide-slate-900">
          {loading ? (
            <div className="py-8 text-center text-slate-500">Querying telemetry stream...</div>
          ) : logType === 'system' ? (
            filteredSystemLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No system events match current filter.</div>
            ) : (
              filteredSystemLogs.map(log => (
                <div key={log.id} className="pt-2 flex items-start gap-3 hover:bg-slate-900/40 p-1.5 rounded-lg transition">
                  <span className="text-slate-500 shrink-0 text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {getLevelBadge(log.level)}
                  <span className="text-teal-400 shrink-0 font-bold">[{log.subsystem || 'KERNEL'}]</span>
                  <span className={`flex-1 ${
                    log.level === 'ERROR' ? 'text-rose-400 font-bold' :
                    log.level === 'WARNING' ? 'text-amber-300' :
                    log.level === 'SECURITY' ? 'text-purple-300' : 'text-slate-200'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))
            )
          ) : (
            filteredAuditLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No audit log entries recorded.</div>
            ) : (
              filteredAuditLogs.map(audit => (
                <div key={audit.id} className="pt-2 flex items-start justify-between gap-4 hover:bg-slate-900/40 p-1.5 rounded-lg transition">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 shrink-0 text-[11px]">{audit.timestamp}</span>
                    <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 font-bold">
                      {audit.actor} ({audit.role})
                    </span>
                    <span className="text-slate-300">&bull; {audit.action}</span>
                  </div>
                  <span className="text-amber-400 shrink-0 font-bold">
                    Target: {audit.target}
                  </span>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
