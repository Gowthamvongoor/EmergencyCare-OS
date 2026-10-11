const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const db = require('../data/db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'INVALID_CREDENTIALS', message: 'Email and password are required' });
  }

  const store = db.getStore();
  const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    db.logSystemEvent('SECURITY', 'AUTH', `Failed login attempt for nonexistent user: ${email}`);
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
  }

  // Check password against bcrypt hash
  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    db.logSystemEvent('SECURITY', 'AUTH', `Failed password verification for user: ${email}`);
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
  }

  // Generate JWT token
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department
  };

  const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

  db.logSystemEvent('SECURITY', 'AUTH', `User logged in: ${user.name} [Role: ${user.role}]`);
  db.logAuditEvent(user.name, user.role, 'User Logged In', 'Authentication System');

  // Return user info and role permissions
  const rolePermissions = store.accessMatrix.permissions[user.role] || {};

  return res.json({
    token,
    user: {
      ...payload,
      avatar: user.avatar
    },
    permissions: rolePermissions
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const store = db.getStore();
  const user = store.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User record not found' });
  }

  const rolePermissions = store.accessMatrix.permissions[user.role] || {};

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar: user.avatar
    },
    permissions: rolePermissions
  });
});

module.exports = router;
