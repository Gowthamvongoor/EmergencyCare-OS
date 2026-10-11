const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken } = require('../middleware/auth');
const syncManager = require('../services/synchronization');

// GET /api/sync/state - Get current lock status for a resource
router.get('/state', authenticateToken, (req, res) => {
  const { resource = 'ICU-05' } = req.query;
  const state = syncManager.getLockState(resource);
  return res.json(state);
});

// POST /api/sync/acquire - Request lock on resource
router.post('/acquire', authenticateToken, (req, res) => {
  const { resource = 'ICU-05', patientId = 'PAT-1001', customRequester = null, autoReleaseMs = 0 } = req.body;
  const requester = customRequester || {
    id: req.user.id,
    name: req.user.name,
    role: req.user.role,
    patientId
  };

  const outcome = syncManager.acquire(resource, requester, parseInt(autoReleaseMs, 10) || 0);

  if (outcome.success) {
    db.logSystemEvent('INFO', 'SYNC_LOCK', `Mutex acquired on ${resource} by ${requester.name} for patient ${patientId}`);
  } else {
    db.logSystemEvent('WARNING', 'SYNC_LOCK', `Mutex contention on ${resource}: ${requester.name} queued at position ${outcome.queuePosition}`);
  }

  return res.json(outcome);
});

// POST /api/sync/release - Release lock on resource
router.post('/release', authenticateToken, (req, res) => {
  const { resource = 'ICU-05' } = req.body;
  const outcome = syncManager.release(resource, req.user?.id || 'SYSTEM');

  db.logSystemEvent('INFO', 'SYNC_LOCK', `Mutex lock released on ${resource}. Next status: ${outcome.status}`);

  return res.json(outcome);
});

// POST /api/sync/race-test - Simulate 3-user simultaneous contention race condition
router.post('/race-test', authenticateToken, (req, res) => {
  const { resource = 'ICU-05' } = req.body;
  const testResults = syncManager.simulateRaceCondition(resource);

  db.logSystemEvent('WARNING', 'SYNC_LOCK', `Race condition test executed on ${resource}: 3 concurrent requests serialized via Mutex`);

  return res.json({
    message: `Concurrent access test completed on ${resource}`,
    ...testResults
  });
});

module.exports = router;
