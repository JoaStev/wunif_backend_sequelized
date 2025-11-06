const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('items').isArray({ min: 1 }),
    body('items.*.product').isString(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.size').isString(), 
    body('paymentMethod').isIn(['PSE','DEBITO','CREDITO'])
  ],
  validate,
  orderController.create
);

router.get('/mine', auth, orderController.mine);

router.get('/all', auth, require('../middleware/auth').requireRole('admin'), orderController.all);

router.get('/:id/updates', auth, orderController.updates);

router.delete('/:id', auth, orderController.remove);

module.exports = router;
