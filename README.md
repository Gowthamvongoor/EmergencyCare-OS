# 🚨 EmergencyCare OS – Hospital Emergency & Resource Management System

> **A real-time clinical operating prototype demonstrating how Operating System (OS) concepts solve critical hospital emergency resource allocation, process scheduling, synchronization, deadlock, and memory management challenges.**

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-blue.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![OS Kernel Tests](https://img.shields.io/badge/OS_Tests-10%2F10_Passed-emerald.svg)](http://localhost:5000/api/tests/run-all)

---

## 📋 Table of Contents
1. [Problem Statement](#-problem-statement)
2. [Proposed Solution](#-proposed-solution)
3. [Operating System Concepts Demonstrated](#-operating-system-concepts-demonstrated)
4. [Key Features & System Modules](#-key-features--system-modules)
5. [System Architecture](#-system-architecture)
6. [Technology Stack](#-technology-stack)
7. [Installation & Getting Started](#-installation--getting-started)
8. [Demo Login Credentials](#-demo-login-credentials)
9. [Automated Verification & Test Suite](#-automated-verification--test-suite)
10. [Future Enhancements](#-future-enhancements)

---

## 🎯 Problem Statement
Modern emergency hospital departments routinely face mass-casualty surges and simultaneous acute presentations. However, physical and personnel resources—such as **ICU beds, trauma surgeons, nurses, ventilators, operation theatres, and ambulances**—are strictly finite. 

Without intelligent algorithmic governance, hospitals experience:
- **Starvation**: Non-critical patients blocking resources while critical cases wait.
- **Race Conditions**: Multiple surgical teams attempting to reserve the same ICU isolation bed simultaneously.
- **Deadlocks**: Patient A holds an operating theatre waiting for an ICU bed; Patient B occupies an ICU bed waiting for the operating theatre.
- **Resource Fragmentation**: Dispersed bed capacity that cannot accommodate large incoming trauma cohorts.

---

## 💡 Proposed Solution
**EmergencyCare OS** models the entire hospital emergency ecosystem as a multi-programmed Operating System:
- **Patients** are treated as **Processes** executing through a standardized 6-state lifecycle (`NEW` &rarr; `READY` &rarr; `RUNNING` &rarr; `WAITING` &rarr; `BLOCKED` &rarr; `COMPLETED`).
- **Doctors & Treatment Bays** are modeled as **CPU Cores** executing tasks via Priority Preemption, FCFS, or Round Robin.
- **Medical Hardware** is modeled as **Multi-Instance Resources** guarded by **Dijkstra's Banker's Algorithm** to guarantee safe sequences.
- **Contested Beds** are protected as **Critical Sections** via backend **Mutex Locks** with FIFO serialization.
- **Triage Intake** is regulated via the **Producer-Consumer Bounded Buffer** using counting semaphores.
- **Hospital Wards** are managed via **Contiguous Memory Partitions** calculating internal and external fragmentation.
- **Patient Records & RBAC** are protected using a formal **Lampson Protection & Access Matrix**.

---

## 🧠 Operating System Concepts Demonstrated

| OS Concept | Hospital Implementation & Mapping | Live Feature / Page |
| :--- | :--- | :--- |
| **Process Management** | Patients modeled as processes with PIDs, Process Control Blocks (PCBs), priority values, arrival times, and state transitions (`NEW`, `READY`, `RUNNING`, `WAITING`, `BLOCKED`, `COMPLETED`). | [Emergency Queue](http://localhost:5173/emergency-queue) |
| **CPU Scheduling** | Authentic execution algorithms: **Priority Scheduling** (Critical=1 > High=2 > Medium=3 > Low=4), **FCFS**, and **Round Robin** with configurable Time Quantum $q$. Computes Start, Completion, Turnaround (TAT), Waiting (WT), Response (RT), and Gantt timeline. | [OS CPU Scheduler](http://localhost:5173/scheduling) |
| **Process Synchronization** | Shared resources (e.g. ICU-05) protected by exclusive **Mutex Locks**. Prevents race conditions when 3 users compete concurrently; serializes conflicts into a FIFO waiting queue. | [Sync Monitor](http://localhost:5173/synchronization-monitor) |
| **Deadlock Avoidance** | **Banker's Algorithm** with Allocation, Maximum, Available, and Need matrices. Verifies safe sequences or flags circular wait deadlocks. | [Deadlock Monitor](http://localhost:5173/deadlock-monitor) |
| **Deadlock Recovery** | Resource Allocation Graph (RAG) cycle detection with automated preemption, rollback, and substitute resource reassignment. | [Deadlock Recovery](http://localhost:5173/deadlock-monitor) |
| **Producer–Consumer** | Bounded buffer triage queue. Producer = Reception; Consumer = Treatment unit. Coordinated using counting semaphores (`mutex`, `empty`, `full`) with buffer full/empty detection. | [Producer-Consumer](http://localhost:5173/producer-consumer) |
| **Memory Management** | Hospital capacity modeled as contiguous memory partitions. Evaluates **First-Fit**, **Best-Fit**, and **Worst-Fit** placement with internal and external fragmentation calculation. | [Memory Management](http://localhost:5173/memory-management) |
| **File Management** | Patient clinical notes, reports, and ECG datagrams structured as a Unix-like virtual hierarchical directory tree (`/Emergency/2026/PAT-1001.med`). | [Patient Records](http://localhost:5173/patient-records) |
| **Protection & Security** | Formal Lampson **Access Control Matrix** [Roles &times; Resources &times; Rights: `READ`, `WRITE`, `UPDATE`, `DELETE`]. Enforced at API runtime via middleware. | [Access Control](http://localhost:5173/access-control) |
| **Audit & System Logs** | OS-style kernel telemetry (`[INFO]`, `[WARNING]`, `[ERROR]`, `[SECURITY]`) recording state changes, resource shortages, and auth events. | [System Logs](http://localhost:5173/system-logs) |

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with Vite 5
- **Styling**: Tailwind CSS with custom medical theme & Dark/Light mode
- **Visualizations**: Recharts (Pie, Bar, Area, Donut charts) + Custom Interactive SVG Gantt Chart
- **Icons**: Lucide React
- **Routing & State**: React Router v6 + Context API (Auth, Theme, Toast)

### Backend
- **Server**: Node.js & Express.js
- **Security**: JSON Web Tokens (JWT), bcryptjs password hashing, RBAC middleware
- **Algorithms**: Pure JavaScript algorithmic engines (Scheduler, Banker's, Mutex, Semaphores, Memory Manager)
- **Persistence Engine**: Clean, atomic, thread-safe JSON persistence store (`server/data/store.json`) with zero external database dependencies required.

---

## 🏗️ Architecture

```
EmergencyCare OS Architecture
───────────────────────────────────────────────────────────────────────────
   [ React Frontend (Port 5173) ]  
           │
           │  REST API Requests + Bearer JWT
           ▼
   [ Express Backend (Port 5000) ]
           │
     ┌─────┴───────────────────────────────────────────────────────┐
     │ Middlewares: Auth (JWT), RBAC Access Matrix, Audit Logger  │
     └─────┬───────────────────────────────────────────────────────┘
           │
     ┌─────┴───────────────────────────────────────────────────────┐
     │ OS Algorithm Engines:                                       │
     │ ├── Scheduler (Priority, FCFS, Round Robin)                 │
     │ ├── Banker's Algorithm (Allocation, Max, Available, Need)   │
     │ ├── Mutex Synchronization Manager (Lock Queue)              │
     │ ├── Producer-Consumer (Semaphores: mutex, empty, full)      │
     │ └── Hospital Memory Manager (Partitions, Fragmentation)     │
     └─────┬───────────────────────────────────────────────────────┘
           │
           ▼
   [ Atomic Store (server/data/store.json) ]
```

---

## 🚀 Installation & Getting Started

### Prerequisites
- **Node.js** v18 or higher (`node -v`)
- **npm** v9 or higher (`npm -v`)

### 1. Install Dependencies
In the root directory, install all dependencies:
```powershell
# Root dependencies
npm install

# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
cd ..
```

### 2. Run the Complete System
Start both backend API server and frontend client concurrently with a single command from the project root:
```powershell
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

*(Alternatively, you can run them in separate terminals)*:
- Terminal 1: `cd server && npm start` (Starts server on port 5000)
- Terminal 2: `cd client && npm run dev` (Starts Vite client on port 5173)

---

## 🔐 Demo Login Credentials

The application includes 4 pre-configured role profiles. On the login screen, you can click any **1-Click Demo Profile** button to auto-fill credentials:

| Role | Email | Password | Permissions & System Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@hospital.com` | `admin123` | **Full Access**: All pages, Access Matrix modification, database factory reset, preemption. |
| **Doctor** | `doctor@hospital.com` | `doctor123` | Patients, Emergency Queue, Clinical Records, Bed updates. |
| **Nurse** | `nurse@hospital.com` | `nurse123` | Patient triage, Bed allocation/cleaning status, records viewing. |
| **Emergency Coordinator** | `coordinator@hospital.com` | `coordinator123` | Ambulance fleet dispatch, emergency queue priority, resource allocation. |

---

## 🧪 Automated Verification & Test Suite

The system includes an automated test runner validating all 10 core OS algorithm requirements:

### Run from Command Line
```powershell
cd server
npm test
```

### Test Suite Output
```text
🧪 Starting EmergencyCare OS Comprehensive Algorithm & Regression Tests...

====================================================
Test Suite: EmergencyCare OS Test Suite
Total: 10 | Passed: 10 | Failed: 0 (100%)
Duration: 1ms
====================================================

✅ [TEST-01] Priority Scheduling Preemption Order (CPU Scheduling)
   Expected: Critical patient (Priority 1) executes before Low urgency patient (Priority 4)
   Actual:   Critical patient (TEST-P2) scheduled first

✅ [TEST-02] Turnaround & Waiting Time Math (CPU Scheduling)
   Expected: P1 wait=0, tat=4; P2 wait=4, tat=10
   Actual:   P1 wait=0, tat=4; P2 wait=4, tat=10

✅ [TEST-03] Banker's Algorithm Safe State Verification (Deadlock Avoidance)
   Expected: System identified as SAFE with complete safe sequence
   Actual:   SAFE: P1 -> P2

✅ [TEST-04] Banker's Algorithm Deadlock Detection (Deadlock Detection)
   Expected: System identified as UNSAFE with circular wait
   Actual:   UNSAFE detected: P1, P2 cannot complete

✅ [TEST-05] Mutex Mutual Exclusion & Queue Serialization (Process Synchronization)
   Expected: Doctor A acquires lock; Doctor B blocked in waiting queue position 1
   Actual:   First user locked; second user placed in queue

✅ [TEST-06] Double Bed Allocation Guard (Resource Management)
   Expected: Occupied bed cannot be double-allocated to another patient
   Actual:   Bed ICU-01 protected against concurrent allocation

✅ [TEST-07] Off-Duty Doctor Assignment Guard (Resource Management)
   Expected: OFF_DUTY doctors cannot receive new patient assignments
   Actual:   Doctor Dr. Leonard McCoy confirmed OFF_DUTY and guarded

✅ [TEST-08] Producer-Consumer Semaphore Invariant (Process Synchronization)
   Expected: Invariant: empty + full = buffer capacity
   Actual:   Invariant satisfied: empty(3) + bufferSize(3) == capacity(6)

✅ [TEST-09] Hospital Capacity Partition & Fragmentation Calculation (Memory Management)
   Expected: Partitions mapped with internal & external fragmentation metrics calculated
   Actual:   Total Capacity: 100, Internal Frag: 10, External Frag: 35

✅ [TEST-10] Protection Matrix RBAC Restrictions (Protection & Security)
   Expected: Admin has WRITE on system_settings; Doctor and Coordinator denied
   Actual:   Protection matrix enforces strict least-privilege boundary

🎉 All 10 OS algorithm tests passed successfully!
```

You can also run these tests live inside the UI by navigating to the **[System Test Runner](http://localhost:5173/system-testing)** page!

---

## 🔮 Future Enhancements
- **Multi-Core Scheduling**: Modeling multiple simultaneous emergency resuscitation bays as symmetric multi-processing (SMP).
- **Virtual Memory Paging**: Virtual patient record swapping between active memory cache and cold storage disk.
- **Distributed Synchronization**: Raft consensus algorithm across multiple regional hospital network nodes.
