import React from 'react';
import {
  BookOpen,
  Cpu,
  GitBranch,
  Lock,
  ShieldAlert,
  HardDrive,
  FolderTree,
  ShieldCheck,
  Repeat,
  Terminal,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OSConcepts() {
  const concepts = [
    {
      id: 'process-management',
      title: '1. Process Management & Lifecycle States',
      icon: Cpu,
      color: 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300',
      badge: 'Core OS Engine',
      summary: 'Emergency patients are modeled as individual Operating System processes (with unique PIDs, arrival times, priority values, and resource demand vectors).',
      osMapping: [
        { os: 'Process Control Block (PCB)', hospital: 'Patient Record (PID, symptoms, medical history, vital signs)' },
        { os: 'Process State Transitions', hospital: 'NEW → READY (Queue) → RUNNING (Doctor) → WAITING (Lab) → BLOCKED (Bed Contention) → COMPLETED' },
        { os: 'Context Switching', hospital: 'Transferring doctor or resuscitation bay attention between acute cases' }
      ],
      link: '/emergency-queue',
      linkLabel: 'Inspect Emergency Process Queue'
    },
    {
      id: 'cpu-scheduling',
      title: '2. CPU Scheduling Algorithms',
      icon: GitBranch,
      color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
      badge: 'Preemption & Scheduling',
      summary: 'Emergency triage requires allocating limited physician attention (CPU cores) to competing emergency presentations using authentic algorithmic dispatch.',
      osMapping: [
        { os: 'Priority Scheduling', hospital: 'Critical patients (Priority 1) immediately preempt routine elective cases (Priority 4)' },
        { os: 'FCFS (First-Come, First-Served)', hospital: 'Patients attended strictly according to timestamped triage check-in time' },
        { os: 'Round Robin (Time Quantum)', hospital: 'Attending physicians rotate time slices equally among stable ward patients' }
      ],
      link: '/scheduling',
      linkLabel: 'Open Interactive Gantt Scheduler'
    },
    {
      id: 'synchronization',
      title: '3. Process Synchronization & Mutex Locking',
      icon: Lock,
      color: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
      badge: 'Critical Sections',
      summary: 'Contested medical hardware (such as single ICU isolation beds or operating theatres) are shared memory variables that must be protected against concurrent race conditions.',
      osMapping: [
        { os: 'Mutual Exclusion (Mutex)', hospital: 'Only one surgical team or doctor can lock and occupy ICU-05 or OT-01 at any given instant' },
        { os: 'Critical Section Entry & Exit', hospital: 'Doctor acquires bed lock, performs resuscitation, and signals lock release upon transfer' },
        { os: 'Lock Wait Queue', hospital: 'Subsequent simultaneous allocation requests are serialized in a FIFO blocked queue' }
      ],
      link: '/synchronization-monitor',
      linkLabel: 'Simulate ICU-05 Contention'
    },
    {
      id: 'deadlock',
      title: '4. Deadlock Detection & Banker\'s Algorithm',
      icon: ShieldAlert,
      color: 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300',
      badge: 'Dijkstra\'s Banker Algorithm',
      summary: 'Hospital multi-instance resource demands (Doctors, Beds, Ventilators, OTs) can cause circular wait deadlocks if allocated unsafely without advance matrix validation.',
      osMapping: [
        { os: 'Allocation & Need Matrices', hospital: 'Currently held hardware vs remaining equipment declared for patient surgery' },
        { os: 'Banker’s Safety Check', hospital: 'Algorithmic check calculating whether a safe sequence exists before committing bed/doctor' },
        { os: 'Resource Preemption & Recovery', hospital: 'Preempting non-critical resources from stable patients to break circular deadlocks' }
      ],
      link: '/deadlock-monitor',
      linkLabel: 'Run Banker’s Algorithm'
    },
    {
      id: 'producer-consumer',
      title: '5. Producer–Consumer Problem (Bounded Buffer)',
      icon: Repeat,
      color: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
      badge: 'Counting Semaphores',
      summary: 'Demonstrates synchronization between asymmetrical rates of patient arrival (Reception Producer) and physician treatment capacity (Doctor Consumer).',
      osMapping: [
        { os: 'Producer Process', hospital: 'Emergency Reception / Triage desk admits incoming patients into triage buffer' },
        { os: 'Consumer Process', hospital: 'Treatment Department / Resuscitation bays consume cases from triage queue' },
        { os: 'Semaphores (mutex, empty, full)', hospital: 'Prevents queue buffer overflow when triage is full and prevents idle reads when empty' }
      ],
      link: '/producer-consumer',
      linkLabel: 'Inspect Bounded Buffer Simulation'
    },
    {
      id: 'memory-management',
      title: '6. Memory Management & Partition Allocation',
      icon: HardDrive,
      color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
      badge: 'Fragmentation & Paging',
      summary: 'Hospital capacity is modeled as contiguous memory partitions. Fixed and dynamic ward blocks experience internal and external fragmentation.',
      osMapping: [
        { os: 'Contiguous Partitions', hospital: 'Hospital wards (Trauma Bay, ICU Wing, Acute Ward) with fixed bed capacity blocks' },
        { os: 'First-Fit, Best-Fit, Worst-Fit', hospital: 'Placement algorithms matching incoming patient cohort sizes to available bed blocks' },
        { os: 'Internal / External Fragmentation', hospital: 'Unused beds inside an occupied ward block vs free beds fragmented across disparate floors' }
      ],
      link: '/memory-management',
      linkLabel: 'Explore Memory Partitions'
    },
    {
      id: 'file-management',
      title: '7. File Systems & Hierarchical Organization',
      icon: FolderTree,
      color: 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300',
      badge: 'Virtual VFS Tree',
      summary: 'Clinical diagnosis reports, surgical notes, and waveforms are structured in a hierarchical virtual directory tree matching Unix file systems.',
      osMapping: [
        { os: 'Hierarchical Tree Directory', hospital: '/Hospital Records/Emergency/2026/PAT-1001_Myocardial_Infarction.med' },
        { os: 'File Metadata & Inodes', hospital: 'Patient ID binding, clinical author, file size (KB), and timestamp creation' },
        { os: 'File Search & Content Indexing', hospital: 'Global search across clinical note payloads and diagnosis categories' }
      ],
      link: '/patient-records',
      linkLabel: 'Browse Patient Records File System'
    },
    {
      id: 'protection-matrix',
      title: '8. Protection Domains & Access Matrix (RBAC)',
      icon: ShieldCheck,
      color: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
      badge: 'Lampson Access Matrix',
      summary: 'Strict protection boundaries enforce least-privilege security between roles (Subjects) and hospital resources (Objects).',
      osMapping: [
        { os: 'Subjects', hospital: 'Roles: Admin, Doctor, Nurse, Emergency Coordinator' },
        { os: 'Objects', hospital: 'Resources: Patient Records, Queue, Beds, OTs, System Settings, Audit Logs' },
        { os: 'Rights & Enforcement', hospital: 'READ, WRITE, UPDATE, DELETE permissions verified by API middleware at request time' }
      ],
      link: '/access-control',
      linkLabel: 'Inspect Protection Matrix'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-teal-600" />
            Operating System Concepts in Hospital Emergency Care
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Academic & technical syllabus mapping: How EmergencyCare OS applies foundational computer science principles to save lives during critical hospital surges.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono text-xs font-bold self-start border border-teal-200 dark:border-teal-800">
          8 Core Modules Implemented
        </span>
      </div>

      {/* Grid of OS Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {concepts.map(concept => {
          const Icon = concept.icon;

          return (
            <div
              key={concept.id}
              className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-2xl border ${concept.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {concept.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {concept.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {concept.summary}
                </p>

                {/* Mapping Table */}
                <div className="mt-4 space-y-2 font-mono text-[11px]">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 block">
                    Concept Mapping:
                  </span>
                  {concept.osMapping.map((map, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <span className="text-teal-600 dark:text-teal-400 font-bold">{map.os}</span>
                      <span className="text-slate-600 dark:text-slate-300 text-right sm:max-w-xs">{map.hospital}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Link */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Live Interactive Demonstration</span>
                <Link
                  to={concept.link}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  {concept.linkLabel} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
