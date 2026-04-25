// companies.routes.js   DEV 2 | Gestion de Empresas
// =============================================
// Endpoints HTTP del modulo de Empresas.
// =============================================

const express    = require('express');
const router     = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./companies.controller');

// POST /api/companies - Crear empresa (ADMIN, APRENDIZ)
router.post(
  '/',
  verifyToken,
  checkRole(['ADMIN', 'APRENDIZ']),
  controller.crear
);

// GET /api/companies - Listar empresas
router.get(
  '/',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']),
  controller.getAll
);

// GET /api/companies/:id - Detalle de empresa
router.get(
  '/:id',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']),
  controller.getById
);

// PUT /api/companies/:id - Actualizar empresa (solo ADMIN)
router.put(
  '/:id',
  verifyToken,
  checkRole(['ADMIN']),
  controller.actualizar
);

module.exports = router;