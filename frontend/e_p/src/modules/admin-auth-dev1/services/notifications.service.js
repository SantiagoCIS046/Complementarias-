// notifications.service.js — Servicio de notificaciones para el frontend
import http from '../../../core/api/http';

export const notificationsService = {
  /**
   * Obtener las notificaciones del usuario autenticado.
   */
  getAll(params = {}) {
    return http.get('/notifications', { params });
  },

  /**
   * Obtener el conteo de no leídas (para el badge).
   */
  getUnreadCount() {
    return http.get('/notifications/count');
  },

  /**
   * Marcar una notificación como leída.
   */
  markAsRead(id) {
    return http.patch(`/notifications/${id}/read`);
  },

  /**
   * Marcar una notificación como resuelta.
   */
  markAsResolved(id) {
    return http.patch(`/notifications/${id}/resolve`);
  },

  /**
   * Marcar todas como leídas.
   */
  markAllAsRead() {
    return http.patch('/notifications/read-all');
  },

  /**
   * ⚠️ TEMPORAL — Enviar correo de prueba.
   */
  sendTestEmail(to) {
    return http.post('/test-email', { to });
  },

  /**
   * ⚠️ TEMPORAL — Ejecutar escaneo de alertas manualmente.
   */
  triggerAlerts() {
    return http.post('/test-email/trigger-alerts');
  },
};
