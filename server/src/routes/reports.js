const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireUser } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');

router.get('/balances', requireUser, requireRole(['manager', 'admin']), reportController.getBalances);
router.get('/factory-net', requireUser, requireRole(['manager', 'admin']), reportController.getFactoryNetChanges);
router.get('/site-debt', requireUser, requireRole(['manager', 'admin']), reportController.getSiteDebtSeries);
router.get('/site-inventory', requireUser, requireRole(['manager', 'admin']), reportController.getSiteInventory);

module.exports = router;
