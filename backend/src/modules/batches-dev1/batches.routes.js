const express = require('express');
const router = express.Router();
const batchesController = require('./batches.controller');
// Asumiendo que existen estos middlewares de protección
// const { protect, authorize } = require('../../core/middlewares/auth.middleware');

/**
 * 🍃 Rutas de Fichas (Batches)
 */

// Obtener todas las fichas (con filtros y populate)
router.get('/', batchesController.getAll);

// Crear nueva ficha
router.post('/', batchesController.crear);

// Obtener detalle de una ficha
router.get('/:id', batchesController.getById);

// Asignar instructor (PATCH /api/fichas/:id/asignar-instructor)
router.patch('/:id/asignar-instructor', batchesController.asignarInstructor);

// Ver aprendices vinculados (GET /api/fichas/:id/aprendices)
router.get('/:id/aprendices', batchesController.getAprendices);

module.exports = router;
