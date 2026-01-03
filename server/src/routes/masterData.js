const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');
const { requireUser } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');

// Consumables
router.get('/consumables', requireUser, masterDataController.listConsumables);
router.post('/consumables', requireUser, requireRole(['admin']), masterDataController.createConsumable);
router.put('/consumables/:id', requireUser, requireRole(['admin']), masterDataController.updateConsumable);
router.delete('/consumables/:id', requireUser, requireRole(['admin']), masterDataController.deleteConsumable);

// Factories
router.get('/factories', requireUser, masterDataController.getFactories);
router.get('/factories/:factory_id/sites', requireUser, masterDataController.getFactorySites);
router.post('/factories', requireUser, requireRole(['admin']), masterDataController.createFactory);
router.put('/factories/:id', requireUser, requireRole(['admin']), masterDataController.updateFactory);
router.delete('/factories/:id', requireUser, requireRole(['admin']), masterDataController.deleteFactory);

// Client Sites
router.get('/client-sites', requireUser, masterDataController.listClientSites);
router.post('/client-sites', requireUser, requireRole(['admin']), masterDataController.createClientSite);
router.put('/client-sites/:id', requireUser, requireRole(['admin']), masterDataController.updateClientSite);
router.delete('/client-sites/:id', requireUser, requireRole(['admin']), masterDataController.deleteClientSite);

module.exports = router;
