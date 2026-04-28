// bitacoras.routes.js   🟡 DEV 3 | Bitacoras / Evidencias
// =============================================
// Rutas para gestión de bitácoras.
// =============================================
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./bitacoras.controller');

router.use(verifyToken);

/**
 * @route   POST /api/bitacoras
 * @access  Private (APRENDIZ)
 */
router.post('/', checkRole(['APRENDIZ']), controller.crear);

/**
 * @route   GET /api/bitacoras
 * @access  Private (ADMIN, INSTRUCTOR, APRENDIZ)
 */
router.get('/', checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']), controller.getAll);

/**
 * @route   GET /api/bitacoras/stage/:stageId
 * @access  Private (ADMIN, INSTRUCTOR, APRENDIZ)
 */
router.get('/stage/:stageId', checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']), controller.getByStage);

/**
 * @route   PATCH /api/bitacoras/:id/review
 * @access  Private (ADMIN, INSTRUCTOR)
 */
router.patch('/:id/review', checkRole(['ADMIN', 'INSTRUCTOR']), controller.revisar);

module.exports = router;