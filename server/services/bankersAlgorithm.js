/**
 * Banker's Algorithm & Deadlock Management Engine for EmergencyCare OS
 * Models patients as processes and medical resources (ICU, OT, Ventilators, Doctors, Nurses)
 * as OS multi-instance resources.
 */

const RESOURCE_TYPES = ['Doctor', 'Nurse', 'ICU Bed', 'Ventilator', 'Operation Theatre'];

/**
 * Builds matrices from live hospital state or uses custom scenario
 */
function buildMatricesFromState(storePatients, storeResources) {
  // Filter active patients (RUNNING, WAITING, BLOCKED, READY)
  const activePatients = storePatients.filter(p => ['RUNNING', 'WAITING', 'BLOCKED', 'READY'].includes(p.processState)).slice(0, 7);

  // Available resource vector
  const available = {};
  RESOURCE_TYPES.forEach(rType => {
    const res = storeResources.find(r => r.name.toLowerCase().includes(rType.toLowerCase()) || rType.toLowerCase().includes(r.name.toLowerCase()));
    available[rType] = res ? Math.max(0, res.available) : 1;
  });

  // Allocation matrix & Max matrix
  const allocation = {};
  const max = {};
  const need = {};

  activePatients.forEach(p => {
    allocation[p.id] = {};
    max[p.id] = {};
    need[p.id] = {};

    RESOURCE_TYPES.forEach(rType => {
      // Is resource currently allocated to this patient?
      const isAllocated = (p.allocatedResources || []).some(r => r.toLowerCase().includes(rType.toLowerCase()));
      // Is resource required?
      const isRequired = (p.requiredResources || []).some(r => r.toLowerCase().includes(rType.toLowerCase()));

      const allocCount = isAllocated ? 1 : 0;
      const maxCount = isRequired ? 1 : (isAllocated ? 1 : 0);

      allocation[p.id][rType] = allocCount;
      max[p.id][rType] = Math.max(allocCount, maxCount);
      need[p.id][rType] = max[p.id][rType] - allocation[p.id][rType];
    });
  });

  return {
    resourceTypes: RESOURCE_TYPES,
    processes: activePatients.map(p => ({ id: p.id, pid: p.pid, name: p.name, priority: p.priority })),
    available,
    allocation,
    max,
    need
  };
}

/**
 * Executes Banker's Algorithm Safety Check
 */
function runBankersSafetyCheck({ resourceTypes, processes, available, allocation, max, need }) {
  const rTypes = resourceTypes || RESOURCE_TYPES;
  const pList = [...processes];
  const work = { ...available };
  const finish = {};
  pList.forEach(p => { finish[p.id] = false; });

  const safeSequence = [];
  const stepLog = [];
  let found = true;

  stepLog.push({
    step: 0,
    action: 'INITIALIZATION',
    work: { ...work },
    description: `Initial Available vector: [${rTypes.map(r => `${r}: ${work[r]}`).join(', ')}]`
  });

  let stepCount = 1;

  while (safeSequence.length < pList.length && found) {
    found = false;

    for (const p of pList) {
      if (!finish[p.id]) {
        // Check if Need[p][j] <= Work[j] for all resources
        let canAllocate = true;
        for (const r of rTypes) {
          const needed = (need[p.id] && need[p.id][r] !== undefined) ? need[p.id][r] : 0;
          if (needed > work[r]) {
            canAllocate = false;
            break;
          }
        }

        if (canAllocate) {
          // Process can safely finish!
          for (const r of rTypes) {
            const alloc = (allocation[p.id] && allocation[p.id][r] !== undefined) ? allocation[p.id][r] : 0;
            work[r] += alloc;
          }
          finish[p.id] = true;
          safeSequence.push(p);
          found = true;

          stepLog.push({
            step: stepCount++,
            action: 'PROCESS_CAN_COMPLETE',
            processId: p.id,
            processName: p.name,
            workAfter: { ...work },
            description: `${p.id} (${p.name}) satisfies Need <= Work. Simulating execution and releasing held resources. New Work: [${rTypes.map(r => `${r}: ${work[r]}`).join(', ')}]`
          });
          break; // restart check loop with updated Work
        }
      }
    }
  }

  const isSafe = safeSequence.length === pList.length;
  const deadlockedProcesses = pList.filter(p => !finish[p.id]);

  return {
    isSafe,
    safeSequence: safeSequence.map(p => ({ id: p.id, pid: p.pid, name: p.name, priority: p.priority })),
    deadlockedProcesses: deadlockedProcesses.map(p => ({ id: p.id, pid: p.pid, name: p.name, priority: p.priority })),
    stepLog,
    summary: isSafe
      ? `SAFE STATE: System can safely schedule all patients without deadlock. Safe sequence: ${safeSequence.map(p => p.id).join(' -> ')}`
      : `UNSAFE STATE: Potential deadlock or starvation detected. ${deadlockedProcesses.length} patients cannot complete with current resource limits.`
  };
}

/**
 * Builds Resource Allocation Graph (RAG) representation
 * Identifies dependencies and circular wait cycles.
 */
function buildResourceAllocationGraph(processes, allocation, waitingResources) {
  const nodes = [];
  const edges = [];

  // Resource nodes
  RESOURCE_TYPES.forEach(r => {
    nodes.push({ id: `RES_${r}`, label: r, type: 'resource' });
  });

  // Process nodes & edges
  processes.forEach(p => {
    nodes.push({ id: p.id, label: `${p.id}: ${p.name}`, type: 'process', priority: p.priority });

    // Assignment edges: Resource -> Process (Process holds Resource)
    const pAlloc = allocation[p.id] || {};
    RESOURCE_TYPES.forEach(r => {
      if (pAlloc[r] && pAlloc[r] > 0) {
        edges.push({
          from: `RES_${r}`,
          to: p.id,
          type: 'ALLOCATED',
          label: 'holds'
        });
      }
    });

    // Request edges: Process -> Resource (Process waiting for Resource)
    const pWait = waitingResources[p.id] || [];
    pWait.forEach(r => {
      edges.push({
        from: p.id,
        to: `RES_${r}`,
        type: 'REQUEST',
        label: 'waiting for'
      });
    });
  });

  // Cycle detection in directed graph
  const cycles = detectCyclesInGraph(nodes, edges);

  return {
    nodes,
    edges,
    hasCycles: cycles.length > 0,
    cycles,
    isDeadlocked: cycles.length > 0
  };
}

// Simple DFS Cycle detector for RAG
function detectCyclesInGraph(nodes, edges) {
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    if (adj[e.from]) adj[e.from].push(e.to);
  });

  const visited = {};
  const recStack = {};
  const cycles = [];

  function dfs(u, path) {
    visited[u] = true;
    recStack[u] = true;
    path.push(u);

    for (const v of (adj[u] || [])) {
      if (!visited[v]) {
        dfs(v, path);
      } else if (recStack[v]) {
        // Cycle detected
        const cycleStartIndex = path.indexOf(v);
        if (cycleStartIndex !== -1) {
          cycles.push(path.slice(cycleStartIndex).concat(v));
        }
      }
    }

    path.pop();
    recStack[u] = false;
  }

  nodes.forEach(n => {
    if (!visited[n.id]) {
      dfs(n.id, []);
    }
  });

  return cycles;
}

module.exports = {
  RESOURCE_TYPES,
  buildMatricesFromState,
  runBankersSafetyCheck,
  buildResourceAllocationGraph
};
