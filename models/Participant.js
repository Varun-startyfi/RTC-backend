const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Participant = sequelize.define('Participant', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sessions',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Unique user identifier'
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Display name of the participant'
    },
    role: {
      type: DataTypes.ENUM('host', 'participant', 'viewer'),
      defaultValue: 'participant',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'left'),
      defaultValue: 'active',
      allowNull: false
    },
    agoraUid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Agora User ID assigned by Agora SDK'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
      comment: 'Additional participant metadata (JSON)'
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when participant left the session'
    }
  }, {
    tableName: 'participants',
    indexes: [
      {
        fields: ['session_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['joined_at']
      }
    ]
  });

  // Instance methods
  Participant.prototype.isActive = function() {
    return this.status === 'active';
  };

  Participant.prototype.leaveSession = function() {
    this.status = 'left';
    this.leftAt = new Date();
    return this.save();
  };

  Participant.prototype.updateStatus = function(newStatus) {
    this.status = newStatus;
    if (newStatus === 'left') {
      this.leftAt = new Date();
    }
    return this.save();
  };

  return Participant;
};
