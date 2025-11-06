
const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const { auth, requireRole } = require('../middleware/auth');

const multer = require('multer');
const upload = multer({ limits: { fileSize: 2 * 1024 * 1024 } });
const router = express.Router();
// POST /api/users/upload-excel (admin)
router.post('/upload-excel', auth, requireRole('admin'), upload.single('excel'), userController.uploadExcel);

// GET /api/users/me (usuario autenticado)
const { normalize } = require('../utils/serialize');
const { User } = require('../models');

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'No encontrado' });
    res.json(normalize(user));
  } catch (err) {
    console.error('Error en /api/users/me:', err);
    res.status(500).json({ error: err.message || 'Error interno' });
  }
});

// GET /api/users (admin)
router.get('/', auth, requireRole('admin'), userController.list);

// POST /api/users (admin)
router.post(
  '/',
  auth,
  requireRole('admin'),
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 1 }).withMessage('Contraseña requerida'),
    body('role').optional().isIn(['user','admin'])
  ],
  validate,
  userController.create
);

// PATCH /api/users/:id (admin)
router.patch('/:id', auth, requireRole('admin'), userController.update);

// DELETE /api/users/:id (admin)
router.delete('/:id', auth, requireRole('admin'), userController.remove);

module.exports = router;
