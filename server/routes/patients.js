const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');

// Helper to determine priority value
function getPriorityValue(priority) {
  switch (priority) {
    case 'Critical': return 1;
    case 'High': return 2;
    case 'Medium': return 3;
    case 'Low': return 4;
    default: return 3;
  }
}

// GET /api/patients - List patients and emergency stats
router.get('/', authenticateToken, (req, res) => {
  const store = db.getStore();
  const { search, priority, state } = req.query;

  let list = [...store.patients];

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.emergencyType && p.emergencyType.toLowerCase().includes(q)) ||
      (p.assignedDoctor && p.assignedDoctor.toLowerCase().includes(q))
    );
  }

  if (priority && priority !== 'ALL') {
    list = list.filter(p => p.priority.toLowerCase() === priority.toLowerCase());
  }

  if (state && state !== 'ALL') {
    list = list.filter(p => p.processState.toLowerCase() === state.toLowerCase());
  }

  // Summary stats
  const total = store.patients.length;
  const critical = store.patients.filter(p => p.priority === 'Critical').length;
  const high = store.patients.filter(p => p.priority === 'High').length;
  const medium = store.patients.filter(p => p.priority === 'Medium').length;
  const low = store.patients.filter(p => p.priority === 'Low').length;
  const waiting = store.patients.filter(p => ['WAITING', 'BLOCKED', 'READY'].includes(p.processState)).length;
  const running = store.patients.filter(p => p.processState === 'RUNNING').length;
  const completed = store.patients.filter(p => p.processState === 'COMPLETED').length;

  return res.json({
    patients: list,
    stats: {
      total,
      critical,
      high,
      medium,
      low,
      waiting,
      running,
      completed
    }
  });
});

// GET /api/patients/:id - Get single patient
router.get('/:id', authenticateToken, (req, res) => {
  const store = db.getStore();
  const patient = store.patients.find(p => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Patient not found' });
  }
  return res.json(patient);
});

// POST /api/patients - Register new emergency patient (Create OS Process)
router.post('/', authenticateToken, checkPermission('patient_records', 'WRITE'), auditLogger(
  (req, data) => `Registered New Patient (${data.patient?.name || 'Unknown'})`,
  (req, data) => data.patient?.id
), (req, res) => {
  const store = db.getStore();
  const {
    name,
    age,
    gender,
    contact,
    emergencyType,
    symptoms,
    bloodGroup,
    medicalHistory,
    priority = 'Medium',
    burstTime = 4,
    requiredResources = ['Doctor'],
    assignedDoctor = null,
    assignedBed = null,
    assignedAmbulance = null
  } = req.body;

  if (!name || !emergencyType) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Patient name and emergency type are required' });
  }

  // Generate unique PID & ID: PAT-10XX
  const maxPid = store.patients.reduce((max, p) => Math.max(max, p.pid || 1000), 1000);
  const newPid = maxPid + 1;
  const newId = `PAT-${newPid}`;

  const prioVal = getPriorityValue(priority);
  const arrivalTime = new Date().toISOString();

  // Smart resource check
  const waitingFor = [];
  const allocatedResources = [];

  // Check bed availability if assigned or required
  if (assignedBed) {
    const bed = store.beds.find(b => b.id === assignedBed);
    if (bed && bed.status === 'AVAILABLE') {
      bed.status = 'OCCUPIED';
      bed.patientId = newId;
      bed.patientName = name;
      allocatedResources.push(bed.type === 'ICU' ? 'ICU Bed' : 'General Bed');
    } else {
      waitingFor.push('Bed');
    }
  }

  // Check doctor availability
  if (assignedDoctor) {
    const doc = store.doctors.find(d => d.name === assignedDoctor);
    if (doc && doc.status === 'AVAILABLE') {
      doc.status = 'BUSY';
      doc.assignedPatients.push(newId);
      allocatedResources.push('Doctor');
    } else if (doc && doc.status === 'OFF_DUTY') {
      return res.status(400).json({ error: 'DOCTOR_OFF_DUTY', message: `Cannot assign ${doc.name} because they are OFF_DUTY.` });
    } else {
      allocatedResources.push('Doctor'); // Doctor assigned workload increment
      if (doc) doc.assignedPatients.push(newId);
    }
  }

  // Determine initial process state
  let processState = 'READY';
  if (allocatedResources.length >= (requiredResources || []).length && (requiredResources || []).length > 0) {
    processState = 'RUNNING';
  } else if (waitingFor.length > 0) {
    processState = 'BLOCKED';
  }

  const newPatient = {
    id: newId,
    pid: newPid,
    name,
    age: parseInt(age, 10) || 30,
    gender: gender || 'Other',
    contact: contact || '',
    emergencyType,
    symptoms: symptoms || '',
    arrivalTime,
    bloodGroup: bloodGroup || 'O+',
    medicalHistory: medicalHistory || 'None',
    priority,
    priorityValue: prioVal,
    burstTime: parseInt(burstTime, 10) || 4,
    remainingTime: parseInt(burstTime, 10) || 4,
    processState,
    assignedDoctor: assignedDoctor || null,
    assignedBed: assignedBed || null,
    assignedAmbulance: assignedAmbulance || null,
    assignedOT: null,
    assignedVentilator: null,
    requiredResources: Array.isArray(requiredResources) ? requiredResources : ['Doctor'],
    allocatedResources,
    waitingFor
  };

  store.patients.unshift(newPatient);
  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'PROCESS_MGR', `Process ${newId} created [PID: ${newPid}, Priority: ${priority} (${prioVal})] for ${name}`);
  db.logSystemEvent('INFO', 'SCHEDULER', `${newId} entered ${processState} state with required resources: [${(requiredResources || []).join(', ')}]`);

  if (waitingFor.length > 0) {
    db.logSystemEvent('WARNING', 'RES_ALLOC', `Resource shortage: ${newId} BLOCKED waiting for [${waitingFor.join(', ')}]`);
  }

  return res.status(201).json({
    message: 'Patient registered and OS process created successfully',
    patient: newPatient
  });
});

