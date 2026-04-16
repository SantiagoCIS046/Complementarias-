// documents.routes.js   ?? DEV 2 | Documentos finales
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./documents.controller');

// Ejemplo de ruta protegida
// router.get('/', verifyToken, controller.getAll);

module.exports = router;