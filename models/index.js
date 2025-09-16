const fs = require('fs');
const path = require('path');
const { sequelize } = require('../db/sequelize');

const db = { sequelize };

fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.slice(-3) === '.js')
  .forEach((file) => {
    const modelFactory = require(path.join(__dirname, file));
    const model = modelFactory(sequelize);
    db[model.name] = model;
  });

module.exports = db;