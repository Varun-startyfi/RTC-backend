const { v4: uuidv4 } = require('uuid');
const { Session, Participant } = require('../models');

/**
 * Session Service
 * Business logic for session management
 */
class SessionService {
  constructor(providerManager) {
    this.providerManager = providerManager;
  }

  /**
   * Create a new session
   * @param {Object} data - Session data
   * @param {string} data.hostId - Host user ID
   * @param {string} data.hostName - Host name
   * @param {string} data.title - Session title (optional)
   * @param {string} data.provider - Provider name (optional, defaults to default provider)
   * @returns {Promise<Object>} Created session with token
   */
  async createSession(data) {
    const { hostId, hostName, title, provider: providerName } = data;

    // Get provider (use specified or default)
    const provider = providerName 
      ? this.providerManager.getProvider(providerName)
      : this.providerManager.getDefaultProvider();

    if (!provider) {
      throw new Error(`Provider ${providerName || 'default'} is not available`);
    }

    if (!provider.isConfigured()) {
      throw new Error(`Provider ${provider.name} is not properly configured`);
    }

    // Generate unique channel name for the session
    const channelName = `session_${uuidv4()}`;

    // Create session in database
    const session = await Session.create({
      hostId,
      hostName,
      title: title || null,
      provider: provider.name,
      channelName,
      status: 'active'
    });

    // Generate token for host
    const tokenData = await provider.generateToken(channelName, hostId, 'host');

    // Create host participant record
    await Participant.create({
      sessionId: session.id,
      userId: hostId,
      userName: hostName,
      role: 'host',
      status: 'active'
    });

    return {
      sessionId: session.id, // Top-level for frontend compatibility
      channelName: session.channelName, // Top-level channel name for Agora
      appId: tokenData.appId, // Top-level for frontend compatibility
      rtmToken: tokenData.rtmToken, // Top-level RTM token for frontend
      userId: hostId, // Top-level userId for frontend
      session: {
        id: session.id,
        hostId: session.hostId,
        hostName: session.hostName,
        title: session.title,
        provider: session.provider,
        channelName: session.channelName,
        status: session.status,
        startedAt: session.startedAt
      },
      token: tokenData.token // RTC token (for backward compatibility)
    };
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session with participants
   */
  async getSession(sessionId) {
    const session = await Session.findByPk(sessionId, {
      include: [{
        model: Participant,
        as: 'participants',
        where: { status: 'active' },
        required: false
      }]
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return {
      id: session.id,
      hostId: session.hostId,
      hostName: session.hostName,
      title: session.title,
      provider: session.provider,
      channelName: session.channelName,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      participants: session.participants?.map(p => ({
        id: p.id,
        userId: p.userId,
        userName: p.userName,
        role: p.role,
        joinedAt: p.joinedAt
      })) || []
    };
  }

  /**
   * Join an existing session
   * @param {string} sessionId - Session ID
   * @param {Object} data - Join data
   * @param {string} data.userId - User ID
   * @param {string} data.userName - User name
   * @param {string} data.role - User role (optional, defaults to 'participant')
   * @returns {Promise<Object>} Session info with token
   */
  async joinSession(sessionId, data) {
    const { userId, userName, role = 'participant' } = data;

    // Get session
    const session = await Session.findByPk(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Session is not active');
    }

    // Get provider
    const provider = this.providerManager.getProvider(session.provider);
    if (!provider || !provider.isConfigured()) {
      throw new Error(`Provider ${session.provider} is not available`);
    }

    // Check if participant already exists
    let participant = await Participant.findOne({
      where: {
        sessionId,
        userId,
        status: 'active'
      }
    });

    if (!participant) {
      // Create participant record
      participant = await Participant.create({
        sessionId,
        userId,
        userName,
        role: role === 'host' ? 'participant' : role, // Prevent creating new hosts
        status: 'active'
      });
    }

    // Generate token
    const tokenData = await provider.generateToken(
      session.channelName,
      userId,
      participant.role
    );

    return {
      sessionId: session.id, // Top-level for frontend compatibility
      channelName: session.channelName, // Top-level channel name for Agora
      appId: tokenData.appId, // Top-level for frontend compatibility
      rtmToken: tokenData.rtmToken, // Top-level RTM token for frontend
      userId: userId, // Top-level userId for frontend
      session: {
        id: session.id,
        hostId: session.hostId,
        hostName: session.hostName,
        title: session.title,
        provider: session.provider,
        channelName: session.channelName,
        status: session.status
      },
      participant: {
        id: participant.id,
        userId: participant.userId,
        userName: participant.userName,
        role: participant.role
      },
      token: tokenData.token // RTC token (for backward compatibility)
    };
  }

  /**
   * End a session
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID (must be host)
   * @returns {Promise<Object>} Ended session
   */
  async endSession(sessionId, userId) {
    const session = await Session.findByPk(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Verify user is the host
    if (session.hostId !== userId) {
      throw new Error('Only the host can end the session');
    }

    // Update session status
    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();

    // Update all participants status
    await Participant.update(
      { status: 'left', leftAt: new Date() },
      { where: { sessionId, status: 'active' } }
    );

    return {
      id: session.id,
      status: session.status,
      endedAt: session.endedAt
    };
  }
}

module.exports = SessionService;

