const { Sequelize } = require('sequelize');
const config = require('../config');

/**
 * PostgreSQL Database Configuration
 * Supports both connection string (DATABASE_URL) or individual parameters
 */

// Initialize Sequelize - supports both connection string and individual parameters
let sequelize;

if (config.database.url) {
  // Use connection string (e.g., Neon, Supabase, etc.)
  sequelize = new Sequelize(config.database.url, {
    dialect: 'postgres',
    dialectOptions: config.database.dialectOptions || {},
    logging: config.database.logging,
    pool: config.database.pool,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
} else {
  // Use individual parameters (local PostgreSQL)
  sequelize = new Sequelize(
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
}

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    const dbType = config.database.url ? 'PostgreSQL (Connection String)' : 'Local PostgreSQL';
    console.log(`✅ ${dbType} database connection established successfully.`);
  } catch (error) {
    const dbType = config.database.url ? 'PostgreSQL' : 'Local PostgreSQL';
    console.error(`❌ Unable to connect to ${dbType} database:`, error.message);
    throw error;
  }
};

// Sync database schema (create tables if they don't exist)
const syncDatabase = async () => {
  try {
    const dbType = config.database.url ? 'PostgreSQL' : 'Local PostgreSQL';
    
    // In development, use alter mode to update schema
    // In production, only create if not exists
    const alterMode = process.env.NODE_ENV === 'development' && process.env.DB_ALTER !== 'false';
    const forceMode = process.env.DB_FORCE === 'true'; // Only use if explicitly set
    
    if (forceMode) {
      console.log('⚠️  Force mode enabled - dropping and recreating all tables...');
      await sequelize.sync({ force: true });
      console.log(`✅ ${dbType} database force-synced (tables recreated).`);
    } else {
      await sequelize.sync({ alter: alterMode });
      console.log(`✅ ${dbType} database synchronized successfully (alter: ${alterMode}).`);
    }
  } catch (error) {
    const dbType = config.database.url ? 'PostgreSQL' : 'Local PostgreSQL';
    console.error(`❌ Error synchronizing ${dbType} database:`, error.message);
    console.error('Full error:', error);
    throw error;
  }
};

// Get database connection info (for logging)
const getConnectionInfo = () => {
  if (config.database.url) {
    try {
      const url = new URL(config.database.url);
      return {
        provider: 'PostgreSQL (Connection String)',
        host: url.hostname,
        port: url.port || '5432',
        database: url.pathname.slice(1) || 'postgres',
        ssl: true
      };
    } catch (error) {
      return {
        provider: 'PostgreSQL (Connection String)',
        host: 'unknown',
        ssl: true
      };
    }
  } else {
    return {
      provider: 'Local PostgreSQL',
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      ssl: false
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