// PUT /api/patients/:id - Update patient
router.put('/:id', authenticateToken, checkPermission('patient_records', 'UPDATE'), (req, res) => {
  const store = db.getStore();
  const index = store.patients.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Patient not found' });
  }

  const current = store.patients[index];
  const updates = req.body;

  if (updates.priority && updates.priority !== current.priority) {
    updates.priorityValue = getPriorityValue(updates.priority);
    db.logSystemEvent('INFO', 'SCHEDULER', `Priority changed for ${current.id} from ${current.priority} to ${updates.priority}`);
    db.logAuditEvent(req.user.name, req.user.role, `Changed Priority to ${updates.priority}`, current.id);
  }

  store.patients[index] = { ...current, ...updates };
  db.syncResourceStats();
  db.saveDB();

  return res.json({
    message: 'Patient updated successfully',
    patient: store.patients[index]
  });
});

// PUT /api/patients/:id/priority - Change patient priority specifically
router.put('/:id/priority', authenticateToken, checkPermission('emergency_queue', 'UPDATE'), (req, res) => {
  const store = db.getStore();
  const patient = store.patients.find(p => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Patient not found' });
  }

  const { priority } = req.body;
  if (!['Critical', 'High', 'Medium', 'Low'].includes(priority)) {
    return res.status(400).json({ error: 'INVALID_PRIORITY', message: 'Invalid priority value' });
  }

  const oldPriority = patient.priority;
  patient.priority = priority;
  patient.priorityValue = getPriorityValue(priority);

  db.logSystemEvent('INFO', 'SCHEDULER', `OS Process ${patient.id} priority adjusted: ${oldPriority} -> ${priority}`);
  db.logAuditEvent(req.user.name, req.user.role, `Priority Reprioritized ${oldPriority} -> ${priority}`, patient.id);
  db.saveDB();

  return res.json({ message: 'Priority updated successfully', patient });
});

// PUT /api/patients/:id/state - Transition process state (NEW, READY, RUNNING, WAITING, BLOCKED, COMPLETED)
router.put('/:id/state', authenticateToken, checkPermission('emergency_queue', 'UPDATE'), (req, res) => {
  const store = db.getStore();
  const patient = store.patients.find(p => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Patient not found' });
  }

  const { state } = req.body;
  const validStates = ['NEW', 'READY', 'RUNNING', 'WAITING', 'BLOCKED', 'COMPLETED'];
  if (!validStates.includes(state)) {
    return res.status(400).json({ error: 'INVALID_STATE', message: `Invalid state. Allowed: ${validStates.join(', ')}` });
  }

  const oldState = patient.processState;
  patient.processState = state;

  if (state === 'COMPLETED') {
    patient.remainingTime = 0;
    // Release assigned bed
    if (patient.assignedBed) {
      const bed = store.beds.find(b => b.id === patient.assignedBed);
      if (bed) {
        bed.status = 'CLEANING';
        bed.patientId = null;
        bed.patientName = null;
      }
    }
    // Release assigned doctor
    if (patient.assignedDoctor) {
      const doc = store.doctors.find(d => d.name === patient.assignedDoctor);
      if (doc) {
        doc.assignedPatients = doc.assignedPatients.filter(pid => pid !== patient.id);
        if (doc.assignedPatients.length === 0) doc.status = 'AVAILABLE';
      }
    }
    // Release ventilator
    if (patient.assignedVentilator) {
      const vent = store.ventilators.find(v => v.id === patient.assignedVentilator);
      if (vent) {
        vent.status = 'AVAILABLE';
        vent.assignedBed = null;
        vent.patientId = null;
      }
    }
    // Clear waiting list
    patient.waitingFor = [];
    patient.allocatedResources = [];
  }

  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'PROCESS_MGR', `Process ${patient.id} state transition: ${oldState} -> ${state}`);
  db.logAuditEvent(req.user.name, req.user.role, `State Transition: ${oldState} -> ${state}`, patient.id);

  return res.json({ message: 'Patient process state updated', patient });
});

// DELETE /api/patients/:id - Discharge patient & terminate process
router.delete('/:id', authenticateToken, checkPermission('patient_records', 'DELETE'), (req, res) => {
  const store = db.getStore();
  const index = store.patients.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Patient not found' });
  }

  const patient = store.patients[index];

  // Free bed
  if (patient.assignedBed) {
    const bed = store.beds.find(b => b.id === patient.assignedBed);
    if (bed) {
      bed.status = 'CLEANING';
      bed.patientId = null;
      bed.patientName = null;
    }
  }

  // Free doctor
  if (patient.assignedDoctor) {
    const doc = store.doctors.find(d => d.name === patient.assignedDoctor);
    if (doc) {
      doc.assignedPatients = doc.assignedPatients.filter(pid => pid !== patient.id);
      if (doc.assignedPatients.length === 0) doc.status = 'AVAILABLE';
    }
  }

  store.patients.splice(index, 1);
  db.syncResourceStats();
  db.saveDB();

  db.logSystemEvent('INFO', 'PROCESS_MGR', `Process ${patient.id} terminated & discharged; memory and hardware resources deallocated`);
  db.logAuditEvent(req.user.name, req.user.role, 'Discharged & Deallocated Patient', patient.id);

  return res.json({ message: `Patient ${patient.id} discharged successfully`, patientId: patient.id });
});

module.exports = router;
