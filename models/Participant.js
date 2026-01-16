const { DataTypes } = require('sequelize');

/**
 * Participant Model
 * Represents a participant in a video session
 */
module.exports = (sequelize) => {
  const Participant = sequelize.define('Participant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sessions',
        key: 'id'
      },
      field: 'session_id'
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'user_id'
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'user_name'
    },
    role: {
      type: DataTypes.ENUM('host', 'participant', 'audience'),
      defaultValue: 'participant',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'left', 'removed'),
      defaultValue: 'active',
      allowNull: false
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at'
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'left_at'
    }
  }, {
    tableName: 'participants',
    underscored: true,
    timestamps: true
  });

  return Participant;
};

