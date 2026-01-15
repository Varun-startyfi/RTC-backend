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

// Database configuration strategy:
// Use DB_PROVIDER environment flag to choose between 'local' (PostgreSQL) or 'supabase'
// Default to 'local' for development if not set
const dbProvider = (process.env.DB_PROVIDER || 'local').toLowerCase()
const useSupabase = dbProvider === 'supabase'
const useLocal = dbProvider === 'local'

// Validate required database configuration based on provider
if (useSupabase) {
  if (!process.env.DATABASE_URL) {
    requiredEnvVars.push('DATABASE_URL')
    console.error('❌ Supabase mode: DATABASE_URL is required')
    console.error('   Get it from: Supabase Dashboard > Settings > Database > Connection string > URI')
  }
} else if (useLocal) {
  if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    requiredEnvVars.push('DB_NAME', 'DB_USER', 'DB_PASSWORD')
    console.error('❌ Local PostgreSQL mode: DB_NAME, DB_USER, and DB_PASSWORD are required')
  }
} else {
  console.error(`❌ Invalid DB_PROVIDER: "${dbProvider}"`)
  console.error('   Valid options: "local" (PostgreSQL) or "supabase"')
  process.exit(1)
}

// Log which database configuration is being used
if (useSupabase) {
  console.log('📦 Database: Supabase (Production)')
} else {
  console.log('📦 Database: Local PostgreSQL (Development)')
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
  // Uses DB_PROVIDER flag to determine which configuration to use
  database: (() => {
    if (useSupabase) {
      // Supabase configuration (connection string)
      return {
        url: process.env.DATABASE_URL,
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false // Supabase requires SSL
          }
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: parseInt(process.env.DB_POOL_MAX || '5', 10),
          min: parseInt(process.env.DB_POOL_MIN || '0', 10),
          acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
          idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10)
        }
      }
    } else {
      // Local PostgreSQL configuration (individual parameters)
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
      }
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
