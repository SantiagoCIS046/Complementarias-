<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../../core/store/auth.store';
import { useNotificationsStore } from '../../core/store/notifications.store';
import { useRouter, useRoute } from 'vue-router';
import { useAlert } from '../../core/composables/useAlert';
import { useThemeStore } from '../../core/store/theme.store';
import SkeletonLoader from '../ui/SkeletonLoader.vue';
import { usersService } from '../../modules/admin-auth-dev1/services/users.service';

const props = defineProps({
  title: {
    type: String,
    default: 'Dashboard'
  }
});

const authStore = useAuthStore();
const notifStore = useNotificationsStore();
const themeStore = useThemeStore();
const router = useRouter();
const route = useRoute();
const { showInfo } = useAlert();

const breadcrumbs = computed(() => {
  const pathArray = route.path.split('/').filter(p => p);
  const crumbs = [{ label: 'Inicio', path: '/' }];
  
  let currentPath = '';
  pathArray.forEach((segment) => {
    currentPath += `/${segment}`;
    
    // Mapear segmentos a nombres amigables en español
    let label = segment;
    if (segment === 'dashboard') label = 'Gestión de Usuarios';
    else if (segment === 'gestion-empresas') label = 'Empresas';
    else if (segment === 'fichas') label = 'Fichas';
    else if (segment === 'configuraciones') label = 'Configuración Global';
    else if (segment === 'instructor-dashboard') label = 'Tablero del Instructor';
    else if (segment === 'seguimiento') label = 'Seguimiento';
    else if (segment === 'bitacoras') label = 'Revisión de Bitácoras';
    else if (segment === 'certificacion') label = 'Certificaciones';
    else if (segment === 'informe-horas') label = 'Informe de Horas';
    else if (segment === 'historico-pagos') label = 'Histórico de Pagos';
    else if (segment === 'mi-ep') label = 'Mi Etapa Productiva';
    else if (segment === 'registro-ep') label = 'Formalizar EP';
    else if (segment === 'seguimiento-ep') label = 'Seguimiento Técnico';
    else if (segment === 'perfil') label = 'Mi Perfil';
    
    crumbs.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      path: currentPath
    });
  });
  
  if (route.name === 'Login') return [];
  
  return crumbs;
});

const currentUser = computed(() => authStore.user || { name: 'Usuario SENA', email: 'usuario@sena.edu.co' });
const userRole = computed(() => authStore.user?.role || 'Visitante');

const showProfileMenu = ref(false);
const showNotifDropdown = ref(false);
const showQuickEdit = ref(false);

const quickEditData = ref({
  name: '',
  email: '',
  telefono: ''
});

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

const handleNotificationClick = async (notif) => {
  if (!notif.leido) {
    await notifStore.markAsRead(notif._id);
  }
  showNotifDropdown.value = false;

  if (notif.referenciaModelo === 'ProductiveStage' && notif.referencia) {
    if (userRole.value === 'APRENDIZ') {
      router.push({ path: '/seguimiento-ep', query: { openChat: 'true' } });
    } else if (userRole.value === 'INSTRUCTOR' || userRole.value === 'ADMIN') {
      router.push({ path: '/bitacoras', query: { id: notif.referencia, openChat: 'true' } });
    }
  }
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
  router.push('/cambiar-clave');
};

const handleViewProfile = () => {
  showProfileMenu.value = false;
  router.push('/perfil');
};

const handleSaveQuickEdit = async () => {
  try {
    const response = await usersService.update(currentUser.value._id, quickEditData.value);
    if (response.data.success) {
      authStore.updateUser(response.data.data);
      showQuickEdit.value = false;
    }
  } catch (err) {
    console.error('Error al actualizar perfil rápido:', err);
    alert('Error al actualizar el perfil.');
  }
};
</script>

<template>
  <header class="topbar">
    <slot name="title-area">
      <div class="header-title-container">
        <h2 class="page-title">{{ title }}</h2>
        <!-- Migas de pan (Breadcrumbs) (RUI-02) -->
        <nav class="breadcrumbs" v-if="breadcrumbs.length > 0">
          <span v-for="(crumb, index) in breadcrumbs" :key="index" class="crumb-item">
            <router-link :to="crumb.path" class="crumb-link">{{ crumb.label }}</router-link>
            <span v-if="index < breadcrumbs.length - 1" class="crumb-separator">/</span>
          </span>
        </nav>
      </div>
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
                <div class="notif-content" @click="handleNotificationClick(notif)" style="cursor: pointer;">
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
            <div v-if="!showQuickEdit">
              <div class="dropdown-header">
                <p class="dropdown-user-name">{{ currentUser.name }}</p>
                <p class="dropdown-user-email">{{ currentUser.email || 'usuario@sena.edu.co' }}</p>
                <p class="dropdown-user-role">{{ userRole }}</p>
              </div>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" @click="handleViewProfile">
                <span class="material-symbols-outlined">person</span>
                <span>Ver Perfil</span>
              </button>
              <button class="dropdown-item" @click="handleChangePassword">
                <span class="material-symbols-outlined">key</span>
                <span>Cambiar Clave</span>
              </button>
              
              <div class="dropdown-divider"></div>
              
              <div class="dropdown-item theme-toggle-item" @click.stop="themeStore.toggleTheme">
                <span class="material-symbols-outlined theme-icon" :class="{ 'rotate-animation': themeStore.isDark }">
                  {{ themeStore.isDark ? 'light_mode' : 'dark_mode' }}
                </span>
                <span>Modo Oscuro</span>
                <div class="theme-switch-wrapper" :class="{ 'active': themeStore.isDark }">
                  <span class="theme-switch-thumb" :class="{ 'active': themeStore.isDark }"></span>
                </div>
              </div>
              
              <div class="dropdown-divider"></div>
              
              <div class="dropdown-footer">
                <button class="dropdown-item logout-btn" @click="handleLogout">
                  <span class="material-symbols-outlined">logout</span>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
            
            <!-- Formulario de Edición Rápida -->
            <div v-else class="quick-edit-container">
              <div class="edit-header">
                <button class="back-btn" @click="showQuickEdit = false">
                  <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <h3>Editar Perfil</h3>
              </div>
              
              <div class="quick-edit-body">
                <div class="quick-field">
                  <label>Nombre</label>
                  <input v-model="quickEditData.name" type="text" placeholder="Tu nombre" />
                </div>
                <div class="quick-field">
                  <label>Correo</label>
                  <input v-model="quickEditData.email" type="email" placeholder="tu@correo.com" />
                </div>
                <div class="quick-field">
                  <label>Teléfono</label>
                  <input v-model="quickEditData.telefono" type="text" placeholder="Tu teléfono" />
                </div>
              </div>
              
              <div class="quick-edit-footer">
                <button class="save-btn" @click="handleSaveQuickEdit">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* ── Breadcrumbs ── */
