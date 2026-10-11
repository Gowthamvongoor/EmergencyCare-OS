const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken } = require('../middleware/auth');
const scheduler = require('../services/scheduler');

// GET /api/scheduling - Run scheduling algorithms on active patients
router.get('/', authenticateToken, (req, res) => {
  const { algorithm = 'priority', quantum = 2, filter = 'active' } = req.query;
  const store = db.getStore();

  let targetPatients = [...store.patients];
  if (filter === 'active') {
    targetPatients = targetPatients.filter(p => ['NEW', 'READY', 'RUNNING', 'WAITING', 'BLOCKED'].includes(p.processState));
  }

  // If active is empty, use all patients
  if (targetPatients.length === 0) {
    targetPatients = [...store.patients];
  }

  let result;
  const algoLower = algorithm.toLowerCase();

  if (algoLower === 'fcfs') {
    result = scheduler.runFCFSScheduling(targetPatients);
  } else if (algoLower === 'round-robin' || algoLower === 'rr') {
    result = scheduler.runRoundRobinScheduling(targetPatients, parseInt(quantum, 10) || 2);
  } else {
    // Default: Priority Scheduling
    result = scheduler.runPriorityScheduling(targetPatients);
  }

  db.logSystemEvent('INFO', 'SCHEDULER', `Dispatched CPU scheduling algorithm [${result.algorithm}] across ${targetPatients.length} patient processes. Avg Waiting: ${result.avgWaitingTime}s`);

  return res.json({
    ...result,
    totalPatients: targetPatients.length,
    executedAt: new Date().toISOString()
  });
});

module.exports = router;
