const Notification = require('./models/notification.model');
const User = require('../users-dev1/models/user.model');
const { sendEmail } = require('../../core/utils/email');
const { logAction } = require('../../core/utils/logger');

/**
 * Envía una notificación doble (DB interna + Email)
 * @param {Object} data - { recipientId, title, message, type, link }
 */
const send = async ({ recipientId, title, message, type = 'INFO', link = null }) => {
  try {
    // 1. Guardar en Base de Datos Interna
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      link
    });

    // 2. Intentar enviar por Email
    const user = await User.findById(recipientId);
    if (user && user.email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #2c3e50;">🔔 Nueva Notificación: ${title}</h2>
          <p>${message}</p>
          ${link ? `<a href="${link}" style="display: inline-block; padding: 10px 20px; background: #3498db; color: #fff; text-decoration: none; border-radius: 3px;">Ver en el sistema</a>` : ''}
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;">
          <small style="color: #7f8c8d;">Este es un correo automático de RepFora SENA.</small>
        </div>
      `;

      const emailInfo = await sendEmail({
        to: user.email,
        subject: `🔔 RepFora: ${title}`,
        html: emailHtml
      });

      if (emailInfo) {
        notification.emailSent = true;
        await notification.save();
      }
    }

    return notification;
  } catch (error) {
    console.error('[NotificationService] Error al enviar notificación:', error.message);
    return null;
  }
};

/**
 * Obtiene las notificaciones de un usuario
 */
const getMyNotifications = async (userId) => {
  return await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(50);
};

/**
 * Obtiene una notificación específica y la marca como VISTA automáticamente
 * @param {String} notificationId 
 * @param {String} userId - Para asegurar que pertenece al usuario
 */
const getOneAndView = async (notificationId, userId) => {
  const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
  
  if (notification && !notification.isRead) {
    notification.isRead = true;
    await notification.save();
    
    // Auditoría automática de visualización
    await logAction({
      user: userId,
      action: 'NOTIFICATION_VIEWED',
      module: 'NOTIFICATIONS',
      details: { notificationId: notification._id, title: notification.title }
    });
  }
  
  return notification;
};

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
};

module.exports = {
  send,
  getMyNotifications,
  getOneAndView,
  markAllAsRead
};
