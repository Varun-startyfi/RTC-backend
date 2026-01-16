/**
 * Base Provider Class
 * Abstract base class for video provider implementations
 */
class BaseProvider {
  constructor(config) {
    this.config = config;
    this.name = 'base';
  }

  /**
   * Check if provider is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error('isConfigured() must be implemented by subclass');
  }

  /**
   * Generate access token for a user in a session
   * @param {string} sessionId - Session/channel ID
   * @param {string|number} userId - User ID
   * @param {string} role - User role (host, participant, audience)
   * @returns {Promise<Object>} Token object with token, appId, userId, etc.
   */
  async generateToken(sessionId, userId, role = 'participant') {
    throw new Error('generateToken() must be implemented by subclass');
  }

  /**
   * Get provider metadata and capabilities
   * @returns {Object} Metadata object
   */
  getMetadata() {
    return {
      name: this.name,
      configured: this.isConfigured(),
      features: [],
      maxParticipants: 0,
      supportedPlatforms: []
    };
  }
}

module.exports = BaseProvider;

