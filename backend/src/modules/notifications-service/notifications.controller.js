const notificationsService = require('./notifications.service');

/**
 * Obtener lista de notificaciones del usuario logueado
 */
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await notificationsService.getMyNotifications(req.user.id);
    res.status(200).json({ status: 'success', data: notifications });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Obtener detalle de una notificación (y marcarla como vista automáticamente)
 */
const getNotificationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationsService.getOneAndView(id, req.user.id);
    
    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notificación no encontrada' });
    }

    res.status(200).json({ status: 'success', data: notification });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Marcar todas las notificaciones como leídas
 */
const markAllReadOnly = async (req, res) => {
  try {
    const result = await notificationsService.markAllAsRead(req.user.id);
    res.status(200).json({ 
      status: 'success', 
      message: 'Todas las notificaciones marcadas como leídas',
      count: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  getNotificationDetail,
  markAllReadOnly
};
