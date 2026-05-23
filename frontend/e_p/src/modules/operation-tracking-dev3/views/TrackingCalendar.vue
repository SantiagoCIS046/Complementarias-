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
        <div class="page-body">

          <!-- Page Header -->
          <header class="page-header">
            <div class="header-left-group">
              <div class="header-info">
                <h1 class="page-title">Seguimientos Técnicos</h1>
                <p class="page-description">Gestión y registro de visitas de seguimiento a aprendices en Etapa Productiva.</p>
              </div>
            </div>
            <button id="btn-nuevo-seguimiento" class="btn-primary-action" @click="openCreate">
              <span class="material-symbols-outlined">add_circle</span>
              Nuevo Seguimiento
            </button>
          </header>

          <!-- Filtros -->
          <div class="tracking-filters-bar">
            <div class="search-box-wrapper">
              <span class="material-symbols-outlined search-icon">search</span>
              <input
                id="input-buscar-seguimiento"
                v-model="searchQuery"
                class="search-input"
                type="text"
                placeholder="Buscar por aprendiz, cédula o N° visita..."
              />
            </div>
            <div class="filter-group">
              <label class="filter-label">Estado</label>
              <select id="select-estado-tracking" v-model="filterEstado" class="filter-select">
                <option v-for="e in ESTADOS" :key="e" :value="e">{{ e === 'TODOS' ? 'Todos los estados' : e }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Tipo</label>
              <select id="select-tipo-tracking" v-model="filterTipo" class="filter-select">
                <option v-for="t in TIPOS" :key="t" :value="t">{{ t === 'TODOS' ? 'Todos los tipos' : t }}</option>
              </select>
            </div>
          </div>

          <!-- Tabla de seguimientos -->
          <div class="tracking-table-card">
            <!-- Loading -->
            <div v-if="isLoading" class="tracking-loading">
              <span class="material-symbols-outlined spin-icon">sync</span>
              <span>Cargando seguimientos...</span>
            </div>

            <!-- Error -->
            <div v-else-if="errorMsg" class="tracking-empty">
              <span class="material-symbols-outlined">error_outline</span>
              <p>{{ errorMsg }}</p>
            </div>

            <!-- Empty state -->
            <div v-else-if="filteredTrackings.length === 0" class="tracking-empty">
              <span class="material-symbols-outlined">playlist_remove</span>
              <p>No hay seguimientos que coincidan con los filtros seleccionados.</p>
              <button class="btn-outline" @click="openCreate">Registrar primer seguimiento</button>
            </div>

            <!-- Tabla -->
            <table v-else class="tracking-table">
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
                    <span class="visit-badge">V{{ t.numeroVisita }}</span>
                  </td>
                  <td>
                    <div class="apprentice-cell">
                      <div class="apprentice-avatar">{{ (t.apprenticeId?.name || 'A').charAt(0).toUpperCase() }}</div>
                      <div>
                        <div class="apprentice-name">{{ t.apprenticeId?.name || 'Sin nombre' }}</div>
                        <div class="apprentice-doc">{{ t.apprenticeId?.documento || '---' }}</div>
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
                    <span :class="['estado-badge', badgeClass(t.estadoVisita)]">
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
            <button class="btn-outline" @click="closeModal">Cancelar</button>
            <button
              id="btn-guardar-seguimiento"
              class="btn-primary-action"
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
/* ── Layout ── */
.page-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
}
.page-title { font-size: 1.6rem; font-weight: 700; color: var(--text-primary, #1e293b); margin: 0; }
.page-description { font-size: 0.875rem; color: var(--text-secondary, #64748b); margin: 0.25rem 0 0; }

.btn-primary-action {
  display: flex; align-items: center; gap: 0.5rem;
  background: linear-gradient(135deg, #39a2db, #2180c0);
  color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.2rem;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 14px rgba(57,162,219,0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}
.btn-primary-action:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(57,162,219,0.45); }
.btn-primary-action:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-outline {
  background: transparent; border: 1.5px solid var(--border-color, #e2e8f0);
  border-radius: 8px; padding: 0.6rem 1rem; font-size: 0.9rem; cursor: pointer;
  color: var(--text-secondary, #64748b); transition: background 0.15s;
}
.btn-outline:hover { background: var(--surface-hover, #f1f5f9); }

/* ── Filtros ── */
.tracking-filters-bar {
  display: flex; align-items: flex-end; gap: 1rem; flex-wrap: wrap;
  background: var(--surface-card, #fff); padding: 1rem 1.25rem;
  border-radius: 12px; border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.search-box-wrapper { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.1rem; }
.search-input { width: 100%; padding: 0.6rem 0.75rem 0.6rem 2.3rem; border-radius: 8px; border: 1.5px solid var(--border-color, #e2e8f0); font-size: 0.875rem; background: var(--surface-input, #f8fafc); transition: border-color 0.2s; }
.search-input:focus { outline: none; border-color: #39a2db; }

.filter-group { display: flex; flex-direction: column; gap: 0.3rem; }
.filter-label { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.05em; }
.filter-select { padding: 0.6rem 0.75rem; border-radius: 8px; border: 1.5px solid var(--border-color, #e2e8f0); font-size: 0.875rem; background: var(--surface-input, #f8fafc); cursor: pointer; }

/* ── Tabla ── */
.tracking-table-card {
  background: var(--surface-card, #fff); border-radius: 14px;
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden;
}

.tracking-loading, .tracking-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.75rem; padding: 4rem 2rem; color: #94a3b8;
}
.tracking-loading .spin-icon, .tracking-empty .material-symbols-outlined { font-size: 2.5rem; }
.spin-icon { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.tracking-table { width: 100%; border-collapse: collapse; }
.tracking-table thead tr { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); }
.tracking-table th { padding: 0.85rem 1rem; text-align: left; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #0369a1; border-bottom: 2px solid #bae6fd; white-space: nowrap; }
.tracking-row { border-bottom: 1px solid var(--border-color, #f1f5f9); transition: background 0.15s; }
.tracking-row:last-child { border-bottom: none; }
.tracking-row:hover { background: #f8fafc; }
.tracking-table td { padding: 0.85rem 1rem; font-size: 0.875rem; color: var(--text-primary, #1e293b); vertical-align: middle; }

.visit-badge { display: inline-flex; align-items: center; justify-content: center; background: #e0f2fe; color: #0369a1; border-radius: 8px; padding: 0.25rem 0.65rem; font-weight: 700; font-size: 0.82rem; }

.apprentice-cell { display: flex; align-items: center; gap: 0.65rem; }
.apprentice-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #39a2db, #2180c0); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
.apprentice-name { font-weight: 600; font-size: 0.875rem; }
.apprentice-doc { font-size: 0.76rem; color: #94a3b8; }

.cell-date, .cell-lugar, .cell-cal { color: #475569; }
.text-muted { color: #cbd5e1; font-style: italic; }
.cal-badge { display: inline-block; background: #fef9c3; color: #854d0e; border-radius: 6px; padding: 0.15rem 0.5rem; font-weight: 700; font-size: 0.82rem; }

.tipo-chip { display: inline-block; border-radius: 6px; padding: 0.2rem 0.55rem; font-size: 0.78rem; font-weight: 600; }
.tipo-std  { background: #e0f2fe; color: #0369a1; }
.tipo-extra { background: #fef3c7; color: #92400e; }

.estado-badge { display: inline-block; border-radius: 20px; padding: 0.2rem 0.7rem; font-size: 0.77rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
.badge-programado  { background: #eff6ff; color: #1d4ed8; }
.badge-realizado   { background: #dcfce7; color: #166534; }
.badge-reprogramado { background: #fef3c7; color: #92400e; }
.badge-no-realizado { background: #fee2e2; color: #991b1b; }

.cell-ia { text-align: center; }
.ia-ok   { color: #16a34a; }
.ia-pending { color: #cbd5e1; }

.btn-icon-action { background: transparent; border: none; padding: 0.3rem; border-radius: 6px; cursor: pointer; color: #64748b; transition: background 0.15s, color 0.15s; display: flex; }
.btn-icon-action:hover { background: #e0f2fe; color: #0369a1; }

.table-footer-count { font-size: 0.82rem; color: #94a3b8; text-align: right; }
.table-footer-count strong { color: #475569; }

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.modal-panel {
  background: var(--surface-card, #fff);
  border-radius: 18px; box-shadow: 0 25px 80px rgba(0,0,0,0.25);
  width: 100%; max-width: 760px; max-height: 90vh;
  display: flex; flex-direction: column; overflow: hidden;
  animation: slideUp 0.25s cubic-bezier(.16,1,.3,1);
}
@keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: none; } }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem; border-bottom: 1.5px solid var(--border-color, #f1f5f9);
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
}
.modal-title-group { display: flex; align-items: center; gap: 0.75rem; }
.modal-icon { color: #0369a1; font-size: 1.4rem; }
.modal-title { margin: 0; font-size: 1.15rem; font-weight: 700; color: #0f172a; }
.modal-close-btn { background: transparent; border: none; cursor: pointer; display: flex; border-radius: 8px; padding: 0.3rem; color: #64748b; }
.modal-close-btn:hover { background: #e2e8f0; }

.modal-body { padding: 1.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1.5rem; }

/* Form grid */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.span-2 { grid-column: span 2; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-label { font-size: 0.82rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
.required-field::after { content: ' *'; color: #ef4444; }
.form-input { padding: 0.65rem 0.85rem; border-radius: 8px; border: 1.5px solid var(--border-color, #e2e8f0); font-size: 0.9rem; background: var(--surface-input, #f8fafc); transition: border-color 0.2s; }
.form-input:focus { outline: none; border-color: #39a2db; background: #fff; }
.form-textarea { resize: vertical; min-height: 80px; font-family: inherit; }

.toggle-label { display: flex; align-items: center; gap: 0.6rem; cursor: pointer; }
.toggle-checkbox { width: 18px; height: 18px; accent-color: #39a2db; cursor: pointer; }
.toggle-text { display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; color: #374151; font-weight: 500; }

/* IA Section */
.ia-section {
  border: 2px dashed #7dd3fc; border-radius: 14px; padding: 1.25rem;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe08);
  display: flex; flex-direction: column; gap: 1rem;
}
.ia-section-header { display: flex; align-items: center; gap: 0.65rem; }
.ia-section-header .material-symbols-outlined { color: #0369a1; font-size: 1.4rem; }
.ia-section-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.required-chip { background: #fef3c7; color: #92400e; font-size: 0.72rem; font-weight: 700; border-radius: 20px; padding: 0.15rem 0.6rem; text-transform: uppercase; letter-spacing: 0.04em; }

.pdf-dropzone {
  border: 2px dashed #bae6fd; border-radius: 12px; padding: 2rem;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem;
  cursor: pointer; background: #f0f9ff; transition: border-color 0.2s, background 0.2s;
}
.pdf-dropzone:hover, .pdf-dropzone.dragging { border-color: #38bdf8; background: #e0f2fe; }
.pdf-dropzone.has-file { border-color: #22c55e; background: #f0fdf4; }
.hidden { display: none; }
.dropzone-icon { font-size: 2.5rem; color: #38bdf8; }
.has-file .dropzone-icon { color: #16a34a; }
.dropzone-text { font-size: 0.875rem; color: #64748b; text-align: center; margin: 0; }

.ia-actions { display: flex; gap: 1rem; }
.btn-ia-validate {
  display: flex; align-items: center; gap: 0.5rem;
  background: linear-gradient(135deg, #0369a1, #0284c7);
  color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.2rem;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 14px rgba(3,105,161,0.3);
  transition: transform 0.15s, box-shadow 0.15s;
}
.btn-ia-validate:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(3,105,161,0.4); }
.btn-ia-validate:disabled { opacity: 0.6; cursor: not-allowed; }

.ia-banner {
  display: flex; align-items: flex-start; gap: 0.75rem;
  border-radius: 10px; padding: 1rem 1.25rem;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.ia-banner .material-symbols-outlined { font-size: 1.5rem; flex-shrink: 0; }
.ia-banner-content { display: flex; flex-direction: column; gap: 0.25rem; }
.ia-banner-content strong { font-size: 0.9rem; }
.ia-banner-content p { margin: 0; font-size: 0.85rem; }
.ia-banner-ok  { background: #dcfce7; border: 1px solid #bbf7d0; color: #166534; }
.ia-banner-error { background: #fee2e2; border: 1px solid #fecaca; color: #991b1b; }

.btn-retry { display: inline-flex; align-items: center; gap: 0.35rem; margin-top: 0.5rem; background: #fca5a5; border: none; color: #991b1b; border-radius: 6px; padding: 0.3rem 0.7rem; font-size: 0.82rem; cursor: pointer; font-weight: 600; }
.btn-retry:hover { background: #f87171; }

.modal-save-error {
  display: flex; align-items: center; gap: 0.5rem;
  margin: 0 1.5rem; padding: 0.75rem 1rem;
  background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
  color: #dc2626; font-size: 0.85rem;
}

.modal-footer {
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
  padding: 1rem 1.5rem; border-top: 1.5px solid var(--border-color, #f1f5f9);
  background: #f8fafc;
}
.ia-lock-hint {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.78rem; color: #b45309; font-weight: 600;
  margin-left: auto;
}
</style>
