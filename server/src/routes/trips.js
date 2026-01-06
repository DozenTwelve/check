const express = require('express');
const router = express.Router();
const { requireUser } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const tripController = require('../controllers/tripController');

router.get('/', requireUser, requireRole(['driver']), tripController.listMyTrips);
router.post('/', requireUser, requireRole(['driver']), tripController.createTrip);
router.delete('/:id', requireUser, requireRole(['driver']), tripController.deletePendingTrip);
router.get('/incoming', requireUser, requireRole(['driver']), tripController.listIncomingRestocks);
router.post('/incoming/:id/confirm', requireUser, requireRole(['driver']), tripController.confirmIncomingRestock);

module.exports = router;
