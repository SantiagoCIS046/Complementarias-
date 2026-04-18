const express = require('express');
const multer = require('multer');
const usersController = require('./users.controller');
const { protect } = require('../../core/middlewares/auth.middleware');
const { checkRole } = require('../../core/middlewares/roles.middleware');
const { ROLES } = require('../../core/utils/enums');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Todas las rutas de gestión de usuarios requieren autenticación y rol de ADMIN o COORDINADOR
router.use(protect);
router.use(checkRole(ROLES.ADMIN, ROLES.COORDINADOR));

// Ruta para importación masiva desde Excel
router.post('/import', upload.single('file'), usersController.importUsers);

// Rutes para reasignación de instructores
router.get('/reassign/suggestions/:instructorId', usersController.getSuggestions);
router.post('/reassign', usersController.reassign);

module.exports = router;
