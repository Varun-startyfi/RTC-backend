const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/sessionController');
const SessionService = require('../services/sessionService');

/**
 * Sessions Routes
 * All routes are prefixed with /api/sessions
 */

module.exports = (io, config) => {
  // Initialize service and controller
  const sessionService = new SessionService(config.providerManager);
  const sessionController = new SessionController(sessionService);

  /**
   * POST /api/sessions/create
   * Create a new session
   */
  router.post('/create', sessionController.createSession);

  /**
   * GET /api/sessions/:id
   * Get session information
   */
  router.get('/:id', sessionController.getSession);

  /**
   * POST /api/sessions/:id/join
   * Join an existing session
   */
  router.post('/:id/join', sessionController.joinSession);

  /**
   * POST /api/sessions/:id/end
   * End a session (host only)
   */
  router.post('/:id/end', sessionController.endSession);

  return router;
};

