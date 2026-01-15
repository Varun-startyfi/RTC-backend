#!/usr/bin/env node

/**
 * Database initialization script
 * Sets up PostgreSQL database and tables for the sessions backend
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  // Validate required database environment variables
  const requiredDbVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD']
  const missingVars = requiredDbVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required database environment variables:')
    missingVars.forEach(varName => console.error(`   - ${varName}`))
    console.error('\nPlease create a .env file based on env-example.txt and fill in all required values.')
    process.exit(1)
  }

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME, // Required - no default
    user: process.env.DB_USER, // Required - no default
    password: process.env.DB_PASSWORD, // Required - no default
  };

  console.log('🔄 Initializing database...');
  console.log(`📍 Connecting to: ${config.host}:${config.port}/${config.database}`);

  const client = new Client({
    ...config,
    database: 'postgres' // Connect to default postgres database first
  });

  try {
    // Connect to PostgreSQL
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create database if it doesn't exist
    try {
      await client.query(`CREATE DATABASE "${config.database}"`);
      console.log(`📦 Created database: ${config.database}`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`📦 Database ${config.database} already exists`);
      } else {
        throw error;
      }
    }

    // Close connection and reconnect to the target database
    await client.end();

    const dbClient = new Client(config);
    await dbClient.connect();
    console.log(`✅ Connected to database: ${config.database}`);

    // Enable UUID extension
    await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('🔧 Enabled UUID extension');

    // Read and execute setup script
    const setupScript = fs.readFileSync(path.join(__dirname, 'setup-db.sql'), 'utf8');

    // Split script into individual statements (basic approach)
    const statements = setupScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await dbClient.query(statement);
        } catch (error) {
          // Ignore errors for CREATE commands that might already exist
          if (!error.message.includes('already exists')) {
            console.warn(`⚠️  Warning executing: ${statement.substring(0, 50)}...`);
            console.warn(error.message);
          }
        }
      }
    }

    await dbClient.end();
    console.log('✅ Database setup complete!');
    console.log('🚀 You can now start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your .env file has correct database credentials');
    console.log(`3. Try running: psql -U ${config.user} -c "CREATE DATABASE ${config.database};"`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
