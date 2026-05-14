// notifications.service.js 🔔 Lógica de negocio para notificaciones
// =============================================
const Notification = require('../system-config-dev1/Notification.model');

/**
 * Obtener notificaciones de un usuario (paginadas, más recientes primero).
 */
const getByUser = async (usuarioId, { limit = 20, skip = 0 } = {}) => {
  const notifications = await Notification.find({ usuario: usuarioId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return notifications;
};

/**
 * Contar notificaciones no leídas de un usuario.
 */
const countUnread = async (usuarioId) => {
  return Notification.countDocuments({ usuario: usuarioId, leido: false });
};

/**
 * Marcar una notificación como leída.
 */
const markAsRead = async (notificationId, usuarioId) => {
  const noti = await Notification.findOneAndUpdate(
    { _id: notificationId, usuario: usuarioId },
    { leido: true },
    { new: true }
  );
  if (!noti) throw new Error('Notificación no encontrada.');
  return noti;
};

/**
 * Marcar una notificación como resuelta.
 */
const markAsResolved = async (notificationId, usuarioId) => {
  const noti = await Notification.findOneAndUpdate(
    { _id: notificationId, usuario: usuarioId },
    { resuelta: true, leido: true },
    { new: true }
  );
  if (!noti) throw new Error('Notificación no encontrada.');
  return noti;
};

/**
 * Marcar TODAS las notificaciones de un usuario como leídas.
 */
const markAllAsRead = async (usuarioId) => {
  const result = await Notification.updateMany(
    { usuario: usuarioId, leido: false },
    { leido: true }
  );
  return result;
};

/**
 * Crear una notificación (usada internamente por el cron y utilidades).
 */
const crear = async ({ usuario, mensaje, tipo = 'INFO', referencia = null, referenciaModelo = null }) => {
  const noti = await Notification.create({
    usuario,
    mensaje,
    tipo,
    referencia,
    referenciaModelo,
  });
  return noti;
};

module.exports = {
  getByUser,
  countUnread,
  markAsRead,
  markAsResolved,
  markAllAsRead,
  crear,
};
