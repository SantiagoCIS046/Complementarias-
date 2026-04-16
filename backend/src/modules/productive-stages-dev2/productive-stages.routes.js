// productive-stages.routes.js   ?? DEV 2 | Etapas Productivas
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./productive-stages.controller');

// Ejemplo de ruta protegida
// router.get('/', verifyToken, controller.getAll);

module.exports = router;