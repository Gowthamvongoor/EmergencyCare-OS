const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken } = require('../middleware/auth');
const memoryManager = require('../services/memoryManager');

// GET /api/memory/state - Get hospital memory partition layout & fragmentation stats
router.get('/state', authenticateToken, (req, res) => {
  return res.json(memoryManager.getCapacityState());
});

// POST /api/memory/allocate - Allocate partition using First-Fit, Best-Fit, or Worst-Fit
router.post('/allocate', authenticateToken, (req, res) => {
  const { size, patientId, algorithm = 'First-Fit' } = req.body;
  if (!size) {
    return res.status(400).json({ error: 'MISSING_SIZE', message: 'Size unit requirement is required' });
  }

  const result = memoryManager.allocatePartition(size, patientId || 'PAT-TEMP', algorithm);
  if (!result.success) {
    db.logSystemEvent('WARNING', 'MEMORY_MGR', `Memory Allocation Fault: ${result.message}`);
    return res.status(507).json(result);
  }

  db.logSystemEvent('INFO', 'MEMORY_MGR', `Partition allocated: Block ${result.allocatedBlock.id} (${result.allocatedBlock.name}) using algorithm [${algorithm}]. Internal Frag: ${result.internalFragmentation} units`);

  return res.json(result);
});

// POST /api/memory/deallocate - Free partition
router.post('/deallocate', authenticateToken, (req, res) => {
  const { blockId } = req.body;
  const result = memoryManager.deallocatePartition(blockId);
  db.logSystemEvent('INFO', 'MEMORY_MGR', `Partition block ${blockId} deallocated and returned to contiguous memory pool`);
  return res.json(result);
});

// POST /api/memory/reset - Reset memory layout
router.post('/reset', authenticateToken, (req, res) => {
  const result = memoryManager.reset();
  db.logSystemEvent('INFO', 'MEMORY_MGR', 'Hospital Memory Manager reset to baseline partition map');
  return res.json(result);
});

module.exports = router;
