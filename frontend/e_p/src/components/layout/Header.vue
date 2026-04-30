<script setup>
import { Bell, HelpCircle } from 'lucide-vue-next';
</script>

<template>
  <header class="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
    <div class="flex items-center gap-8">
      <div class="text-sena-green font-bold text-xl tracking-tight">REPFORA</div>
      
      <nav class="hidden md:flex items-center gap-6">
        <router-link to="/dashboard" class="text-xs font-semibold text-sena-green border-b-2 border-sena-green pb-1">Etapa Productiva</router-link>
        <router-link to="/empresas" class="text-xs font-semibold text-gray-400 hover:text-gray-600">Empresas</router-link>
        <router-link to="/certificacion" class="text-xs font-semibold text-gray-400 hover:text-gray-600">Certificación</router-link>
      </nav>
    </div>

    <div class="flex items-center gap-4">
      <button class="p-2 text-gray-400 hover:text-gray-600 relative">
        <Bell :size="20" />
        <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
      </button>
      <button class="p-2 text-gray-400 hover:text-gray-600">
        <HelpCircle :size="20" />
      </button>
      <div class="flex items-center gap-3 ml-2 pl-4 border-l border-gray-100">
        <div class="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
          <img src="https://ui-avatars.com/api/?name=Instructor+SENA&background=39A900&color=fff" alt="Profile" />
        </div>
      </div>
    </div>
  </header>
</template>
