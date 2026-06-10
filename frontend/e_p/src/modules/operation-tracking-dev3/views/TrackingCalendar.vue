<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import { trackingService } from '../services/tracking.service'
import { useAuthStore } from '../../../core/store/auth.store'

const authStore = useAuthStore()

// ── Estado principal ─────────────────────────────────────────────
const trackings      = ref([])
const isLoading      = ref(true)
const errorMsg       = ref(null)

// ── Filtros ──────────────────────────────────────────────────────
const searchQuery    = ref('')
const filterEstado   = ref('TODOS')
const filterTipo     = ref('TODOS')

// ── Modal de Registro / Edición ──────────────────────────────────
const showModal      = ref(false)
const isEditing      = ref(false)
const isSaving       = ref(false)
const saveError      = ref(null)
const form           = ref(defaultForm())

// ── PDF / IA (RF-INS-14) ─────────────────────────────────────────
const pdfFile        = ref(null)
const pdfFileName    = ref('')
const isValidating   = ref(false)
const iaResult       = ref(null)  // { valid, signatures, confidence }
const iaError        = ref(null)

function defaultForm() {
  return {
    _id: null,
    stageId: '',
    numeroVisita: '',
    fechaVisita: '',
    lugarVisita: '',
    observaciones: '',
    compromisos: '',
    calificacion: '',
    estadoVisita: 'PROGRAMADO',
    esExtraordinario: false,
    isValidatedByIA: false,
    evidenciaUrl: '',
  }
}

const ESTADOS = ['TODOS', 'PROGRAMADO', 'REALIZADO', 'REPROGRAMADO', 'NO_REALIZADO']
const TIPOS   = ['TODOS', 'Estándar', 'Extraordinario']

// ── Cargar datos ─────────────────────────────────────────────────
const fetchTrackings = async () => {
  isLoading.value = true
  errorMsg.value  = null
  try {
    const res = await trackingService.getAllTrackings()
    trackings.value = res.data.data || []
  } catch (err) {
    errorMsg.value = 'Error al cargar los seguimientos: ' + (err.response?.data?.message || err.message)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchTrackings)

// ── Filtrado reactivo ─────────────────────────────────────────────
const filteredTrackings = computed(() => {
  const q   = searchQuery.value.toLowerCase().trim()
  return trackings.value.filter(t => {
    const matchSearch = !q
      || (t.apprenticeId?.name || '').toLowerCase().includes(q)
      || (t.apprenticeId?.documento || '').toLowerCase().includes(q)
      || String(t.numeroVisita).includes(q)
    const matchEstado = filterEstado.value === 'TODOS' || t.estadoVisita === filterEstado.value
    const matchTipo   = filterTipo.value === 'TODOS'
      || (filterTipo.value === 'Extraordinario' && t.esExtraordinario)
      || (filterTipo.value === 'Estándar' && !t.esExtraordinario)
    return matchSearch && matchEstado && matchTipo
  })
})

const badgeClass = (estado) => ({
  'badge-programado':    estado === 'PROGRAMADO',
  'badge-realizado':     estado === 'REALIZADO',
  'badge-reprogramado':  estado === 'REPROGRAMADO',
  'badge-no-realizado':  estado === 'NO_REALIZADO',
})

// ── Abrir modal ───────────────────────────────────────────────────
const openCreate = () => {
  form.value    = defaultForm()
  iaResult.value = null
  iaError.value  = null
  pdfFile.value  = null
  pdfFileName.value = ''
  isEditing.value = false
  saveError.value = null
  showModal.value = true
}

const openEdit = (t) => {
  form.value = {
    _id: t._id,
    stageId: t.stageId?._id || t.stageId || '',
    numeroVisita: t.numeroVisita,
    fechaVisita: t.fechaVisita ? t.fechaVisita.substring(0, 10) : '',
    lugarVisita: t.lugarVisita || '',
    observaciones: t.observaciones || '',
    compromisos: t.compromisos || '',
    calificacion: t.calificacion || '',
    estadoVisita: t.estadoVisita || 'PROGRAMADO',
    esExtraordinario: t.esExtraordinario || false,
    isValidatedByIA: t.isValidatedByIA || false,
    evidenciaUrl: t.evidenciaUrl || '',
  }
  iaResult.value  = t.isValidatedByIA ? { valid: true, signatures: t.signaturesValidated } : null
  iaError.value   = null
  pdfFile.value   = null
  pdfFileName.value = t.evidenciaUrl ? 'Documento ya cargado' : ''
  isEditing.value = true
  saveError.value = null
  showModal.value = true
}

const closeModal = () => { showModal.value = false }

// ── PDF Dropzone ──────────────────────────────────────────────────
const isDragging = ref(false)

const onDropFile = (e) => {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0]
  if (!file) return
  if (file.type !== 'application/pdf') {
    iaError.value = 'Solo se aceptan archivos PDF.'
    return
  }
  pdfFile.value     = file
  pdfFileName.value = file.name
  iaResult.value    = null
  iaError.value     = null
  form.value.isValidatedByIA = false
}

