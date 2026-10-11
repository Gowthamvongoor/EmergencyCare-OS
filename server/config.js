const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'emergency-care-os-secret-key-2026-deepmind',
  JWT_EXPIRES_IN: '24h',
  DATA_FILE: path.join(__dirname, 'data', 'store.json'),
  ENV: process.env.NODE_ENV || 'development'
};
