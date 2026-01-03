const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { requireUser } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');

router.get('/me', requireUser, authController.getMe);

// List users (Admin)
router.get('/', requireUser, requireRole(['admin']), userController.listUsers);

// Create user (Admin)
router.post('/', requireUser, requireRole(['admin']), userController.createUser);
router.put('/:id', requireUser, requireRole(['admin']), userController.updateUser);
router.delete('/:id', requireUser, requireRole(['admin']), userController.deleteUser);

module.exports = router;
