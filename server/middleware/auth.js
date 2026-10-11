const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../data/db');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication token required' });
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      db.logSystemEvent('SECURITY', 'AUTH_GUARD', `Invalid or expired session token attempt: ${err.message}`);
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    if (allowedRoles.length === 0 || allowedRoles.includes(req.user.role)) {
      return next();
    }

    db.logSystemEvent('SECURITY', 'ACCESS_CONTROL', `Access Denied for role [${req.user.role}] requesting restricted route ${req.originalUrl}`);
    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: `Role '${req.user.role}' lacks sufficient privileges to access this endpoint. Required roles: ${allowedRoles.join(', ')}`
    });
  };
}

function checkPermission(resourceKey, action = 'READ') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    // Admin has superuser override
    if (req.user.role === 'Admin') {
      return next();
    }

    const store = db.getStore();
    const rolePerms = store.accessMatrix.permissions[req.user.role];
    if (!rolePerms || !rolePerms[resourceKey] || !rolePerms[resourceKey].includes(action)) {
      db.logSystemEvent('SECURITY', 'PROTECTION_MATRIX', `Subject [${req.user.name} (${req.user.role})] denied action [${action}] on Object [${resourceKey}]`);
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: `Protection Matrix Violation: Role '${req.user.role}' is not granted '${action}' rights on resource '${resourceKey}'`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  checkPermission
};
