<template>
  <div class="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header />

      <main class="flex-1 overflow-y-auto pt-20 pb-12 px-4 md:px-12 flex flex-col items-center">
        <div class="w-full max-w-[1400px] mt-10 space-y-10">

          <!-- Encabezado de Página -->
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div class="space-y-1">
              <HeaderLayout title="Agenda de Seguimientos Técnicos" icon="event_note" class="!mb-0" />
              <p class="text-gray-500 font-medium text-sm ml-1">Gestión de visitas y acompañamiento a sus aprendices.</p>
            </div>
            <div class="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <span class="material-symbols-outlined text-green-600">calendar_today</span>
              <div class="text-right">
                <span class="block text-[10px] font-extrabold text-gray-400 uppercase leading-none">FECHA ACTUAL</span>
                <span class="text-sm font-bold text-gray-700">{{ currentDate }}</span>
              </div>
            </div>
          </div>

          <!-- Tarjetas de Estadísticas -->
          <section class="stats-grid-agenda">
            <div class="stat-card-agenda">
              <div class="stat-content">
                <span class="stat-label">Visitas Pendientes</span>
                <h2 class="stat-value">{{ stats.pendientes }}</h2>
              </div>
              <div class="stat-icon-agenda bg-yellow-soft">
                <span class="material-symbols-outlined">work_history</span>
              </div>
            </div>
            
            <div class="stat-card-agenda">
              <div class="stat-content">
                <span class="stat-label">Visitas Realizadas</span>
                <h2 class="stat-value">{{ stats.realizadas }}</h2>
              </div>
              <div class="stat-icon-agenda bg-green-soft">
                <span class="material-symbols-outlined">task_alt</span>
              </div>
            </div>

            <div class="stat-card-agenda">
              <div class="stat-content">
                <span class="stat-label">Bitácoras con Atraso</span>
                <h2 class="stat-value">{{ stats.atrasadas }}</h2>
              </div>
              <div class="stat-icon-agenda bg-red-soft">
                <span class="material-symbols-outlined">priority_high</span>
              </div>
            </div>
          </section>

          <!-- Barra de Filtros y Acciones -->
          <section class="filters-bar-agenda">
            <div class="filters-left">
              <div class="search-input-wrapper">
                <span class="material-symbols-outlined">search</span>
                <input type="text" v-model="searchQuery" placeholder="Buscar Doc, Nombre o Ficha..." />
              </div>
              
              <select v-model="typeFilter" class="select-premium">
                <option value="TODOS">Tipo de Visita</option>
                <option value="INICIAL">Inicial</option>
                <option value="PARCIAL">Parcial</option>
                <option value="FINAL">Final</option>
              </select>

              <select v-model="statusFilter" class="select-premium">
                <option value="TODOS">Estado Visita</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="REALIZADA">Realizada</option>
                <option value="PROGRAMADA">Programada</option>
              </select>
            </div>

            <button class="btn-programar" @click="fetchData">
              <span class="material-symbols-outlined">sync</span>
              Sincronizar
            </button>
          </section>

          <!-- Tabla de Seguimientos -->
          <section class="table-container-agenda">
            <div v-if="isLoading" class="p-12 text-center text-gray-400">
               <div class="inline-block w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
               <p class="font-bold text-sm">Consultando base de datos real...</p>
            </div>
            <div v-else class="scrollable-table-wrapper">
              <table class="premium-table">
                <thead>
                  <tr>
                    <th>APRENDIZ</th>
                    <th>EMPRESA / FICHA</th>
                    <th>INSTRUCTOR</th>
                    <th>TIPO VISITA</th>
                    <th>ESTADO BITÁCORAS</th>
                    <th>FECHA VISITA</th>
                    <th>ESTADO SEGUIMIENTO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="seg in filteredSeguimientos" :key="seg.id">
                    <td>
                      <div class="user-cell">
                        <div class="avatar">{{ seg.initials }}</div>
                        <span class="user-name">{{ seg.name }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="company-cell">
                        <span class="company-name">{{ seg.company }}</span>
                        <span class="ficha-tag">FICHA: {{ seg.ficha }}</span>
                      </div>
                    </td>
                    <td><span class="text-xs font-bold text-gray-600">{{ seg.instructor }}</span></td>
                    <td><span class="badge-type" :class="seg.type.toLowerCase()">{{ seg.type }}</span></td>
                    <td><span class="badge-logs" :class="seg.logsStatus.replace(' ', '-').toLowerCase()">{{ seg.logsStatus }}</span></td>
                    <td><span class="visit-date">{{ seg.date }}</span></td>
                    <td><span class="badge-status" :class="seg.status.toLowerCase()">{{ seg.status }}</span></td>
                    <td>
                      <div class="actions-cell">
                        <button v-if="seg.status === 'PENDIENTE' || seg.status === 'PROGRAMADA'" class="btn-upload" @click="openTrackingModal(seg)">
                          <span class="material-symbols-outlined">description</span>
                          Subir Acta PDF
                        </button>
                        <button v-else class="btn-view-acta" @click="viewActa(seg)">
                          <span class="material-symbols-outlined">visibility</span>
                          Ver Acta
                        </button>
                        <button class="btn-edit-inline" @click="openTrackingModal(seg, true)"><span class="material-symbols-outlined">edit</span></button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="filteredSeguimientos.length === 0">
                    <td colspan="8" class="p-12 text-center text-gray-400 font-medium italic">
                      No se encontraron seguimientos para los filtros aplicados.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Paginación -->
            <footer class="table-footer">
              <span class="results-info">Mostrando {{ filteredSeguimientos.length }} de {{ seguimientos.length }} registros encontrados</span>
              <div class="pagination">
                <button class="p-btn"><span class="material-symbols-outlined">chevron_left</span></button>
                <button class="p-num active">1</button>
                <button class="p-btn"><span class="material-symbols-outlined">chevron_right</span></button>
              </div>
            </footer>
          </section>

          <!-- Modal de Registro/Edición de Seguimiento -->
          <div v-if="showModal" class="modal-overlay">
            <div class="modal-content-premium">
              <div class="modal-header">
                <div class="header-title-group">
                  <span class="material-symbols-outlined header-icon">assignment_turned_in</span>
                  <div>
                    <h3 class="text-lg font-bold">{{ isEditing ? 'Editar Seguimiento' : 'Registrar Seguimiento' }}</h3>
                    <p class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{{ currentSeg?.name }} - {{ currentSeg?.type }}</p>
                  </div>
                </div>
                <button class="close-btn" @click="closeModal"><span class="material-symbols-outlined">close</span></button>
              </div>

              <div class="modal-body space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div class="input-group">
                    <label>Fecha de Visita</label>
                    <input type="date" v-model="formData.fechaVisita" />
                  </div>
                  <div class="input-group">
                    <label>Lugar de Visita</label>
                    <input type="text" v-model="formData.lugarVisita" placeholder="Ej: Instalaciones Empresa" />
                  </div>
                </div>

                <div class="input-group">
                  <label>Observaciones del Instructor</label>
                  <textarea v-model="formData.observaciones" rows="3" placeholder="Resumen de la visita y desempeño del aprendiz..."></textarea>
                </div>

                <div class="input-group">
                  <label>Compromisos Adquiridos</label>
                  <textarea v-model="formData.compromisos" rows="2" placeholder="Acciones a seguir..."></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="input-group">
                    <label>Calificación</label>
                    <select v-model="formData.calificacion">
                      <option value="EXCELENTE">Excelente</option>
                      <option value="BUENO">Bueno</option>
                      <option value="ACEPTABLE">Aceptable</option>
                      <option value="DEFICIENTE">Deficiente</option>
                    </select>
                  </div>
                  <div class="input-group">
                    <label>Acta Firmada (PDF)</label>
                    <div class="file-upload-wrapper" :class="{ 'has-file': formData.archivo }">
                      <input type="file" @change="handleFileChange" accept=".pdf" id="fileInput" class="hidden" />
                      <label for="fileInput" class="file-label">
                        <span class="material-symbols-outlined">{{ formData.archivo ? 'check_circle' : 'upload_file' }}</span>
                        {{ formData.archivo ? formData.archivo.name : 'Seleccionar PDF' }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-cancel" @click="closeModal">Cancelar</button>
                <button class="btn-save-sena" @click="saveTracking" :disabled="isSaving">
                  <template v-if="isSaving">
                    <div class="spin-sm"></div> Guardando...
                  </template>
                  <template v-else>
                    <span class="material-symbols-outlined">save</span> Guardar Seguimiento
                  </template>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import HeaderLayout from '@/layouts/headerViewsLayout.vue'
import { trackingService } from '../../operation-tracking-dev3/services/tracking.service'

const currentDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
const searchQuery = ref('')
const typeFilter = ref('TODOS')
const statusFilter = ref('TODOS')
const isLoading = ref(true)
const isSaving = ref(false)

const seguimientos = ref([])

// Estado del Modal
const showModal = ref(false)
const isEditing = ref(false)
const currentSeg = ref(null)
const formData = ref({
  fechaVisita: new Date().toISOString().split('T')[0],
  lugarVisita: '',
  observaciones: '',
  compromisos: '',
  calificacion: 'EXCELENTE',
  archivo: null
})

const fetchData = async () => {
  isLoading.value = true
  console.log('📡 Iniciando sincronización de datos...')
  try {
    const [stagesRes, trackingsRes] = await Promise.all([
      trackingService.getMyApprentices(),
      trackingService.getAllTrackings()
    ])
    
    console.log('✅ Respuesta de Etapas:', stagesRes.data)
    console.log('✅ Respuesta de Seguimientos:', trackingsRes.data)

    const stages = stagesRes.data.data || []
    const allTrackings = trackingsRes.data.data || []

    const results = []

    stages.forEach(stage => {
      const apprentice = stage.apprenticeId || {}
      const company = stage.companyId || stage.companySnapshot || {}
      
      const tiposVisita = [
        { label: 'INICIAL', months: 1, num: 1 },
        { label: 'PARCIAL', months: 3, num: 2 },
        { label: 'FINAL', months: 6, num: 3 }
      ]

      tiposVisita.forEach((tipo) => {
        const trackingRealizado = allTrackings.find(t => 
          (t.stageId?._id === stage._id || t.stageId === stage._id) && t.numeroVisita === tipo.num
        )

        let visitDate = 'Sin programar'
        if (stage.fechaInicio) {
          const date = new Date(stage.fechaInicio)
          date.setMonth(date.getMonth() + tipo.months)
          visitDate = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
        }

        const logsStatus = stage.cronograma?.ritmo?.estado?.replace('_', ' ') || 'PENDIENTE'

        results.push({
          id: `${stage._id}-${tipo.label}`,
          stageId: stage._id,
          apprenticeId: apprentice._id,
          name: apprentice.name || 'Desconocido',
          initials: (apprentice.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          company: company.razonSocial || 'Sin empresa',
          ficha: stage.radicado || 'S/N',
          instructor: apprentice.instructorAsignado?.name || 'No asignado',
          type: tipo.label,
          numVisita: tipo.num,
          logsStatus: logsStatus,
          date: trackingRealizado ? new Date(trackingRealizado.fechaVisita).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : visitDate,
          rawDate: trackingRealizado ? new Date(trackingRealizado.fechaVisita) : (stage.fechaInicio ? new Date(new Date(stage.fechaInicio).setMonth(new Date(stage.fechaInicio).getMonth() + tipo.months)) : new Date(0)),
          status: trackingRealizado ? 'REALIZADA' : (stage.fechaInicio ? 'PROGRAMADA' : 'PENDIENTE'),
          trackingId: trackingRealizado ? trackingRealizado._id : null,
          evidenciaUrl: trackingRealizado ? trackingRealizado.evidenciaUrl : '',
          rawTracking: trackingRealizado
        })
      })
    })

    // Orden Cronológico: Primero los más recientes o próximos
    seguimientos.value = results.sort((a, b) => b.rawDate - a.rawDate)
  } catch (error) {
    console.error('Error fetching trackings:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)

// Lógica de Modal y Acciones
const openTrackingModal = (seg, editing = false) => {
  currentSeg.value = seg
  isEditing.value = editing
  
  if (editing && seg.rawTracking) {
    formData.value = {
      fechaVisita: new Date(seg.rawTracking.fechaVisita).toISOString().split('T')[0],
      lugarVisita: seg.rawTracking.lugarVisita || '',
      observaciones: seg.rawTracking.observaciones || '',
      compromisos: seg.rawTracking.compromisos || '',
      calificacion: seg.rawTracking.calificacion || 'EXCELENTE',
      archivo: null
    }
  } else {
    formData.value = {
      fechaVisita: new Date().toISOString().split('T')[0],
      lugarVisita: '',
      observaciones: '',
      compromisos: '',
      calificacion: 'EXCELENTE',
      archivo: null
    }
  }
  
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  currentSeg.value = null
}

const handleFileChange = (e) => {
  formData.value.archivo = e.target.files[0]
}

const saveTracking = async () => {
  if (!formData.value.observaciones) {
    alert('Por favor ingrese las observaciones de la visita.')
    return
  }

  isSaving.value = true
  try {
    let evidenciaUrl = currentSeg.value.evidenciaUrl

    // 1. Subir archivo si hay uno nuevo
    if (formData.value.archivo) {
      const fData = new FormData()
      fData.append('archivo', formData.value.archivo)
      fData.append('stageId', currentSeg.value.stageId)
      fData.append('tipoDocumento', `SEGUIMIENTO_${currentSeg.value.numVisita}`)
      
      const uploadRes = await trackingService.uploadDocument(fData)
      // El backend devuelve el objeto documento en data.data
      evidenciaUrl = uploadRes.data.data?.url || uploadRes.data.url
    }

    const payload = {
      stageId: currentSeg.value.stageId,
      apprenticeId: currentSeg.value.apprenticeId,
      numeroVisita: currentSeg.value.numVisita,
      fechaVisita: formData.value.fechaVisita,
      lugarVisita: formData.value.lugarVisita,
      observaciones: formData.value.observaciones,
      compromisos: formData.value.compromisos,
      calificacion: formData.value.calificacion,
      evidenciaUrl
    }

    if (isEditing.value && currentSeg.value.trackingId) {
      await trackingService.updateTracking(currentSeg.value.trackingId, payload)
    } else {
      await trackingService.createTracking(payload)
    }

    await fetchData()
    closeModal()
  } catch (error) {
    console.error('Error saving tracking:', error)
    alert('Error al guardar el seguimiento: ' + (error.response?.data?.message || error.message))
  } finally {
    isSaving.value = false
  }
}

const viewActa = (seg) => {
  if (seg.evidenciaUrl) {
    window.open(seg.evidenciaUrl, '_blank')
  } else {
    alert('No hay acta disponible para este seguimiento.')
  }
}

const filteredSeguimientos = computed(() => {
  return seguimientos.value.filter(s => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = s.name.toLowerCase().includes(q) || s.ficha.toLowerCase().includes(q)
    const matchesType = typeFilter.value === 'TODOS' || s.type === typeFilter.value
    const matchesStatus = statusFilter.value === 'TODOS' || s.status === statusFilter.value
    return matchesSearch && matchesType && matchesStatus
  })
})

const stats = computed(() => {
  return {
    pendientes: seguimientos.value.filter(s => s.status === 'PENDIENTE' || s.status === 'PROGRAMADA').length,
    realizadas: seguimientos.value.filter(s => s.status === 'REALIZADA').length,
    atrasadas: seguimientos.value.filter(s => s.logsStatus === 'ATRASADO').length
  }
})
</script>

<style scoped>
.dashboard-layout { display: flex; height: 100vh; background-color: #f8fafc; overflow: hidden; }
.main-content { flex: 1; display: flex; flex-direction: column; overflow-hidden: auto; }
.page-container { padding: 1rem 1.5rem; max-width: 100%; margin: 0; width: 100%; }

/* Modal Styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content-premium { background: white; width: 90%; max-width: 550px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; animation: modalIn 0.3s ease-out; }
@keyframes modalIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.modal-header { padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.header-title-group { display: flex; align-items: center; gap: 12px; }
.header-icon { color: #2e7d32; font-size: 1.8rem; }
.close-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; transition: color 0.2s; }
.close-btn:hover { color: #ef4444; }

.modal-body { padding: 1.5rem; }
.input-group { display: flex; flex-direction: column; gap: 6px; }
.input-group label { font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.input-group input, .input-group textarea, .input-group select { padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.8rem; background: #f8fafc; transition: all 0.2s; }
.input-group input:focus, .input-group textarea:focus { border-color: #2e7d32; outline: none; background: white; box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1); }

.file-upload-wrapper { border: 2px dashed #e2e8f0; border-radius: 12px; transition: all 0.2s; }
.file-upload-wrapper.has-file { border-color: #2e7d32; background: #f0fdf4; }
.file-label { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; cursor: pointer; color: #64748b; font-size: 0.75rem; font-weight: 700; }
.has-file .file-label { color: #2e7d32; }

.modal-footer { padding: 1.25rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; }
.btn-cancel { padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.8rem; color: #64748b; background: white; border: 1.5px solid #e2e8f0; cursor: pointer; }
.btn-save-sena { padding: 10px 24px; border-radius: 10px; font-weight: 700; font-size: 0.8rem; color: white; background: #2e7d32; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 6px rgba(46, 125, 50, 0.2); }
.btn-save-sena:disabled { opacity: 0.7; cursor: not-allowed; }

.spin-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Rest of the styles */
.stats-grid-agenda { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.stat-card-agenda { background: white; padding: 1rem 1.25rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border: 1px solid #edf2f7; }
.stat-label { font-size: 0.75rem; color: #718096; font-weight: 700; }
.stat-value { font-size: 1.5rem; font-weight: 800; color: #2d3748; margin: 2px 0 0; }
.stat-icon-agenda { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.stat-icon-agenda .material-symbols-outlined { font-size: 1.2rem; }

.bg-yellow-soft { background: #FFFBEB; color: #D97706; }
.bg-green-soft { background: #F0FDF4; color: #16A34A; }
.bg-red-soft { background: #FEF2F2; color: #DC2626; }

.filters-bar-agenda { display: flex; justify-content: space-between; align-items: center; background: white; padding: 0.75rem 1.25rem; border-radius: 12px; margin-bottom: 1.25rem; border: 1px solid #edf2f7; }
.filters-left { display: flex; gap: 0.75rem; align-items: center; flex: 1; }
.search-input-wrapper { position: relative; flex: 1; max-width: 300px; }
.search-input-wrapper .material-symbols-outlined { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: #a0aec0; }
.search-input-wrapper input { width: 100%; padding: 8px 10px 8px 35px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; font-size: 0.8rem; }

.select-premium { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; font-size: 0.75rem; color: #4a5568; font-weight: 700; cursor: pointer; }

.btn-programar { background: var(--color_button, #2e7d32); color: white; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.2s; }
.btn-programar:hover { filter: brightness(1.1); transform: translateY(-2px); }

.table-container-agenda { background: white; border-radius: 14px; border: 1px solid #edf2f7; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.03); }
.scrollable-table-wrapper { overflow-x: auto; width: 100%; }
.scrollable-table-wrapper::-webkit-scrollbar { height: 6px; }
.scrollable-table-wrapper::-webkit-scrollbar-track { background: transparent; }
.scrollable-table-wrapper::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 10px; }

.premium-table { width: 100%; border-collapse: collapse; min-width: 900px; }
.premium-table th { background: var(--color_header); color: white; padding: 0.75rem 1rem; text-align: left; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
.premium-table td { padding: 0.6rem 1rem; border-bottom: 1px solid #f7fafc; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar { width: 30px; height: 30px; background: #E6F4EA; color: #2e7d32; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; }
.user-name { font-weight: 700; color: #2d3748; font-size: 0.85rem; }

.company-cell { display: flex; flex-direction: column; }
.company-name { font-weight: 700; color: #4a5568; font-size: 0.8rem; }
.ficha-tag { font-size: 0.65rem; color: #a0aec0; font-weight: 800; margin-top: 1px; }

.badge-type { padding: 3px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; }
.badge-type.inicial { background: #EBF8FF; color: #3182CE; }
.badge-type.parcial { background: #F7FAFC; color: #718096; border: 1px solid #E2E8F0; }
.badge-type.final { background: #F3F4F6; color: #9CA3AF; }

.badge-logs { padding: 3px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; }
.badge-logs.atrasado { background: #FEF2F2; color: #DC2626; }
.badge-logs.al-día { background: #F0FDF4; color: #16A34A; }
.badge-logs.pendiente { background: #F7FAFC; color: #718096; }

.badge-status { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
.badge-status.pendiente { color: #D97706; border: 1px solid #FEF3C7; }
.badge-status.realizada { background: var(--color_button); color: white; }
.badge-status.programada { color: #A0AEC0; font-weight: 600; border: 1px solid #edf2f7; }

.visit-date { font-weight: 700; color: #4a5568; font-size: 0.8rem; }

.actions-cell { display: flex; align-items: center; gap: 8px; }
.btn-upload { background: #F0FDF4; color: #16A34A; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 4px; cursor: pointer; }
.btn-view-acta { background: var(--color_button); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 4px; cursor: pointer; }
.btn-edit-inline { background: transparent; border: none; color: #CBD5E0; cursor: pointer; }
.btn-edit-inline .material-symbols-outlined { font-size: 1.1rem; }

.table-footer { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-top: 1px solid #edf2f7; }
.results-info { font-size: 0.75rem; color: #718096; font-weight: 700; }
.pagination { display: flex; align-items: center; gap: 6px; }
.p-num { width: 28px; height: 28px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; font-size: 0.75rem; font-weight: 700; color: #4a5568; cursor: pointer; }
.p-num.active { background: var(--color_button); color: white; border-color: var(--color_button); }
.p-btn { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px; color: #a0aec0; cursor: pointer; }
.p-btn .material-symbols-outlined { font-size: 1.1rem; }

/* Header */
.page-header-premium { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
.page-main-title { font-size: 1.4rem; font-weight: 800; color: #1a202c; margin: 0; letter-spacing: -0.5px; }
.page-subtitle { color: #718096; font-size: 0.8rem; margin-top: 2px; }
.header-date { text-align: right; }
.header-date .label { display: block; font-size: 0.55rem; font-weight: 800; color: #a0aec0; letter-spacing: 1px; }
.header-date .date { font-size: 0.75rem; font-weight: 700; color: #2d3748; }

/* Stats Grid */
.stats-grid-agenda { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.stat-card-agenda { background: white; padding: 1rem 1.25rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border: 1px solid #edf2f7; }
.stat-label { font-size: 0.75rem; color: #718096; font-weight: 700; }
.stat-value { font-size: 1.5rem; font-weight: 800; color: #2d3748; margin: 2px 0 0; }
.stat-icon-agenda { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.stat-icon-agenda .material-symbols-outlined { font-size: 1.2rem; }

.bg-yellow-soft { background: #FFFBEB; color: #D97706; }
.bg-green-soft { background: #F0FDF4; color: #16A34A; }
.bg-red-soft { background: #FEF2F2; color: #DC2626; }

/* Filters Bar */
.filters-bar-agenda { display: flex; justify-content: space-between; align-items: center; background: white; padding: 0.75rem 1.25rem; border-radius: 12px; margin-bottom: 1.25rem; border: 1px solid #edf2f7; }
.filters-left { display: flex; gap: 0.75rem; align-items: center; flex: 1; }
.search-input-wrapper { position: relative; flex: 1; max-width: 300px; }
.search-input-wrapper .material-symbols-outlined { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: #a0aec0; }
.search-input-wrapper input { width: 100%; padding: 8px 10px 8px 35px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; font-size: 0.8rem; }

.select-premium { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; font-size: 0.75rem; color: #4a5568; font-weight: 700; cursor: pointer; }

.btn-programar { background: var(--color_button, #2e7d32); color: white; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.2s; }
.btn-programar:hover { filter: brightness(1.1); transform: translateY(-2px); }

/* Table */
.table-container-agenda { background: white; border-radius: 14px; border: 1px solid #edf2f7; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.03); }
.scrollable-table-wrapper { overflow-x: auto; width: 100%; }
.scrollable-table-wrapper::-webkit-scrollbar { height: 6px; }
.scrollable-table-wrapper::-webkit-scrollbar-track { background: transparent; }
.scrollable-table-wrapper::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 10px; }

.premium-table { width: 100%; border-collapse: collapse; min-width: 900px; }
.premium-table th { background: var(--color_header); color: white; padding: 0.75rem 1rem; text-align: left; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
.premium-table td { padding: 0.6rem 1rem; border-bottom: 1px solid #f7fafc; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar { width: 30px; height: 30px; background: #E6F4EA; color: #2e7d32; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; }
.user-name { font-weight: 700; color: #2d3748; font-size: 0.85rem; }

.company-cell { display: flex; flex-direction: column; }
.company-name { font-weight: 700; color: #4a5568; font-size: 0.8rem; }
.ficha-tag { font-size: 0.65rem; color: #a0aec0; font-weight: 800; margin-top: 1px; }

/* Badges */
.badge-type { padding: 3px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; }
.badge-type.inicial { background: #EBF8FF; color: #3182CE; }
.badge-type.parcial { background: #F7FAFC; color: #718096; border: 1px solid #E2E8F0; }
.badge-type.final { background: #F3F4F6; color: #9CA3AF; }

.badge-logs { padding: 3px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; }
.badge-logs.atrasado { background: #FEF2F2; color: #DC2626; }
.badge-logs.al-día { background: #F0FDF4; color: #16A34A; }
.badge-logs.pendiente { background: #F7FAFC; color: #718096; }

.badge-status { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
.badge-status.pendiente { color: #D97706; border: 1px solid #FEF3C7; }
.badge-status.realizada { background: var(--color_button); color: white; }
.badge-status.programada { color: #A0AEC0; font-weight: 600; border: 1px solid #edf2f7; }

.visit-date { font-weight: 700; color: #4a5568; font-size: 0.8rem; }

/* Actions */
.actions-cell { display: flex; align-items: center; gap: 8px; }
.btn-upload { background: #F0FDF4; color: #16A34A; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 4px; cursor: pointer; }
.btn-view-acta { background: var(--color_button); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 4px; cursor: pointer; }
.btn-edit-inline { background: transparent; border: none; color: #CBD5E0; cursor: pointer; }
.btn-edit-inline .material-symbols-outlined { font-size: 1.1rem; }

/* Footer */
.table-footer { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-top: 1px solid #edf2f7; }
.results-info { font-size: 0.75rem; color: #718096; font-weight: 700; }
.pagination { display: flex; align-items: center; gap: 6px; }
.p-num { width: 28px; height: 28px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; font-size: 0.75rem; font-weight: 700; color: #4a5568; cursor: pointer; }
.p-num.active { background: var(--color_button); color: white; border-color: var(--color_button); }
.p-btn { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px; color: #a0aec0; cursor: pointer; }
.p-btn .material-symbols-outlined { font-size: 1.1rem; }
</style>
