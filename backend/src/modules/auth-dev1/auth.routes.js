// auth.routes.js   🟢 DEV 1 | Seguridad Total
const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const { protect } = require('../../core/middlewares/auth.middleware');

// Rutas públicas
router.post('/login',           controller.login);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password/:token', controller.resetPassword);

// Rutas protegidas (Requieren Login)
router.post('/change-password', protect, controller.changePassword);

module.exports = router;