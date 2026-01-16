#!/usr/bin/env node

/**
 * Database Reset Script
 * Drops and recreates all tables (USE WITH CAUTION - DELETES ALL DATA)
 * 
 * Usage: node scripts/reset-db.js
 * Or set DB_FORCE=true in .env and restart server
 */

require('dotenv').config();
const { sequelize, syncDatabase } = require('../models');

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    // Force sync will drop and recreate all tables
    await sequelize.sync({ force: true });
    
    console.log('✅ Database reset complete! All tables have been recreated.');
    console.log('🚀 You can now start the server normally.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };

