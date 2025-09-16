const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { limiter } = require('../middleware/rateLimit');

const router = express.Router();

// POST /api/auth/login
router.post(
  '/login',
  limiter('login'),
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8 }).withMessage('Contraseña requerida'),
  ],
  validate,
  authController.login
);

// POST /api/auth/forgot (opcional)
router.post('/forgot', authController.forgot);

module.exports = router;
