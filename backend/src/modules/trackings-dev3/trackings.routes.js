// trackings.routes.js   🟡 DEV 3 | Visitas de seguimiento
// =============================================
// Rutas para gestión de visitas de seguimiento.
// =============================================
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./trackings.controller');

router.use(verifyToken);

router.post('/',    checkRole(['ADMIN', 'INSTRUCTOR']), controller.crear);
router.get('/',     checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']), controller.getAll);
router.get('/:id',  checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']), controller.getById);
router.put('/:id',  checkRole(['ADMIN', 'INSTRUCTOR']), controller.actualizar);

module.exports = router;