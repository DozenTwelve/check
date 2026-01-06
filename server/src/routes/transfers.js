const express = require('express');
const router = express.Router();
const dailyReturnController = require('../controllers/dailyReturnController');
const { requireUser } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');

// List transfers
router.get('/', requireUser, dailyReturnController.listDailyReturns);

// Adjust
router.post('/:id/adjustments', requireUser, requireRole(['manager', 'admin']), dailyReturnController.createAdjustment);

module.exports = router;
