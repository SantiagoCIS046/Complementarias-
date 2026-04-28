// notifications.js 🔔 DEV 1 | Utilidad Global de Notificaciones
const Notification = require('../../modules/system-config-dev1/Notification.model');

/**
 * Envía una notificación a un usuario específico
 */
const enviarNotificacion = async (usuarioId, mensaje, tipo = 'INFO') => {
  try {
    const nuevaNoti = new Notification({
      usuario: usuarioId,
      mensaje,
      tipo
    });
    await nuevaNoti.save();
    console.log(`🔔 Notificación enviada al usuario ${usuarioId}: ${mensaje}`);
    return nuevaNoti;
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    return null;
  }
};

module.exports = { enviarNotificacion };
