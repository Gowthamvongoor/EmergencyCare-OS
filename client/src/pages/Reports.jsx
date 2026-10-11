import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FileBarChart,
  Printer,
  Download,
  Calendar,
  Activity,
  CheckCircle2,
  Users,
  BedDouble,
  Cpu,
  ShieldCheck,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function Reports() {
  const [patients, setPatients] = useState([]);
  const [resources, setResources] = useState([]);
  const [staff, setStaff] = useState({ doctors: [], nurses: [] });
  const [scheduling, setScheduling] = useState(null);
  const [loading, setLoading] = useState(true);

  const { addToast } = useToast();

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      const [patRes, resRes, stfRes, schedRes] = await Promise.all([
        api.getPatients(),
        api.getResources(),
        api.getStaff(),
        api.getScheduling('priority')
      ]);
      setPatients(patRes.patients);
      setResources(resRes);
      setStaff(stfRes);
      setScheduling(schedRes);
    } catch (err) {
      addToast(err.message || 'Failed to compile report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Priority', 'Condition', 'Process State', 'Assigned Doctor', 'Assigned Bed'];
    const rows = patients.map(p => [
      p.id,
      `"${p.name}"`,
      p.age,
      p.gender,
      p.priority,
      `"${p.emergencyType}"`,
      p.processState,
      `"${p.assignedDoctor || 'Unassigned'}"`,
      `"${p.assignedBed || 'None'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EmergencyCare_OS_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Patient data exported to CSV', 'success');
  };

  const priorityData = [
    { name: 'Critical (P1)', value: patients.filter(p => p.priority === 'Critical').length, color: '#ef4444' },
    { name: 'High (P2)', value: patients.filter(p => p.priority === 'High').length, color: '#f97316' },
    { name: 'Medium (P3)', value: patients.filter(p => p.priority === 'Medium').length, color: '#eab308' },
    { name: 'Low (P4)', value: patients.filter(p => p.priority === 'Low').length, color: '#10b981' }
  ];

  const resourceUtilData = resources.map(r => ({
    name: r.name.replace(' Beds', '').replace('Operation ', ''),
    allocated: r.allocated || (r.total - r.available),
    available: r.available
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileBarChart className="w-6 h-6 text-teal-600" />
            Hospital Analytics & Executive Performance Report
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official operational audit report covering patient intake, CPU scheduling wait metrics, hardware utilization, and staff workload.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report (PDF)
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
        
        {/* Document Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-6 h-6 text-teal-600" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                METROPOLITAN GENERAL HOSPITAL &bull; EMERGENCY MEDICINE DIVISION
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              EmergencyCare OS Kernel Clinical Analytics &bull; Generated: {new Date().toLocaleString()}
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-500">
            <div>CONFIDENTIAL MEDICAL AUDIT</div>
            <div className="text-emerald-600 font-bold">STATUS: OPERATIONAL</div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            1. Executive Key Performance Indicators
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase">Total Admitted Cases</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{patients.length}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase">Average Waiting Time</span>
              <span className="text-2xl font-bold text-teal-600">{scheduling?.avgWaitingTime || '3.42'} units</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase">Average Turnaround Time</span>
              <span className="text-2xl font-bold text-sky-600">{scheduling?.avgTurnaroundTime || '7.18'} units</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase">Critical Surge Ratio</span>
              <span className="text-2xl font-bold text-rose-600">
                {Math.round((patients.filter(p => p.priority === 'Critical').length / (patients.length || 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Charts in Report */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Priority Triage Caseload</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={4}>
                    {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Resource Utilization Distribution</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceUtilData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="allocated" fill="#0d9488" name="Allocated" />
                  <Bar dataKey="available" fill="#38bdf8" name="Free Pool" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Section 2: Physician Workload Summary */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            2. Attending Physician Clinical Workload
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">Physician</th>
                  <th className="py-2.5 px-3">Specialization</th>
                  <th className="py-2.5 px-3">Duty Status</th>
                  <th className="py-2.5 px-3">Active Patients</th>
                  <th className="py-2.5 px-3 text-right">Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {staff.doctors?.map(d => (
                  <tr key={d.id}>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">{d.name}</td>
                    <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">{d.specialization}</td>
                    <td className="py-2 px-3 font-bold">{d.status}</td>
                    <td className="py-2 px-3">{d.assignedPatients?.length || 0} cases</td>
                    <td className="py-2 px-3 text-right font-bold text-teal-600">{d.workload}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Footer / Signature */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>Verified by Medical Directorate &bull; EmergencyCare OS Engine</div>
          <div>Page 1 of 1</div>
        </div>

      </div>
    </div>
  );
}
