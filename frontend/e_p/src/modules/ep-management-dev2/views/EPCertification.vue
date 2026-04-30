<script setup>
import { ref, computed } from 'vue'

// --- Estado de los Documentos ---
const documentos = ref([
  {
    id: 'EP_CERTIFICATE',
    titulo: 'Certificado EP',
    descripcion: 'Certificado de Finalización de Etapa Productiva',
    estado: 'Pendiente',
    icon: 'verified',
    archivo: null
  },
  {
    id: 'PERFORMANCE_EVALUATION',
    titulo: 'Evaluación de Desempeño',
    descripcion: 'Evaluación de Desempeño por el Co-formador',
    estado: 'Rechazado',
    icon: 'assignment_turned_in',
    archivo: { nombre: 'evaluacion_v1_corregida.pdf', tamaño: '1.2 MB', fecha: 'Hace 2 días' }
  },
  {
    id: 'COMMITMENT_LETTER',
    titulo: 'Carta de Compromiso',
    descripcion: 'Carta de Compromiso de Permanencia',
    estado: 'Aprobado',
    icon: 'handshake',
    archivo: { nombre: 'carta_compromiso_final.pdf', fecha: 'Hoy 10:45 AM' }
  }
])

// --- Observaciones del Admin ---
const observaciones = ref([
  {
    autor: 'Coordinador SENA',
    mensaje: 'El documento de Evaluación de Desempeño no tiene la firma del representante legal de la empresa. Por favor, asegúrate de que esté firmado y escaneado nuevamente.',
    fecha: 'Hace 2 horas',
    tipo: 'error'
  },
  {
    autor: 'Coordinador SENA',
    mensaje: 'Carta de compromiso verificada correctamente.',
    fecha: 'Ayer 09:12 AM',
    tipo: 'success'
  }
])

// --- Métodos ---
const handleFileUpload = (id) => {
  console.log(`Abriendo selector de archivos para: ${id}`)
}

const deleteFile = (id) => {
  const doc = documentos.value.find(d => d.id === id)
  if (doc) doc.archivo = null
}

const solicitarRevision = () => {
  alert("Solicitud enviada al coordinador.")
}

// --- Propiedades Computadas ---
const progreso = computed(() => {
  const aprobados = documentos.value.filter(d => d.estado === 'Aprobado').length
  return Math.round((aprobados / documentos.value.length) * 100)
})

const totalCargados = computed(() => documentos.value.filter(d => d.archivo).length)
const totalAprobados = computed(() => documentos.value.filter(d => d.estado === 'Aprobado').length)
</script>

