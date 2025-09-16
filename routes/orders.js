const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders (user)
router.post(
  '/',
  auth,
  [
    body('items').isArray({ min: 1 }),
    body('items.*.product').isString(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('paymentMethod').isIn(['PSE','DEBITO','CREDITO'])
  ],
  validate,
  orderController.create
);

// GET /api/orders/mine (user)
router.get('/mine', auth, orderController.mine);

module.exports = router;
