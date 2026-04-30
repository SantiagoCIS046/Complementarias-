<script setup>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const days = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
const dates = [
  { day: 30, outside: true }, { day: 31, outside: true }, 
  { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 },
  { day: 6 }, { day: 7 }, { day: 8, active: true }, { day: 9 }, { day: 10, dot: 'pink' }, { day: 11 }, { day: 12 },
  { day: 13 }, { day: 14 }, { day: 15, dot: 'green' }, { day: 16 }, { day: 17 }, { day: 18 }, { day: 19 }
];
</script>

<template>
  <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-50">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-sm font-bold text-gray-700">Noviembre 2023</h3>
      <div class="flex items-center gap-2">
        <button class="p-1 text-gray-400 hover:text-gray-600"><ChevronLeft :size="18" /></button>
        <button class="p-1 text-gray-400 hover:text-gray-600"><ChevronRight :size="18" /></button>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-y-4 text-center">
      <div v-for="day in days" :key="day" class="text-[10px] font-bold text-gray-300 uppercase tracking-widest pb-4">
        {{ day }}
      </div>
      
      <div 
        v-for="(date, index) in dates" 
        :key="index"
        :class="[
          'relative py-3 text-xs font-bold transition-all cursor-pointer rounded-xl',
          date.outside ? 'text-gray-200' : 'text-gray-500 hover:bg-gray-50',
          date.active ? 'bg-sena-green text-white shadow-lg shadow-green-100 hover:bg-sena-green-dark' : ''
        ]"
      >
        {{ date.day }}
        <div v-if="date.dot" :class="['absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full', date.dot === 'pink' ? 'bg-pink-400' : 'bg-sena-green']"></div>
      </div>
    </div>
  </div>
</template>
