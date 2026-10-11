const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');

// GET /api/ots - List all operation theatres and surgical status
router.get('/', authenticateToken, (req, res) => {
  const store = db.getStore();
  return res.json(store.operationTheatres);
});

// POST /api/ots/schedule - Schedule an emergency surgery with priority scheduling
router.post('/schedule', authenticateToken, checkPermission('resource_allocation', 'WRITE'), auditLogger(
  (req, data) => `Scheduled Surgery in ${req.body.otId || 'Next Available'} for Patient ${req.body.patientId}`,
  (req, data) => req.body.otId || 'OT Scheduling'
), (req, res) => {
  const { otId, patientId, surgeryType, leadSurgeon, estDurationHours = 3 } = req.body;
  const store = db.getStore();

  const patient = store.patients.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'PATIENT_NOT_FOUND', message: 'Patient not found' });
  }

  let ot;
  if (otId) {
    ot = store.operationTheatres.find(o => o.id === otId);
  } else {
    // Find available OT
    ot = store.operationTheatres.find(o => o.status === 'AVAILABLE');
  }

  // Priority scheduling preemption check:
  // If no available OT and the incoming patient is Critical, check if a lower priority surgery can be preempted or queued
  if (!ot || ot.status !== 'AVAILABLE') {
    if (patient.priority === 'Critical') {
      const lowerPriorityOT = store.operationTheatres.find(o => o.status === 'IN USE' && o.priority !== 'Critical');
      if (lowerPriorityOT) {
        db.logSystemEvent('WARNING', 'SCHEDULER', `PREEMPTION CANDIDATE: Critical surgery for ${patient.id} requested while OT occupied by lower priority (${lowerPriorityOT.priority || 'Elective'})`);
      }
    }

    db.logSystemEvent('WARNING', 'RES_ALLOC', `OT Allocation Blocked: No Operating Theatres currently available for Process ${patient.id}`);
    patient.processState = 'BLOCKED';
    patient.waitingFor = Array.from(new Set([...(patient.waitingFor || []), 'Operation Theatre']));
    db.saveDB();

    return res.status(409).json({
      error: 'NO_OT_AVAILABLE',
      message: `No Operation Theatre is currently available. Process ${patient.id} placed into BLOCKED queue waiting on OT release.`
    });
  }

  const now = new Date();
  const completionDate = new Date(now.getTime() + (parseInt(estDurationHours, 10) || 3) * 60 * 60 * 1000);

  ot.status = 'IN USE';
  ot.currentPatient = patient.id;
  ot.leadSurgeon = leadSurgeon || patient.assignedDoctor || 'Dr. Angela Rossi';
  ot.surgeryType = surgeryType || patient.emergencyType;
  ot.priority = patient.priority;
  ot.startedAt = now.toISOString();
  ot.estCompletion = completionDate.toISOString();

  patient.assignedOT = ot.id;
  if (!patient.allocatedResources.includes('Operation Theatre')) {
    patient.allocatedResources.push('Operation Theatre');
  }
  patient.waitingFor = (patient.waitingFor || []).filter(r => r !== 'Operation Theatre');

  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'RES_ALLOC', `Emergency Surgery Scheduled: ${ot.id} assigned to Process ${patient.id} (Priority: ${patient.priority}) under ${ot.leadSurgeon}`);

  return res.json({
    success: true,
    message: `Operation Theatre ${ot.id} scheduled successfully`,
    ot,
    patient
  });
});

// POST /api/ots/release - Release OT upon surgery completion
router.post('/release', authenticateToken, checkPermission('resource_allocation', 'UPDATE'), (req, res) => {
  const { otId, nextStatus = 'CLEANING' } = req.body;
  const store = db.getStore();

  const ot = store.operationTheatres.find(o => o.id === otId);
  if (!ot) {
    return res.status(404).json({ error: 'OT_NOT_FOUND', message: 'Operation Theatre not found' });
  }

  const prevPatientId = ot.currentPatient;

  ot.status = nextStatus;
  ot.currentPatient = null;
  ot.leadSurgeon = null;
  ot.surgeryType = null;
  ot.priority = null;
  ot.startedAt = null;
  ot.estCompletion = null;

  if (prevPatientId) {
    const patient = store.patients.find(p => p.id === prevPatientId);
    if (patient) {
      patient.assignedOT = null;
      patient.allocatedResources = (patient.allocatedResources || []).filter(r => r !== 'Operation Theatre');
    }
  }

  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'RES_ALLOC', `Operation Theatre ${ot.id} released; terminal surgical disinfection and autoclave cycle initiated`);

  return res.json({
    success: true,
    message: `Operation Theatre ${ot.id} released and set to ${nextStatus}`,
    ot
  });
});

// PUT /api/ots/:id/status - Update OT status
router.put('/:id/status', authenticateToken, checkPermission('resource_allocation', 'UPDATE'), (req, res) => {
  const { status } = req.body;
  const store = db.getStore();
  const ot = store.operationTheatres.find(o => o.id === req.params.id);

  if (!ot) {
    return res.status(404).json({ error: 'OT_NOT_FOUND', message: 'Operation Theatre not found' });
  }

  ot.status = status;
  if (status === 'AVAILABLE') {
    ot.currentPatient = null;
  }

  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'RES_ALLOC', `Operation Theatre ${ot.id} status modified to ${status}`);

  return res.json({ message: 'OT status updated', ot });
});

module.exports = router;
