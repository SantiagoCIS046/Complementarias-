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
  <header class="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-50">
    <div class="flex items-center gap-6">
      <!-- Badge de Rol Dinámico -->
      <div class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
        <div class="w-1.5 h-1.5 rounded-full bg-sena-green animate-pulse"></div>
        <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">{{ userRole }}</span>
      </div>

      <!-- Barra de búsqueda rápida (Opcional/Estética) -->
      <div class="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl w-64 group focus-within:border-sena-green transition-all">
        <Search class="text-slate-400 group-focus-within:text-sena-green transition-colors" :size="14" />
        <input type="text" placeholder="Buscar en el sistema..." class="bg-transparent border-none outline-none text-[11px] font-bold text-slate-600 placeholder:text-slate-300 w-full" />
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Notificaciones -->
      <div class="flex items-center gap-1 mr-2">
        <button class="p-2 text-slate-400 hover:text-sena-green hover:bg-green-50 rounded-xl transition-all relative">
          <Bell :size="18" stroke-width="2.5" />
          <span class="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
          <HelpCircle :size="18" stroke-width="2.5" />
        </button>
      </div>

      <!-- Perfil de Usuario -->
      <div class="flex items-center gap-3 pl-4 border-l border-slate-100">
        <div class="flex flex-col items-end hidden sm:flex">
          <span class="text-[11px] font-black text-slate-800 leading-none">{{ currentUser.name }}</span>
          <span class="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">SENA Regional</span>
        </div>
        <div class="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
          <img :src="avatarUrl" :alt="currentUser.name" class="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Transición suave para el avatar */
img {
  transition: transform 0.3s ease;
}
img:hover {
  transform: scale(1.1);
}
</style>
