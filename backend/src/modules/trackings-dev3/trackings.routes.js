// trackings.routes.js   🟡 DEV 3 | Visitas de seguimiento
// =============================================
// Rutas para gestión de visitas de seguimiento.
// =============================================
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const { checkTipoInstructor } = require('../../core/middlewares/checkTipoInstructor');
const controller      = require('./trackings.controller');

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(verifyToken);

router.post('/validate-pdf', checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']), upload.single('file'), (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'El archivo excede el tamaño máximo permitido de 5MB.'
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
}, controller.validarPdfIA);

// RF-INS-26: Solo instructores de SEGUIMIENTO pueden crear/actualizar visitas
router.post('/',    checkRole(['ADMIN', 'INSTRUCTOR']), checkTipoInstructor(['SEGUIMIENTO']), controller.crear);
router.get('/',     checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']), controller.getAll);
router.get('/:id',  checkRole(['ADMIN', 'INSTRUCTOR', 'APRENDIZ']), controller.getById);
router.put('/:id',  checkRole(['ADMIN', 'INSTRUCTOR']), checkTipoInstructor(['SEGUIMIENTO']), controller.actualizar);
router.patch('/:id/approve-extraordinary', checkRole(['ADMIN']), controller.approveExtraordinary);

module.exports = router;