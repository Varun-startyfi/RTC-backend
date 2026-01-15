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
  // Use DB_PROVIDER flag to determine database configuration
  const dbProvider = (process.env.DB_PROVIDER || 'local').toLowerCase()
  const useSupabase = dbProvider === 'supabase'
  const useLocal = dbProvider === 'local'

  if (!useSupabase && !useLocal) {
    console.error(`❌ Invalid DB_PROVIDER: "${dbProvider}"`)
    console.error('   Valid options: "local" (PostgreSQL) or "supabase"')
    console.error('\nPlease set DB_PROVIDER in your .env file based on env-example.txt.')
    process.exit(1)
  }

  let config;
  let connectDatabase;
  let sslConfig;

  if (useSupabase) {
    // Supabase configuration (connection string)
    if (!process.env.DATABASE_URL) {
      console.error('❌ Supabase mode: DATABASE_URL is required')
      console.error('   Get it from: Supabase Dashboard > Settings > Database > Connection string > URI')
      process.exit(1)
    }

    // Parse connection string (format: postgresql://user:password@host:port/database)
    const url = new URL(process.env.DATABASE_URL);
    config = {
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
      database: url.pathname.slice(1) || 'postgres', // Remove leading /
      user: url.username,
      password: url.password,
    };
    connectDatabase = config.database; // Connect directly to the target database
    sslConfig = { rejectUnauthorized: false }; // Supabase requires SSL
    console.log('📦 Using Supabase (Production)');
  } else {
    // Local PostgreSQL configuration
    if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
      console.error('❌ Local PostgreSQL mode: DB_NAME, DB_USER, and DB_PASSWORD are required')
      process.exit(1)
    }

    config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };
    connectDatabase = 'postgres'; // For local, connect to default postgres database first
    sslConfig = false; // No SSL for local by default
    console.log('📦 Using Local PostgreSQL (Development)');
  }

  console.log('🔄 Initializing database...');
  console.log(`📍 Connecting to: ${config.host}:${config.port}/${config.database}`);

  const client = new Client({
    ...config,
    database: connectDatabase,
    ssl: sslConfig
  });

  try {
    // Connect to PostgreSQL
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    let dbClient = client;

    // Create database if it doesn't exist (only for local PostgreSQL, not Supabase)
    if (useLocal) {
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

      dbClient = new Client({
        ...config,
        ssl: false // Reconnect to target DB without SSL for local
      });
      await dbClient.connect();
    } else {
      // For Supabase, we're already connected to the target database
      dbClient = client;
    }
    
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
