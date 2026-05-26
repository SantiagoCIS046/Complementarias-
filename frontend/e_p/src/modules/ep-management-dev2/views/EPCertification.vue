<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BtnBack from '@/layouts/btnBackLayout.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import { useAlert } from '@/core/composables/useAlert'
import { epService } from '../services/ep.service'
import http from '@/core/api/http'

const { showSuccess, showError } = useAlert()
const router = useRouter()

const stage = ref(null)
const certData = ref(null)
const loading = ref(true)
const fileInputs = ref({}) // Para almacenar referencias a los inputs de archivo
const uploading = ref({}) // Para almacenar el estado de subida por tipo de documento

async function loadData() {
  loading.value = true
  try {
    const res = await epService.getAll()
    const stages = res.data?.data || []
    if (stages.length > 0) {
      stage.value = stages[0]
      const certRes = await epService.getEstadoCertificacion(stage.value._id)
      certData.value = certRes.data?.data || certRes.data
    }
  } catch (err) {
    console.error('Error al cargar datos de certificación:', err)
  } finally {
    loading.value = false
  }
}

const currentPhase = computed(() => {
  if (!stage.value) return 'Activo'
  const est = stage.value.estado
  if (['SOLICITUD', 'REGISTRO'].includes(est)) return 'Activo'
  if (['VALIDACION', 'RECHAZADO'].includes(est)) return 'Validación'
  if (['APROBADO', 'EN_CURSO'].includes(est)) return 'Proceso'
  if (['FINALIZADO', 'CERTIFICADO'].includes(est)) return 'Finalizado'
  return 'Activo'
})

const mappedDocumentos = computed(() => {
  if (!certData.value || !certData.value.documentos) return []
  return certData.value.documentos.map(doc => {
    let titulo = ''
    let descripcion = ''
    let icon = ''

    if (doc.tipoDocumento === 'ACTA_INICIO') {
      titulo = 'Acta de Inicio'
      descripcion = 'Acta de Inicio firmada por las partes'
      icon = 'assignment_turned_in'
    } else if (doc.tipoDocumento === 'EVALUACION_FINAL') {
      titulo = 'Evaluación de Desempeño (Final)'
      descripcion = 'Evaluación de desempeño firmada por el co-formador'
      icon = 'rate_review'
    } else if (doc.tipoDocumento === 'CERTIFICADO_EP') {
      titulo = 'Certificación de la Empresa'
      descripcion = 'Certificado emitido por la empresa al finalizar la EP'
      icon = 'workspace_premium'
    } else if (doc.tipoDocumento === 'SOPORTES_FINALES') {
      titulo = 'Soportes Finales'
      descripcion = 'PDF compilado de todos los soportes (Paz y Salvo, Cédula 150%, TyT, etc.)'
      icon = 'folder_shared'
    }

    return {
      tipoDocumento: doc.tipoDocumento,
      titulo,
      descripcion,
      estado: doc.estado === 'NO_SUBIDO' ? 'Pendiente' : doc.estado === 'PENDIENTE' ? 'En Revisión' : doc.estado === 'APROBADO' ? 'Aprobado' : 'Rechazado',
      estadoRaw: doc.estado,
      icon,
      archivo: doc.subido ? { nombre: doc.nombreArchivo || 'documento.pdf', url: doc.url, observaciones: doc.observaciones } : null
    }
  })
})

const objections = computed(() => {
  if (!certData.value || !certData.value.documentos) return []
  return certData.value.documentos
    .filter(d => d.estado === 'RECHAZADO' && d.observaciones)
    .map(d => {
      const docMapped = mappedDocumentos.value.find(m => m.tipoDocumento === d.tipoDocumento)
      return {
        autor: 'Instructor / Coordinador SENA',
        mensaje: d.observaciones,
        docName: docMapped?.titulo || d.tipoDocumento,
        fecha: 'Reciente',
        tipo: 'error'
      }
    })
})

const progreso = computed(() => {
  if (mappedDocumentos.value.length === 0) return 0
  const aprobados = mappedDocumentos.value.filter(d => d.estado === 'Aprobado').length
  return Math.round((aprobados / mappedDocumentos.value.length) * 100)
})

const totalCargados = computed(() => mappedDocumentos.value.filter(d => d.archivo).length)
const totalAprobados = computed(() => mappedDocumentos.value.filter(d => d.estado === 'Aprobado').length)

