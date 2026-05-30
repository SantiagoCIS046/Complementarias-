<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../core/store/auth.store';
import AvatarDisplay from '../shared/AvatarDisplay.vue';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

// Reactive so it updates when photo changes
const currentUser  = computed(() => authStore.user);
const userRole        = computed(() => authStore.user?.role || 'APRENDIZ');
const tipoInstructor  = computed(() => authStore.tipoInstructor);

const handleItemClick = (item, navigate) => {
  if (item.path === '/certificacion' && userRole.value === 'APRENDIZ' && window.innerWidth <= 780) {
    if (route.path === '/mi-ep') {
      window.dispatchEvent(new CustomEvent('open-new-bitacora'));
    } else {
      router.push({ path: '/mi-ep', query: { openModal: '1' } });
    }
  } else {
    navigate();
  }
};

const menuItems = computed(() => {
  const role = userRole.value;
  const tipo = tipoInstructor.value;

  if (role === 'ADMIN') {
    return [
      { name: 'Gestión de Usuarios', icon: 'group', path: '/dashboard' },
      { name: 'Gestión de Empresas', icon: 'domain', path: '/gestion-empresas' },
      { name: 'Gestión de Fichas', icon: 'folder_open', path: '/fichas' },
      { name: 'Parámetros Formativos', icon: 'settings', path: '/configuraciones' },
      { name: 'Revisión de Documentos', icon: 'folder_shared', path: '/instructor-dashboard' },
      { name: 'Histórico de Pagos', icon: 'payments', path: '/historico-pagos' },
      { name: 'Plantillas Oficiales', icon: 'download', path: '/plantillas' },
    ];
  }

  if (role === 'INSTRUCTOR') {
    // --- RF-INS-26: Menú diferenciado por tipo de instructor ---

    if (tipo === 'TECNICO') {
      // Instructor Técnico: acceso de lectura al dashboard y a sus aprendices
      return [
        { name: 'Mis Aprendices', icon: 'people', path: '/instructor-dashboard' },
        { name: 'Seguimientos Técnicos', icon: 'engineering', path: '/seguimiento' },
        { name: 'Informe de Horas', icon: 'schedule', path: '/informe-horas' },
        { name: 'Histórico de Pagos', icon: 'payments', path: '/historico-pagos' },
        { name: 'Plantillas Oficiales', icon: 'download', path: '/plantillas' },
      ];
    }

    if (tipo === 'PROYECTO') {
      // Instructor de Proyecto: supervisa el proyecto productivo
      return [
        { name: 'Mis Aprendices', icon: 'people', path: '/instructor-dashboard' },
        { name: 'Certificación', icon: 'workspace_premium', path: '/certificacion' },
        { name: 'Informe de Horas', icon: 'schedule', path: '/informe-horas' },
        { name: 'Histórico de Pagos', icon: 'payments', path: '/historico-pagos' },
        { name: 'Plantillas Oficiales', icon: 'download', path: '/plantillas' },
      ];
    }

    // Por defecto (SEGUIMIENTO o sin tipo): menú completo del instructor
    return [
      { name: 'Dashboard', icon: 'dashboard', path: '/instructor-dashboard' },
      { name: 'Seguimientos', icon: 'assessment', path: '/seguimiento' },
      { name: 'Bitácoras', icon: 'description', path: '/bitacoras' },
      { name: 'Certificación', icon: 'workspace_premium', path: '/certificacion' },
      { name: 'Informe de Horas', icon: 'schedule', path: '/informe-horas' },
      { name: 'Histórico de Pagos', icon: 'payments', path: '/historico-pagos' },
      { name: 'Plantillas Oficiales', icon: 'download', path: '/plantillas' },
    ];
  }

  return [
    { name: 'Mi Etapa Productiva', icon: 'grid_view', path: '/mi-ep' },
    { name: 'Formalizar EP', icon: 'app_registration', path: '/registro-ep' },
    { name: 'Seguimientos Técnicos', icon: 'assessment', path: '/seguimiento-ep' },
    { name: 'Certificación Final', icon: 'workspace_premium', path: '/certificacion' },
    { name: 'Plantillas Oficiales', icon: 'download', path: '/plantillas' },
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
        v-slot="{ href, navigate, isActive }"
      >
        <a :href="href" @click.prevent="handleItemClick(item, navigate)" :class="['nav-item', { active: isActive }]">
          <span class="material-symbols-outlined">{{ item.icon }}</span> {{ item.name }}
        </a>
      </router-link>
    </nav>

    <!-- Sidebar Footer: mini user card + logout -->
    <div class="sidebar-footer">
      <router-link to="/perfil" class="sidebar-user-card">
        <AvatarDisplay :user="currentUser" size="sm" />
        <div class="sidebar-user-info">
          <span class="sidebar-user-name">{{ currentUser?.name?.split(' ')[0] }}</span>
          <span class="sidebar-user-role">{{ currentUser?.role }}</span>
        </div>
      </router-link>

      <button @click="handleLogout" class="nav-item logout-btn">
        <span class="material-symbols-outlined">logout</span> Cerrar Sesión
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* Los estilos globales del sidebar están en style.css */

/* ── Sidebar user card (foto de perfil en sidebar) ── */
.sidebar-user-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  border-radius: 12px;
  background: var(--bg-hover, rgba(255,255,255,0.05));
  border: 1px solid var(--border-primary, rgba(255,255,255,0.06));
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
}

.sidebar-user-card:hover {
  background: var(--bg-active, rgba(255,255,255,0.1));
  border-color: var(--color_button, #2e7d32);
}

.sidebar-user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.sidebar-user-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary, #fff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user-role {
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--color_button, #4ade80);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.sidebar-profile-icon {
  font-size: 1rem;
  color: var(--text-muted, #64748b);
  flex-shrink: 0;
}
</style>
