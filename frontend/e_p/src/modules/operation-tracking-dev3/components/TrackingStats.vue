<script setup>
import { Calendar, ClipboardList } from 'lucide-vue-next';
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-50 relative overflow-hidden group">
      <div class="space-y-4">
        <Calendar class="text-sena-green" :size="24" />
        <div>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Visitas Mes</p>
          <p class="text-2xl font-black text-gray-800">12</p>
        </div>
      </div>
      <Calendar class="absolute -bottom-4 -right-4 text-gray-50 w-24 h-24 group-hover:scale-110 transition-transform" />
    </div>

    <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-50 relative overflow-hidden group">
      <div class="space-y-4">
        <ClipboardList class="text-pink-500" :size="24" />
        <div>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pendiente Firma</p>
          <p class="text-2xl font-black text-gray-800">05</p>
        </div>
      </div>
      <ClipboardList class="absolute -bottom-4 -right-4 text-gray-50 w-24 h-24 group-hover:scale-110 transition-transform" />
    </div>

    <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-center group">
      <div class="space-y-4">
        <div class="relative w-20 h-20 mx-auto">
          <svg class="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r="35" stroke="currentColor" stroke-width="6" fill="transparent" class="text-gray-50" />
            <circle cx="40" cy="40" r="35" stroke="currentColor" stroke-width="6" fill="transparent" stroke-dasharray="220" stroke-dashoffset="220 - (220 * 68) / 100" class="text-sena-green" stroke-linecap="round" />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-xs font-black text-gray-800">68%</span>
          </div>
        </div>
        <div>
          <p class="text-[10px] font-bold text-gray-800 uppercase tracking-widest mb-1">Progreso Global</p>
          <p class="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Meta Visitas Trimestrales</p>
        </div>
      </div>
    </div>
  </div>
</template>
