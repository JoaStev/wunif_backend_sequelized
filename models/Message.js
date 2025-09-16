const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fromName: { type: DataTypes.STRING, allowNull: false },
    fromEmail: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    handled: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'messages',
    timestamps: true,
  });

  return Message;
};