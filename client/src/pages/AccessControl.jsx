import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  Check,
  Save,
  RotateCcw,
  Users,
  FolderTree,
  Boxes,
  Activity,
  Terminal,
  RefreshCw,
  Info
} from 'lucide-react';

export default function AccessControl() {
  const [matrixData, setMatrixData] = useState(null);
  const [activeRole, setActiveRole] = useState('Doctor');
  const [editedMatrix, setEditedMatrix] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async () => {
    try {
      const data = await api.getAccessMatrix();
      setMatrixData(data);
      setEditedMatrix(JSON.parse(JSON.stringify(data.permissions)));
    } catch (err) {
      addToast(err.message || 'Failed to load protection matrix', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (role, resourceKey, perm) => {
    setEditedMatrix(prev => {
      const currentPerms = prev[role]?.[resourceKey] || [];
      const updated = currentPerms.includes(perm)
        ? currentPerms.filter(p => p !== perm)
        : [...currentPerms, perm];

      return {
        ...prev,
        [role]: {
          ...prev[role],
          [resourceKey]: updated
        }
      };
    });
  };

  const handleSaveMatrix = async () => {
    try {
      // Save all updated permissions for active role
      const rolePerms = editedMatrix[activeRole];
      const promises = Object.entries(rolePerms).map(([resKey, perms]) =>
        api.updateAccessMatrix(activeRole, resKey, perms)
      );
      await Promise.all(promises);
      addToast(`Protection Matrix successfully updated for role: ${activeRole}`, 'success');
      loadMatrix();
    } catch (err) {
      addToast(err.message || 'Failed to update access matrix', 'error');
    }
  };

  const roles = matrixData?.roles || ['Admin', 'Doctor', 'Nurse', 'Emergency Coordinator'];
  const resources = matrixData?.resources || [];
  const permissionsList = ['READ', 'WRITE', 'UPDATE', 'DELETE'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Lock className="w-6 h-6 text-teal-600" />
            Protection Domain & Access Matrix (RBAC Enforcement)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Operating System Access Control Matrix. Defines subject (role) capabilities over objects (clinical resources) with real-time backend authorization enforcement.
          </p>
        </div>

        <button
          onClick={handleSaveMatrix}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 self-start"
        >
          <Save className="w-3.5 h-3.5" />
          Save Protection Matrix
        </button>
      </div>

      {/* Role Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {roles.map(r => (
          <button
            key={r}
            onClick={() => setActiveRole(r)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeRole === r
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Active Role Rights Editor Table */}
      {editedMatrix && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Protection Rights for Subject: <span className="text-teal-600 dark:text-teal-400">{activeRole}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Grant or revoke granular system permissions (READ, WRITE, UPDATE, DELETE)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {resources.length} Protected Objects
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase">
                  <th className="py-3.5 px-6">System Resource Object</th>
                  {permissionsList.map(perm => (
                    <th key={perm} className="py-3.5 px-6 text-center">{perm}</th>
                  ))}
                  <th className="py-3.5 px-6 text-right">Access Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {resources.map(res => {
                  const rolePerms = editedMatrix[activeRole]?.[res.key] || [];
                  const isFull = rolePerms.length === 4;

                  return (
                    <tr key={res.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-6">
                        <span className="font-semibold text-slate-900 dark:text-white block">{res.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{res.key}</span>
                      </td>

                      {permissionsList.map(perm => {
                        const hasRight = rolePerms.includes(perm);

                        return (
                          <td key={perm} className="py-3.5 px-6 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1">
                              <input
                                type="checkbox"
                                checked={hasRight}
                                onChange={() => handleTogglePermission(activeRole, res.key, perm)}
                                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                            </label>
                          </td>
                        );
                      })}

                      <td className="py-3.5 px-6 text-right font-mono">
                        {rolePerms.length === 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">DENIED</span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isFull ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' :
                            rolePerms.includes('WRITE') ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                            'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                          }`}>
                            {rolePerms.join(' / ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Protection Matrix Comparison View */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-teal-600" />
          Global Access Matrix Summary [Subject &times; Object]
        </h3>
        <p className="text-xs text-slate-500">
          Enforced by API middleware at request time. Violations trigger HTTP 403 Forbidden and log a SECURITY event in the kernel logs.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 text-[10px] uppercase">
                <th className="py-2.5 px-3 text-left">Subject (Role)</th>
                {resources.slice(0, 6).map(r => (
                  <th key={r.key} className="py-2.5 px-2 truncate max-w-[90px]" title={r.name}>{r.name.split(' ')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {roles.map(r => (
                <tr key={r} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-left font-bold font-sans text-slate-800 dark:text-slate-200">{r}</td>
                  {resources.slice(0, 6).map(res => {
                    const p = matrixData?.permissions?.[r]?.[res.key] || [];
                    const code = p.length === 4 ? 'R/W/U/D' : p.length > 0 ? p.map(s => s[0]).join('/') : '&mdash;';

                    return (
                      <td key={res.key} className="py-2.5 px-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {code === '&mdash;' ? <span className="text-slate-400">&mdash;</span> : code}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
