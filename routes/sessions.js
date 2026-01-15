const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Session, Participant } = require('../models');
const config = require('../config');

module.exports = (io) => {

const router = express.Router();

// Create a new session
router.post('/create', async (req, res) => {
  try {
    const { userId, userName, sessionName } = req.body;

    if (!userId || !userName) {
      return res.status(400).json({
        error: 'Missing required fields: userId and userName'
      });
    }

    const sessionId = uuidv4();

    // Generate token using provider manager (defaults to Agora)
    // Pass the actual userId string for web clients
    const tokenData = await config.providerManager.generateToken(
      sessionId,
      userId, // Use actual userId string for web clients
      'host'
    );

    // Generate RTM token for chat
    let rtmTokenData = null;
    try {
      console.log('[CREATE] Generating RTM token for userId:', userId);
      rtmTokenData = await config.providerManager.generateRtmToken(userId);
      console.log('[CREATE] RTM token generated successfully:', rtmTokenData ? 'Yes' : 'No');
      if (rtmTokenData) {
        console.log('[CREATE] RTM token length:', rtmTokenData.token ? rtmTokenData.token.length : 0);
      }
    } catch (rtmError) {
      console.error('[CREATE] Failed to generate RTM token (chat may be unavailable):', rtmError);
      console.error('[CREATE] RTM error details:', {
        message: rtmError.message,
        stack: rtmError.stack
      });
      // Continue without RTM token - chat will be disabled but video/audio will work
    }

    // Create session in database
    const session = await Session.create({
      id: sessionId,
      createdBy: userId,
      creatorName: userName,
      name: sessionName || null, // Optional session name
      status: 'active',
      provider: 'agora'
    });

    // Add creator as first participant
    await session.addParticipant({
      userId,
      userName,
      role: 'host'
    });

    const responseData = {
      sessionId,
      name: session.name,
      token: tokenData.token,
      appId: tokenData.appId,
      userId: tokenData.userId,
      role: tokenData.role,
      provider: tokenData.provider,
      rtmToken: rtmTokenData?.token || null, // Include RTM token if available
      participants: await session.getActiveParticipants()
    };
    
    console.log('Session create response - rtmToken present:', !!responseData.rtmToken);
    console.log('Session create response keys:', Object.keys(responseData));
    
    res.json(responseData);

  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Join an existing session
router.post('/:sessionId/join', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, userName } = req.body;

    if (!userId || !userName) {
      return res.status(400).json({
        error: 'Missing required fields: userId and userName'
      });
    }

    const session = await Session.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.isActive()) {
      return res.status(400).json({ error: 'Session is not active' });
    }

    // Check if user is already in the session
    const existingParticipant = await Participant.findOne({
      where: { sessionId, userId, status: 'active' }
    });
    if (existingParticipant) {
      return res.status(400).json({ error: 'User already in session' });
    }

    // Generate token using provider manager (defaults to Agora)
    // Pass the actual userId string for web clients
    const tokenData = await config.providerManager.generateToken(
      sessionId,
      userId, // Use actual userId string for web clients
      'participant'
    );

    // Generate RTM token for chat
    let rtmTokenData = null;
    try {
      console.log('[JOIN] Generating RTM token for userId:', userId);
      rtmTokenData = await config.providerManager.generateRtmToken(userId);
      console.log('[JOIN] RTM token generated successfully:', rtmTokenData ? 'Yes' : 'No');
      if (rtmTokenData) {
        console.log('[JOIN] RTM token length:', rtmTokenData.token ? rtmTokenData.token.length : 0);
      }
    } catch (rtmError) {
      console.error('[JOIN] Failed to generate RTM token (chat may be unavailable):', rtmError);
      console.error('[JOIN] RTM error details:', {
        message: rtmError.message,
        stack: rtmError.stack
      });
      // Continue without RTM token - chat will be disabled but video/audio will work
    }

    // Add participant to session
    await session.addParticipant({
      userId,
      userName,
      role: 'participant'
    });

    const joinResponseData = {
      sessionId,
      token: tokenData.token,
      appId: tokenData.appId,
      userId: tokenData.userId,
      role: tokenData.role,
      provider: tokenData.provider,
      rtmToken: rtmTokenData?.token || null, // Include RTM token if available
      participants: await session.getActiveParticipants()
    };
    
    console.log('[JOIN] Response - rtmToken present:', !!joinResponseData.rtmToken);
    console.log('[JOIN] Response keys:', Object.keys(joinResponseData));
    
    res.json(joinResponseData);

  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

// Get session info
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findByPk(sessionId, {
      include: [{
        model: Participant,
        as: 'participants',
        where: { status: 'active' },
        required: false
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId: session.id,
      name: session.name,
      createdBy: session.createdBy,
      creatorName: session.creatorName,
      createdAt: session.createdAt,
      participants: await session.getActiveParticipants(),
      status: session.status,
      provider: session.provider
    });

  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// End session
router.post('/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;

    const session = await Session.findByPk(sessionId, {
      include: [{
        model: Participant,
        as: 'participants',
        where: { status: 'active' },
        required: false
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.createdBy !== userId) {
      return res.status(403).json({ error: 'Only session creator can end the session' });
    }

    // End the session in database
    await session.endSession();

    // Mark all active participants as left
    if (session.participants && session.participants.length > 0) {
      await Participant.update(
        { 
          status: 'left', 
          leftAt: new Date() 
        },
        { 
          where: { 
            sessionId: sessionId,
            status: 'active'
          } 
        }
      );
    }

    // Broadcast session-ended event to all participants in the session room
    io.to(sessionId).emit('session-ended', {
      sessionId: sessionId,
      endedBy: userId,
      message: 'The host has ended the session'
    });

    console.log(`Session ${sessionId} ended by ${userId}. Notified all participants.`);

    res.json({ message: 'Session ended successfully' });

  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

  return router;
};
