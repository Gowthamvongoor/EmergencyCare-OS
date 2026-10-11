const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/logs/system - Retrieve OS kernel system logs
router.get('/system', authenticateToken, (req, res) => {
  const store = db.getStore();
  const { level, limit = 100 } = req.query;

  let logs = [...store.systemLogs];
  if (level && level !== 'ALL') {
    logs = logs.filter(l => l.level.toLowerCase() === level.toLowerCase());
  }

  const counts = {
    total: store.systemLogs.length,
    info: store.systemLogs.filter(l => l.level === 'INFO').length,
    warning: store.systemLogs.filter(l => l.level === 'WARNING').length,
    error: store.systemLogs.filter(l => l.level === 'ERROR').length,
    security: store.systemLogs.filter(l => l.level === 'SECURITY').length
  };

  return res.json({
    logs: logs.slice(0, parseInt(limit, 10)),
    counts
  });
});

// GET /api/logs/audit - Retrieve hospital activity audit trail
router.get('/audit', authenticateToken, (req, res) => {
  const store = db.getStore();
  const { limit = 100 } = req.query;
  return res.json({
    auditLogs: store.auditLogs.slice(0, parseInt(limit, 10)),
    total: store.auditLogs.length
  });
});

// POST /api/logs/reset - Reset entire database to initial seed state
router.post('/reset', authenticateToken, requireRole(['Admin']), (req, res) => {
  db.resetDB();
  db.logSystemEvent('SECURITY', 'DATABASE', `System database state factory reset executed by ${req.user.name} (${req.user.email})`);
  db.logAuditEvent(req.user.name, req.user.role, 'Reset Database to Demo Seed State', 'System DB');

  return res.json({
    success: true,
    message: 'Hospital database has been reset to pristine initial state'
  });
});

module.exports = router;
