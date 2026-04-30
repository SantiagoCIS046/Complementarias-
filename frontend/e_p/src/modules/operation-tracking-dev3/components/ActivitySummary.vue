<script setup>
const summaries = [
  { label: 'Aprendices Activos', value: '24', color: 'text-sena-green' },
  { label: 'Novedades Pendientes', value: '03', color: 'text-pink-500' },
];
</script>

<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Resumen de Actividad</h3>
    <div class="grid grid-cols-2 gap-4">
      <div 
        v-for="item in summaries" 
        :key="item.label"
        class="bg-white p-5 rounded-2xl shadow-sm border border-gray-50"
      >
        <p :class="['text-3xl font-bold mb-1', item.color]">{{ item.value }}</p>
        <p class="text-[10px] font-bold text-gray-500 uppercase leading-tight">{{ item.label }}</p>
      </div>
    </div>
  </div>
</template>
