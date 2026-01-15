const config = require('../config');

/**
 * Database Models Index
 * Uses DB_PROVIDER flag to determine which database provider to use:
 * - 'supabase' -> uses models/supabase.js
 * - 'local' -> uses models/local.js
 */

// Determine database provider from config (which already validates the flag)
const { databaseProvider } = config;
const { provider: dbProvider, useSupabase, useLocal } = databaseProvider;

// Load appropriate database module based on flag
let dbModule;
if (useSupabase) {
  dbModule = require('./supabase');
} else if (useLocal) {
  dbModule = require('./local');
} else {
  // This should not happen as config.js validates it, but keep as safety check
  console.error(`❌ Invalid DB_PROVIDER: "${dbProvider}"`);
  console.error('   Valid options: "local" (PostgreSQL) or "supabase"');
  process.exit(1);
}

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
