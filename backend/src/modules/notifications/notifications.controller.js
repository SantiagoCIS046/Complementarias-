// notifications.controller.js 🔔 Controladores HTTP para notificaciones
// =============================================
const service = require('./notifications.service');

/**
 * GET /api/notifications — Listar notificaciones del usuario autenticado.
 */
const getMyNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const data = await service.getByUser(req.user._id, { limit, skip });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/notifications/count — Contar no leídas (para el badge).
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await service.countUnread(req.user._id);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/notifications/:id/read — Marcar como leída.
 */
const markAsRead = async (req, res) => {
  try {
    const data = await service.markAsRead(req.params.id, req.user._id);
    res.json({ success: true, data });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/notifications/:id/resolve — Marcar como resuelta.
 */
const markAsResolved = async (req, res) => {
  try {
    const data = await service.markAsResolved(req.params.id, req.user._id);
    res.json({ success: true, data });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/notifications/read-all — Marcar todas como leídas.
 */
const markAllAsRead = async (req, res) => {
  try {
    const result = await service.markAllAsRead(req.user._id);
    res.json({ success: true, modified: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAsResolved,
  markAllAsRead,
};
