const express = require('express');
const router = express.Router();
const { requireUser } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const outboundController = require('../controllers/outboundController');

router.get('/', requireUser, requireRole(['clerk', 'manager']), outboundController.getDailyOutbound);
router.post('/', requireUser, requireRole(['clerk']), outboundController.upsertDailyOutbound);

module.exports = router;
