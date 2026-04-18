const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('../../core/middlewares/auth.middleware');

// Ruta de login (Pública)
router.post('/login', authController.login);

// Ruta de cambio de contraseña (Privada)
router.post('/change-password', protect, authController.changePassword);

module.exports = router;
