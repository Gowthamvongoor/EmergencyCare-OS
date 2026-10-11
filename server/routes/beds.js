const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');

// GET /api/beds - List all beds and occupancy
router.get('/', authenticateToken, (req, res) => {
  const store = db.getStore();
  const icuBeds = store.beds.filter(b => b.type === 'ICU');
  const genBeds = store.beds.filter(b => b.type === 'General');

  return res.json({
    all: store.beds,
    icu: {
      beds: icuBeds,
      total: icuBeds.length,
      occupied: icuBeds.filter(b => b.status === 'OCCUPIED').length,
      available: icuBeds.filter(b => b.status === 'AVAILABLE').length,
      cleaning: icuBeds.filter(b => b.status === 'CLEANING').length,
      maintenance: icuBeds.filter(b => b.status === 'MAINTENANCE').length
    },
    general: {
      beds: genBeds,
      total: genBeds.length,
      occupied: genBeds.filter(b => b.status === 'OCCUPIED').length,
      available: genBeds.filter(b => b.status === 'AVAILABLE').length,
      cleaning: genBeds.filter(b => b.status === 'CLEANING').length,
      maintenance: genBeds.filter(b => b.status === 'MAINTENANCE').length
    }
  });
});

// POST /api/beds/allocate - Allocate bed to patient (Prevents double allocation)
router.post('/allocate', authenticateToken, checkPermission('bed_management', 'UPDATE'), auditLogger(
  (req, data) => `Allocated Bed ${req.body.bedId} to Patient ${req.body.patientId}`,
  (req, data) => req.body.bedId
), (req, res) => {
  const { bedId, patientId, ventilatorId } = req.body;
  const store = db.getStore();

  const bed = store.beds.find(b => b.id === bedId);
  if (!bed) {
    return res.status(404).json({ error: 'BED_NOT_FOUND', message: 'Bed not found' });
  }

  // Prevent double allocation!
  if (bed.status === 'OCCUPIED') {
    db.logSystemEvent('WARNING', 'RES_ALLOC', `CONCURRENT ALLOCATION CONFLICT: Bed ${bed.id} is already occupied by ${bed.patientName} (${bed.patientId})`);
    return res.status(409).json({
      error: 'BED_ALREADY_OCCUPIED',
      message: `Bed ${bed.id} is already occupied by patient ${bed.patientName} (${bed.patientId}). Double-allocation prevented!`
    });
  }

  if (bed.status === 'CLEANING' || bed.status === 'MAINTENANCE') {
    return res.status(400).json({
      error: 'BED_NOT_READY',
      message: `Bed ${bed.id} is currently under ${bed.status}. Must be marked AVAILABLE first.`
    });
  }

  const patient = store.patients.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'PATIENT_NOT_FOUND', message: 'Patient not found' });
  }

  // Assign bed
  bed.status = 'OCCUPIED';
  bed.patientId = patient.id;
  bed.patientName = patient.name;
  patient.assignedBed = bed.id;

  const resName = bed.type === 'ICU' ? 'ICU Bed' : 'General Bed';
  if (!patient.allocatedResources.includes(resName)) {
    patient.allocatedResources.push(resName);
  }
  patient.waitingFor = (patient.waitingFor || []).filter(r => r !== resName && r !== 'Bed');

  // Handle ventilator if specified
  if (ventilatorId) {
    const vent = store.ventilators.find(v => v.id === ventilatorId);
    if (vent && vent.status === 'AVAILABLE') {
      vent.status = 'IN_USE';
      vent.assignedBed = bed.id;
      vent.patientId = patient.id;
      bed.ventilator = vent.id;
      patient.assignedVentilator = vent.id;
      if (!patient.allocatedResources.includes('Ventilator')) {
        patient.allocatedResources.push('Ventilator');
      }
      patient.waitingFor = patient.waitingFor.filter(r => r !== 'Ventilator');
    }
  }

  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'RES_ALLOC', `Bed ${bed.id} (${bed.type}) allocated to Process ${patient.id} (${patient.name})`);

  return res.json({
    success: true,
    message: `Bed ${bed.id} allocated successfully to ${patient.name}`,
    bed,
    patient
  });
});

// POST /api/beds/release - Release bed
router.post('/release', authenticateToken, checkPermission('bed_management', 'UPDATE'), auditLogger(
  (req, data) => `Released Bed ${req.body.bedId}`,
  (req, data) => req.body.bedId
), (req, res) => {
  const { bedId, nextStatus = 'CLEANING' } = req.body;
  const store = db.getStore();

  const bed = store.beds.find(b => b.id === bedId);
  if (!bed) {
    return res.status(404).json({ error: 'BED_NOT_FOUND', message: 'Bed not found' });
  }

  const prevPatientId = bed.patientId;
  const prevPatientName = bed.patientName;

  bed.status = nextStatus;
  bed.patientId = null;
  bed.patientName = null;

  if (bed.ventilator) {
    const vent = store.ventilators.find(v => v.id === bed.ventilator);
    if (vent) {
      vent.status = 'AVAILABLE';
      vent.assignedBed = null;
      vent.patientId = null;
    }
    bed.ventilator = null;
  }

  if (prevPatientId) {
    const patient = store.patients.find(p => p.id === prevPatientId);
    if (patient) {
      patient.assignedBed = null;
      patient.allocatedResources = (patient.allocatedResources || []).filter(r => !r.includes('Bed'));
    }
  }

  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'RES_ALLOC', `Bed ${bed.id} released from ${prevPatientName || 'Patient'}. Set to ${nextStatus}.`);

  return res.json({
    success: true,
    message: `Bed ${bed.id} released and marked ${nextStatus}`,
    bed
  });
});

// PUT /api/beds/:id/status - Update bed status (Mark cleaning, available, maintenance)
router.put('/:id/status', authenticateToken, checkPermission('bed_management', 'UPDATE'), (req, res) => {
  const { status } = req.body;
  const store = db.getStore();
  const bed = store.beds.find(b => b.id === req.params.id);

  if (!bed) {
    return res.status(404).json({ error: 'BED_NOT_FOUND', message: 'Bed not found' });
  }

  const validStatuses = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'INVALID_STATUS', message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  bed.status = status;
  if (status !== 'OCCUPIED') {
    bed.patientId = null;
    bed.patientName = null;
  }

  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'RES_ALLOC', `Bed ${bed.id} status updated to ${status}`);
  db.logAuditEvent(req.user.name, req.user.role, `Updated Bed Status to ${status}`, bed.id);

  return res.json({
    message: 'Bed status updated',
    bed
  });
});

module.exports = router;
