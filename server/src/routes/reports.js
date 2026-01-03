const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireUser } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');

router.get('/balances', requireUser, requireRole(['manager', 'admin']), reportController.getBalances);

module.exports = router;
