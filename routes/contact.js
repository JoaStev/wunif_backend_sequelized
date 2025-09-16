const express = require('express');
const { body } = require('express-validator');
const messageController = require('../controllers/messageController');
const validate = require('../middleware/validate');
const { auth, requireRole } = require('../middleware/auth');
const { limiter } = require('../middleware/rateLimit');

const router = express.Router();

// POST /api/contact (público/usuario)
router.post(
  '/',
  limiter('contact'),
  [
    body('fromName').isLength({ min: 2 }),
    body('fromEmail').isEmail(),
    body('subject').isLength({ min: 2 }),
    body('body').isLength({ min: 5 })
  ],
  validate,
  messageController.create
);

// GET /api/contact (admin)
router.get('/', auth, requireRole('admin'), messageController.list);

// PATCH /api/contact/:id (admin)
router.patch('/:id', auth, requireRole('admin'), messageController.handle);

module.exports = router;
