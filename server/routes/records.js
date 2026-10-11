const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');

// Helper to search through virtual file tree
function searchFiles(node, query, results = []) {
  if (node.type === 'file') {
    if (
      node.name.toLowerCase().includes(query) ||
      (node.patientId && node.patientId.toLowerCase().includes(query)) ||
      (node.content && node.content.toLowerCase().includes(query)) ||
      (node.author && node.author.toLowerCase().includes(query))
    ) {
      results.push(node);
    }
  } else if (node.children && Array.isArray(node.children)) {
    node.children.forEach(child => searchFiles(child, query, results));
  }
  return results;
}

// GET /api/records/tree - Retrieve virtual file system directory tree
router.get('/tree', authenticateToken, checkPermission('patient_records', 'READ'), (req, res) => {
  const store = db.getStore();
  return res.json(store.virtualFileSystem);
});

// GET /api/records/search - Search across patient files
router.get('/search', authenticateToken, checkPermission('patient_records', 'READ'), (req, res) => {
  const { q } = req.query;
  const store = db.getStore();
  if (!q) {
    return res.json([]);
  }

  const results = searchFiles(store.virtualFileSystem, q.toLowerCase());
  return res.json(results);
});

// POST /api/records/file - Create a new clinical document file in the virtual tree
router.post('/file', authenticateToken, checkPermission('patient_records', 'WRITE'), auditLogger(
  (req, data) => `Created File ${req.body.fileName} in ${req.body.targetPath}`,
  (req, data) => req.body.fileName
), (req, res) => {
  const { fileName, targetPath = '/Emergency/2026', content, patientId, category } = req.body;
  const store = db.getStore();

  if (!fileName || !content) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'fileName and content are required' });
  }

  // Find target folder in tree
  function findFolder(node, path) {
    if (node.path === path) return node;
    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'directory') {
          const res = findFolder(child, path);
          if (res) return res;
        }
      }
    }
    return null;
  }

  const targetFolder = findFolder(store.virtualFileSystem, targetPath);
  if (!targetFolder) {
    return res.status(404).json({ error: 'FOLDER_NOT_FOUND', message: `Target path ${targetPath} not found in file tree` });
  }

  const newFile = {
    name: fileName.endsWith('.med') || fileName.endsWith('.pdf') || fileName.endsWith('.log') ? fileName : `${fileName}.med`,
    type: 'file',
    size: `${Math.floor(content.length / 10) + 12} KB`,
    patientId: patientId || null,
    createdAt: new Date().toISOString().split('T')[0],
    category: category || 'Clinical Notes',
    author: req.user.name,
    content
  };

  targetFolder.children = targetFolder.children || [];
  targetFolder.children.push(newFile);

  db.saveDB();

  db.logSystemEvent('INFO', 'FILE_SYSTEM', `File created: ${targetPath}/${newFile.name} by ${req.user.name} [Size: ${newFile.size}]`);

  return res.status(201).json({
    message: 'File created successfully in patient file system',
    file: newFile,
    path: targetPath
  });
});

module.exports = router;
