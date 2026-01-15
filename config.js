// Configuration file - all values must come from environment variables
// Copy env-example.txt to .env and fill in your values

// Load environment variables if not already loaded
if (!process.env.AGORA_APP_ID && !process.env.DB_NAME) {
  try {
    require('dotenv').config();
  } catch (err) {
    // dotenv might not be available, that's okay if loaded elsewhere
  }
}

// Validate required environment variables
const requiredEnvVars = [
  'AGORA_APP_ID',
  'AGORA_APP_CERTIFICATE'
]

// Validate required database configuration
// Support both connection string (DATABASE_URL) or individual parameters
const useConnectionString = !!process.env.DATABASE_URL
const useIndividualParams = !!(process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD)

if (!useConnectionString && !useIndividualParams) {
  requiredEnvVars.push('DATABASE_URL or (DB_NAME, DB_USER, DB_PASSWORD)')
  console.error('❌ Database configuration required:')
  console.error('   Option 1: Set DATABASE_URL (connection string)')
  console.error('   Option 2: Set DB_NAME, DB_USER, and DB_PASSWORD (individual parameters)')
}

if (useConnectionString) {
  console.log('📦 Database: PostgreSQL (Connection String)')
} else {
  console.log('📦 Database: Local PostgreSQL')
}

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingVars.forEach(varName => console.error(`   - ${varName}`))
  console.error('\nPlease create a .env file based on env-example.txt and fill in all required values.')
  process.exit(1)
}

const config = {
  port: process.env.PORT || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',

  // Database Configuration
  // Supports both connection string (DATABASE_URL) or individual parameters
  database: (() => {
    if (process.env.DATABASE_URL) {
      // Connection string mode (e.g., Neon, Supabase, etc.)
      const url = new URL(process.env.DATABASE_URL);
      const sslMode = url.searchParams.get('sslmode') || 'require';
      
      return {
        url: process.env.DATABASE_URL,
        dialect: 'postgres',
        dialectOptions: {
          ssl: sslMode === 'require' || sslMode === 'prefer' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: parseInt(process.env.DB_POOL_MAX || '5', 10),
          min: parseInt(process.env.DB_POOL_MIN || '0', 10),
          acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
          idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10)
        }
      };
    } else {
      // Individual parameters mode (local PostgreSQL)
      return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        dialect: 'postgres',
        dialectOptions: {
          ssl: false // Local PostgreSQL typically doesn't use SSL
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: parseInt(process.env.DB_POOL_MAX || '5', 10),
          min: parseInt(process.env.DB_POOL_MIN || '0', 10),
          acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
          idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10)
        }
      };
    }
  })(),

  // Extensible provider configuration
  providers: {
    agora: {
      enabled: true,
      config: {
        appId: process.env.AGORA_APP_ID, // Required - no default
        appCertificate: process.env.AGORA_APP_CERTIFICATE // Required - no default
      }
    },
    // Add other providers here
    zoom: {
      enabled: false,
      config: {
        apiKey: process.env.ZOOM_API_KEY,
        apiSecret: process.env.ZOOM_API_SECRET
      }
    },
    twilio: {
      enabled: false,
      config: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        apiKey: process.env.TWILIO_API_KEY,
        apiSecret: process.env.TWILIO_API_SECRET
      }
    }
  }
}

// Initialize provider manager after config is defined
const ProviderManager = require('./providers/ProviderManager')
config.providerManager = new ProviderManager(config)


module.exports = config;
