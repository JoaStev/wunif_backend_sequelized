const express = require('express');
const { body } = require('express-validator');
const messageController = require('../controllers/messageController');
const validate = require('../middleware/validate');
const { auth, requireRole } = require('../middleware/auth');
const { limiter } = require('../middleware/rateLimit');

const router = express.Router();

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

router.get('/', auth, requireRole('admin'), messageController.list);

router.patch('/:id', auth, requireRole('admin'), messageController.handle);

module.exports = router;
