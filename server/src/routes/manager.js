const express = require('express');
const router = express.Router();
const { requireUser } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const managerController = require('../controllers/managerController');

// Review Dashboard
router.get('/pending', requireUser, requireRole(['manager', 'admin']), managerController.getPendingItems);
router.post('/approve', requireUser, requireRole(['manager', 'admin']), managerController.approveItem);

// Platform Returns
router.get('/platform-returns', requireUser, requireRole(['manager', 'admin']), managerController.getPlatformReturns);
router.post('/platform-returns', requireUser, requireRole(['manager', 'admin']), managerController.createPlatformReturn);

// Distribution
router.post('/restock', requireUser, requireRole(['manager', 'admin']), managerController.createRestock);

module.exports = router;
