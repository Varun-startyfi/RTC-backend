// Load environment variables FIRST, before importing config
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');
const { testConnection, syncDatabase, getConnectionInfo } = require('./models');
const SocketService = require('./services/socketService');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

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

// Routes
app.use('/health', require('./routes/health'));
app.use('/api/sessions', require('./routes/sessions')(io, config));

// Initialize Socket.io service
new SocketService(io);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

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
      // Get connection info from database module (handles both Supabase and local)
      const { getConnectionInfo } = require('./models');
      const dbInfo = getConnectionInfo();
      console.log(`Database: ${dbInfo.provider} - ${dbInfo.database || 'N/A'} on ${dbInfo.host}:${dbInfo.port || 'N/A'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
