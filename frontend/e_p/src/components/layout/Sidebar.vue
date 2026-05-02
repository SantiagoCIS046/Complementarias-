<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  LayoutDashboard, 
  BarChart2,
  FileText, 
  AlertTriangle,
  Settings, 
  LogOut,
  ShieldCheck,
  GraduationCap
} from 'lucide-vue-next';
import { useAuthStore } from '../../core/store/auth.store';

const authStore = useAuthStore();
const router = useRouter();

const userRole = computed(() => authStore.user?.role || 'APRENDIZ');

const menuItems = computed(() => {
  const role = userRole.value;

  if (role === 'ADMIN') {
    return [
      { name: 'USUARIOS', icon: ShieldCheck, path: '/usuarios' },
      { name: 'CONFIG', icon: Settings, path: '/configuracion' },
    ];
  }

  if (role === 'INSTRUCTOR') {
    return [
      { name: 'DASHBOARD', icon: LayoutDashboard, path: '/instructor-dashboard' },
      { name: 'SEGUIMIENTO', icon: BarChart2, path: '/seguimiento' },
      { name: 'BITÁCORAS', icon: FileText, path: '/bitacoras' },
      { name: 'NOVEDADES', icon: AlertTriangle, path: '/novedades' },
      { name: 'CERTIFICACIÓN', icon: FileText, path: '/certificacion' },
      { name: 'AJUSTES', icon: Settings, path: '/configuracion' },
    ];
  }

  return [
    { name: 'MI ETAPA', icon: GraduationCap, path: '/dashboard-ep' },
    { name: 'BITÁCORAS', icon: FileText, path: '/bitacoras' },
  ];
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <aside class="sidebar">
    <!-- Logo Section - ULTRA COMPACT -->
    <div class="sidebar-header">
      <div class="logo-box">
        <div class="logo-icon">
          <span class="logo-r">R</span>
        </div>
        <div class="logo-text-group">
          <h1 class="logo-main">REPFORA</h1>
          <p class="logo-sub">Portal</p>
        </div>
      </div>
    </div>

    <!-- Navigation - ULTRA DENSE -->
    <nav class="sidebar-nav">
      <router-link 
        v-for="item in menuItems" 
        :key="item.name"
        :to="item.path"
        v-slot="{ isActive }"
        class="nav-link"
      >
        <div :class="['nav-item', { 'active': isActive }]">
          <component :is="item.icon" class="nav-icon" :size="14" stroke-width="2.5" />
          <span class="nav-text">{{ item.name }}</span>
        </div>
      </router-link>
    </nav>

    <!-- Logout - ULTRA DENSE -->
    <div class="sidebar-footer">
      <button @click="handleLogout" class="btn-logout">
        <LogOut class="nav-icon" :size="14" stroke-width="2.5" />
        <span class="nav-text">CERRAR SESIÓN</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 170px; /* Ultra small width */
  background-color: #ffffff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f1f1f1;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
}

.sidebar-header {
  padding: 1.25rem 1rem;
}

.logo-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  width: 1.75rem;
  height: 1.75rem;
  background-color: #39A900;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-r {
  color: #ffffff;
  font-weight: 900;
  font-size: 0.875rem;
}

.logo-text-group {
  display: flex;
  flex-direction: column;
}

.logo-main {
  font-size: 0.875rem;
  font-weight: 900;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1;
}

.logo-sub {
  font-size: 0.5rem;
  font-weight: 800;
  color: #AAAAAA;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.125rem;
}

.sidebar-nav {
  flex: 1;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.nav-link {
  text-decoration: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
  color: #888888;
}

.nav-item:hover {
  background-color: #f8fafc;
  color: #1a1a1a;
}

.nav-item.active {
  background-color: #39A900;
  color: #ffffff;
}

.nav-icon {
  flex-shrink: 0;
}

.nav-text {
  font-size: 0.55rem; /* Ultra small text */
  font-weight: 800;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.sidebar-footer {
  padding: 0.75rem 0.5rem;
  border-top: 1px solid #f1f1f1;
}

.btn-logout {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: #888888;
  cursor: pointer;
}

.btn-logout:hover {
  background-color: #FFF5F5;
  color: #C62828;
}
</style>
