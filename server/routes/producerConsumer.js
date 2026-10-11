const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken } = require('../middleware/auth');
const pcService = require('../services/producerConsumer');

// GET /api/producer-consumer - Simulation state
router.get('/', authenticateToken, (req, res) => {
  return res.json(pcService.getState());
});

// POST /api/producer-consumer/produce - Reception produces emergency case
router.post('/produce', authenticateToken, (req, res) => {
  const { patient } = req.body;
  const result = pcService.produce(patient);

  if (!result.success) {
    db.logSystemEvent('WARNING', 'PRODUCER_CONSUMER', `Reception Producer Blocked: Bounded buffer is FULL (${result.state.bufferSize}/${result.state.capacity})`);
    return res.status(429).json(result);
  }

  db.logSystemEvent('INFO', 'PRODUCER_CONSUMER', `Reception produced emergency case: ${result.item.name} (${result.item.condition})`);
  return res.json(result);
});

// POST /api/producer-consumer/consume - Treatment consumes emergency case
router.post('/consume', authenticateToken, (req, res) => {
  const result = pcService.consume();

  if (!result.success) {
    db.logSystemEvent('WARNING', 'PRODUCER_CONSUMER', `Treatment Consumer Blocked: Bounded buffer is EMPTY (0/${result.state.capacity})`);
    return res.status(404).json(result);
  }

  db.logSystemEvent('INFO', 'PRODUCER_CONSUMER', `Treatment consumed emergency case: ${result.item.name}`);
  return res.json(result);
});

// POST /api/producer-consumer/capacity - Update buffer capacity
router.post('/capacity', authenticateToken, (req, res) => {
  const { capacity } = req.body;
  const newState = pcService.setCapacity(capacity);
  return res.json(newState);
});

// POST /api/producer-consumer/reset - Reset simulation
router.post('/reset', authenticateToken, (req, res) => {
  const newState = pcService.reset();
  db.logSystemEvent('INFO', 'PRODUCER_CONSUMER', 'Producer-Consumer simulation reset by user');
  return res.json(newState);
});

module.exports = router;
