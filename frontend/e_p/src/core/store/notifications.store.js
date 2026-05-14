// notifications.store.js — Estado global de notificaciones (Pinia)
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { notificationsService } from '../../modules/admin-auth-dev1/services/notifications.service';

export const useNotificationsStore = defineStore('notifications', () => {
  // ── State ──────────────────────────────────────────
  const notifications = ref([]);
  const unreadCount = ref(0);
  const isLoading = ref(false);
  let pollInterval = null;

  // ── Getters ────────────────────────────────────────
  const hasUnread = computed(() => unreadCount.value > 0);

  // ── Actions ────────────────────────────────────────

  /**
   * Cargar notificaciones del usuario autenticado.
   */
  async function fetchNotifications() {
    try {
      const res = await notificationsService.getAll({ limit: 30 });
      notifications.value = res.data.data || [];
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    }
  }

  /**
   * Actualizar conteo de no leídas (para el badge).
   */
  async function fetchUnreadCount() {
    try {
      const res = await notificationsService.getUnreadCount();
      unreadCount.value = res.data.count || 0;
    } catch (err) {
      // Silenciar error si el usuario no está autenticado
    }
  }

  /**
   * Marcar una notificación como leída.
   */
  async function markAsRead(id) {
    try {
      await notificationsService.markAsRead(id);
      const noti = notifications.value.find(n => n._id === id);
      if (noti) noti.leido = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    } catch (err) {
      console.error('Error marcando como leída:', err);
    }
  }

  /**
   * Marcar una notificación como resuelta.
   */
  async function markAsResolved(id) {
    try {
      await notificationsService.markAsResolved(id);
      const noti = notifications.value.find(n => n._id === id);
      if (noti) {
        noti.resuelta = true;
        noti.leido = true;
      }
    } catch (err) {
      console.error('Error marcando como resuelta:', err);
    }
  }

  /**
   * Marcar todas como leídas.
   */
  async function markAllAsRead() {
    try {
      await notificationsService.markAllAsRead();
      notifications.value.forEach(n => (n.leido = true));
      unreadCount.value = 0;
    } catch (err) {
      console.error('Error marcando todas como leídas:', err);
    }
  }

  /**
   * Iniciar polling cada 60 segundos.
   */
  function startPolling() {
    // Fetch inicial inmediato
    fetchNotifications();
    fetchUnreadCount();

    // Polling cada 60 segundos
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);
  }

  /**
   * Detener polling.
   */
  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  /**
   * Resetear el store (al cerrar sesión).
   */
  function reset() {
    stopPolling();
    notifications.value = [];
    unreadCount.value = 0;
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    hasUnread,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAsResolved,
    markAllAsRead,
    startPolling,
    stopPolling,
    reset,
  };
});
