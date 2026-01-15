const { Sequelize } = require('sequelize');
const dns = require('dns');
const config = require('../config');

/**
 * Supabase Database Configuration
 * This module provides database connection specifically for Supabase
 * Activated when DB_PROVIDER=supabase in environment variables
 * 
 * Note: Resolves hostname to IPv4 to avoid IPv6 connection issues (ENETUNREACH errors)
 */

// Parse connection string to extract components
let connectionConfig;
try {
  const url = new URL(config.database.url);
  connectionConfig = {
    host: url.hostname,
    port: parseInt(url.port || '5432', 10),
    database: url.pathname.slice(1) || 'postgres',
    username: url.username,
    password: url.password,
  };
} catch (error) {
  throw new Error(`Invalid DATABASE_URL format: ${error.message}`);
}

// Resolve hostname to IPv4 address to avoid IPv6 connection issues
let ipv4Host = connectionConfig.host;
try {
  // Try to resolve to IPv4 synchronously
  const result = dns.lookupSync(connectionConfig.host, { family: 4 });
  ipv4Host = result.address;
  console.log(`🔗 Resolved ${connectionConfig.host} to IPv4: ${ipv4Host}`);
} catch (error) {
  // If sync lookup fails, log warning but continue with hostname
  // The connection might still work, or we'll get a clearer error
  console.warn(`⚠️  Could not resolve ${connectionConfig.host} to IPv4 synchronously:`, error.message);
  console.warn(`   Using hostname directly. If you get ENETUNREACH errors, check your network IPv6 support.`);
}

// Initialize Sequelize with IPv4 address (or hostname as fallback)
const sequelize = new Sequelize(
  connectionConfig.database,
  connectionConfig.username,
  connectionConfig.password,
  {
    host: ipv4Host,
    port: connectionConfig.port,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Supabase requires SSL
      },
      connect_timeout: 10,
    },
    native: true,
    logging: config.database.logging,
    pool: config.database.pool,
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

// Test Supabase database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Supabase database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to Supabase database:', error.message);
    if (error.code === 'ENETUNREACH') {
      console.error('\n💡 IPv6 connection issue detected. Troubleshooting:');
      console.error('   1. Ensure your network supports IPv4');
      console.error('   2. Try using the IPv4 address directly in DATABASE_URL');
      console.error('   3. Check if your firewall allows outbound connections on port 5432');
    }
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
