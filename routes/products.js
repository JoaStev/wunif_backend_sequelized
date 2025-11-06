const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const validate = require('../middleware/validate');
const { auth, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuración de multer para guardar imágenes en /public/products
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/products'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

const router = express.Router();

// GET /api/products (público/usuario)
router.get('/', productController.list);

// POST /api/products (admin)
router.post(
  '/',
  auth,
  requireRole('admin'),
  upload.single('image'),
  [
    body('name').optional().isLength({ min: 3 }),
    body('model').optional().isLength({ min: 2 }),
    body('price').optional().isFloat({ min: 0.01 }),
    body('imageUrl').optional().isURL().matches(/^https?:\/\//)
  ],
  validate,
  productController.create
);

// PATCH /api/products/:id (admin)
router.patch('/:id', auth, requireRole('admin'), upload.single('image'), productController.update);

// DELETE /api/products/:id (admin)
router.delete('/:id', auth, requireRole('admin'), productController.remove);

module.exports = router;
