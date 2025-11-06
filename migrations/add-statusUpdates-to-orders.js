'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'statusUpdates', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [
        'Su pedido está siendo confeccionado',
        'Su pedido está siendo llevado a su destino',
        'Su pedido ha sido entregado'
      ]
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('orders', 'statusUpdates');
  }
};
