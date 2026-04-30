<script setup>
import { MoreHorizontal } from 'lucide-vue-next';

const resolutions = [
  { 
    id: '#NOV-9021', 
    date: 'Oct 12, 2023', 
    apprentice: 'Andrés Mendoza', 
    initials: 'AM',
    type: 'Indisciplina', 
    status: 'Resuelto',
    statusColor: 'text-sena-green',
    statusBg: 'bg-sena-green/10'
  },
  { 
    id: '#NOV-8945', 
    date: 'Oct 15, 2023', 
    apprentice: 'Laura Carrillo', 
    initials: 'LC',
    type: 'Deserción', 
    status: 'En Revisión',
    statusColor: 'text-pink-500',
    statusBg: 'bg-pink-50'
  },
  { 
    id: '#NOV-8712', 
    date: 'Oct 08, 2023', 
    apprentice: 'Jorge Pulido', 
    initials: 'JP',
    type: 'Médico', 
    status: 'Rechazado',
    statusColor: 'text-red-500',
    statusBg: 'bg-red-50'
  },
];
</script>

<template>
  <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-50">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wide">Historial de Resoluciones</h3>
      <button class="text-[10px] font-bold text-sena-green uppercase tracking-widest hover:underline">Ver Todo</button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-50">
            <th class="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID / Fecha</th>
            <th class="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aprendiz</th>
            <th class="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo</th>
            <th class="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</th>
            <th class="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Acción</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="item in resolutions" :key="item.id" class="group hover:bg-gray-50/50 transition-colors">
            <td class="py-5">
              <p class="text-sm font-bold text-gray-800">{{ item.id }}</p>
              <p class="text-[10px] font-medium text-gray-400">{{ item.date }}</p>
            </td>
            <td class="py-5">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                  {{ item.initials }}
                </div>
                <span class="text-xs font-bold text-gray-700">{{ item.apprentice }}</span>
              </div>
            </td>
            <td class="py-5">
              <span class="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold">
                {{ item.type }}
              </span>
            </td>
            <td class="py-5">
              <div class="flex items-center gap-2">
                <span :class="['w-2 h-2 rounded-full', item.statusColor.replace('text', 'bg')]"></span>
                <span :class="['text-[10px] font-bold', item.statusColor]">{{ item.status }}</span>
              </div>
            </td>
            <td class="py-5 text-right">
              <button class="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                <MoreHorizontal :size="18" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
