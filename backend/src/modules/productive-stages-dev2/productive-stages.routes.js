// productive-stages.routes.js   🔵 DEV 2 | Etapas Productivas
// =============================================
// Endpoints HTTP del módulo de Etapas Productivas.
// =============================================

const express    = require('express');
const router     = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./productive-stages.controller');

// --- Elegibilidad (debe ir ANTES de /:id para evitar conflicto de rutas) ---
// GET /api/productive-stages/elegibility
router.get(
  '/elegibility',
  verifyToken,
  checkRole(['APRENDIZ']),
  controller.checkElegibility
);

// --- RF-ADM-21 Reportes Estadísticos (debe ir ANTES de /:id) ---
// GET /api/productive-stages/reports/stats
router.get(
  '/reports/stats',
  verifyToken,
  checkRole(['ADMIN']),
  controller.getReportStats
);

const multer     = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Máximo 10MB por archivo
  }
});

// --- CRUD de Etapas Productivas ---

// POST /api/productive-stages - Registrar nueva EP (solo APRENDIZ)
router.post(
  '/',
  verifyToken,
  checkRole(['APRENDIZ']),
  upload.fields([
    { name: 'rutFile', maxCount: 1 },
    { name: 'camaraFile', maxCount: 1 },
    { name: 'terceroFile', maxCount: 1 }
  ]),
  controller.registrar
);

// GET /api/productive-stages - Listar EPs
// ADMIN e INSTRUCTOR ven todas, APRENDIZ solo las suyas
router.get(
  '/',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']),
  controller.getAll
);

// --- Motor de Cronogramas (Modulo 2) ---

// GET /api/productive-stages/:id/schedule - Consultar cronograma
router.get(
  '/:id/schedule',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']),
  controller.getCronograma
);

// PATCH /api/productive-stages/:id/schedule - Configurar jornada y cronograma
router.patch(
  '/:id/schedule',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR']),
  controller.configurarCronograma
);

// --- Modulo 4: Aprobaciones y Notificaciones (Semaforo) ---

// PUT /api/productive-stages/evaluar/:id - Instructor evalua la EP
// Body: { decision: 'APROBADA'|'RECHAZADA', comentario: '...', documentosRevisados?: [...] }
router.put(
  '/evaluar/:id',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR']),
  controller.evaluarEP
);

// PATCH /api/productive-stages/:id/enviar-revision - Aprendiz envia a revision
router.patch(
  '/:id/enviar-revision',
  verifyToken,
  checkRole(['APRENDIZ']),
  controller.enviarARevision
);

// GET /api/productive-stages/:id/semaforo - Estado visual del proceso
router.get(
  '/:id/semaforo',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']),
  controller.getSemaforo
);

// --- Punto 4: Documentos de Certificacion ---

// GET /api/productive-stages/:id/certificacion - Estado de documentos finales
router.get(
  '/:id/certificacion',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']),
  controller.getEstadoCertificacion
);

// POST /api/productive-stages/:id/certificar - Certificar EP (valida 3 docs finales)
router.post(
  '/:id/certificar',
  verifyToken,
  checkRole(['ADMIN']),
  controller.certificarEP
);

// --- RF-INS-10: Autorizar Seguimientos Extraordinarios ---
// PATCH /api/productive-stages/:id/authorize-extraordinary
router.patch(
  '/:id/authorize-extraordinary',
  verifyToken,
  checkRole(['ADMIN']),
  controller.authorizeExtraordinary
);

// --- RF-INS-15: Chat de Observaciones ---
// POST /api/productive-stages/:id/chat
router.post(
  '/:id/chat',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR']),
  controller.agregarMensajeChat
);

// --- CRUD general ---

// GET /api/productive-stages/:id - Detalle de una EP
router.get(
  '/:id',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']),
  controller.getById
);

// PATCH /api/productive-stages/:id/transition - Cambiar estado (generico)
router.patch(
  '/:id/transition',
  verifyToken,
  checkRole(['ADMIN', 'INSTRUCTOR']),
  controller.transicionar
);

module.exports = router;
