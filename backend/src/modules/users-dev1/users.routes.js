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

const upload = multer({ storage: multer.memoryStorage() });

// Todas las rutas requieren token válido
router.use(verifyToken);

// ⚠️ IMPORTANTE: rutas específicas deben ir ANTES de /:id
// para que Express no capture "fichas" como parámetro :id

// Rutas restringidas a ADMIN e INSTRUCTOR
// TODO: implementar controller.importExcel
// router.post('/import',      checkRole(['ADMIN']), upload.single('file'), controller.importExcel);
// TODO: implementar controller.getInstructorsHours
// router.get('/instructors/hours', checkRole(['ADMIN']), controller.getInstructorsHours);
// TODO: implementar controller.payInstructorsHours
// router.patch('/instructors/:id/pay-hours', checkRole(['ADMIN']), controller.payInstructorsHours);
router.get('/fichas/stats', checkRole(['ADMIN', 'INSTRUCTOR']), controller.getFichasSummary);
router.get('/',             checkRole(['ADMIN', 'INSTRUCTOR']), controller.getAll);
router.patch('/:id/toggle-status', checkRole(['ADMIN']),        controller.toggleStatus);
// TODO: implementar controller.reassignApprentices
// router.post('/:id/reassign',       checkRole(['ADMIN']),        controller.reassignApprentices);
router.post('/reassign-instructor', checkRole(['ADMIN']),       controller.reassignInstructor);

// Rutas accesibles por cualquier usuario autenticado (ver/editar su propio perfil)
router.get('/me/logs', controller.getMyLogs);
router.get('/:id',  controller.getById);
router.put('/:id/foto-perfil', controller.updateFotoPerfil);
router.put('/:id',  controller.actualizar);

module.exports = router;