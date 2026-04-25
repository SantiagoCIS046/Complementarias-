// system-config.routes.js   🟢 DEV 1 | Configuracion global
// =============================================
// Rutas para configuración del sistema.
// =============================================
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./system-config.controller');

router.use(verifyToken);
router.use(checkRole(['ADMIN']));

router.get('/', controller.getAll);
router.post('/', controller.upsert);
router.delete('/:clave', controller.eliminar);

module.exports = router;