<script setup>
import { MapPin } from 'lucide-vue-next';
</script>

<template>
  <div class="bg-green-50/50 border border-green-100 rounded-2xl p-6 relative group overflow-hidden">
    <div class="absolute top-4 right-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
      Hoy, 14:00
    </div>
    
    <div class="space-y-4">
      <div class="space-y-1">
        <p class="text-[10px] font-bold text-sena-green uppercase tracking-[0.2em]">Siguiente Visita</p>
        <h4 class="text-lg font-extrabold text-gray-800">Carolina Herrera</h4>
        <p class="text-xs text-gray-500 font-medium">TechSolutions S.A.S</p>
      </div>

      <div class="flex items-center gap-3">
        <button class="bg-sena-green text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-sena-green-dark transition-all active:scale-95">
          Ver Detalles
        </button>
        <button class="bg-white text-gray-600 px-4 py-2 border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2">
          <MapPin :size="12" />
          Ruta
        </button>
      </div>
    </div>

    <!-- Decorative Icon -->
    <MapPin class="absolute -bottom-4 -right-4 text-sena-green/5 w-24 h-24 rotate-12" />
  </div>
</template>
