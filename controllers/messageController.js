const { Message } = require('../models');
const { transporter } = require('../utils/mailer');
const { normalizeArray, normalize } = require('../utils/serialize');

const notifyAdmin = async (msg) => {
  if (!process.env.SMTP_HOST) return;
  try {
    const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER;
    const mailTo = process.env.SMTP_USER;
    await transporter.sendMail({
      from: mailFrom,
      to: mailTo,
      subject: `Nuevo mensaje de contacto: ${msg.subject}`,
      replyTo: `${msg.fromName} <${msg.fromEmail}>`,
      html: `<b>De:</b> ${msg.fromName} (${msg.fromEmail})<br><b>Asunto:</b> ${msg.subject}<br><p>${msg.body}</p>`
    });
  } catch (err) {
    console.error('Error enviando notificación por correo:', err && err.message ? err.message : err);
  }
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