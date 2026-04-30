<script setup>
import { Search, Download, ChevronLeft, ChevronRight, X } from 'lucide-vue-next';

const emit = defineEmits(['openRevision']);

const bitacoras = [
  { 
    id: 1, 
    apprentice: 'Carlos Mario Mendoza', 
    email: 'c.mendoza@soy.sena.edu.co',
    initials: 'CM',
    ficha: '2475102',
    program: 'ADSO - Jornada Mañana',
    quincena: 'Q2 Octubre',
    date: '28 Oct 2023',
    status: 'PENDIENTE',
    statusClass: 'bg-gray-100 text-gray-500',
    action: 'Revisar'
  },
  { 
    id: 2, 
    apprentice: 'Luisa Fernanda Rios', 
    email: 'luisa.rios@soy.sena.edu.co',
    initials: 'LR',
    ficha: '2475102',
    program: 'ADSO - Jornada Mañana',
    quincena: 'Q2 Octubre',
    date: '27 Oct 2023',
    status: 'APROBADO',
    statusClass: 'bg-green-100 text-sena-green',
    action: 'Ver',
    active: true
  },
  { 
    id: 3, 
    apprentice: 'Jorge Ivan Palacios', 
    email: 'ji.palacios@soy.sena.edu.co',
    initials: 'JP',
    ficha: '2568890',
    program: 'Multimedia - Mixta',
    quincena: 'Q1 Octubre',
    date: '15 Oct 2023',
    status: 'RECHAZADO',
    statusClass: 'bg-red-100 text-red-500',
    action: 'Corregir'
  },
  { 
    id: 4, 
    apprentice: 'Angela Maria Restrepo', 
    email: 'am.restrepo@soy.sena.edu.co',
    initials: 'AM',
    ficha: '2475102',
    program: 'ADSO - Jornada Mañana',
    quincena: 'Q2 Octubre',
    date: '28 Oct 2023',
    status: 'PENDIENTE',
    statusClass: 'bg-gray-100 text-gray-500',
    action: 'Revisar'
  },
  { 
    id: 5, 
    apprentice: 'Samuel Hernandez', 
    email: 's.hernandez@soy.sena.edu.co',
    initials: 'SH',
    ficha: '2568890',
    program: 'Multimedia - Mixta',
    quincena: 'Q2 Octubre',
    date: '26 Oct 2023',
    status: 'APROBADO',
    statusClass: 'bg-green-100 text-sena-green',
    action: 'Ver'
  }
];

const filters = ['Todos', 'Pendientes', 'Aprobados', 'Rechazados'];
</script>

<template>
  <div class="space-y-8">
    <!-- Filters & Search -->
    <div class="flex items-center justify-between gap-8">
      <div class="relative flex-1 max-w-xl">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
        <input 
          type="text" 
          placeholder="Buscar por aprendiz, ficha o programa..." 
          class="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl text-sm focus:ring-2 focus:ring-sena-green/20 shadow-sm"
        />
      </div>
      
      <div class="flex items-center bg-gray-200/50 p-1.5 rounded-2xl gap-2">
        <button 
          v-for="f in filters" 
          :key="f"
          :class="[
            'px-6 py-2 rounded-xl text-xs font-bold transition-all',
            f === 'Todos' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-white/50'
          ]"
        >
          {{ f }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden">
      <table class="w-full text-left">
        <thead>
          <tr class="bg-gray-50/50">
            <th class="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Aprendiz</th>
            <th class="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Ficha / Programa</th>
            <th class="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Quincena</th>
            <th class="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha de Envío</th>
            <th class="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Estado</th>
            <th class="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr 
            v-for="item in bitacoras" 
            :key="item.id" 
            :class="['group hover:bg-gray-50/30 transition-colors relative', item.active ? 'bg-green-50/20 border-l-4 border-sena-green' : '']"
          >
            <td class="px-8 py-6">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 border-2 border-white shadow-sm">
                  {{ item.initials }}
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-800 tracking-tight">{{ item.apprentice }}</p>
                  <p class="text-[10px] font-bold text-gray-400">{{ item.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-8 py-6">
              <p class="text-xs font-bold text-gray-700 tracking-tight">{{ item.ficha }}</p>
              <p class="text-[10px] font-bold text-gray-400 leading-tight">{{ item.program }}</p>
            </td>
            <td class="px-8 py-6">
              <p class="text-xs font-bold text-gray-700">{{ item.quincena.split(' ')[0] }}</p>
              <p class="text-xs font-bold text-gray-700">{{ item.quincena.split(' ')[1] }}</p>
            </td>
            <td class="px-8 py-6">
              <p class="text-xs font-bold text-gray-500">{{ item.date.split(' ').slice(0,2).join(' ') }}</p>
              <p class="text-xs font-bold text-gray-500">{{ item.date.split(' ').slice(2).join(' ') }}</p>
            </td>
            <td class="px-8 py-6 text-center">
              <div class="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full mx-auto" :class="item.statusClass.replace('bg-', 'bg-opacity-20 bg-')">
                <span :class="['w-1.5 h-1.5 rounded-full', item.status === 'APROBADO' ? 'bg-sena-green' : item.status === 'RECHAZADO' ? 'bg-red-500' : 'bg-gray-400']"></span>
                <span class="text-[10px] font-black tracking-[0.15em]">{{ item.status }}</span>
              </div>
            </td>
            <td class="px-8 py-6 text-right">
              <button 
                @click="emit('openRevision', item)"
                :class="[
                  'px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95',
                  item.action === 'Revisar' || item.action === 'Corregir' 
                    ? 'bg-sena-green text-white hover:bg-sena-green-dark shadow-green-100' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 shadow-gray-50'
                ]"
              >
                {{ item.action }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between">
      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mostrando 5 de 124 registros</p>
      <div class="flex items-center gap-2">
        <button class="p-2 text-gray-400 hover:text-gray-800 disabled:opacity-30"><ChevronLeft :size="18" /></button>
        <button class="w-8 h-8 rounded-lg bg-sena-green text-white text-xs font-bold">1</button>
        <button class="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 text-xs font-bold transition-colors">2</button>
        <button class="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 text-xs font-bold transition-colors">3</button>
        <button class="p-2 text-gray-400 hover:text-gray-800"><ChevronRight :size="18" /></button>
      </div>
    </div>

    <!-- Bottom Alert -->
    <div class="fixed bottom-10 right-10 z-40 bg-white border-l-4 border-sena-green p-6 rounded-2xl shadow-2xl flex items-start gap-6 max-w-md animate-in slide-in-from-right duration-500">
      <div class="p-3 bg-green-50 rounded-xl text-sena-green">
        <CheckCircle :size="24" />
      </div>
      <div class="space-y-1">
        <h5 class="text-sm font-bold text-gray-800">Bitácoras Pendientes</h5>
        <p class="text-[10px] text-gray-400 font-medium leading-relaxed">
          Tienes 14 bitácoras de la ficha 2475102 que vencen hoy. ¡No olvides revisarlas!
        </p>
      </div>
      <button class="text-gray-300 hover:text-gray-600">
        <X :size="16" />
      </button>
    </div>
  </div>
</template>
