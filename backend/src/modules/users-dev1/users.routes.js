// users.routes.js   🟢 DEV 1 | Instructores y Aprendices
// =============================================
// Rutas para la gestión de usuarios.
// =============================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('./users.controller');
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');

// Todas las rutas de usuarios requieren autenticación y rol ADMIN
router.use(verifyToken);
router.use(checkRole(['ADMIN', 'INSTRUCTOR']));

router.get('/fichas/stats', controller.getFichasSummary);
router.get('/',    controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', controller.actualizar);
router.patch('/:id/toggle-status', controller.toggleStatus);

module.exports = router;