const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { requireUser } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');

router.get('/me', requireUser, authController.getMe);
router.get('/', requireUser, requireRole(['admin', 'manager']), userController.listUsers);
router.post('/', userController.createUser);

module.exports = router;
