/**
 * Base class for video conferencing providers
 * Provides a common interface for different video providers
 */
class BaseProvider {
  constructor(config) {
    this.config = config
    this.name = 'base'
  }

  /**
   * Generate access token for a session
   * @param {string} sessionId - The session/channel identifier
   * @param {string} userId - The user identifier
   * @param {string} role - The user role (host, participant, etc.)
   * @returns {Promise<Object>} Token data with token, appId, userId, etc.
   */
  async generateToken(sessionId, userId, role) {
    throw new Error('generateToken must be implemented by provider')
  }

  /**
   * Validate if the provider is properly configured
   * @returns {boolean} True if configured correctly
   */
  isConfigured() {
    throw new Error('isConfigured must be implemented by provider')
  }

  /**
   * Get provider-specific metadata
   * @returns {Object} Provider metadata
   */
  getMetadata() {
    return {
      name: this.name,
      version: '1.0.0',
      features: []
    }
  }
}

module.exports = BaseProvider
