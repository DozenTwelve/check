const express = require('express');
const router = express.Router();
const dailyReturnController = require('../controllers/dailyReturnController');
const { requireUser } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');

// List
router.get('/', requireUser, dailyReturnController.listDailyReturns);

// Create
router.post('/', requireUser, requireRole(['driver', 'clerk']), dailyReturnController.createDailyReturn);

// Confirm
router.post('/:id/confirm', requireUser, requireRole(['manager']), dailyReturnController.confirmDailyReturn);

// Adjust
router.post('/:id/adjustments', requireUser, requireRole(['clerk', 'manager']), dailyReturnController.createAdjustment);

module.exports = router;
