const { Participant } = require('../models');

/**
 * Socket Service
 * Handles Socket.io events and real-time communication
 */
class SocketService {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  /**
   * Setup Socket.io event handlers
   */
  setupSocketHandlers() {
    this.io.on('connection', async (socket) => {
      console.log('User connected:', socket.id);

      socket.on('join-session', async (data) => {
        try {
          const { sessionId, userId } = data;
          socket.join(sessionId);
          console.log(`User ${userId} joined session ${sessionId}`);

          // Fetch participant info from database
          const participant = await Participant.findOne({
            where: { sessionId, userId, status: 'active' }
          });

          if (participant) {
            // Notify others in the session with participant info
            socket.to(sessionId).emit('user-joined', {
              userId: participant.userId,
              userName: participant.userName,
              role: participant.role,
              socketId: socket.id
            });
          } else {
            // Fallback if participant not found
            socket.to(sessionId).emit('user-joined', {
              userId,
              socketId: socket.id
            });
          }
        } catch (error) {
          console.error('Error in join-session:', error);
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      socket.on('leave-session', async (data) => {
        try {
          const { sessionId, userId } = data;
          socket.leave(sessionId);
          console.log(`User ${userId} left session ${sessionId}`);

          // Fetch participant info before notifying
          const participant = await Participant.findOne({
            where: { sessionId, userId, status: 'active' }
          });

          // Notify others in the session
          socket.to(sessionId).emit('user-left', {
            userId: userId,
            userName: participant?.userName,
            socketId: socket.id
          });
        } catch (error) {
          console.error('Error in leave-session:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }

  /**
   * Emit event to all clients in a session
   * @param {string} sessionId - Session ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToSession(sessionId, event, data) {
    this.io.to(sessionId).emit(event, data);
  }

  /**
   * Emit event to all clients except sender in a session
   * @param {string} sessionId - Session ID
   * @param {string} socketId - Sender socket ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToSessionExcept(sessionId, socketId, event, data) {
    this.io.to(sessionId).except(socketId).emit(event, data);
  }
}

module.exports = SocketService;

