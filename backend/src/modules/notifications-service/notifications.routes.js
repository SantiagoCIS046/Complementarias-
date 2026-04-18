const express = require('express');
const notificationsController = require('./notifications.controller');
const { protect } = require('../../core/middlewares/auth.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Obtener mis notificaciones
router.get('/', notificationsController.getMyNotifications);

// Ver una notificación específica (Marca automáticamente como leída)
router.get('/:id', notificationsController.getNotificationDetail);

// Marcar todas como leídas
router.patch('/mark-all-read', notificationsController.markAllReadOnly);

module.exports = router;
