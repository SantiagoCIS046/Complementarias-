<script setup>
import { ref, computed } from 'vue'

// --- Datos del Aprendiz (Simulados) ---
const aprendiz = ref({
  nombre: 'Carlos Alberto Ruíz',
  estadoActual: 'LOGBOOK_REVIEW',
  progresoPorcentaje: 66,
  inicio: '15 Ene, 2024',
  finEstimado: '15 Jul, 2024',
  razonSocial: 'TechNova Solutions S.A.S',
  email: 'm.rodriguez@technova.com',
  nit: '900.452.123-5',
  ubicacion: 'Calle 100 #15-32, Bogotá',
  jefe: 'Ing. Martha Rodriguez',
  modalidad: 'Contrato de Aprendizaje'
})

// --- Flujo de Estados ---
const steps = [
  { id: 1, label: 'Pending Registration', icon: 'how_to_reg', active: true },
  { id: 2, label: 'Validating', icon: 'rule', active: true },
  { id: 3, label: 'In Progress', icon: 'trending_up', active: true },
  { id: 4, label: 'Logbook Review', icon: 'rate_review', active: true, current: true },
  { id: 5, label: 'Final Evaluation', icon: 'assignment_turned_in', active: false },
  { id: 6, label: 'Certification Pending', icon: 'pending_actions', active: false },
  { id: 7, label: 'Completed', icon: 'verified', active: false },
]