<template>
  <div class="min-h-screen bg-background font-body text-on-surface antialiased">
    
    <!-- Top Navigation -->
    <nav class="fixed top-0 right-0 left-0 lg:left-64 h-16 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-8 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <span class="text-primary font-headline font-bold tracking-tight text-lg">REPFORA</span>
        <div class="hidden md:flex gap-6">
          <a href="#" class="text-sm font-label font-bold text-on-surface-variant hover:text-on-surface transition-colors">Etapa Productiva</a>
          <a href="#" class="text-sm font-label font-bold text-on-surface-variant hover:text-on-surface transition-colors">Empresas</a>
          <a href="#" class="text-sm font-label font-bold text-primary border-b-2 border-primary pb-1">Certificación</a>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <button class="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors text-on-surface-variant relative">
          <span class="material-symbols-outlined text-[22px]">notifications</span>
          <span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
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
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold text-on-surface-variant hover:bg-stone-200/50 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined text-[20px]">analytics</span> ETAPA PRODUCTIVA
        </a>
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold text-on-surface-variant hover:bg-stone-200/50 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined text-[20px]">business</span> DIRECTORIO
        </a>
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold bg-white text-primary shadow-sm border border-stone-200/40 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined fill-icon text-[20px]">description</span> DOCUMENTACIÓN
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

    <main class="lg:ml-64 pt-24 px-8 lg:px-12 pb-12">
      <header class="max-w-7xl mx-auto mb-10">
        <h1 class="font-headline text-5xl font-extrabold tracking-tight text-on-surface mb-2">Certificación Final</h1>
        <p class="font-body text-on-surface-variant text-lg max-w-2xl leading-relaxed">
          Carga la documentación requerida para finalizar tu proceso de Etapa Productiva. Todos los documentos deben estar en formato PDF.
        </p>
      </header>

      <div class="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
        <!-- Documents Section -->
        <div class="col-span-12 lg:col-span-8 space-y-6">
          <section 
            v-for="doc in documentos" 
            :key="doc.id"
            class="bg-white rounded-[2rem] p-8 shadow-premium border border-stone-100/60 transition-all hover:shadow-lg group"
          >
            <div class="flex items-center justify-between mb-8">
              <div class="flex items-center gap-5">
                <div class="w-14 h-14 bg-surface-container-low rounded-2xl flex items-center justify-center border border-stone-100 text-primary shadow-inner group-hover:scale-105 transition-transform">
                  <span class="material-symbols-outlined fill-icon text-3xl">{{ doc.icon }}</span>
                </div>
                <div>
                  <h3 class="font-headline text-xl font-extrabold">{{ doc.titulo }}</h3>
                  <p class="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">{{ doc.descripcion }}</p>
                </div>
              </div>
              <span 
                class="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border"
                :class="{
                  'bg-warning-container text-warning border-warning/20': doc.estado === 'Pendiente',
                  'bg-error-container text-error border-error/20': doc.estado === 'Rechazado',
                  'bg-primary-light text-primary border-primary/20': doc.estado === 'Aprobado'
                }"
              >
                {{ doc.estado }}
              </span>
            </div>

            <!-- Upload Zone -->
            <div 
              v-if="!doc.archivo"
              @click="handleFileUpload(doc.id)"
              class="border-2 border-dashed border-stone-200 rounded-[1.5rem] bg-stone-50/50 p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all group/upload"
            >
              <div class="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 group-hover/upload:translate-y-[-4px] transition-transform">
                 <span class="material-symbols-outlined text-3xl text-stone-400 group-hover/upload:text-primary transition-colors">upload_file</span>
              </div>
              <p class="text-sm font-bold text-on-surface mb-1">Haz clic o arrastra el archivo aquí</p>
              <p class="text-xs text-on-surface-variant font-medium opacity-60">Soportado: PDF (Máx. 5MB)</p>
            </div>

            <!-- File Info -->
            <div 
              v-else 
              class="bg-surface-container-low/50 rounded-2xl p-5 flex items-center gap-5 border border-stone-100 relative overflow-hidden"
            >
              <div class="absolute left-0 top-0 bottom-0 w-1.5" :class="doc.estado === 'Aprobado' ? 'bg-primary' : 'bg-error'"></div>
              <div class="w-12 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-2xl" :class="doc.estado === 'Aprobado' ? 'text-primary' : 'text-error'">
                   {{ doc.estado === 'Aprobado' ? 'task' : 'picture_as_pdf' }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-base font-bold truncate text-primary">{{ doc.archivo.nombre }}</p>
                <p class="text-xs text-on-surface-variant font-medium">{{ doc.archivo.fecha }} • {{ doc.archivo.tamaño || 'Verificado' }}</p>
              </div>
              <div class="flex gap-2">
                <button class="w-10 h-10 bg-white text-primary rounded-xl shadow-sm hover:bg-primary hover:text-white transition-all flex items-center justify-center">
                  <span class="material-symbols-outlined text-[20px] fill-icon">visibility</span>
                </button>
                <button v-if="doc.estado !== 'Aprobado'" @click.stop="deleteFile(doc.id)" class="w-10 h-10 bg-white text-error rounded-xl shadow-sm hover:bg-error hover:text-white transition-all flex items-center justify-center">
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- Sidebar Info -->
        <div class="col-span-12 lg:col-span-4 space-y-8">
          <!-- Summary Card -->
          <section class="bg-white rounded-[2.5rem] p-10 shadow-premium border border-stone-100/60">
            <h4 class="font-headline text-2xl font-extrabold mb-8">Resumen de Revisión</h4>
            
            <div class="space-y-8">
              <div class="space-y-3">
                <div class="flex justify-between items-end">
                  <span class="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Progreso General</span>
                  <span class="text-xl font-black text-primary">{{ progreso }}%</span>
                </div>
                <div class="h-3 w-full bg-surface-container-high rounded-full overflow-hidden shadow-inner">
                  <div class="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(57,169,0,0.3)]" :style="{ width: progreso + '%' }"></div>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="bg-surface-container-low p-4 rounded-2xl text-center border border-stone-100">
                  <p class="text-[9px] font-black text-on-surface-variant uppercase tracking-tighter mb-1">Cargados</p>
                  <p class="text-xl font-black">{{ totalCargados }}/3</p>
                </div>
                <div class="bg-primary/5 p-4 rounded-2xl text-center border border-primary/10">
                  <p class="text-[9px] font-black text-primary uppercase tracking-tighter mb-1">Aprobados</p>
                  <p class="text-xl font-black text-primary">{{ totalAprobados }}</p>
                </div>
                <div class="bg-error/5 p-4 rounded-2xl text-center border border-error/10">
                  <p class="text-[9px] font-black text-error uppercase tracking-tighter mb-1">Alertas</p>
                  <p class="text-xl font-black text-error">1</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Observaciones Section -->
          <section class="bg-surface-container-high/60 backdrop-blur-sm rounded-[2.5rem] p-8 relative overflow-hidden">
            <div class="flex items-center gap-3 mb-8">
               <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <span class="material-symbols-outlined text-on-surface-variant">forum</span>
               </div>
               <h4 class="font-headline text-2xl font-extrabold">Observaciones</h4>
            </div>

            <div class="space-y-6">
              <div v-for="(obs, index) in observaciones" :key="index" class="flex gap-4">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-stone-100">
                  <span class="material-symbols-outlined text-primary text-[16px] fill-icon">shield_person</span>
                </div>
                <div class="bg-white/90 rounded-[1.5rem] rounded-tl-none p-5 shadow-sm backdrop-blur-sm border border-stone-100">
                  <p class="text-[11px] font-black text-on-surface mb-2">{{ obs.autor }}</p>
                  <p class="text-xs leading-relaxed font-medium" :class="obs.tipo === 'error' ? 'text-on-surface' : 'text-on-surface-variant'">
                    <span v-if="obs.tipo === 'error'" class="text-error font-bold">El documento de Evaluación de Desempeño</span> 
                    {{ obs.mensaje.replace('El documento de Evaluación de Desempeño', '') }}
                  </p>
                  <p class="text-[10px] text-on-surface-variant font-bold opacity-40 mt-3">{{ obs.fecha }}</p>
                </div>
              </div>
            </div>

            <button @click="solicitarRevision" class="w-full mt-10 py-5 bg-primary text-white font-black font-label text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3">
              <span class="material-symbols-outlined fill-icon text-[20px]">send</span>
              Solicitar Revisión Final
            </button>
          </section>
          
          <!-- Institutional Card Footer -->
          <div class="bg-gradient-to-br from-secondary to-secondary-light rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl">
             <div class="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
             <div class="relative z-10">
                <span class="material-symbols-outlined text-4xl mb-6 opacity-60">architecture</span>
                <h5 class="text-xl font-headline font-extrabold mb-2">Arquitecto Institucional</h5>
                <p class="text-xs text-white/70 leading-relaxed font-medium">Construyendo tu futuro profesional paso a paso.</p>
                <div class="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
                   <div class="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black tracking-widest uppercase">RepFora 2024</div>
                   <div class="px-3 py-1 bg-primary rounded-full text-[9px] font-black tracking-widest uppercase">Safe & Work</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>
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
