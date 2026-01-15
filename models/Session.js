const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'User ID of the session creator'
    },
    creatorName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Display name of the session creator'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'Name/title of the session'
    },
    status: {
      type: DataTypes.ENUM('active', 'ended', 'expired'),
      defaultValue: 'active',
      allowNull: false
    },
    provider: {
      type: DataTypes.STRING,
      defaultValue: 'agora',
      allowNull: false,
      comment: 'Video provider used for this session'
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 17, // Agora's default limit
      allowNull: false
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
      comment: 'Additional session settings (JSON)'
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when session was ended'
    }
  }, {
    tableName: 'sessions',
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Instance methods
  Session.prototype.isActive = function() {
    return this.status === 'active';
  };

  Session.prototype.endSession = function() {
    this.status = 'ended';
    this.endedAt = new Date();
    return this.save();
  };

  Session.prototype.getActiveParticipants = async function() {
    return await this.getParticipants({
      where: { status: 'active' }
    });
  };

  Session.prototype.addParticipant = async function(participantData) {
    const Participant = sequelize.models.Participant;
    return await Participant.create({
      ...participantData,
      sessionId: this.id
    });
  };

  return Session;
};
