import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  UserPlus,
  Activity,
  AlertCircle,
  Stethoscope,
  BedDouble,
  Ambulance,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function PatientRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    contact: '',
    emergencyType: '',
    symptoms: '',
    bloodGroup: 'O+',
    medicalHistory: '',
    priority: 'Critical',
    burstTime: 4,
    assignedDoctor: '',
    assignedBed: '',
    assignedAmbulance: '',
    requiredResources: ['Doctor', 'Nurse']
  });

  const [doctors, setDoctors] = useState([]);
  const [beds, setBeds] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [predictedPid, setPredictedPid] = useState('PAT-...');

  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      const [patRes, staffRes, bedRes, ambRes] = await Promise.all([
        api.getPatients(),
        api.getStaff(),
        api.getBeds(),
        api.getAmbulances()
      ]);

      const maxPid = patRes.patients.reduce((m, p) => Math.max(m, p.pid || 1000), 1000);
      setPredictedPid(`PAT-${maxPid + 1}`);

      setDoctors(staffRes.doctors || []);
      setBeds(bedRes.all || []);
      setAmbulances(ambRes || []);
    } catch (err) {
      console.error('Failed to load form prerequisites:', err);
    }
  };

  const handleResourceCheckbox = (rName) => {
    setFormData(prev => {
      const current = prev.requiredResources || [];
      const updated = current.includes(rName)
        ? current.filter(r => r !== rName)
        : [...current, rName];
      return { ...prev, requiredResources: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.emergencyType) {
      addToast('Patient name and emergency condition are required', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createPatient(formData);
      addToast(`Patient registered! Process ${res.patient.id} created in state ${res.patient.processState}`, 'success');
      navigate('/emergency-queue');
    } catch (err) {
      addToast(err.message || 'Failed to register patient', 'error');
    } finally {
      setLoading(false);
    }
  };

  const availableBeds = beds.filter(b => b.status === 'AVAILABLE');
  const availableDocs = doctors.filter(d => d.status === 'AVAILABLE');
  const availableAmbs = ambulances.filter(a => a.status === 'AVAILABLE');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserPlus className="w-6 h-6 text-teal-600" />
            Admit Emergency Patient (Spawn OS Process)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registers incoming trauma or emergency patient and allocates OS resources based on availability.
          </p>
        </div>

        {/* Auto Generated PID Pill */}
        <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-mono text-xs font-bold flex items-center gap-2">
          <span>Target PID:</span>
          <span className="text-sm underline decoration-teal-400">{predictedPid}</span>
        </div>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Section 1: Demographics */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            1. Patient Demographics & Profile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Johnathan Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Age *
              </label>
              <input
                type="number"
                required
                placeholder="Years"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary / Other">Non-binary / Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                placeholder="+1-555-0199"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none font-mono"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Emergency & Priority */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            2. Emergency Triage & OS Scheduling Priority
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Diagnosis / Presentation *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acute STEMI, Severe Subdural Hematoma"
                value={formData.emergencyType}
                onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                OS Scheduling Burst Time (Simulated Treatment Units)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.burstTime}
                onChange={(e) => setFormData({ ...formData, burstTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Symptoms & Clinical Signs
              </label>
              <textarea
                rows="2"
                placeholder="Crushing retrosternal chest pain, diaphoresis, hypotensive..."
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              ></textarea>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Medical History / Comorbidities
              </label>
              <input
                type="text"
                placeholder="Type 2 Diabetes, Hypertension, Coronary Stenting 2021"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            {/* Priority Selector with OS Priority Values */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Emergency Priority Level (Determines Preemptive Dispatch)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'Critical', label: 'Critical (Priority 1)', desc: 'Immediate attention required', color: 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300' },
                  { key: 'High', label: 'High (Priority 2)', desc: 'Urgent resuscitation', color: 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300' },
                  { key: 'Medium', label: 'Medium (Priority 3)', desc: 'Moderate urgency', color: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300' },
                  { key: 'Low', label: 'Low (Priority 4)', desc: 'Stable / Can wait in queue', color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300' }
                ].map(p => (
                  <div
                    key={p.key}
                    onClick={() => setFormData({ ...formData, priority: p.key })}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.priority === p.key ? `${p.color} ring-2 ring-teal-500 shadow-sm` : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="font-bold text-xs">{p.label}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: OS Hardware & Resource Demand */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            3. Demanded Hospital Resources (Multi-Resource Allocation)
          </h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {['Doctor', 'Nurse', 'ICU Bed', 'General Bed', 'Ventilator', 'Operation Theatre', 'Emergency Room'].map(r => {
              const isChecked = (formData.requiredResources || []).includes(r);
              return (
                <button
                  type="button"
                  key={r}
                  onClick={() => handleResourceCheckbox(r)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                    isChecked
                      ? 'bg-teal-500 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isChecked ? '✓ ' : '+ '} {r}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Doctor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assign Doctor ({availableDocs.length} Available)
              </label>
              <select
                value={formData.assignedDoctor}
                onChange={(e) => setFormData({ ...formData, assignedDoctor: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Auto Assign or Select --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.name} disabled={d.status === 'OFF_DUTY'}>
                    {d.name} ({d.specialization}) - {d.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Bed */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assign Bed ({availableBeds.length} Free)
              </label>
              <select
                value={formData.assignedBed}
                onChange={(e) => setFormData({ ...formData, assignedBed: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              >
                <option value="">-- Allocate in Ward Later --</option>
                {beds.map(b => (
                  <option key={b.id} value={b.id} disabled={b.status !== 'AVAILABLE'}>
                    {b.id} [{b.type}] - {b.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Ambulance */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dispatch Ambulance ({availableAmbs.length} Available)
              </label>
              <select
                value={formData.assignedAmbulance}
                onChange={(e) => setFormData({ ...formData, assignedAmbulance: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              >
                <option value="">-- Walk-in / Self-Arrival --</option>
                {ambulances.map(a => (
                  <option key={a.id} value={a.id} disabled={a.status !== 'AVAILABLE'}>
                    {a.id} ({a.code}) - {a.status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Process states: Automatically evaluated as <strong>RUNNING</strong> (if resources satisfied) or <strong>BLOCKED/WAITING</strong> (if resources contested).
          </p>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-600/20 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Spawning Process...' : 'Admit Patient & Create Process'}
          </button>
        </div>

      </form>
    </div>
  );
}
