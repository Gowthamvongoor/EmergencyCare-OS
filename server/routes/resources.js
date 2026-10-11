const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');

// GET /api/resources - List all hospital resources and utilization stats
router.get('/', authenticateToken, (req, res) => {
  db.syncResourceStats();
  const store = db.getStore();
  const resources = store.resources.map(r => ({
    ...r,
    utilization: r.total > 0 ? Math.round(((r.total - r.available) / r.total) * 100) : 0
  }));

  return res.json(resources);
});

// POST /api/resources - Add or update a resource configuration
router.post('/', authenticateToken, checkPermission('resource_allocation', 'WRITE'), (req, res) => {
  const store = db.getStore();
  const { name, total, icon, unit } = req.body;

  if (!name || !total) {
    return res.status(400).json({ error: 'MISSING_DATA', message: 'Name and total units are required' });
  }

  const id = `RES-${name.substring(0, 3).toUpperCase()}-${Date.now() % 1000}`;
  const totalNum = parseInt(total, 10);
  const newResource = {
    id,
    name,
    total: totalNum,
    available: totalNum,
    allocated: 0,
    waiting: 0,
    icon: icon || 'ShieldAlert',
    unit: unit || 'Units',
    utilization: 0
  };

  store.resources.push(newResource);
  db.saveDB();

  db.logSystemEvent('INFO', 'RES_ALLOC', `New hardware/hospital resource added: ${name} (Total: ${totalNum} ${newResource.unit})`);
  db.logAuditEvent(req.user.name, req.user.role, `Added Resource [${name}]`, id);

  return res.status(201).json(newResource);
});

// PUT /api/resources/:id - Update resource limits
router.put('/:id', authenticateToken, checkPermission('resource_allocation', 'UPDATE'), (req, res) => {
  const store = db.getStore();
  const resIndex = store.resources.findIndex(r => r.id === req.params.id);
  if (resIndex === -1) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Resource not found' });
  }

  const current = store.resources[resIndex];
  const { total, available } = req.body;

  if (total !== undefined) {
    current.total = parseInt(total, 10);
  }
  if (available !== undefined) {
    current.available = Math.min(current.total, Math.max(0, parseInt(available, 10)));
    current.allocated = current.total - current.available;
  }

  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'RES_ALLOC', `Resource limits modified for ${current.name}: Total=${current.total}, Available=${current.available}`);
  db.logAuditEvent(req.user.name, req.user.role, `Modified Resource Limits for ${current.name}`, current.id);

  return res.json(current);
});

// POST /api/resources/allocate - Smart Resource Allocation to Patient
router.post('/allocate', authenticateToken, checkPermission('resource_allocation', 'WRITE'), (req, res) => {
  const { patientId, resourcesToAllocate } = req.body;
  if (!patientId || !resourcesToAllocate || !Array.isArray(resourcesToAllocate)) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'patientId and resourcesToAllocate array are required' });
  }

  const store = db.getStore();
  const patient = store.patients.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'PATIENT_NOT_FOUND', message: 'Patient not found' });
  }

  const unavailable = [];
  const allocatedNow = [];

  // Check availability of each requested resource
  resourcesToAllocate.forEach(rName => {
    const resCatalog = store.resources.find(r => r.name.toLowerCase().includes(rName.toLowerCase()) || rName.toLowerCase().includes(r.name.toLowerCase()));
    if (!resCatalog || resCatalog.available <= 0) {
      unavailable.push(rName);
    } else {
      allocatedNow.push({ rName, catalog: resCatalog });
    }
  });

  if (unavailable.length > 0) {
    // Cannot fulfill completely -> Move patient into WAITING or BLOCKED state!
    patient.processState = 'BLOCKED';
    patient.waitingFor = Array.from(new Set([...(patient.waitingFor || []), ...unavailable]));

    db.logSystemEvent('WARNING', 'RES_ALLOC', `RESOURCE UNAVAILABLE: Patient ${patient.id} is waiting for: [${unavailable.join(', ')}]. Transitioned to BLOCKED.`);
    db.logAuditEvent(req.user.name, req.user.role, `Blocked on Resource Demand [${unavailable.join(', ')}]`, patient.id);
    db.syncResourceStats();
    db.saveDB();

    return res.status(409).json({
      success: false,
      status: 'BLOCKED',
      message: `RESOURCE UNAVAILABLE: Patient ${patient.id} is waiting for: ${unavailable.join(', ')}`,
      unavailable,
      patient
    });
  }

  // Allocate all requested resources
  allocatedNow.forEach(({ rName, catalog }) => {
    catalog.available = Math.max(0, catalog.available - 1);
    catalog.allocated++;
    if (!patient.allocatedResources.includes(rName)) {
      patient.allocatedResources.push(rName);
    }
  });

  patient.waitingFor = (patient.waitingFor || []).filter(r => !resourcesToAllocate.includes(r));
  if (patient.waitingFor.length === 0) {
    patient.processState = 'RUNNING';
  }

  db.logSystemEvent('INFO', 'RES_ALLOC', `Smart Allocation: [${resourcesToAllocate.join(', ')}] successfully allocated to Process ${patient.id}`);
  db.logAuditEvent(req.user.name, req.user.role, `Allocated [${resourcesToAllocate.join(', ')}]`, patient.id);
  db.syncResourceStats();
  db.saveDB();

  return res.json({
    success: true,
    status: 'ALLOCATED',
    message: `Resources successfully allocated to ${patient.name}`,
    patient
  });
});

// POST /api/resources/release - Release allocated resources
router.post('/release', authenticateToken, checkPermission('resource_allocation', 'UPDATE'), (req, res) => {
  const { patientId, resourcesToRelease } = req.body;
  const store = db.getStore();
  const patient = store.patients.find(p => p.id === patientId);

  if (!patient) {
    return res.status(404).json({ error: 'PATIENT_NOT_FOUND', message: 'Patient not found' });
  }

  const toRelease = Array.isArray(resourcesToRelease) ? resourcesToRelease : patient.allocatedResources;
  toRelease.forEach(rName => {
    const resCatalog = store.resources.find(r => r.name.toLowerCase().includes(rName.toLowerCase()) || rName.toLowerCase().includes(r.name.toLowerCase()));
    if (resCatalog) {
      resCatalog.available = Math.min(resCatalog.total, resCatalog.available + 1);
      resCatalog.allocated = Math.max(0, resCatalog.allocated - 1);
    }
    patient.allocatedResources = (patient.allocatedResources || []).filter(r => r !== rName);
  });

  db.logSystemEvent('INFO', 'RES_ALLOC', `Resources [${toRelease.join(', ')}] released by Process ${patient.id}`);
  db.logAuditEvent(req.user.name, req.user.role, `Released [${toRelease.join(', ')}]`, patient.id);
  db.syncResourceStats();
  db.saveDB();

  return res.json({
    success: true,
    message: 'Resources successfully released',
    patient
  });
});

module.exports = router;
