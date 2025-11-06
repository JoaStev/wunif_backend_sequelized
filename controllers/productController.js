const { Product } = require('../models');
const { normalize, normalizeArray } = require('../utils/serialize');
const { Op } = require('sequelize');
const path = require('path');

exports.list = async (req, res) => {
  try {
    const { size, model, minPrice, maxPrice } = req.query;
    const where = { isActive: true };
    if (size) where.size = size;
    if (model) where.model = model;
    if (minPrice) where.price = { ...(where.price||{}), [Op.gte]: Number(minPrice) };
    if (maxPrice) where.price = { ...(where.price||{}), [Op.lte]: Number(maxPrice) };
    const products = await Product.findAll({ where, order: [['name','ASC']] });
    res.json(normalizeArray(products));
  } catch (err) {
    console.error('Error en GET /api/products:', err);
    res.status(500).json({ error: err.message || 'Error interno' });
  }
};

exports.create = async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl;
    if (req.file) {
      // Si se subió archivo, usar la ruta pública
      imageUrl = `/products/${req.file.filename}`;
    }
    const { name, model, price } = req.body;
    if (price <= 0) return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
    const product = await Product.create({ name, model, price, imageUrl });
    res.status(201).json(normalize(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'No encontrado' });
    let updateData = req.body;
    if (req.file) {
      updateData.imageUrl = `/products/${req.file.filename}`;
    }
    await product.update(updateData);
    res.json(normalize(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'No encontrado' });
    await product.destroy();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};