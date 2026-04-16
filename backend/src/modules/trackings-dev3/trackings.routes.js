// trackings.routes.js   ?? DEV 3 | Visitas de seguimiento
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./trackings.controller');

// Ejemplo de ruta protegida
// router.get('/', verifyToken, controller.getAll);

module.exports = router;