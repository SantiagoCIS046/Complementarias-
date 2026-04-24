// users.routes.js 🟢 DEV 1 | Rutas Protegidas
const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('./users.controller');
const { protect, authorize } = require('../../core/middlewares/auth.middleware');

// Configuración de Multer para recibir archivos en memoria (buffer)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * RUTA: Importación masiva
 * Solo accesible para ADMIN
 */
router.post(
  '/import',
  protect,
  authorize('ADMIN'),
  upload.single('file'), // 'file' es el nombre del campo en el FormData
  controller.importUsers
);

module.exports = router;