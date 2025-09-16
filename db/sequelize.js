const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'postgres';

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect,
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME || 'icit-web',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASS || 'Diosesmipastor1023',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : (dialect === 'postgres' ? 5432 : 3306),
        dialect,
        logging: false,
      }
    );

module.exports = { sequelize };