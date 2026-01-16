const AgoraProvider = require('./AgoraProvider');

/**
 * Provider Manager
 * Manages multiple video provider implementations
 */
class ProviderManager {
  constructor(config) {
    this.config = config;
    this.providers = new Map();
    this.defaultProvider = null;
    this.initializeProviders();
  }

  /**
   * Initialize all enabled providers
   */
  initializeProviders() {
    const { providers: providerConfig } = this.config;

    // Initialize Agora provider
    if (providerConfig.agora?.enabled) {
      const agoraProvider = new AgoraProvider(providerConfig.agora.config);
      this.providers.set('agora', agoraProvider);
      if (!this.defaultProvider) {
        this.defaultProvider = agoraProvider;
      }
    }

    // Add other providers here as they are implemented
    // if (providerConfig.zoom?.enabled) {
    //   const zoomProvider = new ZoomProvider(providerConfig.zoom.config);
    //   this.providers.set('zoom', zoomProvider);
    // }

    // if (providerConfig.twilio?.enabled) {
    //   const twilioProvider = new TwilioProvider(providerConfig.twilio.config);
    //   this.providers.set('twilio', twilioProvider);
    // }
  }

  /**
   * Get a provider by name
   * @param {string} name - Provider name
   * @returns {BaseProvider|null}
   */
  getProvider(name) {
    return this.providers.get(name) || null;
  }

  /**
   * Get the default provider
   * @returns {BaseProvider|null}
   */
  getDefaultProvider() {
    return this.defaultProvider;
  }

  /**
   * Get all available providers
   * @returns {Array<BaseProvider>}
   */
  getAllProviders() {
    return Array.from(this.providers.values());
  }

  /**
   * Check if a provider is available
   * @param {string} name - Provider name
   * @returns {boolean}
   */
  hasProvider(name) {
    return this.providers.has(name);
  }

  /**
   * Generate token using specified provider or default
   * @param {string} providerName - Provider name (optional, uses default if not provided)
   * @param {string} sessionId - Session/channel ID
   * @param {string|number} userId - User ID
   * @param {string} role - User role
   * @returns {Promise<Object>}
   */
  async generateToken(providerName, sessionId, userId, role = 'participant') {
    const provider = providerName 
      ? this.getProvider(providerName) 
      : this.getDefaultProvider();

    if (!provider) {
      throw new Error(`Provider ${providerName || 'default'} is not available`);
    }

    if (!provider.isConfigured()) {
      throw new Error(`Provider ${provider.name} is not properly configured`);
    }

    return await provider.generateToken(sessionId, userId, role);
  }
}

module.exports = ProviderManager;

