<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../../core/store/auth.store';
import { useNotificationsStore } from '../../core/store/notifications.store';
import { useRouter } from 'vue-router';
import SkeletonLoader from '../ui/SkeletonLoader.vue';

const props = defineProps({
  title: {
    type: String,
    default: 'Dashboard'
  }
});

const authStore = useAuthStore();
const notifStore = useNotificationsStore();
const router = useRouter();

const currentUser = computed(() => authStore.user || { name: 'Usuario SENA', email: 'usuario@sena.edu.co' });
const userRole = computed(() => authStore.user?.role || 'Visitante');

const showProfileMenu = ref(false);
const showNotifDropdown = ref(false);

const avatarUrl = computed(() => {
  const name = encodeURIComponent(currentUser.value.name);
  return `https://ui-avatars.com/api/?name=${name}&background=2e7d32&color=fff&bold=true`;
});

// ── Notificaciones ──────────────────────────────────
onMounted(() => {
  if (authStore.isLoggedIn) {
    notifStore.startPolling();
  }
});

onUnmounted(() => {
  notifStore.stopPolling();
});

const toggleNotifDropdown = () => {
  showNotifDropdown.value = !showNotifDropdown.value;
  showProfileMenu.value = false;
  if (showNotifDropdown.value) {
    notifStore.fetchNotifications();
  }
};

const handleMarkRead = async (id) => {
  await notifStore.markAsRead(id);
};

const handleMarkAllRead = async () => {
  await notifStore.markAllAsRead();
};

const handleMarkResolved = async (id) => {
  await notifStore.markAsResolved(id);
};

const closeDropdowns = (e) => {
  // Cerrar dropdowns si se hace click fuera
  if (!e.target.closest('.notification-wrapper') && !e.target.closest('.user-profile-wrapper')) {
    showNotifDropdown.value = false;
    showProfileMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closeDropdowns);
});
onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns);
});

// Formatear tiempo relativo
const timeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHr < 24) return `Hace ${diffHr}h`;
  if (diffDay === 1) return 'Ayer';
  return `Hace ${diffDay} días`;
};

const getNotifIcon = (tipo) => {
  const map = {
    SEGUIMIENTO: '📋',
    SUCCESS: '✅',
    WARNING: '⚠️',
    ERROR: '❌',
    INFO: 'ℹ️',
  };
  return map[tipo] || '🔔';
};

// ── Profile ──────────────────────────────────────────
const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value;
  showNotifDropdown.value = false;
};

const handleLogout = () => {
  notifStore.reset();
  authStore.logout();
  router.push('/login');
};

const handleChangePassword = () => {
  showProfileMenu.value = false;
  alert('Funcionalidad de cambiar contraseña en desarrollo...');
};
</script>

<template>
  <header class="topbar">
    <slot name="title-area">
      <h2 class="page-title">{{ title }}</h2>
    </slot>
    <div class="topbar-actions">
      <!-- Slot for custom actions per view -->
      <slot name="actions"></slot>
      
      <div class="divider"></div>

      <!-- ═══ Campanita de Notificaciones (Interactiva) ═══ -->
      <div class="notification-wrapper">
        <button 
          class="notification-bell" 
          :class="{ 'has-unread': notifStore.hasUnread, 'shake': notifStore.hasUnread }"
          @click.stop="toggleNotifDropdown"
          title="Notificaciones"
        >
          <span class="material-symbols-outlined">notifications</span>
          <span v-if="notifStore.unreadCount > 0" class="notif-badge">
            {{ notifStore.unreadCount > 9 ? '9+' : notifStore.unreadCount }}
          </span>
        </button>

        <!-- Dropdown de Notificaciones -->
        <Transition name="dropdown">
          <div v-if="showNotifDropdown" class="notif-dropdown" @click.stop>
            <div class="notif-header">
              <h3>Notificaciones</h3>
              <button 
                v-if="notifStore.hasUnread" 
                class="mark-all-btn" 
                @click="handleMarkAllRead"
              >
                Marcar todas como leídas
              </button>
            </div>

            <div class="notif-list" v-if="notifStore.notifications.length > 0">
              <div 
                v-for="notif in notifStore.notifications" 
                :key="notif._id"
                class="notif-item"
                :class="{ 'unread': !notif.leido, 'resolved': notif.resuelta }"
              >
                <div class="notif-icon-col">
                  <span class="notif-type-icon">{{ getNotifIcon(notif.tipo) }}</span>
                </div>
                <div class="notif-content">
                  <p class="notif-msg">{{ notif.mensaje }}</p>
                  <span class="notif-time">{{ timeAgo(notif.createdAt) }}</span>
                </div>
                <div class="notif-actions-col">
                  <button 
                    v-if="!notif.leido"
                    class="notif-action-btn read" 
                    @click="handleMarkRead(notif._id)"
                    title="Marcar como leída"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                  <button 
                    v-if="notif.tipo === 'SEGUIMIENTO' && !notif.resuelta"
                    class="notif-action-btn resolve" 
                    @click="handleMarkResolved(notif._id)"
                    title="Marcar como resuelta"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Loading skeleton for notifications -->
            <div v-else-if="notifStore.isLoading" class="notif-list">
              <SkeletonLoader variant="notification" :count="4" />
            </div>

            <div v-else class="notif-empty">
              <span class="empty-icon">🔔</span>
              <p>No hay notificaciones</p>
            </div>
          </div>
        </Transition>
      </div>
      
      <div class="user-profile-wrapper">
        <div class="user-profile" @click.stop="toggleProfileMenu">
          <span class="user-name">{{ currentUser.name }}</span>
          <div class="user-avatar">
            <img :src="avatarUrl" :alt="currentUser.name">
          </div>
        </div>

        <!-- Dropdown de Perfil -->
        <Transition name="dropdown">
          <div v-if="showProfileMenu" class="profile-dropdown" @click.stop>
            <div class="dropdown-header">
              <p class="dropdown-user-name">{{ currentUser.name }}</p>
              <p class="dropdown-user-email">{{ currentUser.email || 'usuario@sena.edu.co' }}</p>
              <p class="dropdown-user-role">{{ userRole }}</p>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item">
              <span class="material-symbols-outlined">person</span>
              <span>Ver Perfil</span>
            </button>
            <button v-if="userRole === 'ADMIN'" class="dropdown-item" @click="handleChangePassword">
              <span class="material-symbols-outlined">key</span>
              <span>Cambiar Clave</span>
            </button>
            <button class="dropdown-item logout" @click="handleLogout">
              <span class="material-symbols-outlined">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* ── Notification Bell ── */
