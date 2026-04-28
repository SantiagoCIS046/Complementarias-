// auth.routes.js   🟢 DEV 1 | Autenticacion y seguridad
// =============================================
// Rutas para registro, login y perfil.
// =============================================
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const controller      = require('./auth.controller');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post('/register', controller.registrar);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión y obtener token
 * @access  Public
 */
router.post('/login', controller.login);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario actual
 * @access  Private
 */
router.get('/profile', verifyToken, controller.getPerfil);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar email para restablecer contraseña
 * @access  Public
 */
router.post('/forgot-password', controller.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Restablecer contraseña con token del email
 * @access  Public
 * @body    { token: string, newPassword: string }
 */
router.post('/reset-password', controller.resetPassword);

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar la contraseña del usuario actual
 * @access  Private
 */
router.post('/change-password', verifyToken, controller.changePassword);

module.exports = router;