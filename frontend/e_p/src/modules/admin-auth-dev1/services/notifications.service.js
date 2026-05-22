// notifications.service.js — Servicio de notificaciones para el frontend
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('repfora_token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const notificationsService = {
  /**
   * Obtener las notificaciones del usuario autenticado.
   */
  getAll(params = {}) {
    return axios.get(`${API}/notifications`, { ...getAuthHeaders(), params });
  },

  /**
   * Obtener el conteo de no leídas (para el badge).
   */
  getUnreadCount() {
    return axios.get(`${API}/notifications/count`, getAuthHeaders());
  },

  /**
   * Marcar una notificación como leída.
   */
  markAsRead(id) {
    return axios.patch(`${API}/notifications/${id}/read`, {}, getAuthHeaders());
  },

  /**
   * Marcar una notificación como resuelta.
   */
  markAsResolved(id) {
    return axios.patch(`${API}/notifications/${id}/resolve`, {}, getAuthHeaders());
  },

  /**
   * Marcar todas como leídas.
   */
  markAllAsRead() {
    return axios.patch(`${API}/notifications/read-all`, {}, getAuthHeaders());
  },

  /**
   * ⚠️ TEMPORAL — Enviar correo de prueba.
   */
  sendTestEmail(to) {
    return axios.post(`${API}/test-email`, { to }, getAuthHeaders());
  },

  /**
   * ⚠️ TEMPORAL — Ejecutar escaneo de alertas manualmente.
   */
  triggerAlerts() {
    return axios.post(`${API}/test-email/trigger-alerts`, {}, getAuthHeaders());
  },
};
