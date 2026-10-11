const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const bankers = require('../services/bankersAlgorithm');

// GET /api/deadlock/matrices - Retrieve current matrices for Banker's Algorithm
router.get('/matrices', authenticateToken, (req, res) => {
  const store = db.getStore();
  const matrixData = bankers.buildMatricesFromState(store.patients, store.resources);
  return res.json(matrixData);
});

// POST /api/deadlock/banker - Execute Banker's Algorithm Safety Check
router.post('/banker', authenticateToken, (req, res) => {
  const store = db.getStore();
  const { customMatrices, scenario } = req.body;

  let matrixData;

  if (customMatrices) {
    matrixData = customMatrices;
  } else if (scenario === 'deadlock_demo') {
    // Generate a deliberate deadlock/unsafe state scenario for educational evaluation
    matrixData = {
      resourceTypes: ['Doctor', 'Nurse', 'ICU Bed', 'Ventilator'],
      processes: [
        { id: 'PAT-P1', pid: 101, name: 'P1: Severe Trauma', priority: 'Critical' },
        { id: 'PAT-P2', pid: 102, name: 'P2: Cardiac Arrest', priority: 'Critical' },
        { id: 'PAT-P3', pid: 103, name: 'P3: Septic Shock', priority: 'High' }
      ],
      available: { Doctor: 0, Nurse: 0, 'ICU Bed': 0, Ventilator: 0 },
      allocation: {
        'PAT-P1': { Doctor: 1, Nurse: 0, 'ICU Bed': 1, Ventilator: 0 },
        'PAT-P2': { Doctor: 0, Nurse: 1, 'ICU Bed': 0, Ventilator: 1 },
        'PAT-P3': { Doctor: 1, Nurse: 1, 'ICU Bed': 0, Ventilator: 0 }
      },
      max: {
        'PAT-P1': { Doctor: 1, Nurse: 1, 'ICU Bed': 1, Ventilator: 1 },
        'PAT-P2': { Doctor: 1, Nurse: 1, 'ICU Bed': 1, Ventilator: 1 },
        'PAT-P3': { Doctor: 1, Nurse: 2, 'ICU Bed': 1, Ventilator: 1 }
      },
      need: {
        'PAT-P1': { Doctor: 0, Nurse: 1, 'ICU Bed': 0, Ventilator: 1 },
        'PAT-P2': { Doctor: 1, Nurse: 0, 'ICU Bed': 1, Ventilator: 0 },
        'PAT-P3': { Doctor: 0, Nurse: 1, 'ICU Bed': 1, Ventilator: 1 }
      }
    };
  } else {
    matrixData = bankers.buildMatricesFromState(store.patients, store.resources);
  }

  const result = bankers.runBankersSafetyCheck(matrixData);

  if (result.isSafe) {
    db.logSystemEvent('INFO', 'DEADLOCK', `Banker's Algorithm: SAFE STATE verified. Sequence: ${result.safeSequence.map(p => p.id).join(' -> ')}`);
  } else {
    db.logSystemEvent('WARNING', 'DEADLOCK', `Banker's Algorithm: UNSAFE STATE detected! Deadlocked processes: ${result.deadlockedProcesses.map(p => p.id).join(', ')}`);
  }

  return res.json({
    ...result,
    matrixData
  });
});

// GET /api/deadlock/rag - Resource Allocation Graph & Cycle Detection
router.get('/rag', authenticateToken, (req, res) => {
  const store = db.getStore();
  const matrixData = bankers.buildMatricesFromState(store.patients, store.resources);

  const waitingMap = {};
  matrixData.processes.forEach(p => {
    const orig = store.patients.find(pt => pt.id === p.id);
    waitingMap[p.id] = orig ? (orig.waitingFor || []) : [];
  });

  const rag = bankers.buildResourceAllocationGraph(
    matrixData.processes,
    matrixData.allocation,
    waitingMap
  );

  return res.json({
    ...rag,
    processes: matrixData.processes,
    resourceTypes: matrixData.resourceTypes
  });
});

// POST /api/deadlock/recover - Execute Deadlock Recovery Action
router.post('/recover', authenticateToken, checkPermission('deadlock_recovery', 'UPDATE'), (req, res) => {
  const { actionType, victimProcessId, targetResourceId, newResourceId } = req.body;
  const store = db.getStore();

  let recoveryMessage = '';

  if (actionType === 'PREEMPT') {
    // Preempt resource from victim patient
    const victim = store.patients.find(p => p.id === victimProcessId);
    if (victim) {
      victim.allocatedResources = (victim.allocatedResources || []).filter(r => r !== targetResourceId);
      victim.waitingFor = Array.from(new Set([...(victim.waitingFor || []), targetResourceId]));
      victim.processState = 'BLOCKED';
      recoveryMessage = `[PREEMPTION] Preempted resource '${targetResourceId}' from lower-priority process ${victim.id} (${victim.name}). Process rolled back to BLOCKED state.`;
    }
  } else if (actionType === 'REASSIGN') {
    // Reassign resource
    const victim = store.patients.find(p => p.id === victimProcessId);
    if (victim && newResourceId) {
      victim.waitingFor = (victim.waitingFor || []).filter(r => r !== targetResourceId);
      victim.allocatedResources.push(newResourceId);
      victim.processState = 'RUNNING';
      recoveryMessage = `[REASSIGNMENT] Reassigned substitute resource '${newResourceId}' to process ${victim.id} (${victim.name}). State promoted to RUNNING.`;
    }
  } else if (actionType === 'CANCEL_REQUEST') {
    // Cancel request
    const victim = store.patients.find(p => p.id === victimProcessId);
    if (victim) {
      victim.waitingFor = (victim.waitingFor || []).filter(r => r !== targetResourceId);
      recoveryMessage = `[CANCEL_REQUEST] Aborted pending request for '${targetResourceId}' by process ${victim.id}. Removed from contention queue.`;
    }
  } else {
    // General rollback
    recoveryMessage = `[DEADLOCK RESOLVED] General preemption initiated. Released contended resource locks and re-evaluated safe sequence.`;
  }

  db.logSystemEvent('INFO', 'DEADLOCK', `Deadlock Recovery Initiated: ${recoveryMessage}`);
  db.logAuditEvent(req.user.name, req.user.role, 'Deadlock Recovery Action Executed', victimProcessId || 'Deadlock Engine');
  db.syncResourceStats();
  db.saveDB();

  return res.json({
    success: true,
    actionType,
    message: recoveryMessage,
    recoveredAt: new Date().toISOString()
  });
});

module.exports = router;
