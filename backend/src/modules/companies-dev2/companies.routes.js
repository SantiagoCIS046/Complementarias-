// companies.routes.js   ?? DEV 2 | Gestion de Empresas
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./companies.controller');

// Ejemplo de ruta protegida
// router.get('/', verifyToken, controller.getAll);

module.exports = router;