import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Cpu,
  Boxes,
  Lock,
  GitBranch,
  Repeat,
  BedDouble,
  Ambulance,
  Activity,
  UserCheck,
  FolderTree,
  ShieldAlert,
  Terminal,
  FileBarChart,
  BookOpen,
  FlaskConical,
  Settings,
  HardDrive,
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout, can } = useAuth();

  const navigationGroups = [
    {
      title: 'Emergency Overview',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Emergency Patients', path: '/emergency-patients', icon: Users, perm: ['patient_records', 'READ'] },
        { name: 'Patient Registration', path: '/patient-registration', icon: UserPlus, perm: ['patient_records', 'WRITE'] },
        { name: 'Emergency Queue', path: '/emergency-queue', icon: Cpu, perm: ['emergency_queue', 'READ'] }
      ]
    },
    {
      title: 'OS Algorithms & Sync',
      items: [
        { name: 'CPU Scheduling', path: '/scheduling', icon: GitBranch, perm: ['emergency_queue', 'READ'] },
        { name: 'Smart Allocation', path: '/resource-allocation', icon: Boxes, perm: ['resource_allocation', 'READ'] },
        { name: 'Deadlock & Banker’s', path: '/deadlock-monitor', icon: ShieldAlert, perm: ['deadlock_recovery', 'READ'] },
        { name: 'Synchronization (Mutex)', path: '/synchronization-monitor', icon: Lock },
        { name: 'Producer-Consumer', path: '/producer-consumer', icon: Repeat },
        { name: 'Memory Management', path: '/memory-management', icon: HardDrive }
      ]
    },
    {
      title: 'Hospital Resources',
      items: [
        { name: 'Resource Overview', path: '/resource-management', icon: Boxes, perm: ['resource_allocation', 'READ'] },
        { name: 'Bed & ICU Allocation', path: '/bed-management', icon: BedDouble, perm: ['bed_management', 'READ'] },
        { name: 'Ambulance Dispatch', path: '/ambulance-management', icon: Ambulance, perm: ['ambulance_dispatch', 'READ'] },
        { name: 'Operation Theatres', path: '/operation-theatres', icon: Activity, perm: ['resource_allocation', 'READ'] },
        { name: 'Staff Management', path: '/doctor-management', icon: UserCheck, perm: ['doctor_management', 'READ'] }
      ]
    },
    {
      title: 'Protection & Audit',
      items: [
        { name: 'Patient Records (FS)', path: '/patient-records', icon: FolderTree, perm: ['patient_records', 'READ'] },
        { name: 'Access Matrix (RBAC)', path: '/access-control', icon: Lock, roles: ['Admin'] },
        { name: 'System Logs (Kernel)', path: '/system-logs', icon: Terminal, perm: ['audit_logs', 'READ'] },
        { name: 'Reports & Analytics', path: '/reports', icon: FileBarChart }
      ]
    },
    {
      title: 'Education & Testing',
      items: [
        { name: 'OS Concepts Guide', path: '/os-concepts', icon: BookOpen },
        { name: 'System Test Runner', path: '/system-testing', icon: FlaskConical },
        { name: 'System Settings', path: '/settings', icon: Settings }
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              EmergencyCare <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">OS</span>
            </h1>
            <p className="text-[11px] text-slate-400">Hospital Resource Kernel</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationGroups.map((group, gIdx) => {
            // Filter items based on user role and permissions
            const visibleItems = group.items.filter(item => {
              if (item.roles && !item.roles.includes(user?.role)) return false;
              if (item.perm && !can(item.perm[0], item.perm[1])) return false;
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {group.title}
                </h3>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-teal-600 text-white font-semibold shadow-sm shadow-teal-600/30'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5 truncate">
              <span className="text-xl shrink-0">{user?.avatar || '👨‍⚕️'}</span>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Staff'}</p>
                <span className="inline-block text-[10px] font-medium text-teal-400 truncate">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
