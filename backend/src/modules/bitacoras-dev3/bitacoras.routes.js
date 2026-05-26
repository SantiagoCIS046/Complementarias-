// bitacoras.routes.js   🟡 DEV 3 | Bitacoras / Evidencias
// =============================================
// Rutas para gestión de bitácoras.
// =============================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./bitacoras.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Máximo 5MB por archivo
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF.'), false);
    }
  },
});

router.use(verifyToken);

/**
 * @route   POST /api/bitacoras/validate-signatures
 * @access  Private (APRENDIZ, INSTRUCTOR, ADMIN)
 */
router.post('/validate-signatures', checkRole(['APRENDIZ', 'INSTRUCTOR', 'ADMIN']), upload.single('file'), controller.validarFirmasIA);

/**
 * @route   POST /api/bitacoras
 * @access  Private (APRENDIZ, INSTRUCTOR, ADMIN)
 */
router.post('/', checkRole(['APRENDIZ', 'INSTRUCTOR', 'ADMIN']), upload.single('archivo'), controller.crear);

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

/**
 * @route   PUT /api/bitacoras/:id
 * @access  Private (APRENDIZ, INSTRUCTOR, ADMIN)
 */
router.put('/:id', checkRole(['APRENDIZ', 'INSTRUCTOR', 'ADMIN']), upload.single('archivo'), controller.actualizar);

module.exports = router;