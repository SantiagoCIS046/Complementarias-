<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header title="Gestión de Bitácoras" />

      <main class="content">
        <div class="w-full space-y-2">

      <div class="content-columns">
        <!-- Columna 1: Fichas (Simplificada en esta vista de detalle) -->
        <aside class="column-fichas">
          <button class="btn-new-bitacora" @click="showNewBitacoraModal = true">
            <span class="material-symbols-outlined">add</span> Nueva Bitácora
          </button>
          
          <div class="fichas-section">
            <h3 class="section-title">
              <span class="material-symbols-outlined">person</span> APRENDIZ SELECCIONADO
            </h3>
            
            <div class="ficha-card active">
              <div class="ficha-header">
                <span class="ficha-id">Ficha {{ ficha }}</span>
              </div>
              <p class="ficha-name">{{ apprenticeName }}</p>
            </div>
          </div>
        </aside>

        <!-- Columna 2: Entregas -->
        <section class="column-entregas">
          <div class="entregas-header">
            <h2>Bitácoras Entregadas</h2>
            <div v-if="isLoading" class="p-4 text-center">
              <div class="spin-sm !border-green-600 mx-auto"></div>
            </div>
          </div>

          <div class="entregas-list">
            <div v-for="bit in bitacoras" :key="bit._id" 
                 class="entrega-item" 
                 :class="{ selected: selectedBitacora?._id === bit._id }"
                 @click="selectBitacora(bit)">
              <div class="entrega-info">
                <strong>{{ apprenticeName }}</strong>
                <span class="time">{{ formatDate(bit.createdAt) }}</span>
              </div>
              <p class="entrega-subject">Bitácora Semana {{ bit.semana }}</p>
              <p class="entrega-preview" :class="bit.estado.toLowerCase()">Estado: {{ bit.estado }}</p>
            </div>
            
            <div v-if="bitacoras.length === 0 && !isLoading" class="p-8 text-center text-gray-400 italic text-xs">
              No hay bitácoras registradas para esta etapa.
            </div>
          </div>
        </section>

        <!-- Columna 3: Detalle / Revisión -->
        <section class="column-revision">
          <div v-if="selectedBitacora" class="revision-scroll">
            <header class="revision-header">
              <div class="user-profile">
                <div class="avatar-large">{{ getInitials(apprenticeName) }}</div>
                <div class="profile-info">
                  <h2>{{ apprenticeName }}</h2>
                  <p>Ficha {{ ficha }}</p>
                  <div class="pills">
                    <span class="pill gray">ETAPA PRODUCTIVA</span>
                    <span class="pill green">SEMANA {{ selectedBitacora.semana }}</span>
                  </div>
                </div>
              </div>
            </header>

            <div class="revision-widgets">
              <div class="widget">
                <div class="widget-header">INFORMACIÓN DE ENTREGA</div>
                <div class="space-y-2">
                  <p class="text-xs"><strong>Horas Reportadas:</strong> {{ selectedBitacora.horasReportadas }}h</p>
                  <p class="text-xs"><strong>Descripción:</strong></p>
                  <p class="text-[11px] text-gray-600 bg-white p-2 rounded border">{{ selectedBitacora.descripcion }}</p>
                </div>
              </div>

              <div class="widget">
                <div class="widget-header">OBSERVACIONES DEL INSTRUCTOR</div>
                <textarea v-model="observaciones" 
                          class="w-full text-xs p-2 rounded border focus:border-green-600 outline-none" 
                          rows="4" 
                          placeholder="Escriba aquí sus observaciones..."></textarea>
              </div>
            </div>

            <!-- Visor PDF / Evidencias -->
            <div class="evidencias-container mb-6">
               <h3 class="text-xs font-bold mb-2">Evidencias Adjuntas</h3>
               <div v-if="selectedBitacora.evidencias?.length > 0" class="grid grid-cols-1 gap-2">
                 <div v-for="(ev, idx) in selectedBitacora.evidencias" :key="idx" 
                    class="pdf-access-box">
                    <div class="pdf-info-group">
                      <div class="pdf-icon-wrapper">
                        <span class="material-symbols-outlined icon-pdf">picture_as_pdf</span>
                      </div>
                      <div class="pdf-info">
                        <h4>{{ ev.nombre || 'Evidencia ' + (idx + 1) }}</h4>
                        <p>Documento adjunto para revisión</p>
                      </div>
                    </div>
                    <a :href="ev.url" target="_blank" class="btn-view-pdf">
                      Ver Documento
                    </a>
                 </div>
               </div>
               <p v-else class="text-xs text-gray-400 italic">No se adjuntaron archivos.</p>
            </div>

            <!-- Acciones Finales -->
            <footer v-if="selectedBitacora.estado === 'PENDIENTE'" class="revision-actions">
              <button class="btn-reject" @click="handleReview('RECHAZADA')" :disabled="isSaving">
                <span class="material-symbols-outlined">close</span> Rechazar
              </button>
              <button class="btn-approve" @click="handleReview('APROBADA')" :disabled="isSaving">
                <span class="material-symbols-outlined">check_circle</span> Aprobar
              </button>
            </footer>
            <div v-else class="p-4 bg-gray-50 rounded-xl border text-center">
               <p class="text-xs font-bold" :class="selectedBitacora.estado === 'APROBADA' ? 'text-green-600' : 'text-red-600'">
                 ESTA BITÁCORA YA FUE {{ selectedBitacora.estado }}
               </p>
               <p v-if="selectedBitacora.observacionesInstructor" class="text-[10px] text-gray-500 mt-1 italic">
                 "{{ selectedBitacora.observacionesInstructor }}"
               </p>
            </div>
          </div>
          <div v-else class="h-full flex flex-col items-center justify-center text-gray-400 p-12">
             <span class="material-symbols-outlined text-6xl mb-4">description</span>
             <p class="font-bold">Seleccione una bitácora para revisar</p>
          </div>
        </section>
      </div>
    </div>
  </main>

  <!-- ═══════ MODAL: Nueva Bitácora ═══════ -->
  <div class="modal-overlay" v-if="showNewBitacoraModal" @click.self="showNewBitacoraModal = false">
    <div class="modal-card modal-md">
      <div class="modal-head">
        <div class="head-info">
          <h2>Nueva Bitácora</h2>
          <p class="u-email">Registrar una nueva entrega de bitácora</p>
        </div>
        <button class="modal-close" @click="showNewBitacoraModal = false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group-premium mb-4">
          <label class="label-premium">Ficha / Programa</label>
          <select class="select-premium">
            <option>Ficha 2670687 - ADSO</option>
            <option>Ficha 2558342 - Sistemas</option>
            <option>Ficha 2441092 - Multimedia</option>
          </select>
        </div>
        <div class="form-group-premium mb-4">
          <label class="label-premium">Asunto / Título</label>
          <input type="text" class="input-premium" placeholder="Ej: Bitácora Quincena 5" />
        </div>
        <div class="form-group-premium mb-4">
          <label class="label-premium">Archivo PDF</label>
          <input type="file" class="input-premium" accept="application/pdf" />
        </div>
      </div>
      <div class="modal-footer footer-premium">
        <button class="btn-cancel-premium" @click="showNewBitacoraModal = false">Cancelar</button>
        <button class="btn-confirm-premium" @click="showNewBitacoraModal = false">Subir Bitácora</button>
      </div>
    </div>
  </div>

