const { Sequelize } = require('sequelize');
const config = require('../config');

// Initialize Sequelize with database configuration
const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging,
    pool: config.database.pool,
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Import models
const Session = require('./Session')(sequelize);
const Participant = require('./Participant')(sequelize);

// Define associations
Session.hasMany(Participant, {
  foreignKey: 'sessionId',
  as: 'participants',
  onDelete: 'CASCADE'
});

Participant.belongsTo(Session, {
  foreignKey: 'sessionId',
  as: 'session'
});

// Sync database (create tables if they don't exist)
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true }); // Use alter: true for development
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  syncDatabase,
  Session,
  Participant
};
