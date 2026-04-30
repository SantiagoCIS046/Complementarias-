<script setup>
import { Clock, AlertTriangle } from 'lucide-vue-next';

const props = defineProps({
  hours: { type: Number, default: 168 },
  limit: { type: Number, default: 160 },
});

const percentage = Math.min((props.hours / props.limit) * 100, 100);
const excess = props.hours > props.limit ? props.hours - props.limit : 0;
</script>

<template>
  <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 flex flex-col h-full">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wide">Monitor de Horas</h3>
      <div class="p-2 bg-sena-green/10 rounded-full">
        <Clock class="text-sena-green" :size="18" />
      </div>
    </div>

    <!-- Progress Circle -->
    <div class="relative flex items-center justify-center mb-8">
      <svg class="w-40 h-40 transform -rotate-90">
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="currentColor"
          stroke-width="12"
          fill="transparent"
          class="text-gray-100"
        />
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="currentColor"
          stroke-width="12"
          fill="transparent"
          :stroke-dasharray="440"
          :stroke-dashoffset="440 - (440 * percentage) / 100"
          class="text-sena-green transition-all duration-1000 ease-out"
          stroke-linecap="round"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span class="text-3xl font-bold text-gray-800">{{ hours }}</span>
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Horas</span>
      </div>
    </div>

    <!-- Alert Box -->
    <div v-if="excess > 0" class="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center justify-between">
      <div>
        <p class="text-[10px] font-bold text-red-400 uppercase tracking-wider">Exceso Reportado</p>
        <p class="text-lg font-bold text-red-600">+{{ excess }} Horas Extra</p>
      </div>
      <AlertTriangle class="text-red-500" :size="24" />
    </div>

    <!-- Limit Info -->
    <div class="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
      <span class="text-xs font-semibold text-gray-400">Límite Mensual</span>
      <span class="text-xs font-bold text-gray-800">{{ limit }} Horas</span>
    </div>
    <div class="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
      <div class="bg-red-500 h-full w-full"></div>
    </div>
  </div>
</template>
