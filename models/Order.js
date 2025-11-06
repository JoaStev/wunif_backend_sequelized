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
    items: { // array de objetos: cada uno debe incluir talla seleccionada
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    paymentMethod: { type: DataTypes.ENUM('PSE','DEBITO','CREDITO'), allowNull: false },
    status: { type: DataTypes.ENUM('PAID','FAILED','PENDING'), defaultValue: 'PAID' },
    statusUpdates: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [
        'Su pedido está siendo confeccionado',
        'Su pedido está siendo llevado a su destino',
        'Su pedido ha sido entregado'
      ]
    },
  }, {
    tableName: 'orders',
    timestamps: true,
  });

  return Order;
};