const db = require('../data/db');

function auditLogger(actionDescription, targetExtractor) {
  return (req, res, next) => {
    // Execute request first
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const user = req.user || { name: 'Anonymous / Guest', role: 'Guest' };
          let target = 'System';
          if (typeof targetExtractor === 'function') {
            target = targetExtractor(req, data);
          } else if (req.params && req.params.id) {
            target = req.params.id;
          } else if (req.body && (req.body.id || req.body.name)) {
            target = req.body.id || req.body.name;
          }

          const action = typeof actionDescription === 'function' ? actionDescription(req, data) : actionDescription;
          db.logAuditEvent(user.name, user.role, action, target);
        } catch (e) {
          console.error('[Audit Logger Error]', e.message);
        }
      }
      return originalJson.call(this, data);
    };
    next();
  };
}

module.exports = {
  auditLogger
};
