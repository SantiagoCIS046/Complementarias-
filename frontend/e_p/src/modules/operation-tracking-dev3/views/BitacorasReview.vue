<script setup>
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import { Download, Search, Filter, CheckCircle, XCircle, Eye } from 'lucide-vue-next';
import { ref } from 'vue';

const bitacoras = ref([
  { id: 1, aprendiz: 'Aprendiz Mancilla', documento: '1098765432', numero: '08', fecha: '28 Oct, 2023', estado: 'APROBADO', color: '#39A900' },
  { id: 2, aprendiz: 'Carlos Ruiz', documento: '1023456789', numero: '09', fecha: '29 Oct, 2023', estado: 'PENDIENTE', color: '#F59E0B' },
  { id: 3, aprendiz: 'Ana Garcia', documento: '1045678912', numero: '10', fecha: '30 Oct, 2023', estado: 'EN REVISIÓN', color: '#3B82F6' },
  { id: 4, aprendiz: 'Luis Moreno', documento: '1056789123', numero: '05', fecha: '01 Nov, 2023', estado: 'RECHAZADO', color: '#EF4444' }
]);
</script>

<template>
  <div class="flex h-screen bg-[#F4F7F6] overflow-hidden">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header />

      <main class="flex-1 overflow-y-auto">
        <div class="max-w-[1600px] mx-auto p-6 space-y-6">
          
          <!-- Header Section -->
          <div class="flex items-end justify-between">
            <div>
              <p class="text-[10px] font-bold text-sena-green uppercase tracking-wider">Gestión Académica</p>
              <h2 class="text-2xl font-black text-slate-800 tracking-tight">Revisión de Bitácoras</h2>
              <p class="text-xs text-slate-400 font-medium">Valide el progreso quincenal y la documentación de sus aprendices.</p>
            </div>
            <div class="flex gap-3">
              <button class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-all shadow-sm">
                <Download :size="14" />
                Exportar Reporte
              </button>
              <button class="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">
                <CheckCircle :size="14" />
                Aprobación Masiva
              </button>
            </div>
          </div>

          <!-- Filtros Rápidos -->
          <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div class="flex items-center gap-4 flex-1">
              <div class="relative flex-1 max-w-md">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="16" />
                <input type="text" placeholder="Buscar por aprendiz o documento..." class="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-sena-green transition-all" />
              </div>
              <div class="flex gap-2">
                <button class="px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-black text-slate-500 hover:bg-sena-green/10 hover:text-sena-green transition-all uppercase tracking-widest border border-transparent hover:border-sena-green/20">Todos</button>
                <button class="px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-black text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-all uppercase tracking-widest border border-transparent hover:border-amber-100">Pendientes</button>
                <button class="px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-black text-slate-500 hover:bg-green-50 hover:text-green-600 transition-all uppercase tracking-widest border border-transparent hover:border-green-100">Aprobados</button>
              </div>
            </div>
            <button class="p-2 text-slate-400 hover:text-slate-600">
              <Filter :size="20" />
            </button>
          </div>

          <!-- Tabla Principal -->
          <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full">
              <thead>
                <tr class="bg-slate-50/50">
                  <th class="text-left py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Aprendiz</th>
                  <th class="text-left py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Detalles Entrega</th>
                  <th class="text-left py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Recibido</th>
                  <th class="text-left py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado Actual</th>
                  <th class="text-right py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="item in bitacoras" :key="item.id" class="hover:bg-slate-50/30 transition-colors">
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-black text-xs">
                        {{ item.aprendiz[0] }}
                      </div>
                      <div>
                        <p class="text-xs font-black text-slate-700 leading-none">{{ item.aprendiz }}</p>
                        <p class="text-[9px] font-bold text-slate-400 mt-1">CC {{ item.documento }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex flex-col">
                      <span class="text-xs font-bold text-slate-700">Bitácora Quincenal #{{ item.numero }}</span>
                      <span class="text-[10px] text-slate-400">Periodo: Oct 15 - Oct 30</span>
                    </div>
                  </td>
                  <td class="py-4 px-6 text-xs font-medium text-slate-400">{{ item.fecha }}</td>
                  <td class="py-4 px-6">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black border" 
                      :style="{ color: item.color, backgroundColor: item.color + '10', borderColor: item.color + '20' }">
                      <span class="w-1 h-1 rounded-full" :style="{ backgroundColor: item.color }"></span>
                      {{ item.estado }}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex justify-end gap-2">
                      <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-sena-green hover:bg-green-50 transition-all" title="Aprobar">
                        <CheckCircle :size="16" />
                      </button>
                      <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Rechazar">
                        <XCircle :size="16" />
                      </button>
                      <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all" title="Ver Documento">
                        <Eye :size="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
main::-webkit-scrollbar { width: 6px; }
main::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
</style>
