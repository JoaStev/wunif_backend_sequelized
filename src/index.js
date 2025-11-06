require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { sequelize } = require('../db/sequelize');
const { verifyMailer } = require('../utils/mailer');
const path = require('path');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', date: new Date() });
});

const authRoutes = require('../routes/auth');
const usersRoutes = require('../routes/users');
const productsRoutes = require('../routes/products');
const ordersRoutes = require('../routes/orders');
const contactRoutes = require('../routes/contact');
const statsRoutes = require('../routes/stats');
const testMailRoutes = require('../routes/testMail');
const paymentsRoutes = require('../routes/payments');

app.use('/api/test', testMailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats', statsRoutes);


async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('Sequelize conectado y modelos sincronizados');

    try {
      await verifyMailer();
    } catch (mailErr) {
      console.warn('Advertencia: no se pudo verificar SMTP en arranque:', mailErr.message || mailErr);
    }

    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`Servidor escuchando en puerto ${port}`));
  } catch (err) {
    console.error('Error conectando con la base de datos:', err);
    process.exit(1);
  }
}
async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); 
    try {
        await verifyMailer();
        } catch (mailErr) {
            console.warn('Advertencia: no se pudo verificar SMTP en arranque:', mailErr.message || mailErr);
                }
    console.log('Sequelize conectado y modelos sincronizados');
    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`Servidor escuchando en puerto ${port}`));
  } catch (err) {
    console.error('Error conectando con la base de datos:', err);
    process.exit(1);
  }
}



start();