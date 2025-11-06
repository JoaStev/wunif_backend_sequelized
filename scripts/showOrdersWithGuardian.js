const { sequelize } = require('../db/sequelize');
const { Order, User } = require('../models');

async function showOrdersWithGuardian() {
  await sequelize.authenticate();
  const orders = await Order.findAll();
  for (const order of orders) {
    const user = await User.findByPk(order.user);
    console.log(`Pedido: ${order.id} | Usuario: ${order.user} | Acudiente: ${user ? user.acudienteNombre : 'No encontrado'}`);
  }
  await sequelize.close();
}

showOrdersWithGuardian().catch(console.error);