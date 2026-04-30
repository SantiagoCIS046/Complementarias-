<<<<<<< Updated upstream
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()
=======
<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../admin-auth-dev1/core/store/auth.store'
import { epService } from '../services/ep.service'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// --- Datos del Usuario Autenticado ---
const currentUser = computed(() => authStore.user || { name: 'Usuario', role: 'Invitado' })

// --- Datos de la EP (Dinámicos) ---
const stages = ref([])
const isLoading = ref(true)

const aprendiz = ref({
  nombre: 'Cargando...',
  estadoActual: 'PENDING',
  progresoPorcentaje: 0,
  inicio: '---',
  finEstimado: '---',
  razonSocial: '---',
  email: '---',
  nit: '---',
  ubicacion: '---',
  jefe: '---',
  modalidad: '---'
})

const fetchEPData = async () => {
  try {
    const res = await epService.getAll()
    stages.value = res.data.data
    
    if (stages.value.length > 0) {
      const stage = stages.value[0] // Tomamos la primera para el dashboard
      aprendiz.value = {
        nombre: stage.apprenticeId?.name || 'Aprendiz',
        estadoActual: stage.estado,
        progresoPorcentaje: stage.horasRequeridas > 0 ? (stage.horasCompletadas / stage.horasRequeridas) * 100 : 0,
        inicio: stage.fechaInicio ? new Date(stage.fechaInicio).toLocaleDateString() : 'Por definir',
        finEstimado: stage.fechaFin ? new Date(stage.fechaFin).toLocaleDateString() : 'Por definir',
        razonSocial: stage.companyId?.razonSocial || 'N/A',
        email: stage.companySnapshot?.emailContacto || 'N/A',
        nit: stage.companyId?.nit || 'N/A',
        ubicacion: stage.companySnapshot?.direccion || 'N/A',
        jefe: stage.companySnapshot?.jefeInmediato || 'N/A',
        modalidad: stage.modalidad
      }
    } else {
      aprendiz.value.nombre = currentUser.value.name
    }
  } catch (error) {
    console.error('Error fetching EP data:', error)
    aprendiz.value.nombre = currentUser.value.name
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchEPData()
})
>>>>>>> Stashed changes

  // --- Datos de Ejemplo ---
  const apprenticeName = ref('Carlos Alberto Ruíz')
  const currentState = ref('LOGBOOK_REVIEW')
  
  const bitacoras = ref([
    { id: '08', periodo: '01 May - 15 May', entrega: '16 May, 2024', estado: 'APROBADA' },
    { id: '09', periodo: '16 May - 30 May', entrega: '31 May, 2024', estado: 'EN REVISIÓN' },
    { id: '10', periodo: '01 Jun - 15 Jun', entrega: '---', estado: 'PENDIENTE' }
  ])

  const handleLogout = () => {
    localStorage.removeItem('repfora_token')
    localStorage.removeItem('repfora_user')
    window.location.href = '/login'
  }
  </script>

<<<<<<< Updated upstream
  <template>
    <div class="min-h-screen bg-[#f8f9fa] font-sans text-gray-800 antialiased">
=======
const totalAprobadas = computed(() => bitacoras.value.filter(b => b.estado === 'Aprobada').length)
const pendientes = computed(() => bitacoras.value.filter(b => b.estado === 'Pendiente').length)

const downloadReport = () => {
  console.log("Descargando reporte para:", aprendiz.value.nombre)
}
</script>

