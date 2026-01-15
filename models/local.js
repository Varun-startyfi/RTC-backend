const { Sequelize } = require('sequelize');
const config = require('../config');

/**
 * Local PostgreSQL Database Configuration
 * This module provides database connection for local PostgreSQL
 * Activated when DB_PROVIDER=local in environment variables
 */

// Initialize Sequelize with individual connection parameters
const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    dialectOptions: config.database.dialectOptions || {},
    logging: config.database.logging,
    pool: config.database.pool,
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

// Test local database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Local PostgreSQL database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to local PostgreSQL database:', error.message);
    throw error;
  }
};

// Sync database schema (create tables if they don't exist)
const syncDatabase = async () => {
  try {
    // Use alter: true for development (local PostgreSQL)
    await sequelize.sync({ alter: true });
    console.log('✅ Local PostgreSQL database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing local PostgreSQL database:', error.message);
    throw error;
  }
};

// Get database connection info (for logging)
const getConnectionInfo = () => {
  return {
    provider: 'Local PostgreSQL',
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    ssl: false
  };
};

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  syncDatabase,
  getConnectionInfo
};

