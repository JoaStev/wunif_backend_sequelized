const express = require('express');
const statsController = require('../controllers/statsController');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/summary (admin)
router.get('/summary', auth, requireRole('admin'), statsController.summary);

module.exports = router;
