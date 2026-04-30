<script setup>
import { Search, Filter, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-vue-next';

const trackings = [
  {
    apprentice: 'Carlos Arturo Peña',
    ficha: '2560341',
    company: 'Bancolombia S.A.',
    program: 'Nov 17, 2023',
    visit: 'VISITA 1 DE 3',
    signatureStatus: 'FIRMADO',
    paymentStatus: 'PAGADO'
  },
  {
    apprentice: 'Valentina Ruiz',
    ficha: '2563141',
    company: 'Globant Colombia',
    program: 'Nov 15, 2023',
    visit: 'VISITA 2 DE 3',
    signatureStatus: 'PENDIENTE',
    paymentStatus: 'NO PAGADO'
  },
  {
    apprentice: 'Mateo Jiménez',
    ficha: '2589032',
    company: 'Sura Seguros',
    program: 'Pendiente',
    visit: 'VISITA 3 DE 3',
    signatureStatus: 'FIRMADO',
    paymentStatus: 'NO PAGADO'
  },
  {
    apprentice: 'Isabel García',
    ficha: '2563341',
    company: 'Nutresa',
    program: 'Dic 02, 2023',
    visit: 'VISITA 1 DE 3',
    signatureStatus: 'PENDIENTE',
    paymentStatus: 'NO PAGADO'
  }
];
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden flex flex-col h-full">
    <div class="p-8 flex items-center justify-between border-b border-gray-50">
      <h3 class="text-sm font-bold text-gray-700">Listado de Seguimiento</h3>
      <div class="flex items-center gap-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="14" />
          <input 
            type="text" 
            placeholder="Buscar aprendiz..." 
            class="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-sena-green/20 w-64"
          />
        </div>
        <button class="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors">
          <Filter :size="16" />
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="bg-gray-50/30">
            <th class="px-8 py-4 text-[10px] font-bold text-gray-300 uppercase tracking-wider">Aprendiz</th>
            <th class="px-8 py-4 text-[10px] font-bold text-gray-300 uppercase tracking-wider">Empresa</th>
            <th class="px-8 py-4 text-[10px] font-bold text-gray-300 uppercase tracking-wider">Programación</th>
            <th class="px-8 py-4 text-[10px] font-bold text-gray-300 uppercase tracking-wider text-center">Estado Firma</th>
            <th class="px-8 py-4 text-[10px] font-bold text-gray-300 uppercase tracking-wider text-center">Estado Pago</th>
            <th class="px-8 py-4 text-right"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="row in trackings" :key="row.apprentice" class="hover:bg-gray-50/50 transition-colors group">
            <td class="px-8 py-5">
              <p class="text-xs font-bold text-gray-700">{{ row.apprentice }}</p>
              <p class="text-[10px] font-bold text-gray-300 uppercase">Ficha: {{ row.ficha }}</p>
            </td>
            <td class="px-8 py-5">
              <p class="text-xs font-medium text-gray-500">{{ row.company }}</p>
            </td>
            <td class="px-8 py-5">
              <p :class="['text-xs font-bold', row.program === 'Pendiente' ? 'text-pink-500' : 'text-gray-700']">{{ row.program }}</p>
              <p class="text-[10px] font-bold text-gray-300 uppercase">{{ row.visit }}</p>
            </td>
            <td class="px-8 py-5 text-center">
              <span :class="['px-3 py-1 rounded-full text-[9px] font-black tracking-widest', row.signatureStatus === 'FIRMADO' ? 'bg-green-100 text-sena-green' : 'bg-pink-50 text-pink-500']">
                {{ row.signatureStatus }}
              </span>
            </td>
            <td class="px-8 py-5 text-center">
              <span :class="['px-3 py-1 rounded-full text-[9px] font-black tracking-widest', row.paymentStatus === 'PAGADO' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-400']">
                {{ row.paymentStatus }}
              </span>
            </td>
            <td class="px-8 py-5 text-right">
              <button class="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                <MoreVertical :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="p-6 flex items-center justify-between border-t border-gray-50">
      <p class="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Mostrando 4 de 10 aprendices asignados</p>
      <div class="flex items-center gap-4">
        <button class="text-[10px] font-bold text-gray-700 uppercase tracking-widest hover:text-sena-green disabled:opacity-30">Anterior</button>
        <button class="text-[10px] font-bold text-gray-700 uppercase tracking-widest hover:text-sena-green">Siguiente</button>
      </div>
    </div>
  </div>
</template>
