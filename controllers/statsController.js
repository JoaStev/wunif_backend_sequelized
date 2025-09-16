const { Order, User } = require('../models');
const { Op } = require('sequelize');

exports.summary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to) : new Date();

    const orders = await Order.findAll({
      where: {
        status: 'PAID',
        createdAt: { [Op.between]: [fromDate, toDate] }
      }
    });

    const totalVentas = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalOrdenes = orders.length;

    // Ventas por mes (últimos 12 meses)
    const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const ordersYear = await Order.findAll({
      where: {
        status: 'PAID',
        createdAt: { [Op.gte]: oneYearAgo }
      },
      order: [['createdAt','ASC']]
    });
    const ventasPorMesMap = {};
    ordersYear.forEach(o => {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth()+1).padStart(2,'0')}`;
      ventasPorMesMap[key] = (ventasPorMesMap[key] || 0) + Number(o.total || 0);
    });
    const ventasPorMes = Object.keys(ventasPorMesMap).map(k => ({ month: k, total: ventasPorMesMap[k] }));

    // Top productos
    const itemsFlat = orders.flatMap(o => o.items || []);
    const prodMap = {};
    itemsFlat.forEach(i => {
      const pid = i.product;
      if (!prodMap[pid]) prodMap[pid] = { name: i.name, cantidad: 0 };
      prodMap[pid].cantidad += Number(i.quantity || 0);
    });
    const topProductos = Object.keys(prodMap).map(k => ({ _id: k, name: prodMap[k].name, cantidad: prodMap[k].cantidad }))
      .sort((a,b)=> b.cantidad - a.cantidad).slice(0,5);

    // Compras por usuario
    const comprasMap = {};
    orders.forEach(o => {
      const uid = o.user;
      comprasMap[uid] = (comprasMap[uid] || 0) + Number(o.total || 0);
    });
    const comprasArr = Object.keys(comprasMap).map(k => ({ userId: k, total: comprasMap[k] }))
      .sort((a,b)=> b.total - a.total).slice(0,10);

    const userIds = comprasArr.map(c => c.userId).filter(Boolean);
    const users = userIds.length ? await User.findAll({ where: { id: userIds } }) : [];
    const comprasPorUsuarioEnriq = comprasArr.map(c => ({
      userId: c.userId,
      nombreAcudiente: (users.find(u => u.id === c.userId) || {}).acudienteNombre || '',
      total: c.total
    }));

    res.json({
      totalVentas,
      totalOrdenes,
      ventasPorMes,
      topProductos,
      comprasPorUsuario: comprasPorUsuarioEnriq
    });
  } catch (err) {
    console.error('Error en stats summary:', err);
    res.status(500).json({ error: err.message });
  }
};