const handleFileUpload = (tipoDocumento) => {
  const el = fileInputs.value[tipoDocumento]
  if (el) el.click()
}

const onFileSelected = async (e, tipoDocumento) => {
  const file = e.target.files[0]
  if (!file) return

  if (file.type !== 'application/pdf') {
    showError('Formato inválido', 'Solo se permiten archivos en formato PDF.')
    e.target.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    showError('Archivo muy grande', 'El archivo supera el límite permitido de 5MB.')
    e.target.value = ''
    return
  }

  uploading.value[tipoDocumento] = true
  try {
    const fData = new FormData()
    fData.append('stageId', stage.value._id)
    fData.append('tipoDocumento', tipoDocumento)
    fData.append('archivo', file)

    await http.post('/documents/upload', fData)
    showSuccess('¡Éxito!', `El archivo para ${mapDocTitle(tipoDocumento)} se cargó correctamente.`)
    await loadData()
  } catch (err) {
    showError('Error al subir', err.response?.data?.message || 'No se pudo subir el archivo.')
  } finally {
    uploading.value[tipoDocumento] = false
    e.target.value = ''
  }
}

const deleteFile = (tipoDocumento) => {
  // Limpiamos el archivo localmente para forzar la re-subida
  const doc = mappedDocumentos.value.find(d => d.tipoDocumento === tipoDocumento)
  if (doc) doc.archivo = null
  showSuccess('Re-subida habilitada', 'Puedes arrastrar o seleccionar un nuevo archivo PDF.')
}

const solicitarRevision = () => {
  if (progreso.value < 100) {
    showError('Incompleto', 'Debes cargar y tener aprobados todos los documentos de certificación.')
    return
  }
  showSuccess('Solicitud Enviada', 'La solicitud de certificación final ha sido enviada con éxito al coordinador.')
}

function mapDocTitle(tipo) {
  if (tipo === 'ACTA_INICIO') return 'Acta de Inicio'
  if (tipo === 'EVALUACION_FINAL') return 'Evaluación Final'
  if (tipo === 'CERTIFICADO_EP') return 'Certificación de la Empresa'
  if (tipo === 'SOPORTES_FINALES') return 'Soportes Finales'
  return tipo
}