// --- Listado de Bitácoras ---
const bitacoras = ref([
  { id: 8, periodo: '01 May - 15 May', entrega: '16 May, 2024', estado: 'Aprobada', color: 'primary' },
  { id: 9, periodo: '16 May - 30 May', entrega: '31 May, 2024', estado: 'En Revisión', color: 'warning' },
  { id: 10, periodo: '01 Jun - 15 Jun', entrega: '---', estado: 'Pendiente', color: 'surface-container-highest' },
])

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
            <p class="text-xs font-bold leading-none">Admin User</p>
            <p class="text-[10px] text-on-surface-variant font-medium">SENA Administrator</p>
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
            <p class="text-[9px] text-on-surface-variant font-black uppercase tracking-[0.15em] mt-1 opacity-70">Institutional Architect</p>
          </div>
        </div>
      </div>
      
      <nav class="flex-1 px-4 space-y-1.5">
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold text-on-surface-variant hover:bg-stone-200/50 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined text-[20px]">dashboard</span> DASHBOARD
        </a>
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold bg-white text-primary shadow-sm border border-stone-200/40 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined fill-icon text-[20px]">analytics</span> ETAPA PRODUCTIVA
        </a>
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold text-on-surface-variant hover:bg-stone-200/50 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined text-[20px]">business</span> DIRECTORIO
        </a>
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold text-on-surface-variant hover:bg-stone-200/50 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined text-[20px]">description</span> DOCUMENTACIÓN
        </a>
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold text-on-surface-variant hover:bg-stone-200/50 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined text-[20px]">settings</span> CONFIGURACIÓN
        </a>
      </nav>

      <div class="p-4 mt-auto">
        <button class="w-full flex items-center gap-3 px-4 py-3 font-label text-[11px] uppercase tracking-widest font-black text-on-surface-variant hover:bg-error-container hover:text-error rounded-xl transition-all">
          <span class="material-symbols-outlined text-[20px]">logout</span> CERRAR SESIÓN
        </button>
      </div>
    </aside>

    <main class="lg:ml-64 pt-24 px-8 pb-12">
      <section class="max-w-7xl mx-auto mb-10">
        <div class="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
          <div>
            <h2 class="text-4xl font-headline font-extrabold tracking-tight text-on-surface">Seguimiento de Aprendiz</h2>
            <p class="text-on-surface-variant mt-2 text-lg">
              Monitoreo detallado del progreso de etapa productiva para: <span class="font-bold text-primary">{{ aprendiz.nombre }}</span>
            </p>
          </div>
          <button @click="downloadReport" class="bg-primary text-white px-8 py-4 rounded-2xl font-black font-label text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-3 transition-all hover:shadow-primary/30 active:scale-95">
            <span class="material-symbols-outlined fill-icon text-[20px]">download</span>
            Descargar Reporte
          </button>
        </div>

        <!-- Progress Stepper Card -->
        <div class="bg-white rounded-[2.5rem] p-10 mb-10 shadow-premium border border-stone-100/60 overflow-x-auto relative">
          <div class="flex justify-between items-center mb-12 min-w-[900px]">
             <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <span class="material-symbols-outlined text-[22px] fill-icon">account_tree</span>
                </div>
                <h3 class="text-xs font-black text-on-surface-variant uppercase tracking-[0.15em]">Flujo de Estados de Etapa Productiva</h3>
             </div>
             <span class="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
               Estado Actual: {{ aprendiz.estadoActual }}
             </span>
          </div>

          <div class="relative min-w-[900px] px-8 pb-4">
            <div class="absolute top-7 left-12 right-12 h-[3px] bg-surface-container-high rounded-full -z-10"></div>
            <div 
              class="absolute top-7 left-12 h-[3px] bg-primary rounded-full -z-10 transition-all duration-1000 ease-in-out"
              :style="{ width: aprendiz.progresoPorcentaje + '%' }"
            ></div>

            <div class="relative z-10 flex justify-between items-start">
              <div v-for="step in steps" :key="step.id" 
                class="flex flex-col items-center gap-4 w-32 text-center transition-all duration-500"
                :class="{ 'opacity-40': !step.active && !step.current }">
                
                <div v-if="step.current" class="w-14 h-14 -mt-3.5 rounded-2xl bg-white border-4 border-primary text-primary flex items-center justify-center shadow-2xl ring-8 ring-primary/5">
                  <span class="material-symbols-outlined text-[28px] fill-icon">{{ step.icon }}</span>
                </div>
                <div v-else class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md"
                  :class="step.active ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'">
                  <span class="material-symbols-outlined text-[20px]" :class="{'fill-icon': step.active}">{{ step.icon }}</span>
                </div>
                
                <span class="text-[10px] font-black leading-tight uppercase tracking-tighter" :class="step.current ? 'text-primary' : 'text-on-surface'">
                  {{ step.label }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
          <!-- Info Section -->
          <div class="col-span-12 lg:col-span-8 bg-white rounded-[2.5rem] p-10 shadow-premium border border-stone-100/60">
            <div class="flex justify-between items-start mb-10">
              <div>
                <h3 class="text-2xl font-headline font-extrabold mb-1">Información de la Empresa</h3>
                <p class="text-on-surface-variant text-sm font-medium">Detalles del convenio y entidad receptora</p>
              </div>
              <div class="w-20 h-20 bg-surface-container-low rounded-2xl flex items-center justify-center border border-stone-100 p-2 shadow-inner">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJD0EwSaJs0Y2NmdIVEuokaFH6lE8VYlUXI-N407MpqK0sCwSzrxMkPfYiLtdI4v7OrlroTKy-QLcppTkmSZ-Lspn23I3iy1_biM5dOBQsyb9hSUGg8G47_o4wIg8A_HXySqKUXU5Gtm_kKZaUs8dU1caaVw2kGWbEjm3xhl5fUoPeYC5ZgJ3Qn1oOPAK1vHC1Q49wxH_iXJzmgZbWsihaENtdqz_Koy3ZVE9ekCuCIMVYK3y-mq60f9GVpWa8NrdZ4kw-Oqt1Rrs" alt="Logo Empresa" class="w-full h-full object-contain" />
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div class="flex items-center gap-5 p-4 rounded-2xl hover:bg-stone-50 transition-colors">
                <div class="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shadow-sm">
                  <span class="material-symbols-outlined text-[24px] fill-icon">business</span>
                </div>
                <div>
                  <p class="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-0.5">Razón Social</p>
                  <p class="text-base font-bold text-on-surface">{{ aprendiz.razonSocial }}</p>
                </div>
              </div>
              <div class="flex items-center gap-5 p-4 rounded-2xl hover:bg-stone-50 transition-colors">
                <div class="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shadow-sm">
                  <span class="material-symbols-outlined text-[24px] fill-icon">alternate_email</span>
                </div>
                <div>
                  <p class="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-0.5">Email Contacto</p>
                  <p class="text-base font-bold text-on-surface">{{ aprendiz.email }}</p>
                </div>
              </div>
              <div class="flex items-center gap-5 p-4 rounded-2xl hover:bg-stone-50 transition-colors">
                <div class="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shadow-sm">
                  <span class="material-symbols-outlined text-[24px] fill-icon">badge</span>
                </div>
                <div>
                  <p class="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-0.5">NIT</p>
                  <p class="text-base font-bold text-on-surface">{{ aprendiz.nit }}</p>
                </div>
              </div>
              <div class="flex items-center gap-5 p-4 rounded-2xl hover:bg-stone-50 transition-colors">
                <div class="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shadow-sm">
                  <span class="material-symbols-outlined text-[24px] fill-icon">location_on</span>
                </div>
                <div>
                  <p class="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-0.5">Ubicación</p>
                  <p class="text-base font-bold text-on-surface">{{ aprendiz.ubicacion }}</p>
                </div>
              </div>
              <div class="flex items-center gap-5 p-4 rounded-2xl hover:bg-stone-50 transition-colors">
                <div class="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shadow-sm">
                  <span class="material-symbols-outlined text-[24px] fill-icon">person</span>
                </div>
                <div>
                  <p class="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-0.5">Jefe Inmediato</p>
                  <p class="text-base font-bold text-on-surface">{{ aprendiz.jefe }}</p>
                </div>
              </div>
              <div class="flex items-center gap-5 p-4 rounded-2xl hover:bg-stone-50 transition-colors">
                <div class="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shadow-sm">
                  <span class="material-symbols-outlined text-[24px] fill-icon">work</span>
                </div>
                <div>
                  <p class="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-0.5">Modalidad</p>
                  <p class="text-base font-bold text-on-surface">{{ aprendiz.modalidad }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Side Section -->
          <div class="col-span-12 lg:col-span-4 space-y-8">
            <div class="bg-surface-container-high/60 backdrop-blur-sm rounded-[2.5rem] p-8 border border-stone-200/50">
              <h4 class="text-xs font-black text-on-surface-variant mb-8 flex items-center gap-2 tracking-[0.1em] uppercase">
                <span class="material-symbols-outlined text-[20px]">calendar_month</span> FECHAS CRÍTICAS
              </h4>
              <div class="space-y-6">
                <div class="bg-white p-6 rounded-3xl border border-stone-200/40 shadow-sm">
                  <p class="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-1.5">Inicio de Etapa</p>
                  <p class="text-2xl font-headline font-extrabold text-on-surface">{{ aprendiz.inicio }}</p>
                </div>
                <div class="bg-white p-6 rounded-3xl border-l-8 border-error shadow-sm">
                  <p class="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-1.5">Próxima Bitácora</p>
                  <div class="flex justify-between items-end">
                    <p class="text-2xl font-headline font-extrabold text-on-surface">30 May, 2024</p>
                    <span class="text-[9px] bg-error-container text-error px-2.5 py-1.5 rounded-full font-black uppercase tracking-tighter">FALTAN 2 DÍAS</span>
                  </div>
                </div>
                <div class="bg-white p-6 rounded-3xl border border-stone-200/40 shadow-sm">
                  <p class="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-1.5">Fecha Fin Estimada</p>
                  <p class="text-2xl font-headline font-extrabold text-on-surface">{{ aprendiz.finEstimado }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-premium">
              <h4 class="text-xs font-black text-primary mb-8 flex items-center gap-2 tracking-[0.1em] uppercase">
                <span class="material-symbols-outlined text-[20px] fill-icon">bolt</span> Acciones Rápidas
              </h4>
              <div class="grid grid-cols-2 gap-4">
                 <button class="flex flex-col items-center gap-3 p-5 bg-primary/5 rounded-3xl border border-primary/10 hover:bg-primary/10 transition-all group">
                    <span class="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">cloud_upload</span>
                    <span class="text-[10px] font-bold uppercase text-on-surface-variant text-center">Subir Bitácora</span>
                 </button>
                 <button class="flex flex-col items-center gap-3 p-5 bg-stone-50 rounded-3xl border border-stone-100 hover:bg-stone-100 transition-all group">
                    <span class="material-symbols-outlined text-stone-500 text-2xl group-hover:scale-110 transition-transform">forum</span>
                    <span class="text-[10px] font-bold uppercase text-on-surface-variant text-center">Contactar</span>
                 </button>
              </div>
            </div>
          </div>

          <!-- Bitacoras Table -->
          <div class="col-span-12 bg-white rounded-[2.5rem] p-10 shadow-premium border border-stone-100/60 mt-8">
            <div class="flex justify-between items-center mb-8">
              <div>
                <h3 class="text-2xl font-headline font-extrabold">Seguimiento de Bitácoras</h3>
                <p class="text-sm text-on-surface-variant font-medium mt-1">Historial de registros quincenales</p>
              </div>
              <div class="flex gap-4">
                <span class="px-4 py-2 bg-stone-100 text-on-surface-variant rounded-xl text-[10px] font-black uppercase tracking-widest">Total: 12</span>
                <span class="px-4 py-2 bg-primary-light text-primary rounded-xl text-[10px] font-black uppercase tracking-widest">Aprobadas: {{ totalAprobadas }}</span>
                <span class="px-4 py-2 bg-warning-container text-warning px-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Pendientes: {{ pendientes }}</span>
              </div>
            </div>
            
            <div class="overflow-hidden rounded-[2rem] border border-stone-100">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-stone-50/50 text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant/60">
                    <th class="px-8 py-5">Bitácora #</th>
                    <th class="px-8 py-5">Periodo</th>
                    <th class="px-8 py-5">Fecha Entrega</th>
                    <th class="px-8 py-5">Estado</th>
                    <th class="px-8 py-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-100">
                  <tr v-for="b in bitacoras" :key="b.id" class="group hover:bg-stone-50/80 transition-colors">
                    <td class="px-8 py-6">
                      <div class="flex items-center gap-4">
                        <div class="w-1.5 h-10 rounded-full" :class="b.estado === 'Aprobada' ? 'bg-primary' : b.estado === 'En Revisión' ? 'bg-warning' : 'bg-stone-300'"></div>
                        <span class="font-headline font-extrabold text-on-surface text-lg">Bitácora {{ b.id < 10 ? '0'+b.id : b.id }}</span>
                      </div>
                    </td>
                    <td class="px-8 py-6 text-sm font-medium text-on-surface-variant">{{ b.periodo }}</td>
                    <td class="px-8 py-6 text-sm font-medium text-on-surface-variant">{{ b.entrega }}</td>
                    <td class="px-8 py-6">
                      <span :class="{
                        'bg-primary-light text-primary border border-primary/20': b.estado === 'Aprobada',
                        'bg-warning-container text-warning border border-warning/20': b.estado === 'En Revisión',
                        'bg-surface-container-high text-on-surface-variant border border-stone-200/50': b.estado === 'Pendiente'
                      }" class="text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                        {{ b.estado }}
                      </span>
                    </td>
                    <td class="px-8 py-6 text-right">
                      <button v-if="b.estado !== 'Pendiente'" class="w-10 h-10 rounded-xl text-primary hover:bg-primary/10 transition-all flex items-center justify-center ml-auto">
                        <span class="material-symbols-outlined fill-icon text-[20px]">visibility</span>
                      </button>
                      <div v-else class="w-10 h-10 rounded-xl text-stone-300 flex items-center justify-center ml-auto">
                        <span class="material-symbols-outlined text-[20px]">lock</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Floating Action Button -->
    <button class="fixed bottom-10 right-10 w-16 h-16 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50 group">
      <span class="material-symbols-outlined text-[30px] group-hover:rotate-12 transition-transform">support_agent</span>
    </button>
  </div>
</template>

<style scoped>
.font-headline { font-family: 'Outfit', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
.font-label { font-family: 'Manrope', sans-serif; }

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.fill-icon {
  font-variation-settings: 'FILL' 1;
}

.shadow-premium {
  box-shadow: 0 4px 30px -4px rgba(0, 0, 0, 0.04), 0 2px 15px -2px rgba(0, 0, 0, 0.02);
}
</style>