.notification-wrapper {
  position: relative;
}

.notification-bell {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #94A3B8;
}

.notification-bell:hover {
  background: #f1f5f9;
  color: #475569;
}

.notification-bell.has-unread {
  color: #1b5e20;
}

.notification-bell.has-unread .material-symbols-outlined {
  font-variation-settings: 'FILL' 1;
}

/* Badge rojo con número */
.notif-badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 18px;
  height: 18px;
  background: #dc2626;
  color: white;
  font-size: 0.6rem;
  font-weight: 800;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid white;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* Shake animation para la campanita */
.notification-bell.shake .material-symbols-outlined {
  animation: bellShake 4s ease-in-out infinite;
}

@keyframes bellShake {
  0%, 90%, 100% { transform: rotate(0); }
  92% { transform: rotate(12deg); }
  94% { transform: rotate(-10deg); }
  96% { transform: rotate(8deg); }
  98% { transform: rotate(-6deg); }
}

/* ── Notification Dropdown ── */
.notif-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: -60px;
  width: 380px;
  max-height: 480px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  z-index: 200;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.notif-header h3 {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.mark-all-btn {
  background: none;
  border: none;
  color: #1b5e20;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.mark-all-btn:hover {
  background: #f0fdf4;
}

/* Lista de notificaciones */
.notif-list {
  overflow-y: auto;
  max-height: 380px;
}

.notif-item {
  display: flex;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f8fafc;
  transition: all 0.2s ease;
  align-items: flex-start;
}

.notif-item:hover {
  background: #fafbfc;
}

.notif-item.unread {
  background: #f0fdf4;
  border-left: 3px solid #1b5e20;
}

.notif-item.unread:hover {
  background: #e8f7e1;
}

.notif-item.resolved {
  opacity: 0.55;
}

.notif-icon-col {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-item.unread .notif-icon-col {
  background: #dcfce7;
}

.notif-type-icon {
  font-size: 0.9rem;
  line-height: 1;
}

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-msg {
  font-size: 0.8rem;
  color: #334155;
  margin: 0 0 4px;
  line-height: 1.4;
  word-break: break-word;
}

.notif-item.unread .notif-msg {
  font-weight: 700;
  color: #1e293b;
}

.notif-time {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 600;
}

.notif-actions-col {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.notif-action-btn {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.notif-action-btn svg {
  width: 14px;
  height: 14px;
}

.notif-action-btn.read {
  color: #1b5e20;
}

.notif-action-btn.read:hover {
  background: #dcfce7;
  border-color: #86efac;
}

.notif-action-btn.resolve {
  color: #2563eb;
}

.notif-action-btn.resolve:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

/* Empty state */
.notif-empty {
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 8px;
  opacity: 0.4;
}

.notif-empty p {
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
}

/* ── Dropdown Transition ── */
.dropdown-enter-active {
  animation: dropdownIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-leave-active {
  animation: dropdownOut 0.15s ease-in;
}

@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes dropdownOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(-8px) scale(0.96); }
}

/* ── Profile Dropdown (existing, preserved) ── */
.user-profile-wrapper {
  position: relative;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 220px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  border: 1px solid #f1f5f9;
  padding: 0.5rem;
  z-index: 100;
}

.dropdown-header {
  padding: 0.75rem 1rem;
}

.dropdown-user-name {
  font-size: 0.8rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.dropdown-user-email {
  font-size: 0.65rem;
  color: #94a3b8;
  margin: 2px 0 0;
}

.dropdown-user-role {
  font-size: 0.6rem;
  color: #1b5e20;
  margin: 4px 0 0;
  font-weight: 800;
}

.dropdown-divider {
  height: 1px;
  background-color: #f1f5f9;
  margin: 0.5rem 0;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.dropdown-item .material-symbols-outlined {
  font-size: 1.2rem;
}

.dropdown-item:hover {
  background-color: #f8fafc;
  color: #2e7d32;
}

.dropdown-item.logout {
  color: #ef4444;
}

.dropdown-item.logout:hover {
  background-color: #fef2f2;
}

/* ── Header Responsive ── */
@media (max-width: 1024px) {
  .notif-dropdown {
    right: -20px;
    width: 340px;
  }
  .profile-dropdown {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .notif-dropdown {
    position: fixed;
    top: 52px;
    right: 8px;
    left: 8px;
    width: auto;
    max-height: 70vh;
    border-radius: 12px;
  }
  .profile-dropdown {
    position: fixed;
    top: 52px;
    right: 8px;
    width: 220px;
  }
}

@media (max-width: 480px) {
  .notif-dropdown {
    top: 48px;
    right: 4px;
    left: 4px;
    max-height: 65vh;
  }
  .notif-item {
    padding: 10px 14px;
    gap: 8px;
  }
  .notif-msg {
    font-size: 0.75rem;
  }
  .profile-dropdown {
    top: 48px;
    right: 4px;
  }
}
</style>
