const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');

// GET /api/access-control - Get current Protection Matrix
router.get('/', authenticateToken, (req, res) => {
  const store = db.getStore();
  return res.json(store.accessMatrix);
});

// PUT /api/access-control - Update permissions in the Access Matrix (Admin only)
router.put('/', authenticateToken, requireRole(['Admin']), auditLogger(
  (req, data) => `Updated System Protection & Access Matrix Permissions`,
  (req, data) => 'Access Matrix Security Policy'
), (req, res) => {
  const { role, resourceKey, permissions } = req.body;
  const store = db.getStore();

  if (!role || !resourceKey || !Array.isArray(permissions)) {
    return res.status(400).json({ error: 'INVALID_DATA', message: 'role, resourceKey, and permissions array are required' });
  }

  if (!store.accessMatrix.permissions[role]) {
    store.accessMatrix.permissions[role] = {};
  }

  const oldPerms = store.accessMatrix.permissions[role][resourceKey] || [];
  store.accessMatrix.permissions[role][resourceKey] = permissions;

  db.saveDB();

  db.logSystemEvent('SECURITY', 'PROTECTION_MATRIX', `Subject [${role}] permissions on Object [${resourceKey}] modified: [${oldPerms.join(',')}] -> [${permissions.join(',')}]`);

  return res.json({
    message: `Access matrix updated for ${role} on ${resourceKey}`,
    accessMatrix: store.accessMatrix
  });
});

module.exports = router;