onMounted(loadData)
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header title="Certificación Final de Etapa Productiva" />

      <main class="content">
        <div class="w-full space-y-4">
          <!-- 1. Botón volver -->
          <BtnBack route="/mi-ep" />

          <p class="font-body text-gray-500 text-lg max-w-3xl leading-relaxed">
            Carga la documentación requerida para finalizar tu proceso institucional. Todos los documentos deben estar en formato PDF (máximo 5MB).
          </p>

          <div v-if="loading" style="padding: 40px; text-align: center;">
            <p style="color: #64748B; font-weight: 600;">Cargando estado de la certificación institucional...</p>
          </div>

          <div v-else class="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
            <!-- Left Side: Stepper & Documents -->
            <div class="col-span-12 lg:col-span-8 space-y-6">
              
              <!-- STEPPER GRAFICO DE ESTADOS (RF-APR-12) -->
              <div class="bg-white rounded-[2rem] p-4 sm:p-8 shadow-premium border border-stone-100/60 mb-6">
                <h4 class="font-headline text-lg font-extrabold mb-6">Fases del Proceso de Etapa Productiva</h4>
                <div class="flex items-center justify-between relative" style="max-width: 600px; margin: 0 auto;">
                  <!-- Line behind -->
                  <div class="absolute top-5 left-8 right-8 h-1 bg-stone-200 z-0">
                    <div class="h-full bg-primary transition-all duration-500" :style="{
                      width: currentPhase === 'Activo' ? '0%' : currentPhase === 'Validación' ? '33%' : currentPhase === 'Proceso' ? '66%' : '100%'
                    }"></div>
                  </div>

                  <!-- Step 1: Activo -->
                  <div class="flex flex-col items-center z-10">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all" :class="{
                      'bg-primary text-white border-primary shadow-[0_0_10px_rgba(57,169,0,0.4)]': currentPhase === 'Activo' || ['Validación', 'Proceso', 'Finalizado'].includes(currentPhase),
                      'bg-white text-stone-400 border-stone-200': currentPhase !== 'Activo' && !['Validación', 'Proceso', 'Finalizado'].includes(currentPhase)
                    }">
                      <span class="material-symbols-outlined text-lg" v-if="['Validación', 'Proceso', 'Finalizado'].includes(currentPhase)">check</span>
                      <span v-else>1</span>
                    </div>
                    <span class="text-xs font-bold mt-2" :class="currentPhase === 'Activo' ? 'text-primary' : 'text-stone-500'">Activo</span>
                  </div>

                  <!-- Step 2: Validación -->
                  <div class="flex flex-col items-center z-10">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all" :class="{
                      'bg-primary text-white border-primary shadow-[0_0_10px_rgba(57,169,0,0.4)]': currentPhase === 'Validación' || ['Proceso', 'Finalizado'].includes(currentPhase),
                      'bg-white text-stone-400 border-stone-200': currentPhase !== 'Validación' && !['Proceso', 'Finalizado'].includes(currentPhase)
                    }">
                      <span class="material-symbols-outlined text-lg" v-if="['Proceso', 'Finalizado'].includes(currentPhase)">check</span>
                      <span v-else>2</span>
                    </div>
                    <span class="text-xs font-bold mt-2" :class="currentPhase === 'Validación' ? 'text-primary' : 'text-stone-500'">Validación</span>
                  </div>

                  <!-- Step 3: Proceso -->
                  <div class="flex flex-col items-center z-10">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all" :class="{
                      'bg-primary text-white border-primary shadow-[0_0_10px_rgba(57,169,0,0.4)]': currentPhase === 'Proceso' || currentPhase === 'Finalizado',
                      'bg-white text-stone-400 border-stone-200': currentPhase !== 'Proceso' && currentPhase !== 'Finalizado'
                    }">
                      <span class="material-symbols-outlined text-lg" v-if="currentPhase === 'Finalizado'">check</span>
                      <span v-else>3</span>
                    </div>
                    <span class="text-xs font-bold mt-2" :class="currentPhase === 'Proceso' ? 'text-primary' : 'text-stone-500'">Proceso</span>
                  </div>

                  <!-- Step 4: Finalizado -->
                  <div class="flex flex-col items-center z-10">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all" :class="{
                      'bg-primary text-white border-primary shadow-[0_0_10px_rgba(57,169,0,0.4)]': currentPhase === 'Finalizado',
                      'bg-white text-stone-400 border-stone-200': currentPhase !== 'Finalizado'
                    }">
                      <span>4</span>
                    </div>
                    <span class="text-xs font-bold mt-2" :class="currentPhase === 'Finalizado' ? 'text-primary' : 'text-stone-500'">Finalizado</span>
                  </div>
                </div>
              </div>

              <section 
                v-for="doc in mappedDocumentos" 
                :key="doc.tipoDocumento"
                class="bg-white rounded-[2rem] p-4 sm:p-8 shadow-premium border border-stone-100/60 transition-all hover:shadow-lg group"
              >
                <!-- Hidden File Inputs -->
                <input 
                  type="file" 
                  :ref="el => fileInputs[doc.tipoDocumento] = el" 
                  @change="onFileSelected($event, doc.tipoDocumento)" 
                  accept=".pdf" 
                  style="display: none;" 
                />

                <div class="flex items-center justify-between mb-6">
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
                      'bg-primary-light text-primary border-primary/20': doc.estado === 'Aprobado',
                      'bg-stone-100 text-stone-500 border-stone-200': doc.estado === 'NO_SUBIDO'
                    }"
                  >
                    {{ doc.estado }}
                  </span>
                </div>

                <!-- Upload Zone -->
                <div 
                  v-if="!doc.archivo"
                  @click="handleFileUpload(doc.tipoDocumento)"
                  class="border-2 border-dashed border-stone-200 rounded-[1.5rem] bg-stone-50/50 p-6 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all group/upload"
                >
                  <div class="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 group-hover/upload:translate-y-[-4px] transition-transform">
                    <span v-if="uploading[doc.tipoDocumento]" class="material-symbols-outlined text-3xl text-primary animate-spin">sync</span>
                    <span v-else class="material-symbols-outlined text-3xl text-stone-400 group-hover/upload:text-primary transition-colors">upload_file</span>
                  </div>
                  <p class="text-sm font-bold text-on-surface mb-1">
                    {{ uploading[doc.tipoDocumento] ? 'Subiendo documento...' : 'Haz clic o arrastra el archivo aquí' }}
                  </p>
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
                    <p class="text-xs text-on-surface-variant font-medium">Formato de verificación • PDF listo</p>
                  </div>
                  <div class="flex gap-2">
                    <a :href="doc.archivo.url" target="_blank" class="w-10 h-10 bg-white text-primary rounded-xl shadow-sm hover:bg-primary hover:text-white transition-all flex items-center justify-center text-decoration-none">
                      <span class="material-symbols-outlined text-[20px] fill-icon">visibility</span>
                    </a>
                    <button v-if="doc.estado !== 'Aprobado'" @click.stop="deleteFile(doc.tipoDocumento)" class="w-10 h-10 bg-white text-error rounded-xl shadow-sm hover:bg-error hover:text-white transition-all flex items-center justify-center">
                      <span class="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <!-- Right Side: Summary & Objections -->
            <div class="col-span-12 lg:col-span-4 space-y-8">
              <!-- Summary Card -->
              <section class="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-premium border border-stone-100/60">
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
                      <p class="text-base font-black">{{ totalCargados }}/{{ mappedDocumentos.length }}</p>
                    </div>
                    <div class="bg-primary/5 p-4 rounded-2xl text-center border border-primary/10">
                      <p class="text-[9px] font-black text-primary uppercase tracking-tighter mb-1">Aprobados</p>
                      <p class="text-base font-black text-primary">{{ totalAprobados }}</p>
                    </div>
                    <div class="bg-error/5 p-4 rounded-2xl text-center border border-error/10">
                      <p class="text-[9px] font-black text-error uppercase tracking-tighter mb-1">Alertas</p>
                      <p class="text-base font-black text-error">{{ objections.length }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Dynamic Objections Section (RF-APR-10) -->
              <section class="bg-surface-container-high/60 backdrop-blur-sm rounded-[2.5rem] p-4 sm:p-8 relative overflow-hidden">
                <div class="flex items-center gap-3 mb-8">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <span class="material-symbols-outlined text-on-surface-variant">forum</span>
                  </div>
                  <h4 class="font-headline text-2xl font-extrabold">Observaciones</h4>
                </div>

                <div class="space-y-6">
                  <div v-if="objections.length === 0" style="padding: 16px; text-align: center; color: #64748B; font-size: 13px;">
                    No tienes objeciones ni correcciones pendientes en tus documentos de certificación.
                  </div>
                  <div v-else v-for="(obs, index) in objections" :key="index" class="flex gap-4">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-stone-100">
                      <span class="material-symbols-outlined text-error text-[16px] fill-icon">warning</span>
                    </div>
                    <div class="bg-white/90 rounded-[1.5rem] rounded-tl-none p-5 shadow-sm backdrop-blur-sm border border-stone-100 flex-1">
                      <p class="text-[11px] font-black text-error mb-2">{{ obs.docName }}</p>
                      <p class="text-xs leading-relaxed font-medium text-on-surface-variant">
                        {{ obs.mensaje }}
                      </p>
                      <p class="text-[10px] text-on-surface-variant font-bold opacity-40 mt-3">{{ obs.autor }}</p>
                    </div>
                  </div>
                </div>

                <button @click="solicitarRevision" class="w-full mt-10 py-5 bg-green-9 text-white font-black font-label text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-green-10 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3">
                  <span class="material-symbols-outlined fill-icon text-[20px]">send</span>
                  Solicitar Revisión Final
                </button>
              </section>
              
              <!-- Institutional Card Footer -->
              <div class="bg-gradient-to-br from-secondary to-secondary-light rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden group shadow-xl">
                <div class="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                <div class="relative z-10">
                  <span class="material-symbols-outlined text-4xl mb-6 opacity-60">architecture</span>
                  <h5 class="text-xl font-headline font-extrabold mb-2">Arquitecto Institucional</h5>
                  <p class="text-xs text-white/70 leading-relaxed font-medium">Construyendo tu futuro profesional paso a paso.</p>
                  <div class="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
                    <div class="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black tracking-widest uppercase">RepFora 2026</div>
                    <div class="px-3 py-1 bg-primary rounded-full text-[9px] font-black tracking-widest uppercase">Safe & Work</div>
                  </div>
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
.bg-green-9 { background-color: var(--color_button); }
.bg-green-10 { background-color: #1b5e20; }
.text-primary { color: var(--color_button); }
.bg-primary { background-color: var(--color_button); }

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}

@media (max-width: 480px) {
  .w-10 {
    width: 2rem !important;
    height: 2rem !important;
  }
  .h-10 {
    height: 2rem !important;
  }
  .text-xs {
    font-size: 10px !important;
  }
}
</style>
