<script setup>
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import { Plus, Calendar, Clock, MapPin, ChevronRight, MoreHorizontal } from 'lucide-vue-next';
import { ref } from 'vue';

const upcomingVisits = ref([
  { id: 1, aprendiz: 'Aprendiz Mancilla', fecha: '05 Nov, 2023', hora: '09:00 AM', tipo: 'Virtual', empresa: 'SoftTech S.A.' },
  { id: 2, aprendiz: 'Carlos Ruiz', fecha: '07 Nov, 2023', hora: '02:30 PM', tipo: 'Presencial', empresa: 'Alcaldía de Cali' },
  { id: 3, aprendiz: 'Ana Garcia', fecha: '10 Nov, 2023', hora: '10:00 AM', tipo: 'Virtual', empresa: 'SENA Regional' }
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
              <p class="text-[10px] font-bold text-sena-green uppercase tracking-wider">Seguimiento Técnico</p>
              <h2 class="text-2xl font-black text-slate-800 tracking-tight">Seguimiento de Visitas</h2>
              <p class="text-xs text-slate-400 font-medium">Gestione la programación de las visitas técnicas obligatorias.</p>
            </div>
            <button class="flex items-center gap-2 bg-sena-green text-white px-5 py-3 rounded-xl text-[11px] font-bold hover:bg-sena-green-dark transition-all shadow-lg shadow-green-100">
              <Plus :size="16" stroke-width="3" />
              Programar Seguimiento
            </button>
          </div>

          <!-- Main Content Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- Left: Calendar View Placeholder -->
            <div class="lg:col-span-8 space-y-6">
              <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest">Calendario de Visitas</h3>
                  <div class="flex gap-2">
                    <button class="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-sena-green"><Calendar :size="16" /></button>
                    <button class="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-sena-green"><MoreHorizontal :size="16" /></button>
                  </div>
                </div>
                
                <!-- Simple Calendar Mockup -->
                <div class="grid grid-cols-7 gap-2">
                  <template v-for="d in ['L', 'M', 'M', 'J', 'V', 'S', 'D']" :key="d">
                    <div class="text-center py-2 text-[10px] font-black text-slate-300">{{ d }}</div>
                  </template>
                  <template v-for="i in 31" :key="i">
                    <div class="aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer"
                      :class="i === 5 ? 'bg-sena-green text-white shadow-lg shadow-green-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'">
                      {{ i }}
                    </div>
                  </template>
                </div>
              </div>

              <!-- Listado Detallado -->
              <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div class="p-4 bg-slate-50/50 border-b border-slate-100">
                  <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listado de Seguimientos Pendientes</h3>
                </div>
                <div class="divide-y divide-slate-50">
                  <div v-for="visit in upcomingVisits" :key="visit.id" class="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-slate-100 rounded-2xl flex flex-col items-center justify-center">
                        <span class="text-[8px] font-black text-slate-400 uppercase leading-none">Nov</span>
                        <span class="text-sm font-black text-slate-700 leading-none mt-1">{{ visit.fecha.split(' ')[0] }}</span>
                      </div>
                      <div>
                        <p class="text-xs font-black text-slate-800">{{ visit.aprendiz }}</p>
                        <p class="text-[10px] font-bold text-slate-400">{{ visit.empresa }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-6">
                      <div class="flex flex-col items-end">
                        <div class="flex items-center gap-1.5 text-slate-400">
                          <Clock :size="12" />
                          <span class="text-[10px] font-bold">{{ visit.hora }}</span>
                        </div>
                        <div class="flex items-center gap-1.5 text-sena-green mt-1">
                          <MapPin :size="12" />
                          <span class="text-[10px] font-black">{{ visit.tipo }}</span>
                        </div>
                      </div>
                      <button class="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 group-hover:text-sena-green group-hover:bg-green-50 transition-all flex items-center justify-center">
                        <ChevronRight :size="18" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Next Visit Summary -->
            <div class="lg:col-span-4 space-y-6">
              <div class="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-slate-200">
                <div class="relative z-10">
                  <div class="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full mb-6 border border-white/10">
                    <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span class="text-[9px] font-black uppercase tracking-widest text-white/80">Próxima Visita</span>
                  </div>
                  
                  <h4 class="text-lg font-black leading-tight mb-2">Visita de Seguimiento Técnico #1</h4>
                  <p class="text-xs text-white/50 font-medium mb-6">Aprendiz: Diego Mancilla</p>
                  
                  <div class="space-y-3">
                    <div class="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <Calendar class="text-sena-green" :size="18" />
                      <div>
                        <p class="text-[8px] font-black text-white/30 uppercase leading-none">Fecha</p>
                        <p class="text-xs font-bold mt-1">Mañana, 05 Nov 2023</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <MapPin class="text-sena-green" :size="18" />
                      <div>
                        <p class="text-[8px] font-black text-white/30 uppercase leading-none">Ubicación</p>
                        <p class="text-xs font-bold mt-1">Plataforma Microsoft Teams</p>
                      </div>
                    </div>
                  </div>
                  
                  <button class="w-full mt-6 bg-sena-green text-white py-3 rounded-xl font-bold text-xs hover:bg-sena-green-dark transition-all">Iniciar Seguimiento</button>
                </div>
                <!-- Abstract Decor -->
                <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-sena-green/10 rounded-full blur-3xl"></div>
              </div>

              <!-- Stats Cards -->
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                  <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Visitas</p>
                  <p class="text-xl font-black text-slate-800">24</p>
                </div>
                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                  <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendientes</p>
                  <p class="text-xl font-black text-amber-500">03</p>
                </div>
              </div>
            </div>

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
