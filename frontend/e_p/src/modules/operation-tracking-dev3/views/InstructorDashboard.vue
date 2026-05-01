<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../../core/store/auth.store'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'

const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.user || { name: 'Instructor Martin', role: 'INSTRUCTOR' })

// --- Datos del Monitor de Horas (Semáforo) ---
const hoursStats = ref({
  reportadas: 168,
  limite: 160,
  porcentaje: 0,
  estado: 'normal' // normal, warning, danger
})

// --- Datos de Bitácoras (Ejemplo) ---
const bitacoras = ref([
  { id: 1, aprendiz: 'Aprendiz Mancilla', numero: '08', fecha: '28 Oct, 2023', estado: 'APROBADO', color: '#39A900' },
  { id: 2, aprendiz: 'Carlos Ruiz', numero: '09', fecha: '29 Oct, 2023', estado: 'PENDIENTE', color: '#F59E0B' },
  { id: 3, aprendiz: 'Ana Garcia', numero: '10', fecha: '30 Oct, 2023', estado: 'EN REVISIÓN', color: '#3B82F6' }
])

onMounted(() => {
  const p = (hoursStats.value.reportadas / hoursStats.value.limite) * 100
  hoursStats.value.porcentaje = Math.min(p, 100)
  
  if (p > 100) hoursStats.value.estado = 'danger'
  else if (p > 85) hoursStats.value.estado = 'warning'
  else hoursStats.value.estado = 'normal'
})
</script>

<template>
  <div class="flex h-screen bg-[#F4F7F6] overflow-hidden">
    <!-- SIDEBAR GLOBAL COMPACTO -->
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- HEADER GLOBAL COMPACTO -->
      <Header />

      <main class="flex-1 overflow-y-auto content-area">
        <div class="max-w-[1600px] mx-auto p-6 space-y-6">
          
          <!-- SECCIÓN DE BIENVENIDA COMPACTA -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-bold text-sena-green uppercase tracking-wider">Tablero de Gestión</p>
              <h2 class="text-2xl font-black text-slate-800 tracking-tight">Bienvenido, {{ currentUser.name }}</h2>
            </div>
            <button class="bg-sena-green text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-green-100 flex items-center gap-2 hover:-translate-y-0.5 transition-all">
              <span class="material-symbols-outlined !text-lg">add_circle</span>
              Programar Seguimiento
            </button>
          </div>

          <!-- GRID SUPERIOR (Semáforo + Acciones) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- MONITOR DE HORAS (Semáforo) -->
            <div class="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden" :class="hoursStats.estado">
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h3 class="text-sm font-bold text-slate-800">Monitor de Carga Horaria</h3>
                  <p class="text-[10px] text-slate-400 font-medium">Cumplimiento mensual acumulado</p>
                </div>
                <span class="status-pill" :class="hoursStats.estado">
                  {{ hoursStats.estado.toUpperCase() }}
                </span>
              </div>
              
              <div class="flex items-center gap-8">
                <div class="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" class="transform -rotate-90">
                    <circle class="fill-none stroke-slate-50 stroke-[8]" cx="50" cy="50" r="45"></circle>
                    <circle class="fill-none stroke-[8] stroke-linecap-round transition-all duration-1000" 
                      :class="{'stroke-sena-green': hoursStats.estado === 'normal', 'stroke-amber-500': hoursStats.estado === 'warning', 'stroke-red-500': hoursStats.estado === 'danger'}"
                      cx="50" cy="50" r="45" :style="{ strokeDasharray: 283, strokeDashoffset: 283 - (283 * hoursStats.porcentaje) / 100 }"></circle>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-2xl font-black text-slate-800 leading-none">{{ hoursStats.reportadas }}</span>
                    <span class="text-[8px] font-bold text-slate-400 uppercase">Horas</span>
                  </div>
                </div>
                
                <div class="flex-1 grid grid-cols-1 gap-4">
                  <div class="bg-slate-50 p-3 rounded-2xl">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Límite Mensual</p>
                    <p class="text-sm font-black text-slate-700">{{ hoursStats.limite }}h</p>
                  </div>
                  <div class="bg-slate-50 p-3 rounded-2xl">
                    <p class="text-[9px] font-bold text-slate-400 uppercase">Estado de Alerta</p>
                    <p class="text-sm font-black" :class="{'text-sena-green': hoursStats.estado === 'normal', 'text-amber-600': hoursStats.estado === 'warning', 'text-red-600': hoursStats.estado === 'danger'}">
                      {{ hoursStats.reportadas > hoursStats.limite ? 'Sobrecarga' : 'Dentro del rango' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- REGISTRO RÁPIDO -->
            <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 class="text-sm font-bold text-slate-800 mb-5">Registro Rápido de Seguimiento</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Aprendiz Seleccionado</label>
                  <select class="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sena-green transition-colors">
                    <option>Aprendiz Mancilla</option>
                    <option>Carlos Ruiz</option>
                    <option>Ana Garcia</option>
                  </select>
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Modalidad de Visita</label>
                  <select class="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sena-green transition-colors">
                    <option>Virtual / Remota</option>
                    <option>Presencial / Empresa</option>
                  </select>
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Fecha Programada</label>
                  <input type="date" class="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-sena-green transition-colors" />
                </div>
              </div>
              <button class="w-full mt-5 bg-slate-800 text-white py-3 rounded-xl font-bold text-xs hover:bg-slate-900 transition-all">Confirmar Programación</button>
            </div>
          </div>

          <!-- TABLA DE BITÁCORAS COMPACTA -->
          <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div class="p-6 border-b border-slate-50 flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-800">Bitácoras Recientes en Revisión</h3>
              <div class="flex gap-2">
                <button class="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-sena-green transition-colors">
                  <span class="material-symbols-outlined !text-lg">search</span>
                </button>
                <button class="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-sena-green transition-colors">
                  <span class="material-symbols-outlined !text-lg">filter_list</span>
                </button>
              </div>
            </div>
            
            <table class="w-full">
              <thead>
                <tr class="bg-slate-50/50">
                  <th class="text-left py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Aprendiz</th>
                  <th class="text-left py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nro. Bitácora</th>
                  <th class="text-left py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Envío</th>
                  <th class="text-left py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th class="text-right py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="item in bitacoras" :key="item.id" class="hover:bg-slate-50/30 transition-colors">
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 bg-sena-green/10 rounded-full flex items-center justify-center text-sena-green font-black text-[10px]">
                        {{ item.aprendiz[0] }}
                      </div>
                      <span class="text-xs font-bold text-slate-700">{{ item.aprendiz }}</span>
                    </div>
                  </td>
                  <td class="py-4 px-6 text-xs font-black text-slate-700">Bitácora #{{ item.numero }}</td>
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
                      <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-sena-green hover:bg-green-50 transition-all">
                        <span class="material-symbols-outlined !text-lg">check_circle</span>
                      </button>
                      <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <span class="material-symbols-outlined !text-lg">cancel</span>
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
.content-area::-webkit-scrollbar { width: 6px; }
.content-area::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }

.status-pill {
  font-size: 8px; font-weight: 900; padding: 4px 10px; border-radius: 20px;
}
.status-pill.normal { background: #F0FDF4; color: #16A34A; }
.status-pill.warning { background: #FFFBEB; color: #D97706; }
.status-pill.danger { background: #FEF2F2; color: #DC2626; }

.material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
</style>
