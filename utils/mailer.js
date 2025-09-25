const nodemailer = require('nodemailer');

// Transporter usando Gmail SMTP (App Password)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: (process.env.SMTP_SECURE === 'true') || true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verifica la configuración SMTP (llamar en arranque)
async function verifyMailer() {
  try {
    await transporter.verify();
    console.log('SMTP conectado correctamente (Gmail SMTP).');
  } catch (err) {
    console.error('Error verificando SMTP:', err && err.message ? err.message : err);
    throw err;
  }
}

async function sendTestMail(to) {
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Prueba de correo desde WUNIF',
    text: 'Este es un correo de prueba enviado desde el backend WUNIF usando Gmail SMTP.',
    html: '<p>Este es un <b>correo de prueba</b> enviado desde el backend WUNIF usando Gmail SMTP.</p>'
  });
  return info;
}

module.exports = { transporter, verifyMailer, sendTestMail };