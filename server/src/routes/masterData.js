const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');
const { requireUser } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');

// Consumables
router.get('/consumables', requireUser, masterDataController.listConsumables);
router.post('/consumables', requireUser, requireRole(['admin']), masterDataController.createConsumable);

// Factories
router.get('/factories', requireUser, masterDataController.getFactories);
router.get('/factories/:factory_id/sites', requireUser, masterDataController.getFactorySites);
router.post('/factories', requireUser, requireRole(['admin']), masterDataController.createFactory);

// Client Sites
router.get('/client-sites', requireUser, masterDataController.listClientSites);
router.post('/client-sites', requireUser, requireRole(['admin']), masterDataController.createClientSite);

module.exports = router;
