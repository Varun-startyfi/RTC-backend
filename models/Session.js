const { DataTypes } = require('sequelize');

/**
 * Session Model
 * Represents a video session
 */
module.exports = (sequelize) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    hostId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'host_id'
    },
    hostName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'host_name'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'agora'
    },
    channelName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'channel_name'
    },
    status: {
      type: DataTypes.ENUM('active', 'ended', 'scheduled'),
      defaultValue: 'active',
      allowNull: false
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'started_at'
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ended_at'
    }
  }, {
    tableName: 'sessions',
    underscored: true,
    timestamps: true
  });

  return Session;
};

