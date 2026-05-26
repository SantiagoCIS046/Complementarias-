// hours.routes.js   🟡 DEV 3 | Contabilidad de horas
// =============================================
// Rutas para registro de horas diarias.
// =============================================
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./hours.controller');

router.use(verifyToken);

router.post('/', checkRole(['APRENDIZ']), controller.registrar);
router.get('/',  checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']), controller.getAll);
router.get('/resumen/:stageId', checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']), controller.getResumen);
router.get('/historico-pagos', checkRole(['ADMIN', 'INSTRUCTOR']), controller.getHistoricoPagos);
router.patch('/:id/estado', checkRole(['ADMIN', 'INSTRUCTOR']), controller.actualizarEstado);

module.exports = router;