.header-title-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: var(--text-muted);
}
.crumb-link {
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 650;
  transition: color 0.2s;
}
.crumb-link:hover {
  color: var(--color_button);
}
.crumb-separator {
  margin-left: 6px;
  color: var(--border-primary);
  font-weight: 400;
}

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
  color: var(--text-muted);
}

.notification-bell:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.notification-bell.has-unread {
  color: var(--color_button);
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
  background: var(--bg-elevated);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-primary);
  overflow: hidden;
  z-index: 200;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-primary);
}

.notif-header h3 {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.mark-all-btn {
  background: none;
  border: none;
  color: var(--color_button);
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.mark-all-btn:hover {
  background: var(--bg-hover);
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
  border-bottom: 1px solid var(--border-secondary);
  transition: all 0.2s ease;
  align-items: flex-start;
  background: transparent;
}

.notif-item:hover {
  background: var(--bg-hover);
}

.notif-item.unread {
  background: var(--bg-active);
  border-left: 3px solid var(--color_button);
}

.notif-item.unread:hover {
  background: var(--bg-hover);
}

.notif-item.resolved {
  opacity: 0.55;
}

.notif-icon-col {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-item.unread .notif-icon-col {
  background: var(--bg-active);
  border: 1px solid var(--border-primary);
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
  color: var(--text-secondary);
  margin: 0 0 4px;
  line-height: 1.4;
  word-break: break-word;
}

.notif-item.unread .notif-msg {
  font-weight: 700;
  color: var(--text-primary);
}

.notif-time {
  font-size: 0.65rem;
  color: var(--text-muted);
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
  top: calc(100% + 12px);
  right: 0;
  width: 260px;
  background: var(--bg-elevated);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-primary);
  padding: 0.75rem;
  z-index: 100;
}

.dropdown-header {
  padding: 0.75rem 1rem;
}

.dropdown-user-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.dropdown-user-email {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 2px 0 0;
}

.dropdown-user-role {
  font-size: 0.7rem;
  color: var(--color_button);
  margin: 6px 0 0;
  font-weight: 800;
  text-transform: uppercase;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-primary);
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
  color: var(--text-secondary);
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
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

/* iOS Toggle switch styling inside dropdown */
.theme-toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
}

.theme-toggle-item span:nth-child(2) {
  flex-grow: 1;
  text-align: left;
}

.theme-icon {
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.3s;
}

.theme-icon.rotate-animation {
  transform: rotate(360deg);
  color: #eab308 !important;
}

.theme-toggle-item:hover .theme-icon {
  transform: rotate(180deg);
}

.theme-toggle-item:hover .theme-icon.rotate-animation {
  transform: rotate(540deg);
}

.theme-switch-wrapper {
  width: 34px;
  height: 18px;
  background-color: var(--scrollbar-thumb);
  border-radius: 9999px;
  position: relative;
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.theme-switch-wrapper.active {
  background-color: var(--color_button);
}

.theme-switch-thumb {
  width: 14px;
  height: 14px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.theme-switch-thumb.active {
  transform: translateX(16px);
}

.dropdown-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.dropdown-footer {
  padding: 0.5rem;
  margin-top: 0.5rem;
}

.logout-btn {
  background-color: rgba(239, 68, 68, 0.1) !important;
  color: #ef4444 !important;
  border-radius: 12px !important;
  justify-content: center;
  font-weight: 700;
}

.logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.2) !important;
  filter: brightness(1.05);
}

.logout-btn .material-symbols-outlined {
  font-size: 1.3rem;
}

/* ── Quick Edit Styles ── */
.quick-edit-container {
  padding: 0.5rem;
}

.edit-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.edit-header h3 {
  font-size: 0.9rem;
  font-weight: 800;
  margin: 0;
  color: var(--text-primary);
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  color: var(--text-secondary);
}

.back-btn:hover {
  background: var(--bg-hover);
}

.quick-edit-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quick-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.quick-field label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.quick-field input {
  padding: 8px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.quick-field input:focus {
  outline: none;
  border-color: var(--color_button);
  background: var(--bg-elevated);
}

.quick-edit-footer {
  margin-top: 1.25rem;
}

.save-btn {
  width: 100%;
  padding: 10px;
  background: var(--color_button);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #1b5e20;
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

@media (max-width: 780px) {
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
