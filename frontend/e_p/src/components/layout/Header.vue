<script setup>
import { ref, computed } from 'vue';
import { Bell, HelpCircle, Search, LogOut, User as UserIcon } from 'lucide-vue-next';
import { useAuthStore } from '../../core/store/auth.store';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const currentUser = computed(() => authStore.user || { name: 'Usuario SENA' });
const userRole = computed(() => authStore.user?.role || 'Visitante');

const showProfileMenu = ref(false);

const avatarUrl = computed(() => {
  const name = encodeURIComponent(currentUser.value.name);
  return `https://ui-avatars.com/api/?name=${name}&background=2e7d32&color=fff&bold=true`;
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const handleNotifications = () => {
  alert('No tienes notificaciones pendientes.');
};

const handleHelp = () => {
  alert('Centro de ayuda REPFORA: Próximamente disponible.');
};

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value;
};
</script>

<template>
  <header class="main-header">
    <div class="w-full max-w-[1400px] mx-auto flex items-center justify-between px-4 md:px-12">
      <div class="header-left">
        <div class="search-box">
          <Search class="search-icon" :size="14" />
          <input type="text" placeholder="Buscar entregas, fichas o aprendices..." class="search-input" />
        </div>
      </div>

      <div class="header-right">
        <!-- Estado de Conexión -->
        <div class="connection-status">
          <span class="status-label">ESTADO</span>
          <div class="status-value">
            <div class="dot-online"></div>
            En Línea
          </div>
        </div>

        <!-- Notificaciones -->
        <div class="actions-group">
          <button class="icon-btn relative" @click="handleNotifications">
            <Bell :size="16" stroke-width="2.5" />
            <span class="notification-dot"></span>
          </button>
          <button class="icon-btn" @click="handleHelp">
            <HelpCircle :size="16" stroke-width="2.5" />
          </button>
        </div>

        <!-- Perfil de Usuario -->
        <div class="user-profile-wrapper">
          <div class="user-profile" @click="toggleProfileMenu">
            <div class="user-info">
              <span class="user-name">{{ currentUser.name }}</span>
              <span class="user-rank">SENA {{ userRole }}</span>
            </div>
            <div class="avatar-container">
              <img :src="avatarUrl" :alt="currentUser.name" class="avatar-img" />
            </div>
          </div>

          <!-- Dropdown de Perfil -->
          <div v-if="showProfileMenu" class="profile-dropdown">
            <div class="dropdown-header">
              <p class="dropdown-user-name">{{ currentUser.name }}</p>
              <p class="dropdown-user-email">{{ currentUser.email || 'usuario@sena.edu.co' }}</p>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item">
              <UserIcon :size="14" />
              <span>Ver Perfil</span>
            </button>
            <button class="dropdown-item logout" @click="handleLogout">
              <LogOut :size="14" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.main-header {
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #f1f1f1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: 'Inter', sans-serif;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.875rem;
  border-radius: 10px;
  width: 320px;
  transition: all 0.2s;
}

.search-box:focus-within {
  background-color: #ffffff;
  border-color: #2e7d32;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.05);
}

.search-icon {
  color: #94a3b8;
}

.search-input {
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.75rem;
  font-weight: 500;
  color: #1e293b;
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.connection-status {
  text-align: right;
  display: none;
}

@media (min-width: 1024px) {
  .connection-status { display: block; }
}

.status-label {
  display: block;
  font-size: 0.55rem;
  font-weight: 800;
  color: #94a3b8;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-value {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-weight: 800;
  color: #1e293b;
}

.dot-online {
  width: 6px;
  height: 6px;
  background-color: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background-color: #f1f5f9;
  color: #2e7d32;
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background-color: #ef4444;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.user-profile-wrapper {
  position: relative;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 4px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-profile:hover {
  background-color: #f8fafc;
}

.user-info {
  display: none;
  flex-direction: column;
  align-items: flex-end;
}

@media (min-width: 640px) {
  .user-info { display: flex; }
}

.user-name {
  font-size: 0.75rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.2;
}

.user-rank {
  font-size: 0.6rem;
  font-weight: 600;
  color: #94a3b8;
}

.avatar-container {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f1f5f9;
  border: 2px solid #f1f5f9;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  animation: dropdownIn 0.2s ease-out;
}

@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
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
</style>
