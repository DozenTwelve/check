const express = require('express');
const router = express.Router();
const { requireUser } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const restockController = require('../controllers/restockController');

// Driver/Clerk view incoming
router.get('/pending', requireUser, requireRole(['driver', 'clerk', 'manager']), restockController.getMyPendingRestocks); // Manager included for debugging/viewing? Or strictly drivers. Let's keep strict.
// Actually managers might want to see what they sent. But getMyPendingRestocks name implies receiver.
// Let's allow drivers and clerks.

router.post('/:id/confirm', requireUser, requireRole(['driver', 'clerk']), restockController.confirmRestock);

module.exports = router;
