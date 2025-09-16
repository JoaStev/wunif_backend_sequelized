const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user: { // guardamos user id como string/uuid
      type: DataTypes.STRING,
      allowNull: false,
    },
    items: { // snapshot: array de objetos (JSONB en Postgres)
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    paymentMethod: { type: DataTypes.ENUM('PSE','DEBITO','CREDITO'), allowNull: false },
    status: { type: DataTypes.ENUM('PAID','FAILED','PENDING'), defaultValue: 'PAID' },
  }, {
    tableName: 'orders',
    timestamps: true,
  });

  return Order;
};