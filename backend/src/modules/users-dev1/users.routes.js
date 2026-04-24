// users.routes.js 🟢 DEV 1 | Rutas CRUD Protegidas
const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('./users.controller');
const { protect, authorize } = require('../../core/middlewares/auth.middleware');

// Configuración de Multer para recibir archivos en memoria (buffer)
const upload = multer({ storage: multer.memoryStorage() });

// Todas las rutas requieren autenticación y rol ADMIN
router.use(protect, authorize('ADMIN'));

// CRUD
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Importación masiva
router.post('/import', upload.single('file'), controller.importUsers);

module.exports = router;