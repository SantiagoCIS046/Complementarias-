// companies.routes.js   DEV 2 | Gestion de Empresas
// =============================================
// Endpoints HTTP del modulo de Empresas.
// =============================================

const express    = require('express');
const multer     = require('multer');
const router     = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { checkRole }   = require('../../core/middlewares/roles.middleware');
const controller      = require('./companies.controller');

// Multer: memoria (sin disco), máximo 5 MB, solo xlsx/xls/xlsm/csv
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel',                                           // .xls
      'application/vnd.ms-excel.sheet.macroEnabled.12',                     // .xlsm
      'text/csv',
      'text/plain'
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|xlsm|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .xlsx, .xls, .xlsm o .csv'));
    }
  }
});

// GET /api/companies/template - Descarga la plantilla Excel (solo ADMIN)
router.get(
  '/template',
  verifyToken,
  checkRole(['ADMIN']),
  controller.downloadTemplate
);

// POST /api/companies/upload-xlsx - Sube y procesa un archivo Excel (solo ADMIN)
router.post(
  '/upload-xlsx',
  verifyToken,
  checkRole(['ADMIN']),
  upload.single('file'),
  controller.uploadXlsx
);

// POST /api/companies/bulk - Importar empresas desde JSON array SGVA (solo ADMIN)
router.post(
  '/bulk',
  verifyToken,
  checkRole(['ADMIN']),
  controller.bulkCrear
);

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

// DELETE /api/companies/:id - Eliminar empresa (solo ADMIN)
router.delete(
  '/:id',
  verifyToken,
  checkRole(['ADMIN']),
  controller.eliminar
);

module.exports = router;
