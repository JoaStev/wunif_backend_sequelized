
const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me (usuario autenticado)
router.get('/me', auth, async (req, res) => {
  const user = await require('../models/User').findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'No encontrado' });
  res.json(user);
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
    body('acudienteNombre').isLength({ min: 2 }),
    body('acudienteDocumento').isLength({ min: 6, max: 12 }).isNumeric(),
    body('estudianteNombre').isLength({ min: 2 }),
    body('estudianteDocumento').isLength({ min: 6, max: 12 }).isString(),
    body('estudianteNacimiento').isISO8601().toDate(),
    body('gradoSeccion').matches(/^(1|2|3|4|5|6|7|8|9|10|11)\.[12]$/),
    body('direccion').isLength({ min: 5 }),
    body('telefono').matches(/^[0-9]{10}$/),
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
