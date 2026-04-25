// novelties.routes.js   🟡 DEV 3 | Novedades / Incidentes
// =============================================
// Rutas para gestión de novedades.
// =============================================
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./novelties.controller');

router.use(verifyToken);

router.post('/', checkRole(['APRENDIZ']), controller.crear);
router.get('/',  checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']), controller.getAll);
router.patch('/:id/review', checkRole(['ADMIN', 'INSTRUCTOR']), controller.revisar);

module.exports = router;