const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const validate = require('../middleware/validate');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/products (público/usuario)
router.get('/', productController.list);

// POST /api/products (admin)
router.post(
  '/',
  auth,
  requireRole('admin'),
  [
    body('name').isLength({ min: 3 }),
    body('model').isLength({ min: 2 }),
    body('size').isString(),
    body('price').isFloat({ min: 0.01 }),
    body('imageUrl').optional().isURL().matches(/^https?:\/\//)
  ],
  validate,
  productController.create
);

// PATCH /api/products/:id (admin)
router.patch('/:id', auth, requireRole('admin'), productController.update);

// DELETE /api/products/:id (admin)
router.delete('/:id', auth, requireRole('admin'), productController.remove);

module.exports = router;
