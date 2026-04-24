// auth.routes.js   🟢 DEV 1 | Autenticacion y seguridad
const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');

// Rutas públicas
router.post('/login',    controller.login);
router.post('/register', controller.register);

module.exports = router;