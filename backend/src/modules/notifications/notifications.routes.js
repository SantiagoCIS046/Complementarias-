// notifications.routes.js 🔔 Rutas de notificaciones
// =============================================
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const controller = require('./notifications.controller');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/notifications — Listar mis notificaciones
router.get('/', controller.getMyNotifications);

// GET /api/notifications/count — Contar no leídas
router.get('/count', controller.getUnreadCount);

// PATCH /api/notifications/read-all — Marcar todas como leídas
router.patch('/read-all', controller.markAllAsRead);

// PATCH /api/notifications/:id/read — Marcar una como leída
router.patch('/:id/read', controller.markAsRead);

// PATCH /api/notifications/:id/resolve — Marcar como resuelta
router.patch('/:id/resolve', controller.markAsResolved);

module.exports = router;
