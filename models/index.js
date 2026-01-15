const config = require('../config');

/**
 * Database Models Index
 * Uses local PostgreSQL database
 */

// Load local database module
const dbModule = require('./local');

// Extract database connection and utilities
const { sequelize, Sequelize, testConnection, syncDatabase, getConnectionInfo } = dbModule;

// Import models using the appropriate sequelize instance
const Session = require('./Session')(sequelize);
const Participant = require('./Participant')(sequelize);

// Define associations
Session.hasMany(Participant, {
  foreignKey: 'sessionId',
  as: 'participants',
  onDelete: 'CASCADE'
});

Participant.belongsTo(Session, {
  foreignKey: 'sessionId',
  as: 'session'
});

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  syncDatabase,
  getConnectionInfo,
  Session,
  Participant
};