</div>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import { bitacoraService } from '../services/bitacora.service'
import { useAuthStore } from '../../../core/store/auth.store'

const route = useRoute()
const authStore = useAuthStore()

const stageId = route.query.id
const apprenticeName = route.query.name || 'Aprendiz'
const ficha = route.query.ficha || 'S/N'

const bitacoras = ref([])
const selectedBitacora = ref(null)
const isLoading = ref(true)
const isSaving = ref(false)
const observaciones = ref('')
const showNewBitacoraModal = ref(false)

const fetchBitacoras = async () => {
  if (!stageId) return
  isLoading.value = true
  try {
    const res = await bitacoraService.getByStage(stageId)
    bitacoras.value = res.data.data || []
    if (bitacoras.value.length > 0) {
      selectedBitacora.value = bitacoras.value[bitacoras.value.length - 1] // Seleccionar la última por defecto
    }
  } catch (error) {
    console.error('Error fetching bitacoras:', error)
  } finally {
    isLoading.value = false
  }
}

const selectBitacora = (bit) => {
  selectedBitacora.value = bit
  observaciones.value = bit.observacionesInstructor || ''
}

const handleReview = async (estado) => {
  if (!selectedBitacora.value) return
  
  if (estado === 'RECHAZADA' && !observaciones.value) {
    alert('Por favor ingrese observaciones para el rechazo.')
    return
  }

  isSaving.value = true
  try {
    await bitacoraService.revisar(selectedBitacora.value._id, {
      estado,
      observaciones: observaciones.value
    })
    alert(`Bitácora ${estado} correctamente.`)
    await fetchBitacoras()
  } catch (error) {
    console.error('Error reviewing bitacora:', error)
    alert('Error al procesar la revisión.')
  } finally {
    isSaving.value = false
  }
}

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(fetchBitacoras)
</script>

