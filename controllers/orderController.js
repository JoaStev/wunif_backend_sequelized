// DELETE /api/orders/:id (user): eliminar pedido propio
exports.remove = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    // Solo el dueño o admin puede eliminar
    if (order.user !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    await order.destroy();
    res.status(204).end();
  } catch (err) {
    console.error('Error eliminando pedido:', err, err.stack);
    res.status(500).json({ error: err.message });
  }
};
const { Order, Product, User } = require('../models');
const nodemailer = require('nodemailer');



const sendReceipt = async (order, user) => {
  if (!process.env.SMTP_HOST) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const itemsRows = order.items.map(item =>
    `<tr><td>${item.name}</td><td>${item.model}</td><td>${item.size}</td><td>${item.quantity}</td><td>$${item.unitPrice}</td></tr>`
  ).join('');
  const html = `
    <h2>ICIT – Recibo de compra #${String(order.id).slice(-6)}</h2>
    <p>Fecha: ${order.createdAt.toLocaleString('es-CO')}</p>
    <p>Acudiente: ${user.acudienteNombre} (${user.acudienteDocumento})<br>
    Estudiante: ${user.estudianteNombre} (${user.gradoSeccion})</p>
    <table border="1" cellpadding="4" cellspacing="0">
      <tr><th>Producto</th><th>Modelo</th><th>Talla</th><th>Cantidad</th><th>Precio</th></tr>
      ${itemsRows}
    </table>
    <p><b>Total:</b> $${order.total}</p>
    <p><b>Método de pago:</b> ${order.paymentMethod}</p>
    <hr>
    <small>ICIT | contacto@icit.edu.co | Política de devoluciones disponible en el sitio web.</small>
  `;
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: user.email,
    subject: `ICIT – Recibo de compra #${String(order.id).slice(-6)}`,
    html
  });
};

exports.create = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }
    if (!['PSE','DEBITO','CREDITO'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Método de pago no permitido' });
    }
    let total = 0;
    const snapshotItems = [];
    for (const i of items) {
      const prod = await Product.findByPk(i.product);
      if (!prod || !prod.isActive) return res.status(400).json({ error: 'Producto inválido' });
      // La talla ahora viene de i.size (seleccionada por el usuario)
      snapshotItems.push({
        product: prod.id,
        name: prod.name,
        model: prod.model,
        size: i.size, // talla seleccionada por el usuario
        unitPrice: prod.price,
        quantity: i.quantity
      });
      total += prod.price * i.quantity;
    }
    const order = await Order.create({
      user: req.user.id,
      items: snapshotItems,
      total,
      paymentMethod,
      status: 'PAID',
      statusUpdates: [
        'Su pedido está siendo confeccionado',
        'Su pedido está siendo llevado a su destino',
        'Su pedido ha sido entregado'
      ]
    });
    const user = await User.findByPk(req.user.id);
    if (process.env.SMTP_HOST) await sendReceipt(order, user);
    res.status(201).json({ orderId: order.id, status: 'PAID' });
  } catch (err) {
    console.error('Error creando orden:', err);
    res.status(500).json({ error: err.message || 'Error interno al crear la orden' });
  }
};
// GET /api/orders/all (admin): ver todos los pedidos
exports.all = async (req, res) => {
  try {
    const orders = await Order.findAll({ order: [['createdAt','DESC']] });
    res.json(orders.map(o => (o.toJSON ? o.toJSON() : o)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/orders/:id/updates (user): ver actualizaciones de estado de un pedido
exports.updates = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    // Solo el dueño o admin puede ver
    if (order.user !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    res.json({ statusUpdates: order.statusUpdates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.mine = async (req, res) => {
  try {
    const orders = await Order.findAll({ where: { user: req.user.id }, order: [['createdAt','DESC']] });
    res.json(orders.map(o => (o.toJSON ? o.toJSON() : o)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};