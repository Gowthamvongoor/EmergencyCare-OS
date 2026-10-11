import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import EmergencyBanner from '../components/EmergencyBanner';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertCircle,
  Clock,
  BedDouble,
  Activity,
  Ambulance,
  Stethoscope,
  HeartPulse,
  Wind,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Cpu,
  CheckCircle2
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
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from 'recharts';

export default function Dashboard() {
  const [patientsData, setPatientsData] = useState({ patients: [], stats: {} });
  const [resources, setResources] = useState([]);
  const [schedulingData, setSchedulingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [patRes, resRes, schedRes] = await Promise.all([
        api.getPatients(),
        api.getResources(),
        api.getScheduling('priority')
      ]);
      setPatientsData(patRes);
      setResources(resRes);
      setSchedulingData(schedRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = patientsData.stats || {};

  // Resource helpers
  const getRes = (name) => resources.find(r => r.name.toLowerCase().includes(name.toLowerCase())) || { total: 0, available: 0, allocated: 0 };
  const icu = getRes('ICU');
  const gen = getRes('General');
  const docs = getRes('Doctor');
  const nurses = getRes('Nurse');
  const amb = getRes('Ambulance');
  const ot = getRes('Operation');
  const vent = getRes('Ventilator');

  const icuOccupancy = icu.total > 0 ? Math.round(((icu.total - icu.available) / icu.total) * 100) : 0;
  const genOccupancy = gen.total > 0 ? Math.round(((gen.total - gen.available) / gen.total) * 100) : 0;

  // Chart 1: Priority Distribution
  const priorityChartData = [
    { name: 'Critical', value: stats.critical || 8, color: '#ef4444' },
    { name: 'High', value: stats.high || 13, color: '#f97316' },
    { name: 'Medium', value: stats.medium || 15, color: '#eab308' },
    { name: 'Low', value: stats.low || 6, color: '#10b981' }
  ];

  // Chart 2: Resource Utilization
  const resourceChartData = resources.map(r => ({
    name: r.name.replace(' Beds', '').replace('Operation ', ''),
    Allocated: r.allocated || (r.total - r.available),
    Available: r.available,
    utilization: r.utilization || 0
  }));

  // Chart 3: Patient Arrivals by Time Block
  const arrivalChartData = [
    { time: '08:00', arrivals: 4, critical: 2 },
    { time: '09:00', arrivals: 7, critical: 3 },
    { time: '10:00', arrivals: 6, critical: 1 },
    { time: '11:00', arrivals: 5, critical: 2 },
    { time: '12:00', arrivals: 8, critical: 4 },
    { time: '13:00', arrivals: 3, critical: 0 }
  ];

  // Chart 4: Process / Treatment States
  const treatmentStateData = [
    { name: 'Running / In Treatment', value: stats.running || 11, color: '#0d9488' },
    { name: 'Waiting / Blocked', value: stats.waiting || 6, color: '#f59e0b' },
    { name: 'Discharged / Completed', value: stats.completed || 5, color: '#64748b' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-500">Loading Clinical Operating Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner for Critical surge */}
      <EmergencyBanner criticalCount={stats.critical} waitingCount={stats.waiting} />

      {/* Header with Title and Quick Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            Emergency Command Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time emergency triage, CPU priority scheduling metrics, and multi-resource allocation state.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/patient-registration"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            Admit Patient
          </Link>
          <Link
            to="/scheduling"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Cpu className="w-4 h-4" />
            OS Scheduler
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid: Emergency Patient Statistics */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-rose-500" />
          Emergency Patient Statistics (OS Processes)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          <StatCard
            title="Total Patients"
            value={stats.total || 22}
            subtext="Admitted Cases"
            icon={Users}
            color="teal"
          />
          <StatCard
            title="Critical (P1)"
            value={stats.critical || 8}
            subtext="Immediate Resus"
            icon={AlertCircle}
            color="red"
            badge="Priority 1"
          />
          <StatCard
            title="High Priority"
            value={stats.high || 6}
            subtext="Urgent Attention"
            icon={TrendingUp}
            color="orange"
            badge="Priority 2"
          />
          <StatCard
            title="Medium Priority"
            value={stats.medium || 5}
            subtext="Moderate Urgency"
            icon={Activity}
            color="yellow"
            badge="Priority 3"
          />
          <StatCard
            title="Low Priority"
            value={stats.low || 3}
            subtext="Stable / Can Wait"
            icon={CheckCircle2}
            color="emerald"
            badge="Priority 4"
          />
          <StatCard
            title="Waiting / Blocked"
            value={stats.waiting || 5}
            subtext="Pending Resource"
            icon={Clock}
            color="purple"
          />
          <StatCard
            title="In Treatment"
            value={stats.running || 12}
            subtext="Active CPU Core"
            icon={Cpu}
            color="blue"
          />
        </div>
      </div>

      {/* Secondary KPI Grid: Resource Statistics */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <BedDouble className="w-3.5 h-3.5 text-teal-500" />
          Hospital Hardware & Resource Statistics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          <StatCard
            title="ICU Beds"
            value={`${icu.available}/${icu.total}`}
            subtext={`${icuOccupancy}% Occupancy`}
            icon={BedDouble}
            color={icuOccupancy > 80 ? 'red' : 'teal'}
          />
          <StatCard
            title="General Beds"
            value={`${gen.available}/${gen.total}`}
            subtext={`${genOccupancy}% Occupancy`}
            icon={BedDouble}
            color="blue"
          />
          <StatCard
            title="Doctors Avail"
            value={`${docs.available}/${docs.total}`}
            subtext={`${docs.allocated} On Duty/Busy`}
            icon={Stethoscope}
            color="teal"
          />
          <StatCard
            title="Nurses Avail"
            value={`${nurses.available}/${nurses.total}`}
            subtext={`${nurses.allocated} Active Shifts`}
            icon={HeartPulse}
            color="teal"
          />
          <StatCard
            title="Ambulances"
            value={`${amb.available}/${amb.total}`}
            subtext={`${amb.allocated} Dispatched`}
            icon={Ambulance}
            color="orange"
          />
          <StatCard
            title="OT Theatres"
            value={`${ot.available}/${ot.total}`}
            subtext={`${ot.allocated} Active Surgeries`}
            icon={Activity}
            color={ot.available === 0 ? 'red' : 'teal'}
          />
          <StatCard
            title="Ventilators"
            value={`${vent.available}/${vent.total}`}
            subtext={`${vent.allocated} In Use`}
            icon={Wind}
            color="purple"
          />
        </div>
      </div>

      {/* Main Visualizations: Charts 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Priority Distribution Bar Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Emergency Cases by Priority
              </h3>
              <p className="text-xs text-slate-500">Critical patients receive preemptive CPU dispatch</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Resource Utilization Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-500" />
                Hospital Resource Utilization
              </h3>
              <p className="text-xs text-slate-500">Allocated vs Free capacity</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend />
                <Bar dataKey="Allocated" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Available" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Patient Arrivals Timeline */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-500" />
                Emergency Arrivals Over Time
              </h3>
              <p className="text-xs text-slate-500">Hourly influx pattern</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={arrivalChartData}>
                <defs>
                  <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="arrivals" stroke="#0d9488" fillOpacity={1} fill="url(#colorArrivals)" name="Total Influx" />
                <Area type="monotone" dataKey="critical" stroke="#ef4444" fillOpacity={1} fill="url(#colorCrit)" name="Critical Resus" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Treatment Process States & Average Waiting Time */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-500" />
              Treatment Status & OS Scheduling Performance
            </h3>
            <p className="text-xs text-slate-500">Process lifecycle breakdown</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-auto">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={treatmentStateData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {treatmentStateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Performance KPIs */}
            <div className="space-y-3 font-mono">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase block">Average Waiting Time</span>
                <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                  {schedulingData?.avgWaitingTime || '3.42'} time units
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase block">Average Turnaround Time</span>
                <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
                  {schedulingData?.avgTurnaroundTime || '7.18'} time units
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Algorithms: Priority, FCFS, Round Robin</span>
            <Link to="/scheduling" className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1 hover:underline">
              Inspect Gantt Chart <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
