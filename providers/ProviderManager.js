const AgoraProvider = require('./AgoraProvider')

class ProviderManager {
  constructor(config) {
    this.config = config
    this.providers = new Map()
    this.defaultProvider = null

    this.initializeProviders()
  }

  initializeProviders() {
    // Initialize Agora provider
    if (this.config.providers.agora.enabled) {
      const agoraProvider = new AgoraProvider(this.config.providers.agora.config)
      if (agoraProvider.isConfigured()) {
        this.providers.set('agora', agoraProvider)
        if (!this.defaultProvider) {
          this.defaultProvider = 'agora'
        }
      }
    }

    // Add other providers here as they are implemented
    // if (this.config.providers.zoom.enabled) {
    //   const zoomProvider = new ZoomProvider(this.config.providers.zoom.config)
    //   this.providers.set('zoom', zoomProvider)
    // }

    if (this.providers.size === 0) {
      console.warn('No video providers are properly configured!')
    }
  }

  getProvider(providerName = null) {
    const name = providerName || this.defaultProvider
    const provider = this.providers.get(name)

    if (!provider) {
      throw new Error(`Provider '${name}' not found or not configured`)
    }

    return provider
  }

  getAvailableProviders() {
    const available = []
    for (const [name, provider] of this.providers) {
      available.push({
        name,
        metadata: provider.getMetadata(),
        configured: provider.isConfigured()
      })
    }
    return available
  }

  async generateToken(sessionId, userId, role = 'participant', providerName = null) {
    const provider = this.getProvider(providerName)
    return await provider.generateToken(sessionId, userId, role)
  }

  async generateRtmToken(userId, providerName = null) {
    const provider = this.getProvider(providerName)
    if (typeof provider.generateRtmToken !== 'function') {
      throw new Error(`Provider '${providerName || this.defaultProvider}' does not support RTM token generation`)
    }
    return await provider.generateRtmToken(userId)
  }
}

module.exports = ProviderManager
