/**
 * Session Controller
 * Handles HTTP request/response for session endpoints
 */
class SessionController {
  constructor(sessionService) {
    this.sessionService = sessionService;
  }

  /**
   * Create a new session
   */
  createSession = async (req, res) => {
    try {
      // Accept both field name variants for flexibility
      const hostId = req.body.hostId || req.body.userId;
      const hostName = req.body.hostName || req.body.userName;
      const title = req.body.title || req.body.sessionName;
      const provider = req.body.provider;

      if (!hostId || !hostName) {
        return res.status(400).json({
          error: 'hostId (or userId) and hostName (or userName) are required'
        });
      }

      const result = await this.sessionService.createSession({
        hostId,
        hostName,
        title,
        provider
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({
        error: error.message || 'Failed to create session'
      });
    }
  };

  /**
   * Get session by ID
   */
  getSession = async (req, res) => {
    try {
      const { id } = req.params;
      const session = await this.sessionService.getSession(id);
      res.json(session);
    } catch (error) {
      console.error('Error getting session:', error);
      if (error.message === 'Session not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({
        error: error.message || 'Failed to get session'
      });
    }
  };

  /**
   * Join an existing session
   */
  joinSession = async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, userName, role } = req.body;

      if (!userId || !userName) {
        return res.status(400).json({
          error: 'userId and userName are required'
        });
      }

      const result = await this.sessionService.joinSession(id, {
        userId,
        userName,
        role
      });

      res.json(result);
    } catch (error) {
      console.error('Error joining session:', error);
      if (error.message === 'Session not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Session is not active') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({
        error: error.message || 'Failed to join session'
      });
    }
  };

  /**
   * End a session
   */
  endSession = async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          error: 'userId is required'
        });
      }

      const result = await this.sessionService.endSession(id, userId);
      res.json(result);
    } catch (error) {
      console.error('Error ending session:', error);
      if (error.message === 'Session not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Only the host can end the session') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({
        error: error.message || 'Failed to end session'
      });
    }
  };
}

module.exports = SessionController;

