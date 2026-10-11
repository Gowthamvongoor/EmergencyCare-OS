const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');

// GET /api/doctors - List all doctors and nurses
router.get('/', authenticateToken, (req, res) => {
  const store = db.getStore();
  return res.json({
    doctors: store.doctors,
    nurses: store.nurses,
    summary: {
      totalDoctors: store.doctors.length,
      availableDoctors: store.doctors.filter(d => d.status === 'AVAILABLE').length,
      busyDoctors: store.doctors.filter(d => d.status === 'BUSY').length,
      onBreakDoctors: store.doctors.filter(d => d.status === 'ON_BREAK').length,
      offDutyDoctors: store.doctors.filter(d => d.status === 'OFF_DUTY').length,
      totalNurses: store.nurses.length,
      availableNurses: store.nurses.filter(n => n.status === 'AVAILABLE').length
    }
  });
});

// PUT /api/doctors/:id/status - Update doctor status
router.put('/:id/status', authenticateToken, checkPermission('doctor_management', 'UPDATE'), (req, res) => {
  const { status } = req.body;
  const store = db.getStore();
  const doc = store.doctors.find(d => d.id === req.params.id);

  if (!doc) {
    return res.status(404).json({ error: 'DOCTOR_NOT_FOUND', message: 'Doctor not found' });
  }

  const validStatuses = ['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFF_DUTY'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'INVALID_STATUS', message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  // If going OFF_DUTY, verify doctor has no critical active patients
  if (status === 'OFF_DUTY' && doc.assignedPatients.length > 0) {
    const criticalPatients = store.patients.filter(p => doc.assignedPatients.includes(p.id) && p.priority === 'Critical');
    if (criticalPatients.length > 0) {
      return res.status(400).json({
        error: 'CRITICAL_PATIENTS_ASSIGNED',
        message: `Cannot place ${doc.name} OFF_DUTY while assigned to Critical patients: ${criticalPatients.map(p => p.id).join(', ')}. Reassign them first.`
      });
    }
  }

  const oldStatus = doc.status;
  doc.status = status;
  if (status === 'OFF_DUTY' || status === 'ON_BREAK') {
    doc.workload = 0;
  } else if (status === 'AVAILABLE') {
    doc.workload = Math.min(doc.workload, 25);
  }

  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'STAFF_MGR', `Doctor ${doc.name} status updated: ${oldStatus} -> ${status}`);
  db.logAuditEvent(req.user.name, req.user.role, `Updated Status to ${status}`, doc.name);

  return res.json({
    message: 'Doctor status updated',
    doctor: doc
  });
});

// POST /api/doctors/assign - Assign doctor to patient (Prevent assigning OFF_DUTY doctor!)
router.post('/assign', authenticateToken, checkPermission('doctor_management', 'UPDATE'), auditLogger(
  (req, data) => `Assigned Doctor ${req.body.doctorId} to Patient ${req.body.patientId}`,
  (req, data) => req.body.doctorId
), (req, res) => {
  const { doctorId, patientId } = req.body;
  const store = db.getStore();

  const doc = store.doctors.find(d => d.id === doctorId || d.name === doctorId);
  if (!doc) {
    return res.status(404).json({ error: 'DOCTOR_NOT_FOUND', message: 'Doctor not found' });
  }

  // Enforce rule: PREVENT ASSIGNING A DOCTOR WHO IS OFF_DUTY
  if (doc.status === 'OFF_DUTY') {
    db.logSystemEvent('WARNING', 'STAFF_MGR', `ASSIGNMENT REJECTED: Doctor ${doc.name} is currently OFF_DUTY`);
    return res.status(400).json({
      error: 'DOCTOR_OFF_DUTY',
      message: `Access Violation: Cannot assign ${doc.name} because their status is OFF_DUTY. Select an AVAILABLE or ON_CALL physician.`
    });
  }

  const patient = store.patients.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'PATIENT_NOT_FOUND', message: 'Patient not found' });
  }

  // Assign doctor
  patient.assignedDoctor = doc.name;
  if (!doc.assignedPatients.includes(patient.id)) {
    doc.assignedPatients.push(patient.id);
  }
  doc.status = 'BUSY';
  doc.workload = Math.min(100, doc.workload + 20);

  if (!patient.allocatedResources.includes('Doctor')) {
    patient.allocatedResources.push('Doctor');
  }
  patient.waitingFor = (patient.waitingFor || []).filter(r => r !== 'Doctor');

  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'STAFF_MGR', `Doctor ${doc.name} successfully assigned to Process ${patient.id} (${patient.name})`);

  return res.json({
    success: true,
    message: `${doc.name} assigned to patient ${patient.name}`,
    doctor: doc,
    patient
  });
});

module.exports = router;
