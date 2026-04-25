// documents.routes.js   DEV 2 | Documentos de EP
// =============================================
// Endpoints HTTP del modulo de Documentos.
// Integrado con Google Drive (Modulo 3).
// =============================================

const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./documents.controller');

// --- Configuracion de Multer (para subida de archivos) ---
// Almacena en memoria (buffer) para luego enviar a Google Drive
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Maximo 10MB por archivo
  },
  fileFilter: (_req, file, cb) => {
    // Solo permitir PDFs e imagenes
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, JPG y PNG.'), false);
    }
  },
});

// --- Rutas ---

// POST /api/documents - Subir documento con URL (JSON)
router.post(
  '/',
  verifyToken,
  checkRole(['APRENDIZ']),
  controller.subir
);

// POST /api/documents/upload - Subir archivo PDF directo a Google Drive
// Usa multipart/form-data con campo "archivo"
router.post(
  '/upload',
  verifyToken,
  checkRole(['APRENDIZ']),
  upload.single('archivo'),
  controller.uploadToDrive
);

// GET /api/documents - Listar todos los documentos (ADMIN, INSTRUCTOR)
router.get(
  '/',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR']),
  controller.getAll
);

// GET /api/documents/stage/:stageId - Documentos de una EP
router.get(
  '/stage/:stageId',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']),
  controller.getByStage
);

// PATCH /api/documents/:id/review - Aprobar/rechazar documento (ADMIN, INSTRUCTOR)
router.patch(
  '/:id/review',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR']),
  controller.revisar
);

module.exports = router;