<style scoped>
.bitacoras-layout { display: flex; height: 100vh; background: var(--bg-secondary); overflow: hidden; }
.main-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* Navbar */
.top-nav-bitacoras { height: 40px; background: var(--bg-primary); display: flex; align-items: center; padding: 0 1rem; gap: 1rem; border-bottom: 1px solid var(--border-primary); }
.nav-brand { display: flex; align-items: center; gap: 6px; min-width: 160px; }
.nav-brand h1 { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); }
.icon-main { font-size: 1.1rem; color: var(--color_button, #2e7d32); }

.nav-search { flex: 1; position: relative; max-width: 400px; }
.nav-search .material-symbols-outlined { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: var(--text-muted); }
.nav-search input { width: 100%; padding: 5px 10px 5px 30px; border-radius: 8px; border: none; background: var(--bg-hover); font-size: 0.7rem; color: var(--text-primary); }

.nav-actions { display: flex; align-items: center; gap: 10px; }
.nav-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: none; border: 1px solid var(--border-primary); border-radius: 8px; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
.nav-btn:hover { background: var(--bg-hover); color: var(--color_button); border-color: var(--color_button); }
.nav-btn .material-symbols-outlined { font-size: 1.1rem; }
.user-avatar-mini { width: 26px; height: 26px; border-radius: 50%; background: var(--border-primary); border: 2px solid var(--bg-primary); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

/* Layout Columns */
.content-columns { flex: 1; display: grid; grid-template-columns: 180px 240px 1fr; overflow: hidden; }

/* Scrollbar Style */
.column-fichas::-webkit-scrollbar,
.entregas-list::-webkit-scrollbar,
.column-revision::-webkit-scrollbar { width: 4px; }

/* Columna Fichas */
.column-fichas { background: var(--bg-secondary); padding: 0.75rem 0.5rem; border-right: 1px solid var(--border-primary); display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto; }
.btn-new-bitacora { width: 100%; padding: 8px; background: var(--color_button, #2e7d32); color: white; border: none; border-radius: 8px; font-weight: 800; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; box-shadow: 0 2px 6px rgba(46, 125, 50, 0.2); }

.fichas-section .section-title { font-size: 0.55rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.5px; display: flex; align-items: center; gap: 3px; margin-bottom: 0.5rem; }
.ficha-card { padding: 8px; background: var(--bg-elevated); border-radius: 8px; border: 1px solid var(--border-primary); margin-bottom: 0.4rem; cursor: pointer; transition: all 0.2s; }
.ficha-card:hover { border-color: var(--color_button); }
.ficha-card.active { border-color: var(--color_button); background: var(--bg-active); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.ficha-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
.ficha-id { font-size: 0.6rem; font-weight: 800; color: var(--color_button); }
.badge-new { background: #c53030; color: white; font-size: 0.5rem; padding: 1px 4px; border-radius: 4px; font-weight: 800; }
.ficha-name { font-size: 0.7rem; font-weight: 700; color: var(--text-primary); }

/* Columna Entregas */
.column-entregas { background: var(--bg-hover); border-right: 1px solid var(--border-primary); display: flex; flex-direction: column; }
.entregas-header { padding: 0.75rem 0.5rem; }
.entregas-header h2 { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem; }
.filter-box { position: relative; }
.filter-box .material-symbols-outlined { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: var(--text-muted); }
.filter-box input { width: 100%; padding: 5px 8px 5px 28px; border-radius: 8px; border: 1px solid var(--border-primary); font-size: 0.7rem; background: var(--bg-elevated); color: var(--text-primary); }

.entregas-list { flex: 1; overflow-y: auto; padding: 0 0.5rem 0.75rem; }
.entrega-item { background: var(--bg-elevated); padding: 8px; border-radius: 8px; margin-bottom: 0.4rem; border-left: 3px solid transparent; cursor: pointer; transition: all 0.2s; }
.entrega-item:hover { background: var(--bg-hover); }
.entrega-item.selected { border-left-color: var(--color_button); background: var(--bg-elevated); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.entrega-info { display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 3px; }
.entrega-info strong { color: var(--text-primary); }
.entrega-info .time { font-size: 0.55rem; color: var(--text-muted); font-weight: 700; }
.entrega-subject { font-size: 0.7rem; font-weight: 700; color: var(--color_button); margin-bottom: 2px; }
.entrega-preview { font-size: 0.6rem; color: var(--text-secondary); line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* Columna Revisión */
.column-revision { background: var(--bg-primary); overflow-y: auto; }
.revision-scroll { padding: 1rem; width: 100%; }

.revision-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
.user-profile { display: flex; align-items: center; gap: 12px; }
.avatar-large { width: 36px; height: 36px; background: var(--bg-active); color: var(--color_button); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; }
.profile-info h2 { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 0; }
.profile-info p { color: var(--text-secondary); font-size: 0.7rem; margin-top: 1px; }
.pills { display: flex; gap: 6px; margin-top: 6px; }
.pill { padding: 3px 8px; border-radius: 20px; font-size: 0.55rem; font-weight: 800; }
.pill.gray { background: var(--bg-hover); color: var(--text-secondary); }
.pill.green { background: var(--bg-active); color: #16a34a; }

.header-tools { display: flex; gap: 8px; }
.tool-btn { width: 30px; height: 30px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-elevated); cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; }
.tool-btn .material-symbols-outlined { font-size: 1.1rem; }

.revision-widgets { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.widget { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 12px; padding: 1rem; }
.widget-header { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; }

/* Calendar Widget */
.days-header { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 0.6rem; font-weight: 800; color: var(--text-muted); margin-bottom: 6px; }
.days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
.days-grid span { font-size: 0.65rem; font-weight: 600; padding: 3px 0; border-radius: 6px; color: var(--text-primary); }
.days-grid .today { background: var(--color_button); color: white; }
.days-grid .selected-day { background: var(--bg-active); color: var(--color_button); font-weight: 800; border: 1px solid #16a34a; }

.spin-sm { width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.1); border-top-color: #2e7d32; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.entrega-preview.aprobada { color: #16a34a; font-weight: 800; }
.entrega-preview.rechazada { color: #ef4444; font-weight: 800; }
.entrega-preview.pendiente { color: #d97706; font-weight: 800; }

/* History Widget */
.timeline { display: flex; flex-direction: column; gap: 0.75rem; }
.timeline-item { display: flex; gap: 12px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-primary); margin-top: 3px; }
.dot.active { background: #16a34a; box-shadow: 0 0 0 4px var(--bg-active); }
.t-content p { font-size: 0.75rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.t-time { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; }

/* PDF Access Box */
.pdf-access-box { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 12px; padding: 16px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
.pdf-access-box:hover { border-color: var(--scrollbar-thumb); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.pdf-info-group { display: flex; align-items: center; gap: 16px; }
.pdf-icon-wrapper { width: 48px; height: 48px; background: rgba(239,68,68,0.1); color: #ef4444; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.pdf-icon-wrapper .material-symbols-outlined { font-size: 1.5rem; }
.pdf-info h4 { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0; }
.pdf-info p { font-size: 0.7rem; color: var(--text-secondary); margin: 0; font-weight: 600; }
.btn-view-pdf { background: var(--bg-elevated); border: 1px solid var(--border-primary); padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.75rem; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block; }
.btn-view-pdf:hover { background: var(--bg-hover); color: var(--color_button); border-color: var(--color_button); }

/* Modals General */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: var(--bg-elevated); border-radius: 16px; width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); border: 1px solid var(--border-primary); }
.modal-md { width: 500px; }
.modal-full { width: 90vw; height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 24px; border-bottom: 1px solid var(--border-primary); background: var(--bg-primary); }
.head-info h2 { font-size: 1.1rem; font-weight: 800; margin: 0; color: var(--text-primary); }
.head-info p { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }
.modal-close { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; line-height: 1; }
.modal-body { padding: 24px; background: var(--bg-secondary); }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--border-primary); display: flex; justify-content: flex-end; gap: 10px; background: var(--bg-primary); }

/* Premium Form Styles */
.form-group-premium { margin-bottom: 16px; }
.label-premium { display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; }
.input-premium, .select-premium { width: 100%; padding: 10px 12px; border: 1px solid var(--border-primary); border-radius: 8px; font-size: 0.85rem; outline: none; transition: 0.2s; background: var(--bg-secondary); color: var(--text-primary); box-sizing: border-box; }
.input-premium:focus, .select-premium:focus { border-color: var(--color_button); background: var(--bg-elevated); box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15); }
.btn-cancel-premium { background: var(--bg-hover); color: var(--text-secondary); border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-cancel-premium:hover { background: var(--border-primary); }
.btn-confirm-premium { background: var(--color_button); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background 0.2s; box-shadow: 0 2px 4px rgba(46, 125, 50, 0.2); }
.btn-confirm-premium:hover { background: #1b5e20; }

/* Revision Actions */
.revision-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-primary); }
.btn-reject { padding: 10px; border-radius: 10px; border: 2px solid #c53030; color: #c53030; background: var(--bg-elevated); font-weight: 800; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-approve { padding: 10px; border-radius: 10px; border: none; background: var(--color_button); color: white; font-weight: 800; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
</style>
