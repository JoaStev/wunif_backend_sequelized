const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/methods', paymentController.methods);
router.post('/simulate', paymentController.simulate);


router.post('/webhook', paymentController.webhookHandler);

router.post('/preference', paymentController.createOrderAndPreference);

module.exports = router;

