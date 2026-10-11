/**
 * OS CPU Scheduling Engine for EmergencyCare OS
 * Models patients as processes and doctors/treatment bays as CPU cores.
 * 
 * Algorithms implemented:
 * 1. Priority Scheduling (Critical=1, High=2, Medium=3, Low=4)
 * 2. First-Come, First-Served (FCFS)
 * 3. Round Robin (RR) with dynamic Time Quantum
 */

function normalizePatients(patientList) {
  // Sort by arrival time to establish base timeline
  const sorted = [...patientList].sort((a, b) => new Date(a.arrivalTime) - new Date(b.arrivalTime));
  const baseTime = sorted.length > 0 ? new Date(sorted[0].arrivalTime).getTime() : Date.now();

  return sorted.map((p, idx) => {
    const arrivalSeconds = Math.max(0, Math.floor((new Date(p.arrivalTime).getTime() - baseTime) / (1000 * 60 * 10))); // scale to units
    return {
      id: p.id,
      pid: p.pid || (1000 + idx + 1),
      name: p.name,
      priority: p.priority || 'Medium',
      priorityValue: p.priorityValue || (p.priority === 'Critical' ? 1 : p.priority === 'High' ? 2 : p.priority === 'Medium' ? 3 : 4),
      burstTime: p.burstTime || 4,
      arrivalTime: arrivalSeconds,
      originalArrival: p.arrivalTime,
      emergencyType: p.emergencyType
    };
  });
}

/**
 * 1. Priority Scheduling (Non-preemptive / Preemptive aware)
 */
function runPriorityScheduling(patientList) {
  const processes = normalizePatients(patientList);
  if (processes.length === 0) return { gantt: [], metrics: [], avgWaitingTime: 0, avgTurnaroundTime: 0, avgResponseTime: 0 };

  let currentTime = 0;
  const readyQueue = [];
  const completed = [];
  const gantt = [];
  const remaining = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

  while (remaining.length > 0 || readyQueue.length > 0) {
    // Add all processes that have arrived by currentTime
    while (remaining.length > 0 && remaining[0].arrivalTime <= currentTime) {
      readyQueue.push(remaining.shift());
    }

    if (readyQueue.length === 0) {
      // Idle CPU
      const nextArrival = remaining[0].arrivalTime;
      gantt.push({
        id: 'IDLE',
        pid: 'IDLE',
        name: 'Idle / Triage Standby',
        start: currentTime,
        end: nextArrival,
        duration: nextArrival - currentTime,
        priority: 'None',
        color: '#94a3b8'
      });
      currentTime = nextArrival;
      continue;
    }

    // Sort readyQueue by priority (1 is highest), then arrival time
    readyQueue.sort((a, b) => {
      if (a.priorityValue !== b.priorityValue) return a.priorityValue - b.priorityValue;
      return a.arrivalTime - b.arrivalTime;
    });

    const currentProcess = readyQueue.shift();
    const startTime = currentTime;
    const completionTime = startTime + currentProcess.burstTime;
    const turnaroundTime = completionTime - currentProcess.arrivalTime;
    const waitingTime = startTime - currentProcess.arrivalTime;
    const responseTime = waitingTime;

    gantt.push({
      id: currentProcess.id,
      pid: currentProcess.pid,
      name: currentProcess.name,
      emergencyType: currentProcess.emergencyType,
      priority: currentProcess.priority,
      priorityValue: currentProcess.priorityValue,
      start: startTime,
      end: completionTime,
      duration: currentProcess.burstTime,
      color: getPriorityColor(currentProcess.priority)
    });

    completed.push({
      ...currentProcess,
      startTime,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime
    });

    currentTime = completionTime;
  }

  const totals = completed.reduce((acc, p) => ({
    waiting: acc.waiting + p.waitingTime,
    turnaround: acc.turnaround + p.turnaroundTime,
    response: acc.response + p.responseTime
  }), { waiting: 0, turnaround: 0, response: 0 });

  const n = completed.length;
  return {
    algorithm: 'Priority Scheduling',
    gantt,
    metrics: completed,
    avgWaitingTime: Number((totals.waiting / n).toFixed(2)),
    avgTurnaroundTime: Number((totals.turnaround / n).toFixed(2)),
    avgResponseTime: Number((totals.response / n).toFixed(2)),
    totalTime: currentTime
  };
}

/**
 * 2. First-Come, First-Served (FCFS)
 */
