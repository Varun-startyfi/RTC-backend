const { Sequelize } = require('sequelize');
const config = require('../config');

/**
 * Supabase Database Configuration
 * This module provides database connection specifically for Supabase
 * Activated when DB_PROVIDER=supabase in environment variables
 */

// Initialize Sequelize with Supabase connection string
const sequelize = new Sequelize(config.database.url, {
  dialect: 'postgres',
  dialectOptions: config.database.dialectOptions || {
    ssl: {
      require: true,
      rejectUnauthorized: false // Supabase requires SSL
    }
  },
  logging: config.database.logging,
  pool: config.database.pool,
  define: {
    timestamps: true,
    underscored: true,
  },
});

// Test Supabase database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Supabase database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to Supabase database:', error.message);
    throw error;
  }
};

// Sync database schema (create tables if they don't exist)
const syncDatabase = async () => {
  try {
    // Use alter: false for production/Supabase to avoid data loss
    // Use alter: true only in development if needed
    const alterMode = process.env.NODE_ENV === 'development' && process.env.DB_ALTER === 'true';
    await sequelize.sync({ alter: alterMode });
    console.log('✅ Supabase database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing Supabase database:', error.message);
    throw error;
  }
};

// Get database connection info (for logging)
const getConnectionInfo = () => {
  try {
    const url = new URL(config.database.url);
    return {
      provider: 'Supabase',
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1) || 'postgres',
      ssl: true
    };
  } catch (error) {
    return {
      provider: 'Supabase',
      host: 'unknown',
      ssl: true
    };
  }
};

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  syncDatabase,
  getConnectionInfo
};

