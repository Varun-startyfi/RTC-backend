const express = require('express');
const router = express.Router();
const { testConnection } = require('../models');

/**
 * Health Check Routes
 */

/**
 * GET /health
 * Check server and database status
 */
router.get('/', async (req, res) => {
  try {
    // Test database connection
    await testConnection();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;