function runFCFSScheduling(patientList) {
  const processes = normalizePatients(patientList);
  if (processes.length === 0) return { gantt: [], metrics: [], avgWaitingTime: 0, avgTurnaroundTime: 0, avgResponseTime: 0 };

  let currentTime = 0;
  const gantt = [];
  const metrics = [];

  // Sort by arrival time strictly
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

  for (const p of processes) {
    if (currentTime < p.arrivalTime) {
      gantt.push({
        id: 'IDLE',
        pid: 'IDLE',
        name: 'Idle / Triage Standby',
        start: currentTime,
        end: p.arrivalTime,
        duration: p.arrivalTime - currentTime,
        priority: 'None',
        color: '#94a3b8'
      });
      currentTime = p.arrivalTime;
    }

    const startTime = currentTime;
    const completionTime = startTime + p.burstTime;
    const turnaroundTime = completionTime - p.arrivalTime;
    const waitingTime = startTime - p.arrivalTime;
    const responseTime = waitingTime;

    gantt.push({
      id: p.id,
      pid: p.pid,
      name: p.name,
      emergencyType: p.emergencyType,
      priority: p.priority,
      priorityValue: p.priorityValue,
      start: startTime,
      end: completionTime,
      duration: p.burstTime,
      color: getPriorityColor(p.priority)
    });

    metrics.push({
      ...p,
      startTime,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime
    });

    currentTime = completionTime;
  }

  const totals = metrics.reduce((acc, p) => ({
    waiting: acc.waiting + p.waitingTime,
    turnaround: acc.turnaround + p.turnaroundTime,
    response: acc.response + p.responseTime
  }), { waiting: 0, turnaround: 0, response: 0 });

  const n = metrics.length;
  return {
    algorithm: 'First-Come, First-Served (FCFS)',
    gantt,
    metrics,
    avgWaitingTime: Number((totals.waiting / n).toFixed(2)),
    avgTurnaroundTime: Number((totals.turnaround / n).toFixed(2)),
    avgResponseTime: Number((totals.response / n).toFixed(2)),
    totalTime: currentTime
  };
}

/**
 * 3. Round Robin (RR) with Quantum
 */
function runRoundRobinScheduling(patientList, quantum = 2) {
  const processes = normalizePatients(patientList);
  if (processes.length === 0) return { gantt: [], metrics: [], avgWaitingTime: 0, avgTurnaroundTime: 0, avgResponseTime: 0 };

  const timeQuantum = Math.max(1, parseInt(quantum, 10) || 2);
  let currentTime = 0;
  const gantt = [];
  const procState = processes.map(p => ({
    ...p,
    remBurst: p.burstTime,
    firstStart: -1,
    completionTime: -1
  }));

  const queue = [];
  const remaining = [...procState].sort((a, b) => a.arrivalTime - b.arrivalTime);

  while (remaining.length > 0 && remaining[0].arrivalTime <= currentTime) {
    queue.push(remaining.shift());
  }

  while (queue.length > 0 || remaining.length > 0) {
    if (queue.length === 0) {
      const nextArrival = remaining[0].arrivalTime;
      gantt.push({
        id: 'IDLE',
        pid: 'IDLE',
        name: 'Idle / Triage Standby',
        start: currentTime,
        end: nextArrival,
        duration: nextArrival - currentTime,
        priority: 'None',
        color: '#94a3b8'
      });
      currentTime = nextArrival;
      while (remaining.length > 0 && remaining[0].arrivalTime <= currentTime) {
        queue.push(remaining.shift());
      }
      continue;
    }

    const cur = queue.shift();
    if (cur.firstStart === -1) {
      cur.firstStart = currentTime;
    }

    const slice = Math.min(cur.remBurst, timeQuantum);
    const start = currentTime;
    currentTime += slice;
    cur.remBurst -= slice;

    gantt.push({
      id: cur.id,
      pid: cur.pid,
      name: cur.name,
      emergencyType: cur.emergencyType,
      priority: cur.priority,
      priorityValue: cur.priorityValue,
      start,
      end: currentTime,
      duration: slice,
      color: getPriorityColor(cur.priority)
    });

    // Enqueue newly arrived processes during this quantum slice
    while (remaining.length > 0 && remaining[0].arrivalTime <= currentTime) {
      queue.push(remaining.shift());
    }

    if (cur.remBurst > 0) {
      queue.push(cur);
    } else {
      cur.completionTime = currentTime;
    }
  }

  const metrics = procState.map(p => {
    const turnaroundTime = p.completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    const responseTime = p.firstStart - p.arrivalTime;
    return {
      ...p,
      startTime: p.firstStart,
      turnaroundTime,
      waitingTime,
      responseTime
    };
  });

  const totals = metrics.reduce((acc, p) => ({
    waiting: acc.waiting + p.waitingTime,
    turnaround: acc.turnaround + p.turnaroundTime,
    response: acc.response + p.responseTime
  }), { waiting: 0, turnaround: 0, response: 0 });

  const n = metrics.length;
  return {
    algorithm: `Round Robin (Quantum = ${timeQuantum})`,
    quantum: timeQuantum,
    gantt,
    metrics,
    avgWaitingTime: Number((totals.waiting / n).toFixed(2)),
    avgTurnaroundTime: Number((totals.turnaround / n).toFixed(2)),
    avgResponseTime: Number((totals.response / n).toFixed(2)),
    totalTime: currentTime
  };
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'Critical': return '#ef4444'; // Red
    case 'High': return '#f97316';     // Orange
    case 'Medium': return '#eab308';   // Yellow
    case 'Low': return '#10b981';      // Emerald
    default: return '#64748b';
  }
}

module.exports = {
  runPriorityScheduling,
  runFCFSScheduling,
  runRoundRobinScheduling
};