<template>
  <div class="min-h-screen bg-background font-body text-on-surface antialiased">
    
    <!-- Top Navigation -->
    <nav class="fixed top-0 right-0 left-0 lg:left-64 h-16 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-8 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <span class="text-primary font-headline font-bold tracking-tight text-lg">REPFORA</span>
        <div class="hidden md:flex gap-6">
          <a href="#" class="text-sm font-label font-bold text-primary border-b-2 border-primary pb-1">Etapa Productiva</a>
          <a href="#" class="text-sm font-label font-bold text-on-surface-variant hover:text-on-surface transition-colors">Empresas</a>
          <a href="#" class="text-sm font-label font-bold text-on-surface-variant hover:text-on-surface transition-colors">Certificación</a>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <button class="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors text-on-surface-variant relative">
          <span class="material-symbols-outlined text-[22px]">notifications</span>
          <span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
        </button>
        <button class="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined text-[22px]">help</span>
        </button>
        <div class="flex items-center gap-3 pl-2 border-l border-stone-200">
          <div class="text-right hidden sm:block">
            <p class="text-xs font-bold leading-none">{{ currentUser.name }}</p>
            <p class="text-[10px] text-on-surface-variant font-medium">{{ currentUser.role }}</p>
          </div>
          <div class="h-9 w-9 rounded-full bg-surface-container-high overflow-hidden border border-stone-200 shadow-sm">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0wj6tQ1p8jBIpRM_uuf0oeV8B0U3CjLV3yWZlFPPue85p9nWNcfprEeXu4pmPdNCmbtXEBoVIukJIZZLxoo7_hBYrhXhlr0NzkPvlDj6NbYNQ_VWVr349JKN8L3x86bjv6X_mI2_q2kYqNwuKRcvHyM7G9QlNOCefWIYf4wsurtcQoSy83mhPAlEc9QeHoNAo82Ir__ce5NJQGNWgEejTGFRZT9jnLtdklMNdhaVHoYok4HdT9zEdMlfRkAtkHQ1DrCvdhKZAfhk" alt="Avatar" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </nav>

    <!-- Sidebar -->
    <aside class="hidden lg:flex h-screen w-64 fixed left-0 top-0 flex-col bg-surface-container-low border-r border-stone-200/60 z-50">
      <div class="p-8 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span class="material-symbols-outlined fill-icon text-[26px]">architecture</span>
          </div>
          <div>
            <h2 class="font-headline font-extrabold text-on-surface leading-none tracking-tight">Gestión EP</h2>
            <p class="text-[9px] text-on-surface-variant font-black uppercase tracking-[0.15em] mt-1 opacity-70">{{ currentUser.role }}</p>
          </div>
        </div>
      </div>
