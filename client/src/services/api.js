/**
 * API Service Client for EmergencyCare OS
 * Connects to Express backend with automatic JWT bearer token handling
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('emergencycare_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data.message || 'An API error occurred');
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),

  // Patients
  getPatients: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/patients${query ? `?${query}` : ''}`);
  },
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updatePriority: (id, priority) => request(`/patients/${id}/priority`, { method: 'PUT', body: JSON.stringify({ priority }) }),
  updateProcessState: (id, state) => request(`/patients/${id}/state`, { method: 'PUT', body: JSON.stringify({ state }) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  // Resources
  getResources: () => request('/resources'),
  createResource: (data) => request('/resources', { method: 'POST', body: JSON.stringify(data) }),
  updateResource: (id, data) => request(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  allocateResources: (patientId, resourcesToAllocate) => request('/resources/allocate', { method: 'POST', body: JSON.stringify({ patientId, resourcesToAllocate }) }),
  releaseResources: (patientId, resourcesToRelease) => request('/resources/release', { method: 'POST', body: JSON.stringify({ patientId, resourcesToRelease }) }),

  // Scheduling
  getScheduling: (algorithm = 'priority', quantum = 2) => request(`/scheduling?algorithm=${algorithm}&quantum=${quantum}`),

  // Deadlock & Banker's Algorithm
  getMatrices: () => request('/deadlock/matrices'),
  runBankers: (customMatrices = null, scenario = null) => request('/deadlock/banker', { method: 'POST', body: JSON.stringify({ customMatrices, scenario }) }),
  getRAG: () => request('/deadlock/rag'),
  recoverDeadlock: (actionType, victimProcessId, targetResourceId, newResourceId) => request('/deadlock/recover', { method: 'POST', body: JSON.stringify({ actionType, victimProcessId, targetResourceId, newResourceId }) }),

  // Synchronization & Mutex
  getSyncState: (resource = 'ICU-05') => request(`/sync/state?resource=${encodeURIComponent(resource)}`),
  acquireLock: (resource, patientId, customRequester = null, autoReleaseMs = 0) => request('/sync/acquire', { method: 'POST', body: JSON.stringify({ resource, patientId, customRequester, autoReleaseMs }) }),
  releaseLock: (resource) => request('/sync/release', { method: 'POST', body: JSON.stringify({ resource }) }),
  testRaceCondition: (resource = 'ICU-05') => request('/sync/race-test', { method: 'POST', body: JSON.stringify({ resource }) }),

  // Producer-Consumer
  getProducerConsumerState: () => request('/producer-consumer'),
  produceCase: (patient = null) => request('/producer-consumer/produce', { method: 'POST', body: JSON.stringify({ patient }) }),
  consumeCase: () => request('/producer-consumer/consume', { method: 'POST' }),
  setBufferCapacity: (capacity) => request('/producer-consumer/capacity', { method: 'POST', body: JSON.stringify({ capacity }) }),
  resetProducerConsumer: () => request('/producer-consumer/reset', { method: 'POST' }),

  // Beds & ICU
  getBeds: () => request('/beds'),
  allocateBed: (bedId, patientId, ventilatorId = null) => request('/beds/allocate', { method: 'POST', body: JSON.stringify({ bedId, patientId, ventilatorId }) }),
  releaseBed: (bedId, nextStatus = 'CLEANING') => request('/beds/release', { method: 'POST', body: JSON.stringify({ bedId, nextStatus }) }),
  updateBedStatus: (bedId, status) => request(`/beds/${bedId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Ambulances
  getAmbulances: () => request('/ambulances'),
  dispatchAmbulance: (ambulanceId, patientId, location, destination) => request('/ambulances/dispatch', { method: 'POST', body: JSON.stringify({ ambulanceId, patientId, location, destination }) }),
  updateAmbulanceStatus: (id, status, eta, location) => request(`/ambulances/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, eta, location }) }),

  // Doctors & Staff
  getStaff: () => request('/doctors'),
  updateDoctorStatus: (id, status) => request(`/doctors/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  assignDoctor: (doctorId, patientId) => request('/doctors/assign', { method: 'POST', body: JSON.stringify({ doctorId, patientId }) }),

  // Operation Theatres
  getOTs: () => request('/ots'),
  scheduleOT: (data) => request('/ots/schedule', { method: 'POST', body: JSON.stringify(data) }),
  releaseOT: (otId, nextStatus = 'CLEANING') => request('/ots/release', { method: 'POST', body: JSON.stringify({ otId, nextStatus }) }),

  // Access Control
  getAccessMatrix: () => request('/access-control'),
  updateAccessMatrix: (role, resourceKey, permissions) => request('/access-control', { method: 'PUT', body: JSON.stringify({ role, resourceKey, permissions }) }),

  // System Logs & Audit
  getSystemLogs: (level = 'ALL') => request(`/logs/system?level=${level}`),
  getAuditLogs: () => request('/logs/audit'),
  resetDatabase: () => request('/logs/reset', { method: 'POST' }),

  // Virtual File System & Records
  getRecordsTree: () => request('/records/tree'),
  searchRecords: (q) => request(`/records/search?q=${encodeURIComponent(q)}`),
  createRecordFile: (data) => request('/records/file', { method: 'POST', body: JSON.stringify(data) }),

  // Memory Management
  getMemoryState: () => request('/memory/state'),
  allocateMemory: (size, patientId, algorithm = 'First-Fit') => request('/memory/allocate', { method: 'POST', body: JSON.stringify({ size, patientId, algorithm }) }),
  deallocateMemory: (blockId) => request('/memory/deallocate', { method: 'POST', body: JSON.stringify({ blockId }) }),
  resetMemory: () => request('/memory/reset', { method: 'POST' }),

  // Testing & Development
  runAllTests: () => request('/tests/run-all')
};
