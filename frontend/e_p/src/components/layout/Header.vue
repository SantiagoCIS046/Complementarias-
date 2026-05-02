<script setup>
import { computed } from 'vue';
import { Bell, HelpCircle, Search } from 'lucide-vue-next';
import { useAuthStore } from '../../core/store/auth.store';

const authStore = useAuthStore();
const currentUser = computed(() => authStore.user || { name: 'Usuario SENA' });
const userRole = computed(() => authStore.user?.role || 'Visitante');

const avatarUrl = computed(() => {
  const name = encodeURIComponent(currentUser.value.name);
  return `https://ui-avatars.com/api/?name=${name}&background=39A900&color=fff&bold=true`;
});
</script>

<template>
  <header class="main-header">
    <div class="header-left">
      <!-- Elementos de búsqueda y rol movidos al dashboard para mayor densidad -->
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
        <button class="icon-btn relative">
          <Bell :size="16" stroke-width="2.5" />
          <span class="notification-dot"></span>
        </button>
        <button class="icon-btn">
          <HelpCircle :size="16" stroke-width="2.5" />
        </button>
      </div>

      <!-- Perfil de Usuario -->
      <div class="user-profile">
        <div class="user-info">
          <span class="user-name">{{ currentUser.name }}</span>
          <span class="user-rank">SENA Instructor</span>
        </div>
        <div class="avatar-container">
          <img :src="avatarUrl" :alt="currentUser.name" class="avatar-img" />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.main-header {
  height: 48px; /* Ultra compact */
  background-color: #ffffff;
  border-bottom: 1px solid #f1f1f1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  position: sticky;
  top: 0;
  z-index: 50;
  font-family: 'Inter', sans-serif;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.role-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background-color: #f8fafc;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  border: 1px solid #f1f5f9;
}

.status-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background-color: #39A900;
}

.role-text {
  font-size: 0.55rem; /* Ultra small */
  font-weight: 900;
  color: #888888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.search-box {
  display: none;
  align-items: center;
  gap: 0.5rem;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  padding: 0.375rem 0.75rem;
  border-radius: 0.625rem;
  width: 200px;
}

@media (min-width: 1024px) {
  .search-box { display: flex; }
}

.search-icon {
  color: #cbd5e1;
}

.search-input {
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.65rem;
  font-weight: 700;
  color: #334155;
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.connection-status {
  text-align: right;
  display: none;
}

@media (min-width: 1280px) {
  .connection-status { display: block; }
}

.status-label {
  display: block;
  font-size: 0.5rem;
  font-weight: 800;
  color: #AAAAAA;
  margin-bottom: 0.125rem;
}

.status-value {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6rem;
  font-weight: 900;
  color: #1a1a1a;
  justify-content: flex-end;
}

.dot-online {
  width: 0.25rem;
  height: 0.25rem;
  background-color: #39A900;
  border-radius: 50%;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.icon-btn {
  padding: 0.375rem;
  background: transparent;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  border-radius: 0.5rem;
}

.icon-btn:hover {
  background-color: #f8fafc;
  color: #39A900;
}

.notification-dot {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  width: 0.375rem;
  height: 0.375rem;
  background-color: #ef4444;
  border-radius: 50%;
  border: 1.5px solid #ffffff;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-left: 1rem;
  border-left: 1px solid #F1F1F1;
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
  font-size: 0.65rem;
  font-weight: 900;
  color: #1a1a1a;
  line-height: 1;
}

.user-rank {
  font-size: 0.55rem;
  font-weight: 700;
  color: #AAAAAA;
  margin-top: 0.125rem;
}

.avatar-container {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: #f1f5f9;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
