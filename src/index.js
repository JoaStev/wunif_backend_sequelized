require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { sequelize } = require('../db/sequelize');

const app = express();

// Middlewares
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', date: new Date() });
});

// Rutas
const authRoutes = require('../routes/auth');
const usersRoutes = require('../routes/users');
const productsRoutes = require('../routes/products');
const ordersRoutes = require('../routes/orders');
const contactRoutes = require('../routes/contact');
const statsRoutes = require('../routes/stats');
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats', statsRoutes);

// Conexión a la base de datos (Sequelize)
async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // en producción usa migraciones en lugar de sync()
    console.log('Sequelize conectado y modelos sincronizados');
    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`Servidor escuchando en puerto ${port}`));
  } catch (err) {
    console.error('Error conectando con la base de datos:', err);
    process.exit(1);
  }
}

start();