<script setup>
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Bell, 
  Settings, 
  LogOut 
} from 'lucide-vue-next';

const menuItems = [
  { name: 'DASHBOARD', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'SEGUIMIENTO', icon: Users, path: '/seguimiento' },
  { name: 'BITÁCORAS', icon: FileText, path: '/bitacoras' },
  { name: 'NOVEDADES', icon: Bell, path: '/novedades' },
  { name: 'CONFIGURACIÓN', icon: Settings, path: '/configuracion' },
];
</script>

<template>
  <aside class="w-64 bg-white h-screen flex flex-col border-r border-gray-100 shrink-0">
    <!-- Logo Section -->
    <div class="p-6">
      <h1 class="text-xl font-bold text-gray-800 leading-tight">
        Gestión EP
      </h1>
      <p class="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
        Institutional Architect
      </p>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 space-y-2 mt-4">
      <router-link 
        v-for="item in menuItems" 
        :key="item.name"
        :to="item.path"
        v-slot="{ isActive }"
      >
        <div
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer',
            isActive 
              ? 'bg-sena-green text-white shadow-lg shadow-green-100' 
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          ]"
        >
          <component :is="item.icon" :size="18" />
          {{ item.name }}
        </div>
      </router-link>
    </nav>

    <!-- Logout -->
    <div class="p-6 border-t border-gray-50">
      <button class="flex items-center gap-3 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors w-full px-4">
        <LogOut :size="18" />
        CERRAR SESIÓN
      </button>
    </div>
  </aside>
</template>
