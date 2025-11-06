require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { sendTestMail, verifyMailer } = require('../utils/mailer');

async function main() {
  try {
    console.log('Verificando SMTP...');
    await verifyMailer();
    console.log('Intentando enviar correo de prueba a SMTP_USER...');
    const to = process.env.SMTP_USER;
    if (!to) {
      console.error('No se encontró SMTP_USER en .env');
      process.exit(2);
    }
    const info = await sendTestMail(to);
    console.log('Envío OK. Info:');
    console.log(info);
    process.exit(0);
  } catch (err) {
    console.error('Fallo enviando mail de prueba:', err && err.message ? err.message : err);
    if (err && err.response) console.error('Response:', err.response);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
