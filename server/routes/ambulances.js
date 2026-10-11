const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');

// GET /api/ambulances - List all ambulances
router.get('/', authenticateToken, (req, res) => {
  const store = db.getStore();
  return res.json(store.ambulances);
});

// POST /api/ambulances/dispatch - Dispatch an ambulance to a patient
router.post('/dispatch', authenticateToken, checkPermission('ambulance_dispatch', 'WRITE'), auditLogger(
  (req, data) => `Dispatched Ambulance ${req.body.ambulanceId || 'Best Available'} to Patient ${req.body.patientId}`,
  (req, data) => req.body.ambulanceId || 'Ambulance Dispatch'
), (req, res) => {
  const { ambulanceId, patientId, location, destination } = req.body;
  const store = db.getStore();

  const patient = store.patients.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'PATIENT_NOT_FOUND', message: 'Patient not found' });
  }

  let amb;
  if (ambulanceId) {
    amb = store.ambulances.find(a => a.id === ambulanceId);
    if (!amb) {
      return res.status(404).json({ error: 'AMBULANCE_NOT_FOUND', message: 'Ambulance not found' });
    }
    if (amb.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'AMBULANCE_BUSY', message: `Ambulance ${amb.id} is currently ${amb.status}` });
    }
  } else {
    // Find closest / highest-fuel available ambulance
    amb = store.ambulances.find(a => a.status === 'AVAILABLE');
    if (!amb) {
      db.logSystemEvent('WARNING', 'DISPATCH', `Dispatch failed: 0 Ambulances available for Patient ${patient.id}`);
      return res.status(503).json({ error: 'NO_AMBULANCES_AVAILABLE', message: 'All ambulances are currently dispatched or in maintenance' });
    }
  }

  // Calculate simulated ETA based on patient priority (Critical gets faster priority routing)
  const baseMinutes = patient.priority === 'Critical' ? 6 : (patient.priority === 'High' ? 10 : 15);
  const etaMinutes = baseMinutes + Math.floor(Math.random() * 5);

  amb.status = 'DISPATCHED';
  amb.assignedPatient = patient.id;
  amb.destination = destination || 'Metro General Emergency Dept';
  amb.location = location || `Emergency Site: Sector ${Math.floor(Math.random() * 12) + 1}`;
  amb.eta = etaMinutes;

  patient.assignedAmbulance = amb.id;

  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'DISPATCH', `Ambulance ${amb.id} (${amb.code}) dispatched to ${amb.location} for Process ${patient.id}. Simulated ETA: ${etaMinutes} mins`);

  return res.json({
    success: true,
    message: `Ambulance ${amb.id} successfully dispatched`,
    ambulance: amb,
    patient
  });
});

// PUT /api/ambulances/:id/status - Update ambulance status
router.put('/:id/status', authenticateToken, checkPermission('ambulance_dispatch', 'UPDATE'), (req, res) => {
  const { status, eta, location } = req.body;
  const store = db.getStore();
  const amb = store.ambulances.find(a => a.id === req.params.id);

  if (!amb) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Ambulance not found' });
  }

  const validStatuses = ['AVAILABLE', 'DISPATCHED', 'ON_ROUTE', 'AT_HOSPITAL', 'MAINTENANCE'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'INVALID_STATUS', message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const oldStatus = amb.status;
  amb.status = status;
  if (eta !== undefined) amb.eta = Math.max(0, parseInt(eta, 10));
  if (location) amb.location = location;

  if (status === 'AVAILABLE') {
    amb.assignedPatient = null;
    amb.destination = null;
    amb.eta = 0;
  }

  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'DISPATCH', `Ambulance ${amb.id} status transitioned: ${oldStatus} -> ${status}`);
  db.logAuditEvent(req.user.name, req.user.role, `Updated Ambulance Status to ${status}`, amb.id);

  return res.json({
    message: 'Ambulance status updated',
    ambulance: amb
  });
});

module.exports = router;