>>>>>>> Stashed changes
      
      <!-- Sidebar -->
      <aside class="hidden lg:flex w-64 fixed left-0 top-0 h-full flex-col bg-[#f4f5f6] border-r border-gray-200 z-50">
        <div class="p-6 mb-2 flex items-center gap-3">
          <div class="w-10 h-10 bg-green-700 rounded-lg flex items-center justify-center text-white shadow-sm">
            <span class="material-symbols-outlined text-[24px]">architecture</span>
          </div>
          <div>
            <h2 class="font-bold text-gray-900 text-sm leading-tight">Gestión EP</h2>
            <p class="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">SENA CORE</p>
          </div>
        </div>
        
        <nav class="flex-1 px-3 space-y-1">
          <a href="/dashboard" class="flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <span class="material-symbols-outlined text-[20px]">grid_view</span> DASHBOARD
          </a>
          <a href="#" class="flex items-center gap-3 px-4 py-3 text-xs font-bold text-green-700 bg-white rounded-xl shadow-sm border-l-4 border-green-700 transition-colors">
            <span class="material-symbols-outlined text-[20px]">bar_chart</span> ETAPA PRODUCTIVA
          </a>
          <a href="#" class="flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <span class="material-symbols-outlined text-[20px]">domain</span> DIRECTORIO
          </a>
          <a href="#" class="flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <span class="material-symbols-outlined text-[20px]">description</span> DOCUMENTACIÓN
          </a>
          <a href="#" class="flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <span class="material-symbols-outlined text-[20px]">settings</span> CONFIGURACIÓN
          </a>
        </nav>

        <div class="p-4 mt-auto border-t border-gray-200">
          <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <span class="material-symbols-outlined text-[20px]">logout</span> CERRAR SESIÓN
          </button>
        </div>
      </aside>

      <!-- Main Wrapper -->
      <div class="lg:pl-64 flex flex-col min-h-screen">
        
        <!-- Top Navigation -->
        <nav class="h-16 bg-[#f8f9fa] px-8 flex items-center justify-between sticky top-0 z-40">
          <div class="flex items-center gap-8">
            <span class="text-green-700 font-extrabold tracking-tight text-lg">REPFORA</span>
            <div class="hidden md:flex gap-6">
              <a href="#" class="text-xs font-bold text-green-700">Etapa Productiva</a>
              <a href="#" class="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">Empresas</a>
              <a href="#" class="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">Certificación</a>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <button class="relative text-gray-500 hover:text-gray-700 transition-colors">
              <span class="material-symbols-outlined text-[22px]">notifications</span>
              <span class="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full border border-white"></span>
            </button>
            <button class="text-gray-500 hover:text-gray-700 transition-colors">
              <span class="material-symbols-outlined text-[22px]">help</span>
            </button>
            <div class="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div class="text-right hidden sm:block">
                <p class="text-xs font-bold text-gray-900 leading-none">Admin User</p>
                <p class="text-[10px] text-gray-500 font-medium">Coordinador EP</p>
              </div>
              <div class="h-8 w-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=16a34a&color=fff" alt="Avatar" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </nav>

        <!-- Main Content -->
        <main class="flex-1 px-8 py-8 max-w-[1400px] w-full mx-auto">
          
          <!-- Header Actions -->
          <div class="flex justify-between items-start mb-8">
            <div>
              <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Seguimiento de Aprendiz</h1>
              <p class="text-gray-500 text-sm mt-1">Monitoreo detallado del progreso de etapa productiva para: <span class="text-green-700 font-bold">{{ apprenticeName }}</span></p>
            </div>
            <button class="bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-green-800 transition-all">
              <span class="material-symbols-outlined text-[20px]">download</span> Descargar Reporte
            </button>
          </div>

          <!-- Status Timeline -->
          <div class="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-gray-100">
            <div class="flex items-center gap-3 mb-8">
              <span class="material-symbols-outlined text-gray-400">flowsheet</span>
              <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Flujo de Estados de Etapa Productiva</h3>
              <span class="ml-auto bg-green-50 text-green-700 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase">Estado Actual: {{ currentState }}</span>
            </div>

            <div class="relative px-10 flex justify-between items-center overflow-x-auto pb-4 gap-8 min-w-full">
              <div class="absolute top-6 left-20 right-20 h-0.5 bg-gray-100 -z-0 min-w-[800px]"></div>
              
              <!-- Steps -->
              <div v-for="(step, i) in ['PENDING REGISTRATION', 'VALIDATING', 'IN PROGRESS', 'LOGBOOK REVIEW', 'FINAL EVALUATION', 'CERTIFICATION PENDING', 'COMPLETED']" :key="step" class="flex flex-col items-center gap-3 w-32 shrink-0 relative z-10">
                <div 
                  class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500"
                  :class="i <= 3 ? (i === 3 ? 'bg-white border-[3px] border-green-700 ring-8 ring-green-50' : 'bg-green-700 text-white') : 'bg-gray-100 text-gray-300'"
                >
                  <span v-if="i < 3" class="material-symbols-outlined text-[20px]">check</span>
                  <span v-else-if="i === 3" class="material-symbols-outlined text-green-700 text-[24px]">description</span>
                  <span v-else class="material-symbols-outlined text-[20px]">{{ i === 4 ? 'fact_check' : i === 5 ? 'assignment' : 'verified' }}</span>
                </div>
                <span class="text-[8px] font-black uppercase text-center leading-tight tracking-wider" :class="i <= 3 ? 'text-gray-900' : 'text-gray-300'">
                  {{ step }}
                </span>
              </div>
            </div>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <!-- Company Card -->
            <div class="lg:col-span-8 bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 relative overflow-hidden">
               <div class="absolute top-0 right-0 p-8">
                  <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-inner">
                     <span class="material-symbols-outlined text-gray-400 text-3xl">corporate_fare</span>
                  </div>
               </div>

               <h3 class="text-2xl font-black text-gray-900 mb-2">Información de la Empresa</h3>
               <p class="text-gray-400 text-xs mb-10">Detalles del convenio y entidad receptora</p>

               <div class="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-700 border border-green-100">
                       <span class="material-symbols-outlined">apartment</span>
                    </div>
                    <div>
                       <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Razón Social</p>
                       <p class="font-bold text-gray-800 text-sm">TechNova Solutions S.A.S</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-700 border border-green-100">
                       <span class="material-symbols-outlined">mail</span>
                    </div>
                    <div>
                       <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Contacto</p>
                       <p class="font-bold text-gray-800 text-sm">m.rodriguez@technova.com</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-700 border border-green-100">
                       <span class="material-symbols-outlined">badge</span>
                    </div>
                    <div>
                       <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">NIT</p>
                       <p class="font-bold text-gray-800 text-sm">900.452.123-5</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-700 border border-green-100">
                       <span class="material-symbols-outlined">location_on</span>
                    </div>
                    <div>
                       <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ubicación</p>
                       <p class="font-bold text-gray-800 text-sm">Calle 100 #15-32, Bogotá</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-700 border border-green-100">
                       <span class="material-symbols-outlined">person</span>
                    </div>
                    <div>
                       <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Jefe Inmediato</p>
                       <p class="font-bold text-gray-800 text-sm">Ing. Martha Rodríguez</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-700 border border-green-100">
                       <span class="material-symbols-outlined">work</span>
                    </div>
                    <div>
                       <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Modalidad</p>
                       <p class="font-bold text-gray-800 text-sm">Contrato de Aprendizaje</p>
                    </div>
                  </div>
               </div>
            </div>

            <!-- Right Column Cards -->
            <div class="lg:col-span-4 space-y-8">
              <!-- Critical Dates -->
              <div class="bg-[#f0f2f5] rounded-[2.5rem] p-8 border border-gray-200">
                 <div class="flex items-center gap-3 mb-6">
                    <span class="material-symbols-outlined text-gray-900">calendar_month</span>
                    <h4 class="font-bold text-gray-900 text-sm uppercase tracking-widest">Fechas Críticas</h4>
                 </div>
                 
                 <div class="space-y-4">
                    <div class="bg-white rounded-2xl p-4 border-l-4 border-gray-400">
                       <p class="text-[9px] font-bold text-gray-400 uppercase">Inicio de Etapa</p>
                       <p class="font-black text-gray-900 text-lg">15 Ene, 2024</p>
                    </div>
                    <div class="bg-white rounded-2xl p-4 border-l-4 border-pink-500 relative">
                       <p class="text-[9px] font-bold text-gray-400 uppercase">Próxima Bitácora</p>
                       <p class="font-black text-gray-900 text-lg">30 May, 2024</p>
                       <span class="absolute top-4 right-4 bg-pink-100 text-pink-600 px-2 py-1 rounded-md text-[8px] font-black">FALTAN 2 DÍAS</span>
                    </div>
                    <div class="bg-white rounded-2xl p-4 border-l-4 border-gray-200">
                       <p class="text-[9px] font-bold text-gray-400 uppercase">Fecha Fin Estimada</p>
                       <p class="font-black text-gray-900 text-lg">15 Jul, 2024</p>
                    </div>
                 </div>
              </div>

              <!-- Quick Actions -->
              <div class="bg-green-50/50 rounded-[2.5rem] p-8 border border-green-100">
                 <h4 class="font-bold text-green-800 text-sm uppercase tracking-widest mb-6">Acciones Rápidas</h4>
                 <div class="grid grid-cols-2 gap-4">
                    <button class="bg-white p-5 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group">
                       <div class="w-10 h-10 bg-green-700 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span class="material-symbols-outlined">upload_file</span>
                       </div>
                       <span class="text-[10px] font-bold text-gray-900">Subir Bitácora</span>
                    </button>
                    <button class="bg-white p-5 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group">
                       <div class="w-10 h-10 bg-green-50 text-green-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span class="material-symbols-outlined">forum</span>
                       </div>
                       <span class="text-[10px] font-bold text-gray-900 text-center">Contactar Instructor</span>
                    </button>
                 </div>
              </div>
            </div>
          </div>

          <!-- Logbooks Table -->
          <div class="mt-8 bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
             <div class="flex justify-between items-center mb-8">
                <h3 class="text-2xl font-black text-gray-900">Seguimiento de Bitácoras</h3>
                <div class="flex gap-4">
                   <span class="bg-gray-100 px-4 py-2 rounded-xl text-[10px] font-bold text-gray-500">Total: 12</span>
                   <span class="bg-green-50 px-4 py-2 rounded-xl text-[10px] font-bold text-green-700 uppercase">Aprobadas: 8</span>
                   <span class="bg-orange-50 px-4 py-2 rounded-xl text-[10px] font-bold text-orange-600 uppercase">Pendientes: 1</span>
                </div>
             </div>

             <table class="w-full">
                <thead>
                   <tr class="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                      <th class="pb-6 pl-4">Bitácora #</th>
                      <th class="pb-6">Periodo</th>
                      <th class="pb-6">Fecha Entrega</th>
                      <th class="pb-6">Estado</th>
                      <th class="pb-6 text-right pr-4">Acciones</th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                   <tr v-for="item in bitacoras" :key="item.id" class="group hover:bg-gray-50 transition-colors">
                      <td class="py-6 pl-4">
                         <div class="flex items-center gap-3">
                            <div class="w-1 h-8 bg-green-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span class="font-bold text-gray-900">Bitácora {{ item.id }}</span>
                         </div>
                      </td>
                      <td class="py-6 text-sm font-medium text-gray-600">{{ item.periodo }}</td>
                      <td class="py-6 text-sm font-medium text-gray-600">{{ item.entrega }}</td>
                      <td class="py-6">
                         <span 
                           class="px-3 py-1 rounded-lg text-[9px] font-black tracking-widest"
                           :class="{
                             'bg-green-100 text-green-700': item.estado === 'APROBADA',
                             'bg-orange-100 text-orange-600': item.estado === 'EN REVISIÓN',
                             'bg-gray-100 text-gray-400': item.estado === 'PENDIENTE'
                           }"
                         >{{ item.estado }}</span>
                      </td>
                      <td class="py-6 text-right pr-4">
                         <button class="text-gray-400 hover:text-green-700 transition-colors">
                            <span class="material-symbols-outlined text-[22px]">visibility</span>
                         </button>
                      </td>
                   </tr>
                </tbody>
             </table>
          </div>
        </main>
      </div>

      <!-- Help FAB -->
      <button class="fixed bottom-8 right-8 w-14 h-14 bg-green-700 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-green-800 transition-colors z-50">
        <span class="material-symbols-outlined text-[26px]">smart_toy</span>
      </button>
    </div>
  </template>

  <style scoped>
  .font-sans {
    font-family: 'Inter', system-ui, sans-serif;
  }
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
  </style>
