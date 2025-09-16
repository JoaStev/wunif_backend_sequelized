const { Message } = require('../models');
const nodemailer = require('nodemailer');
const { normalizeArray, normalize } = require('../utils/serialize');

const notifyAdmin = async (msg) => {
  if (!process.env.SMTP_HOST) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_FROM,
    subject: `Nuevo mensaje de contacto: ${msg.subject}`,
    html: `<b>De:</b> ${msg.fromName} (${msg.fromEmail})<br><b>Asunto:</b> ${msg.subject}<br><p>${msg.body}</p>`
  });
};

exports.create = async (req, res) => {
  try {
    const { fromName, fromEmail, subject, body } = req.body;
    const message = await Message.create({ fromName, fromEmail, subject, body });
    if (process.env.SMTP_HOST) await notifyAdmin(message);
    res.status(201).json({ message: 'Recibido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const total = await Message.count();
    const data = await Message.findAll({ order: [['createdAt','DESC']], offset: Number(offset), limit: Number(limit) });
    res.json({ data: normalizeArray(data), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.handle = async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: 'No encontrado' });
    message.handled = true;
    await message.save();
    res.json(normalize(message));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};