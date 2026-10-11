const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./data/db');

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const resourceRoutes = require('./routes/resources');
const schedulingRoutes = require('./routes/scheduling');
const deadlockRoutes = require('./routes/deadlock');
const syncRoutes = require('./routes/sync');
const producerConsumerRoutes = require('./routes/producerConsumer');
const ambulanceRoutes = require('./routes/ambulances');
const bedRoutes = require('./routes/beds');
const doctorRoutes = require('./routes/doctors');
const otRoutes = require('./routes/ots');
const accessControlRoutes = require('./routes/accessControl');
const logRoutes = require('./routes/logs');
const recordRoutes = require('./routes/records');
const memoryRoutes = require('./routes/memory');
const { router: testRoutes } = require('./routes/tests');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger for OS system log tracking
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    console.log(`[HTTP ${req.method}] ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/deadlock', deadlockRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/producer-consumer', producerConsumerRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/ots', otRoutes);
app.use('/api/access-control', accessControlRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/tests', testRoutes);

// Root health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'EmergencyCare OS Kernel',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  db.logSystemEvent('ERROR', 'SERVER_KERNEL', `Unhandled Exception: ${err.message}`);
  res.status(err.status || 500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An internal server error occurred'
  });
});

app.listen(config.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚨 EmergencyCare OS Kernel Server is running on port ${config.PORT}`);
  console.log(`🔗 API Base: http://localhost:${config.PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${config.PORT}/api/health`);
  console.log(`====================================================`);
  db.logSystemEvent('INFO', 'SERVER_KERNEL', `EmergencyCare OS Server initialized on port ${config.PORT}`);
});

module.exports = app;
