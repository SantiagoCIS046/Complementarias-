<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../core/store/auth.store';

const authStore = useAuthStore();
const router = useRouter();

const userRole = computed(() => authStore.user?.role || 'APRENDIZ');

const menuItems = computed(() => {
  const role = userRole.value;

  if (role === 'ADMIN') {
    return [
      { name: 'Gestión de Usuarios', icon: 'group', path: '/dashboard' },
      { name: 'Gestión de Empresas', icon: 'domain', path: '/gestion-empresas' },
      { name: 'Gestión de Fichas', icon: 'folder_open', path: '/fichas' },
      { name: 'Parámetros Formativos', icon: 'settings', path: '/configuraciones' },
      { name: 'Revisión de Documentos', icon: 'folder_shared', path: '/instructor-dashboard' },
      { name: 'Histórico de Pagos', icon: 'payments', path: '/historico-pagos' },
    ];
  }

  if (role === 'INSTRUCTOR') {
    return [
      { name: 'Dashboard', icon: 'dashboard', path: '/instructor-dashboard' },
      { name: 'Seguimientos', icon: 'assessment', path: '/seguimiento' },
      { name: 'Bitácoras', icon: 'description', path: '/bitacoras' },
      { name: 'Certificación', icon: 'workspace_premium', path: '/certificacion' },
      { name: 'Informe de Horas', icon: 'schedule', path: '/informe-horas' },
      { name: 'Histórico de Pagos', icon: 'payments', path: '/historico-pagos' },
    ];
  }

  return [
    { name: 'Mi Etapa Productiva', icon: 'grid_view', path: '/mi-ep' },
    { name: 'Formalizar EP', icon: 'app_registration', path: '/registro-ep' },
    { name: 'Seguimientos Técnicos', icon: 'assessment', path: '/seguimiento-ep' },
    { name: 'Certificación Final', icon: 'workspace_premium', path: '/certificacion' }
  ];
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo-icon">
        <img src="/logoSena.png" alt="SENA Logo" class="sena-logo-img">
      </div>
      <div class="logo-text">
        <span class="title">Administración Académica</span>
        <span class="subtitle">DIVISIÓN REGIONAL</span>
      </div>
    </div>
    
    <nav class="sidebar-nav">
      <router-link 
        v-for="item in menuItems" 
        :key="item.name" 
        :to="item.path" 
        custom 
        v-slot="{ navigate, isActive }"
      >
        <button @click="navigate" :class="['nav-item', { active: isActive }]">
          <span class="material-symbols-outlined">{{ item.icon }}</span> {{ item.name }}
        </button>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <button @click="handleLogout" class="nav-item logout-btn">
        <span class="material-symbols-outlined">logout</span> Cerrar Sesión
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* Los estilos del sidebar se han movido globalmente a style.css */
</style>