const triggerFileInput = () => document.getElementById('pdf-input').click()

// ── Validación IA ─────────────────────────────────────────────────
const validateWithIA = async () => {
  if (!pdfFile.value) { iaError.value = 'Seleccione un PDF primero.'; return }
  isValidating.value = true
  iaResult.value     = null
  iaError.value      = null
  try {
    const res = await trackingService.validatePdf(pdfFile.value)
    const data = res.data.data || res.data
    iaResult.value = data
    if (data.valid) {
      form.value.isValidatedByIA = true
    } else {
      form.value.isValidatedByIA = false
      iaError.value = `Firma(s) no detectadas: ${data.missingSig || 'Verificar documento'}`
    }
  } catch (err) {
    iaError.value = 'Error al validar con IA: ' + (err.response?.data?.message || err.message)
  } finally {
    isValidating.value = false
  }
}

// ── Guardar seguimiento ───────────────────────────────────────────
const requiresPdf = computed(() => form.value.estadoVisita === 'REALIZADO')

const canSave = computed(() => {
  if (requiresPdf.value && !form.value.isValidatedByIA) return false
  return true
})

const saveTracking = async () => {
  saveError.value = null
  if (!form.value.stageId) { saveError.value = 'Seleccione una Etapa Productiva.'; return }
  isSaving.value = true
  try {
    const payload = { ...form.value }
    delete payload._id

    if (isEditing.value) {
      await trackingService.updateTracking(form.value._id, payload)
    } else {
      await trackingService.createTracking(payload)
    }
    await fetchTrackings()
    closeModal()
  } catch (err) {
    saveError.value = err.response?.data?.message || err.message
  } finally {
    isSaving.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric' }) : '---'
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />
    <div class="main-wrapper">
      <Header title="Seguimientos Técnicos" />

      <main class="content">
        <div class="ins-page-body">

          <!-- Page Header -->
          <header class="ins-page-header">
            <div class="header-left-group">
              <div class="header-info">
                <h1 class="ins-page-title">Seguimientos Técnicos</h1>
                <p class="ins-page-description">Gestión y registro de visitas de seguimiento a aprendices en Etapa Productiva.</p>
              </div>
            </div>
            <button id="btn-nuevo-seguimiento" class="ins-btn-primary" @click="openCreate">
              <span class="material-symbols-outlined">add_circle</span>
              Nuevo Seguimiento
            </button>
          </header>

          <!-- Filtros -->
          <div class="ins-filters-bar">
            <div class="search-box-wrapper">
              <span class="material-symbols-outlined search-icon">search</span>
              <input
                id="input-buscar-seguimiento"
                v-model="searchQuery"
                class="ins-search-input"
                type="text"
                placeholder="Buscar por aprendiz, cédula o N° visita..."
              />
            </div>
            <div class="filter-group">
              <label class="ins-filter-label">Estado</label>
              <select id="select-estado-tracking" v-model="filterEstado" class="ins-filter-select">
                <option v-for="e in ESTADOS" :key="e" :value="e">{{ e === 'TODOS' ? 'Todos los estados' : e }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="ins-filter-label">Tipo</label>
              <select id="select-tipo-tracking" v-model="filterTipo" class="ins-filter-select">
                <option v-for="t in TIPOS" :key="t" :value="t">{{ t === 'TODOS' ? 'Todos los tipos' : t }}</option>
              </select>
            </div>
          </div>

          <!-- Tabla de seguimientos -->
          <div class="ins-table-card">
            <!-- Loading -->
            <div v-if="isLoading" class="ins-loading-state">
              <span class="material-symbols-outlined spin-icon">sync</span>
              <span>Cargando seguimientos...</span>
            </div>

            <!-- Error -->
            <div v-else-if="errorMsg" class="ins-empty-state">
              <span class="material-symbols-outlined">error_outline</span>
              <p>{{ errorMsg }}</p>
            </div>

            <!-- Empty state -->
            <div v-else-if="filteredTrackings.length === 0" class="ins-empty-state">
              <span class="material-symbols-outlined">playlist_remove</span>
              <p>No hay seguimientos que coincidan con los filtros seleccionados.</p>
              <button class="ins-btn-outline" @click="openCreate">Registrar primer seguimiento</button>
            </div>

            <!-- Tabla -->
            <table v-else class="ins-table">
              <thead>
                <tr>
                  <th>N° Visita</th>
                  <th>Aprendiz</th>
                  <th>Fecha</th>
                  <th>Lugar</th>
                  <th>Tipo</th>
                  <th>Calificación</th>
                  <th>Estado</th>
                  <th>IA</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in filteredTrackings" :key="t._id" class="tracking-row">
                  <td class="visit-num">
                    <span class="ins-ficha-chip">V{{ t.numeroVisita }}</span>
                  </td>
                  <td>
                    <div class="ins-apprentice-cell">
                      <div class="ins-apprentice-avatar">{{ (t.apprenticeId?.name || 'A').charAt(0).toUpperCase() }}</div>
                      <div>
                        <div class="ins-apprentice-name">{{ t.apprenticeId?.name || 'Sin nombre' }}</div>
                        <div class="ins-apprentice-doc">{{ t.apprenticeId?.documento || '---' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="cell-date">{{ fmtDate(t.fechaVisita) }}</td>
                  <td class="cell-lugar">{{ t.lugarVisita || '---' }}</td>
                  <td>
                    <span :class="['tipo-chip', t.esExtraordinario ? 'tipo-extra' : 'tipo-std']">
                      {{ t.esExtraordinario ? '⭐ Ext.' : 'Estándar' }}
                    </span>
                  </td>
                  <td class="cell-cal">
                    <span v-if="t.calificacion" class="cal-badge">{{ t.calificacion }}</span>
                    <span v-else class="text-muted">---</span>
                  </td>
                  <td>
                    <span :class="['ins-status-badge', badgeClass(t.estadoVisita)]">
                      {{ t.estadoVisita }}
                    </span>
                  </td>
                  <td class="cell-ia">
                    <span v-if="t.isValidatedByIA" class="ia-ok" title="Validado por IA">
                      <span class="material-symbols-outlined">verified</span>
                    </span>
                    <span v-else class="ia-pending" title="Sin validación IA">
                      <span class="material-symbols-outlined">pending</span>
                    </span>
                  </td>
                  <td>
                    <button class="btn-icon-action" @click="openEdit(t)" title="Editar seguimiento">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Contador -->
          <div v-if="!isLoading && filteredTrackings.length > 0" class="table-footer-count">
            Mostrando <strong>{{ filteredTrackings.length }}</strong> de <strong>{{ trackings.length }}</strong> seguimientos
          </div>
        </div>
      </main>
    </div>

    <!-- ══════════ MODAL DE REGISTRO / EDICIÓN ══════════ -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-panel">
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="material-symbols-outlined modal-icon">{{ isEditing ? 'edit_note' : 'add_task' }}</span>
              <h2 class="modal-title">{{ isEditing ? 'Editar Seguimiento' : 'Nuevo Seguimiento' }}</h2>
            </div>
            <button class="modal-close-btn" @click="closeModal">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <!-- Fila 1: Stage y NumVisita -->
              <div class="form-group">
                <label class="form-label required-field">ID de Etapa Productiva (stageId)</label>
                <input id="input-stage-id" v-model="form.stageId" class="form-input" type="text" placeholder="ObjectId de la EP..." />
              </div>
              <div class="form-group">
                <label class="form-label required-field">N° de Visita</label>
                <input id="input-num-visita" v-model.number="form.numeroVisita" class="form-input" type="number" min="1" placeholder="1, 2, 3..." />
              </div>

              <!-- Fila 2: Fecha y Lugar -->
              <div class="form-group">
                <label class="form-label">Fecha de Visita</label>
                <input id="input-fecha-visita" v-model="form.fechaVisita" class="form-input" type="date" />
              </div>
              <div class="form-group">
                <label class="form-label" :class="{ 'required-field': form.estadoVisita === 'REALIZADO' }">Lugar de Visita</label>
                <input id="input-lugar-visita" v-model="form.lugarVisita" class="form-input" type="text" placeholder="Empresa, dirección..." />
              </div>

              <!-- Estado y Calificación -->
              <div class="form-group">
                <label class="form-label">Estado de Visita</label>
                <select id="select-estado-visita" v-model="form.estadoVisita" class="form-input">
                  <option value="PROGRAMADO">PROGRAMADO</option>
                  <option value="REALIZADO">REALIZADO</option>
                  <option value="REPROGRAMADO">REPROGRAMADO</option>
                  <option value="NO_REALIZADO">NO_REALIZADO</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Calificación</label>
                <input id="input-calificacion" v-model.number="form.calificacion" class="form-input" type="number" min="0" max="5" step="0.1" placeholder="0.0 – 5.0" />
              </div>

              <!-- Observaciones -->
              <div class="form-group span-2">
                <label class="form-label" :class="{ 'required-field': form.estadoVisita === 'REALIZADO' }">Observaciones</label>
                <textarea id="input-observaciones" v-model="form.observaciones" class="form-input form-textarea" rows="3" placeholder="Describa lo observado en la visita..."></textarea>
              </div>

              <!-- Compromisos -->
              <div class="form-group span-2">
                <label class="form-label">Compromisos</label>
                <textarea id="input-compromisos" v-model="form.compromisos" class="form-input form-textarea" rows="2" placeholder="Compromisos adquiridos por el aprendiz..."></textarea>
              </div>

              <!-- Tipo Extraordinario -->
              <div class="form-group span-2">
                <label class="toggle-label">
                  <input id="check-extraordinario" v-model="form.esExtraordinario" type="checkbox" class="toggle-checkbox" />
                  <span class="toggle-text">
                    <span class="material-symbols-outlined">star</span>
                    Seguimiento Extraordinario (requiere autorización previa)
                  </span>
                </label>
              </div>
            </div>

            <!-- ── RF-INS-14: Zona PDF + IA ── -->
            <div v-if="form.estadoVisita === 'REALIZADO'" class="ia-section">
              <div class="ia-section-header">
                <span class="material-symbols-outlined">smart_toy</span>
                <h3>Validación de Acta con IA <span class="required-chip">Obligatorio para REALIZADO</span></h3>
              </div>

              <!-- Dropzone -->
              <div
                :class="['pdf-dropzone', { 'dragging': isDragging, 'has-file': !!pdfFile }]"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop.prevent="onDropFile"
                @click="triggerFileInput"
              >
                <input id="pdf-input" type="file" accept="application/pdf" class="hidden" @change="onDropFile" />
                <span class="material-symbols-outlined dropzone-icon">{{ pdfFile ? 'picture_as_pdf' : 'upload_file' }}</span>
                <p class="dropzone-text">
                  <span v-if="pdfFile">{{ pdfFileName }}</span>
                  <span v-else>Arrastre el acta PDF aquí o <u>haga clic para seleccionar</u></span>
                </p>
              </div>

              <!-- Botón de validar -->
              <div class="ia-actions">
                <button
                  id="btn-validar-ia"
                  class="btn-ia-validate"
                  :disabled="!pdfFile || isValidating"
                  @click="validateWithIA"
                >
                  <span class="material-symbols-outlined">{{ isValidating ? 'sync' : 'psychology' }}</span>
                  {{ isValidating ? 'Analizando firmas...' : 'Validar con IA' }}
                </button>
              </div>

              <!-- Resultado IA válido -->
              <div v-if="iaResult?.valid" class="ia-banner ia-banner-ok">
                <span class="material-symbols-outlined">check_circle</span>
                <div class="ia-banner-content">
                  <strong>✅ Acta validada correctamente</strong>
                  <p>Las 3 firmas requeridas fueron detectadas satisfactoriamente.</p>
                </div>
              </div>

              <!-- Error IA -->
              <div v-if="iaError" class="ia-banner ia-banner-error">
                <span class="material-symbols-outlined">cancel</span>
                <div class="ia-banner-content">
                  <strong>❌ Validación fallida</strong>
                  <p>{{ iaError }}</p>
                  <button class="btn-retry" @click="pdfFile = null; pdfFileName = ''; iaError = null; form.isValidatedByIA = false">
                    <span class="material-symbols-outlined">refresh</span> Reintentar carga
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Error de guardado -->
          <div v-if="saveError" class="modal-save-error">
            <span class="material-symbols-outlined">warning</span>
            {{ saveError }}
          </div>

          <!-- Footer del modal -->
          <div class="modal-footer">
            <button class="ins-btn-outline" @click="closeModal">Cancelar</button>
            <button
              id="btn-guardar-seguimiento"
              class="ins-btn-primary"
              :disabled="isSaving || !canSave"
              @click="saveTracking"
            >
              <span class="material-symbols-outlined">{{ isSaving ? 'sync' : 'save' }}</span>
              {{ isSaving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Registrar') }}
            </button>
            <div v-if="requiresPdf && !form.isValidatedByIA" class="ia-lock-hint">
              <span class="material-symbols-outlined">lock</span>
              Validación IA obligatoria para guardar en estado REALIZADO
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── Filtros (Específicos del buscador) ── */
.search-box-wrapper { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.1rem; }

.filter-group { display: flex; flex-direction: column; gap: 0.3rem; }

/* ── Tabla (Estilos específicos de columnas / chips) ── */
.spin-icon { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.tracking-row { border-bottom: 1px solid var(--border-color, #f1f5f9); transition: background 0.15s; }
.tracking-row:last-child { border-bottom: none; }
.tracking-row:hover { background: var(--surface-hover, #f8fafc); }

.cell-date, .cell-lugar, .cell-cal { color: #475569; }
.text-muted { color: #cbd5e1; font-style: italic; }
.cal-badge { display: inline-block; background: #fef9c3; color: #854d0e; border-radius: 6px; padding: 0.15rem 0.5rem; font-weight: 700; font-size: 0.82rem; }

.tipo-chip { display: inline-block; border-radius: 6px; padding: 0.2rem 0.55rem; font-size: 0.78rem; font-weight: 600; }
.tipo-std  { background: #e0f2fe; color: #0369a1; }
.tipo-extra { background: #fef3c7; color: #92400e; }

.badge-programado  { background: #eff6ff; color: #1d4ed8; }
.badge-realizado   { background: #dcfce7; color: #166534; }
.badge-reprogramado { background: #fef3c7; color: #92400e; }
.badge-no-realizado { background: #fee2e2; color: #991b1b; }

.ia-lock-hint {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.78rem; color: #b45309; font-weight: 600;
  margin-left: auto;
}

/* ── Dark Mode Overrides (Específicos) ── */
[data-theme="dark"] .tracking-row { border-bottom-color: #242b3d; }
[data-theme="dark"] .tracking-row:hover { background: #1e2535; }
[data-theme="dark"] .cell-date,
[data-theme="dark"] .cell-lugar,
[data-theme="dark"] .cell-cal {
  background: #2d3748;
  color: #f1f5f9;
}
[data-theme="dark"] .form-label {
  color: #94a3b8;
}
[data-theme="dark"] .form-input {
  background: #151a27;
  border-color: #374151;
  color: #f1f5f9;
}
[data-theme="dark"] .form-input:focus {
  background: #1e2535;
  border-color: #39a2db;
}
[data-theme="dark"] .toggle-text {
  color: #d1d5db;
}
[data-theme="dark"] .ia-section {
  border-color: #0284c7;
  background: linear-gradient(135deg, #151a27, #0c2a3d20);
}
[data-theme="dark"] .ia-section-header h3 {
  color: #f1f5f9;
}
[data-theme="dark"] .pdf-dropzone {
  border-color: #374151;
  background: #151a27;
}
[data-theme="dark"] .pdf-dropzone:hover,
[data-theme="dark"] .pdf-dropzone.dragging {
  border-color: #38bdf8;
  background: #1e2535;
}
[data-theme="dark"] .pdf-dropzone.has-file {
  border-color: #22c55e;
  background: #143d2120;
}
[data-theme="dark"] .dropzone-text {
  color: #94a3b8;
}
[data-theme="dark"] .modal-footer {
  background: #151a27;
  border-top-color: #2d3748;
}
</style>
