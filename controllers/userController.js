// Procesar archivo Excel y crear usuarios
exports.uploadExcel = async (req, res) => {
  const XLSX = require('xlsx');
  try {
    if (!req.file) {
      console.error('No se recibió archivo');
      return res.status(400).json({ error: 'Archivo no recibido' });
    }
    const buffer = req.file.buffer;
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      console.error('El archivo no tiene hojas');
      return res.status(400).json({ error: 'El archivo Excel no tiene hojas' });
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    if (!Array.isArray(rows) || rows.length === 0) {
      console.error('No se encontraron filas en el Excel');
      return res.status(400).json({ error: 'El archivo Excel no tiene datos' });
    }
    let created = [], skipped = [];
    for (const [i, row] of rows.entries()) {
      const { estudianteNombre, gradoSeccion, password, email } = row;
      if (!email || !password) {
        skipped.push({ row: i+2, reason: 'Faltan email o password' });
        continue;
      }
      if (await User.findOne({ where: { email } })) {
        skipped.push({ row: i+2, reason: 'Email ya registrado' });
        continue;
      }
      try {
        const user = await User.create({
          email,
          passwordHash: await bcrypt.hash(password, 10),
          estudianteNombre: estudianteNombre || '',
          gradoSeccion: gradoSeccion || '',
          acudienteNombre: '',
          acudienteDocumento: '',
          estudianteDocumento: '',
          estudianteNacimiento: new Date(),
          direccion: '',
          telefono: '',
          role: 'user'
        });
        created.push(user);
      } catch (err) {
        skipped.push({ row: i+2, reason: 'Error al crear usuario: ' + err.message });
      }
    }
    res.json({ created: created.length, skipped });
  } catch (err) {
    console.error('Error procesando Excel:', err);
    res.status(500).json({ error: err.message || 'Error interno procesando Excel' });
  }
};
const { User } = require('../models');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { normalize, normalizeArray } = require('../utils/serialize');
const { Op } = require('sequelize');

const sendCredentialsEmail = async (user, password) => {
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
    to: user.email,
    subject: 'Credenciales ICIT Uniformes',
    html: `<p>Hola ${user.acudienteNombre},<br>Tu usuario ha sido creado.<br>Email: ${user.email}<br>Contraseña: ${password}</p>`
  });
};

exports.list = async (req, res) => {
  try {
    const { q, gradoSeccion, page = 1, limit = 20 } = req.query;
    const where = {};
    if (gradoSeccion) where.gradoSeccion = gradoSeccion;
    if (q) {
      where[Op.or] = [
        { acudienteNombre: { [Op.iLike]: `%${q}%` } },
        { estudianteNombre: { [Op.iLike]: `%${q}%` } }
      ];
    }
    const total = await User.count({ where });
    const data = await User.findAll({ where, order: [['createdAt','DESC']], offset: (page-1)*limit, limit: Number(limit) });
    res.json({ data: normalizeArray(data), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { email, password, acudienteNombre, acudienteDocumento, estudianteNombre, estudianteDocumento, estudianteNacimiento, gradoSeccion, direccion, telefono, role } = req.body;
    if (await User.findOne({ where: { email } })) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      acudienteNombre: acudienteNombre || '',
      acudienteDocumento: acudienteDocumento || '',
      estudianteNombre: estudianteNombre || '',
      estudianteDocumento: estudianteDocumento || '',
      estudianteNacimiento: estudianteNacimiento || new Date(),
      gradoSeccion: gradoSeccion || '',
      direccion: direccion || '',
      telefono: telefono || '',
      role: role || 'user'
    });
    if (process.env.SMTP_HOST) {
      try {
        await sendCredentialsEmail(user, password);
      } catch (mailErr) {
        console.warn('No se pudo enviar el correo de credenciales:', mailErr.message);
      }
    }
    res.status(201).json(normalize(user));
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ error: err.message || 'Error interno' });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'No encontrado' });
    await user.update(req.body);
    res.json(normalize(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'No encontrado' });
    await user.destroy();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};