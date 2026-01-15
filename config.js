// Configuration file - in production, use environment variables
const config = {
  port: process.env.PORT || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rtcapp-sessions2',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  // Extensible provider configuration
  providers: {
    agora: {
      enabled: true,
      config: {
        appId: process.env.AGORA_APP_ID || 'd4db3ea489a64f7e9096ad79c805e4fa',
        appCertificate: process.env.AGORA_APP_CERTIFICATE || 'e4e3ef643c9245a1a3b2744156fa2d26'
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
