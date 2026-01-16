const { RtcTokenBuilder, RtcRole, RtmTokenBuilder, RtmRole } = require('agora-access-token')
const BaseProvider = require('./BaseProvider')

class AgoraProvider extends BaseProvider {
  constructor(config) {
    super(config)
    this.name = 'agora'
  }

  isConfigured() {
    return !!(this.config.appId && this.config.appCertificate)
  }

  async generateToken(sessionId, userId, role = 'participant') {
    if (!this.isConfigured()) {
      throw new Error('Agora provider is not properly configured')
    }

    // Calculate expiration time (24 hours from now)
    // Agora expects timestamp in seconds since epoch
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const tokenExpirationTimeInSeconds = currentTimestamp + (3600 * 24) // 24 hours from now
    const privilegeExpirationTimeInSeconds = currentTimestamp + (3600 * 24) // 24 hours from now

    console.log('Generating Agora token:', {
      sessionId,
      userId,
      role,
      appId: this.config.appId,
      expirationTime: new Date(tokenExpirationTimeInSeconds * 1000).toISOString()
    })

    // Map role to Agora role
    let agoraRole = RtcRole.PUBLISHER
    if (role === 'audience') {
      agoraRole = RtcRole.SUBSCRIBER
    }

    // For web clients, use buildTokenWithAccount with string userId
    // For native clients, use buildTokenWithUid with numeric uid
    let token
    if (typeof userId === 'string' && userId !== '0') {
      // Use account-based token for web clients
      token = RtcTokenBuilder.buildTokenWithAccount(
        this.config.appId,
        this.config.appCertificate,
        sessionId,
        userId, // Use the actual userId string
        agoraRole,
        tokenExpirationTimeInSeconds,
        privilegeExpirationTimeInSeconds
      )
    } else {
      // Use UID-based token (for numeric UIDs or when UID should be assigned)
      const numericUid = typeof userId === 'number' ? userId : 0
      token = RtcTokenBuilder.buildTokenWithUid(
        this.config.appId,
        this.config.appCertificate,
        sessionId,
        numericUid,
        agoraRole,
        tokenExpirationTimeInSeconds,
        privilegeExpirationTimeInSeconds
      )
    }

    // Generate RTM token for chat functionality
    const rtmExpirationTimeInSeconds = currentTimestamp + (3600 * 24) // 24 hours from now
    
    let rtmToken
    try {
      // RTM tokens use RtmTokenBuilder
      // For RTM, we always use the userId as a string (account-based)
      const rtmUserId = typeof userId === 'string' ? userId : String(userId)
      rtmToken = RtmTokenBuilder.buildToken(
        this.config.appId,
        this.config.appCertificate,
        rtmUserId,
        RtmRole.Rtm_User,
        rtmExpirationTimeInSeconds
      )
    } catch (rtmError) {
      console.warn('Failed to generate RTM token:', rtmError.message)
      // Don't fail the whole request if RTM token generation fails
      rtmToken = null
    }

    return {
      token, // RTC token for video/audio
      rtmToken, // RTM token for chat
      appId: this.config.appId,
      userId: userId, // Return the userId (string or number)
      role: role,
      provider: this.name,
      expiresIn: 3600 * 24 // 24 hours in seconds
    }
  }

  getMetadata() {
    return {
      ...super.getMetadata(),
      features: [
        'video',
        'audio',
        'screen-sharing',
        'recording',
        'real-time-messaging'
      ],
      maxParticipants: 17, // Agora's limit for basic accounts
      supportedPlatforms: ['web', 'mobile', 'desktop']
    }
  }
}

module.exports = AgoraProvider
