// Load environment variables FIRST, before importing config
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');
const { testConnection, syncDatabase, Session, Participant } = require('./models');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database models are imported above

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Session management routes will be added here
app.use('/api/sessions', require('./routes/sessions')(io));

// Socket.io connection handling
io.on('connection', async (socket) => {
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

const PORT = config.port;

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database schema
    await syncDatabase();

    // Start the server
    server.listen(PORT, () => {
      console.log(`Sessions backend server running on port ${PORT}`);
      console.log(`Database: ${config.database.database} on ${config.database.host}:${config.database.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
