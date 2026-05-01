<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Bell, 
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
      { name: 'GUSTIÓN USUARIOS', icon: ShieldCheck, path: '/usuarios' },
      { name: 'CONFIGURACIÓN', icon: Settings, path: '/configuracion' },
    ];
  }

  if (role === 'INSTRUCTOR') {
    return [
      { name: 'TABLERO', icon: LayoutDashboard, path: '/instructor-dashboard' },
      { name: 'SEGUIMIENTO', icon: Users, path: '/seguimiento' },
      { name: 'BITÁCORAS', icon: FileText, path: '/bitacoras' },
    ];
  }

  // APRENDIZ (DEV 2)
  return [
    { name: 'MI ETAPA', icon: GraduationCap, path: '/dashboard-ep' },
    { name: 'MIS BITÁCORAS', icon: FileText, path: '/bitacoras' },
  ];
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <aside class="w-56 bg-white h-screen flex flex-col border-r border-gray-100 shrink-0">
    <!-- Logo Section -->
    <div class="p-5">
      <div class="flex items-center gap-2 mb-1">
        <div class="w-6 h-6 bg-sena-green rounded-lg flex items-center justify-center">
          <span class="text-white font-black text-[10px]">R</span>
        </div>
        <h1 class="text-lg font-black text-slate-800 leading-tight tracking-tighter">
          REPFORA
        </h1>
      </div>
      <p class="text-[9px] text-slate-400 font-bold tracking-wider uppercase">
        Gestión Académica
      </p>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 space-y-1.5 mt-4">
      <router-link 
        v-for="item in menuItems" 
        :key="item.name"
        :to="item.path"
        v-slot="{ isActive }"
      >
        <div
          :class="[
            'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-300 cursor-pointer',
            isActive 
              ? 'bg-sena-green text-white shadow-lg shadow-green-100 translate-x-1' 
              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
          ]"
        >
          <component :is="item.icon" :size="16" stroke-width="2.5" />
          {{ item.name }}
        </div>
      </router-link>
    </nav>

    <!-- Logout -->
    <div class="p-5 border-t border-slate-50">
      <button 
        @click="handleLogout"
        class="flex items-center gap-3 text-[11px] font-bold text-slate-400 hover:text-red-500 transition-all duration-300 w-full px-3.5 py-2 hover:bg-red-50 rounded-xl"
      >
        <LogOut :size="16" stroke-width="2.5" />
        CERRAR SESIÓN
      </button>
    </div>
  </aside>
</template>

<style scoped>
.router-link-active div {
  transform: translateX(4px);
}
</style>
