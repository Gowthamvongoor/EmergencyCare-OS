const fs = require('fs');
const path = require('path');
const config = require('../config');
const initialData = require('./initialData');

let store = null;

// Ensure data directory exists
const dataDir = path.dirname(config.DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Deep clone helper
const clone = (data) => JSON.parse(JSON.stringify(data));

// Initialize or load data store
function initDB() {
  if (fs.existsSync(config.DATA_FILE)) {
    try {
      const raw = fs.readFileSync(config.DATA_FILE, 'utf-8');
      store = JSON.parse(raw);
    } catch (err) {
      console.error('[DB] Failed to read store.json, resetting to seed data:', err.message);
      resetDB();
    }
  } else {
    resetDB();
  }
}

// Reset store to initial demo state
function resetDB() {
  store = {
    users: clone(initialData.users),
    resources: clone(initialData.resources),
    patients: clone(initialData.patients),
    doctors: clone(initialData.doctors),
    nurses: clone(initialData.nurses),
    beds: clone(initialData.beds),
    ambulances: clone(initialData.ambulances),
    operationTheatres: clone(initialData.operationTheatres),
    ventilators: clone(initialData.ventilators),
    accessMatrix: clone(initialData.accessMatrix),
    systemLogs: clone(initialData.systemLogs),
    auditLogs: clone(initialData.auditLogs),
    virtualFileSystem: clone(initialData.virtualFileSystem),
    updatedAt: new Date().toISOString()
  };
  saveDB();
}

// Persist store to disk atomically
function saveDB() {
  if (!store) return;
  try {
    store.updatedAt = new Date().toISOString();
    const tempFile = `${config.DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tempFile, config.DATA_FILE);
  } catch (err) {
    console.error('[DB] Error saving store to disk:', err.message);
  }
}

// Append an OS system log entry
function logSystemEvent(level, subsystem, message) {
  if (!store) initDB();
  const entry = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(), // 'INFO', 'WARNING', 'ERROR', 'SECURITY'
    subsystem,
    message
  };
  store.systemLogs.unshift(entry);
  // Keep max 200 logs
  if (store.systemLogs.length > 200) {
    store.systemLogs = store.systemLogs.slice(0, 200);
  }
  saveDB();
  return entry;
}

// Append an audit log entry
function logAuditEvent(actor, role, action, target) {
  if (!store) initDB();
  const date = new Date();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const entry = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: timeStr,
    fullTimestamp: date.toISOString(),
    actor: actor || 'System User',
    role: role || 'Unknown',
    action,
    target: target || 'Resource'
  };
  store.auditLogs.unshift(entry);
  if (store.auditLogs.length > 200) {
    store.auditLogs = store.auditLogs.slice(0, 200);
  }
  saveDB();
  return entry;
}

// Recalculate resource aggregate statistics
function syncResourceStats() {
  if (!store) initDB();
  
  // Bed stats
  const icuBeds = store.beds.filter(b => b.type === 'ICU');
  const genBeds = store.beds.filter(b => b.type === 'General');
  const icuRes = store.resources.find(r => r.id === 'RES-ICU');
  const genRes = store.resources.find(r => r.id === 'RES-GEN');
  
  if (icuRes) {
    icuRes.total = icuBeds.length;
    icuRes.allocated = icuBeds.filter(b => b.status === 'OCCUPIED').length;
    icuRes.available = icuBeds.filter(b => b.status === 'AVAILABLE').length;
    icuRes.waiting = store.patients.filter(p => p.waitingFor && p.waitingFor.includes('ICU Bed')).length;
  }
  
  if (genRes) {
    genRes.total = genBeds.length;
    genRes.allocated = genBeds.filter(b => b.status === 'OCCUPIED').length;
    genRes.available = genBeds.filter(b => b.status === 'AVAILABLE').length;
    genRes.waiting = store.patients.filter(p => p.waitingFor && p.waitingFor.includes('General Bed')).length;
  }

  // Doctor stats
  const docRes = store.resources.find(r => r.id === 'RES-DOC');
  if (docRes) {
    docRes.total = store.doctors.length;
    docRes.allocated = store.doctors.filter(d => d.status === 'BUSY').length;
    docRes.available = store.doctors.filter(d => d.status === 'AVAILABLE').length;
    docRes.waiting = store.patients.filter(p => p.waitingFor && p.waitingFor.includes('Doctor')).length;
  }

  // Nurse stats
  const nurRes = store.resources.find(r => r.id === 'RES-NUR');
  if (nurRes) {
    nurRes.total = store.nurses.length;
    nurRes.allocated = store.nurses.filter(n => n.status === 'BUSY').length;
    nurRes.available = store.nurses.filter(n => n.status === 'AVAILABLE').length;
    nurRes.waiting = store.patients.filter(p => p.waitingFor && p.waitingFor.includes('Nurse')).length;
  }

  // Ambulance stats
  const ambRes = store.resources.find(r => r.id === 'RES-AMB');
  if (ambRes) {
    ambRes.total = store.ambulances.length;
    ambRes.available = store.ambulances.filter(a => a.status === 'AVAILABLE').length;
    ambRes.allocated = store.ambulances.filter(a => ['DISPATCHED', 'ON_ROUTE', 'AT_HOSPITAL'].includes(a.status)).length;
    ambRes.waiting = store.patients.filter(p => p.waitingFor && p.waitingFor.includes('Ambulance')).length;
  }

  // OT stats
  const otRes = store.resources.find(r => r.id === 'RES-OT');
  if (otRes) {
    otRes.total = store.operationTheatres.length;
    otRes.available = store.operationTheatres.filter(o => o.status === 'AVAILABLE').length;
    otRes.allocated = store.operationTheatres.filter(o => o.status === 'IN USE').length;
    otRes.waiting = store.patients.filter(p => p.waitingFor && p.waitingFor.includes('Operation Theatre')).length;
  }

  // Ventilator stats
  const ventRes = store.resources.find(r => r.id === 'RES-VENT');
  if (ventRes) {
    ventRes.total = store.ventilators.length;
    ventRes.available = store.ventilators.filter(v => v.status === 'AVAILABLE').length;
    ventRes.allocated = store.ventilators.filter(v => v.status === 'IN_USE').length;
    ventRes.waiting = store.patients.filter(p => p.waitingFor && p.waitingFor.includes('Ventilator')).length;
  }

  saveDB();
}

// Initial load
initDB();

module.exports = {
  getStore: () => {
    if (!store) initDB();
    return store;
  },
  saveDB,
  resetDB,
  logSystemEvent,
  logAuditEvent,
  syncResourceStats
};
