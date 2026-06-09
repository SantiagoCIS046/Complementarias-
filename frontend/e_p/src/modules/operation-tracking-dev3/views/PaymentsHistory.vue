<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import { useAuthStore } from '../../../core/store/auth.store'
import http from '../../../core/api/http'

const authStore = useAuthStore()

// ── Estado ───────────────────────────────────────────────────────
const resumenGlobal = ref({ totalCobrado: 0, totalPendiente: 0, visitasEjecutadas: 0 })
const meses         = ref([])
const instructores  = ref([]) // Para filtro de ADMIN
const selectedInst  = ref('')
const isLoading     = ref(true)
const errorMsg      = ref(null)
const expandedMeses = ref(new Set())
const isUpdating    = ref(null) // ID del registro que se está actualizando

const isAdmin = computed(() => authStore.user?.role === 'ADMIN')

// ── Carga de Datos ───────────────────────────────────────────────
const fetchData = async () => {
  isLoading.value = true
  errorMsg.value  = null
  try {
    const params = {}
    if (isAdmin.value && selectedInst.value) {
      params.instructorId = selectedInst.value
    }
    const res = await http.get('/hours/historico-pagos', { params })
    const payload = res.data.data || {}
    resumenGlobal.value = payload.resumenGlobal || { totalCobrado: 0, totalPendiente: 0, visitasEjecutadas: 0 }
    meses.value         = payload.meses || []

    // Inicialmente expandir el mes más reciente
    if (meses.value.length > 0) {
      expandedMeses.value.add(`${meses.value[0].year}-${meses.value[0].mes}`)
    }
  } catch (err) {
    errorMsg.value = 'Error al cargar el histórico: ' + (err.response?.data?.message || err.message)
  } finally {
    isLoading.value = false
  }
}

// Carga lista de instructores para filtros del ADMIN
const fetchInstructors = async () => {
  if (!isAdmin.value) return
  try {
    const res = await http.get('/users?role=INSTRUCTOR')
    instructores.value = res.data.users || []
  } catch (err) {
    console.error('Error fetching instructors:', err)
  }
}

onMounted(() => {
  fetchData()
  fetchInstructors()
})

// ── Acordeón ─────────────────────────────────────────────────────
const toggleMes = (key) => {
  if (expandedMeses.value.has(key)) {
    expandedMeses.value.delete(key)
  } else {
    expandedMeses.value.add(key)
  }
}
const isExpanded = (key) => expandedMeses.value.has(key)

// ── Control de Horas (Ejecutado / Cobrado) ──────────────────────────
const findDetalleById = (hourId) => {
  for (const m of meses.value) {
    const found = m.detalles.find(d => d.hourId === hourId)
    if (found) return found
  }
  return null
}

const marcarEjecutado = async (hourId) => {
  if (isUpdating.value) return
  isUpdating.value = hourId

  const det = findDetalleById(hourId)
  let previousEjecutado = false
  if (det) {
    previousEjecutado = det.ejecutado
    det.ejecutado = true
  }

  try {
    await http.patch(`/hours/${hourId}/estado`, {
      ejecutado: true
    })
  } catch (err) {
    if (det) {
      det.ejecutado = previousEjecutado
    }
    alert('Error al actualizar estado: ' + (err.response?.data?.message || err.message))
  } finally {
    isUpdating.value = null
  }
}

const marcarCobrado = async (hourId) => {
  if (isUpdating.value) return
  isUpdating.value = hourId

  const det = findDetalleById(hourId)
  let previousCobrado = false
  let previousPendiente = true
  if (det) {
    previousCobrado = det.cobrado
    previousPendiente = det.pendiente
    det.cobrado = true
    det.pendiente = false
  }

  try {
    await http.patch(`/hours/${hourId}/estado`, {
      ejecutado: true,
      cobrado: true,
      pendiente: false
    })
    await fetchData()
  } catch (err) {
    if (det) {
      det.cobrado = previousCobrado
      det.pendiente = previousPendiente
    }
    alert('Error al actualizar estado: ' + (err.response?.data?.message || err.message))
  } finally {
    isUpdating.value = null
  }
}

// ── Helpers ───────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'
const calculoPorcentaje = (mesItem) => {
  const total = mesItem.cobradasCount + mesItem.pendientesCount
  if (total === 0) return 0
  return Math.round((mesItem.cobradasCount / total) * 100)
}
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header title="Histórico de Pagos" />

      <main class="content">
        <div class="ins-page-body">

          <!-- Page Header -->
          <header class="ins-page-header">
            <div class="header-info">
              <h1 class="ins-page-title">Histórico de Pagos por Mes</h1>
              <p class="ins-page-description">Consolidación financiera de visitas extraordinarias y horas adicionales devengadas.</p>
            </div>
            
            <div class="header-actions">
              <!-- Filtro Admin -->
              <div v-if="isAdmin" class="ins-filter-group">
                <select id="select-instructor-pagos" v-model="selectedInst" @change="fetchData" class="ins-filter-select">
                  <option value="">Todos los Instructores</option>
                  <option v-for="inst in instructores" :key="inst._id" :value="inst._id">{{ inst.name }}</option>
                </select>
              </div>

              <button id="btn-sincronizar-pagos" class="ins-btn-sync" @click="fetchData" :disabled="isLoading">
                <span class="material-symbols-outlined" :class="{ 'ins-spin': isLoading }">sync</span>
                {{ isLoading ? 'Cargando...' : 'Sincronizar' }}
              </button>
            </div>
          </header>

          <!-- KPI Cards Premium (HSL curado) -->
          <div class="ins-kpi-grid">
            <div class="ins-kpi-card">
              <div class="ins-kpi-icon-wrap"><span class="material-symbols-outlined">payments</span></div>
              <div class="ins-kpi-content">
                <span class="ins-kpi-value">{{ resumenGlobal.totalCobrado }}<span class="ins-kpi-unit">h</span></span>
                <span class="ins-kpi-label">Horas Cobradas</span>
              </div>
            </div>
            <div class="ins-kpi-card">
              <div class="ins-kpi-icon-wrap"><span class="material-symbols-outlined">pending</span></div>
              <div class="ins-kpi-content">
                <span class="ins-kpi-value">{{ resumenGlobal.totalPendiente }}<span class="ins-kpi-unit">h</span></span>
                <span class="ins-kpi-label">Horas Pendientes</span>
              </div>
            </div>
            <div class="ins-kpi-card">
              <div class="ins-kpi-icon-wrap"><span class="material-symbols-outlined">local_activity</span></div>
              <div class="ins-kpi-content">
                <span class="ins-kpi-value">{{ resumenGlobal.visitasEjecutadas }}</span>
                <span class="ins-kpi-label">Visitas Especiales Ejecutadas</span>
              </div>
            </div>
          </div>

          <!-- Tabla de Historial agrupado por mes -->
          <div class="ins-table-card">
            <div v-if="isLoading" class="ins-loading-state">
              <span class="material-symbols-outlined ins-spin">sync</span>
              <span>Cargando histórico de pagos...</span>
            </div>
            <div v-else-if="errorMsg" class="ins-empty-state">
              <span class="material-symbols-outlined">error_outline</span>
              <p>{{ errorMsg }}</p>
            </div>
            <div v-else-if="meses.length === 0" class="ins-empty-state">
              <span class="material-symbols-outlined">receipt_long</span>
              <p class="ins-empty-title">SIN REGISTROS FINANCIEROS</p>
              <p class="ins-empty-subtitle">Las horas adicionales aparecerán listadas aquí una vez que se registren visitas extraordinarias.</p>
            </div>
            
            <template v-else>
              <div class="meses-list">
                <div v-for="m in meses" :key="m.year + '-' + m.mes" class="mes-block">
                  
                  <!-- Cabecera de bloque mensual -->
                  <div 
                    :id="'btn-toggle-' + m.year + '-' + m.mes"
                    class="mes-header" 
                    @click="toggleMes(m.year + '-' + m.mes)"
                    :class="{ 'expanded': isExpanded(m.year + '-' + m.mes) }"
                  >
                    <div class="mes-title-group">
                      <span class="material-symbols-outlined expand-chevron" :class="{ 'rotated': isExpanded(m.year + '-' + m.mes) }">
                        expand_more
                      </span>
                      <span class="mes-nombre">{{ m.mesNombre }}</span>
                    </div>

                    <!-- Progreso del Mes -->
                    <div class="mes-progress-wrapper" @click.stop>
                      <div class="progress-bar-container">
                        <div class="progress-bar-fill" :style="{ width: calculoPorcentaje(m) + '%' }"></div>
                      </div>
                      <span class="progress-percent">{{ calculoPorcentaje(m) }}% Cobrado</span>
                    </div>

                    <!-- Totales del Mes -->
                    <div class="mes-totals">
                      <span class="badge badge-cobradas">{{ m.totalHorasCobradas }}h Cobradas</span>
                      <span class="badge badge-pendientes">{{ m.totalHorasPendientes }}h Pendientes</span>
                    </div>
                  </div>

                  <!-- Desglose de visitas (Sub-tabla de mes) -->
                  <div v-if="isExpanded(m.year + '-' + m.mes)" class="mes-body">
                    <table class="desglose-table">
                      <thead>
                        <tr>
                          <th>Aprendiz</th>
                          <th>Ficha</th>
                          <th>Visita N°</th>
                          <th>Fecha Visita</th>
                          <th>Horas</th>
                          <th class="text-center" style="width: 220px;">Control de Pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="det in m.detalles" :key="det.hourId">
                          <td>
                            <div class="user-info-cell">
                              <span class="name">{{ det.apprentice.name }}</span>
                              <span class="document">Doc: {{ det.apprentice.documento }}</span>
                            </div>
                          </td>
                          <td>
                            <span class="ins-ficha-chip">#{{ det.apprentice.ficha }}</span>
                          </td>
                          <td>
                            <span class="visita-badge">Especial N°{{ det.visitaNumero }}</span>
                          </td>
                          <td>{{ fmtDate(det.fecha) }}</td>
                          <td class="font-bold">2.0h</td>
                          <td class="text-center">
                            <div class="control-checkbox-group">
                              <!-- Checkbox Ejecutado -->
                              <label 
                                class="checkbox-control"
                                :class="{ 'disabled': det.cobrado || det.pendiente === false || isUpdating === det.hourId }"
                              >
                                <input 
                                  type="checkbox"
                                  :id="'chk-ejecutado-' + det.hourId"
                                  :checked="det.ejecutado"
                                  :disabled="det.cobrado || det.pendiente === false || isUpdating === det.hourId"
                                  @change="marcarEjecutado(det.hourId)"
                                />
                                <span>Ejecutado</span>
                              </label>

                              <!-- Checkbox Cobrado -->
                              <label 
                                class="checkbox-control"
                                :class="{ 'disabled': !det.ejecutado || det.cobrado || det.pendiente === false || isUpdating === det.hourId }"
                              >
                                <input 
                                  type="checkbox"
                                  :id="'chk-cobrado-' + det.hourId"
                                  :checked="det.cobrado"
                                  :disabled="!det.ejecutado || det.cobrado || det.pendiente === false || isUpdating === det.hourId"
                                  @change="marcarCobrado(det.hourId)"
                                />
                                <span>Cobrado</span>
                              </label>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            </template>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ── */
.header-actions { display: flex; align-items: center; gap: 1rem; }

/* ── Historial ── */
.meses-list { display: flex; flex-direction: column; }
.mes-block { border-bottom: 1px solid #f1f5f9; }
.mes-block:last-child { border-bottom: none; }

/* Cabecera mensual de acordeón */
.mes-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem 1.5rem; background: var(--bg-elevated, #fff);
  cursor: pointer; transition: background 0.15s;
}
.mes-header:hover { background: var(--bg-hover, #f8fafc); }
.mes-header.expanded { background: var(--bg-active, #faf5ff); border-left: 3px solid #7c3aed; }

.mes-title-group { display: flex; align-items: center; gap: 0.65rem; }
.expand-chevron { color: #94a3b8; transition: transform 0.2s, color 0.15s; }
.expand-chevron.rotated { transform: rotate(180deg); color: #7c3aed; }
.mes-nombre { font-size: 0.95rem; font-weight: 800; color: var(--text-primary, #1e293b); }

.mes-progress-wrapper { display: flex; align-items: center; gap: 0.65rem; min-width: 170px; }
.progress-bar-container { flex: 1; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #7c3aed); border-radius: 99px; }
.progress-percent { font-size: 0.72rem; font-weight: 800; color: #6d28d9; white-space: nowrap; min-width: 65px; }

.mes-totals { display: flex; gap: 0.5rem; }
.badge { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 6px; font-size: 0.74rem; font-weight: 700; }
.badge-cobradas { background: #f5f3ff; color: #6d28d9; }
.badge-pendientes { background: #fff7ed; color: #c2410c; }

/* Sub-tabla mensual de visitas extraordinarias */
.mes-body { background: var(--bg-elevated); padding: 0.5rem 1.5rem 1.25rem 1.5rem; border-top: 1px solid var(--border-primary, #f1f5f9); }
.desglose-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
.desglose-table th { background: var(--bg-secondary, #f1f5f9); color: var(--text-secondary); font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.65rem 0.85rem; text-align: left; border-bottom: 1.5px solid var(--border-primary, #e2e8f0); }
.desglose-table td { padding: 0.75rem 0.85rem; font-size: 0.84rem; color: var(--text-primary); border-bottom: 1px solid var(--border-primary, #f1f5f9); background: var(--bg-elevated); vertical-align: middle; }
.desglose-table tbody tr:last-child td { border-bottom: none; }

.user-info-cell { display: flex; flex-direction: column; }
.user-info-cell .name { font-weight: 700; color: var(--text-primary); }
.user-info-cell .document { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.05rem; }

.visita-badge { display: inline-block; background: #f3e8ff; color: #7c3aed; border-radius: 6px; padding: 0.15rem 0.5rem; font-size: 0.74rem; font-weight: 800; }
.font-bold { font-weight: 700; }

.text-center { text-align: center; }

/* Control de Horas Checkboxes */
.control-checkbox-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
}

.checkbox-control {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--text-secondary);
  user-select: none;
  transition: all 0.2s ease;
}

.checkbox-control:hover:not(.disabled) {
  color: #7c3aed;
}

.checkbox-control.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.checkbox-control input[type="checkbox"] {
  accent-color: #7c3aed;
  width: 16px;
  height: 16px;
  cursor: pointer;
  border-radius: 4px;
}

/* ── Dark Mode Overrides (Específicos) ── */
[data-theme="dark"] .mes-block { border-bottom-color: var(--border-primary); }
[data-theme="dark"] .mes-header { background: var(--bg-elevated); }
[data-theme="dark"] .mes-header:hover { background: var(--bg-hover); }
[data-theme="dark"] .mes-header.expanded { background: var(--bg-active); border-left-color: #7c3aed; }

[data-theme="dark"] .mes-nombre { color: var(--text-primary); }
[data-theme="dark"] .expand-chevron { color: var(--text-muted); }
[data-theme="dark"] .expand-chevron.rotated { color: #a78bfa; }

[data-theme="dark"] .progress-bar-container { background: #374151; }
[data-theme="dark"] .progress-percent { color: #a78bfa; }

[data-theme="dark"] .badge-cobradas   { background: #2e235a; color: #c4b5fd; }
[data-theme="dark"] .badge-pendientes { background: #3b2010; color: #fb923c; }

[data-theme="dark"] .mes-body { background: var(--bg-elevated); border-top-color: var(--border-primary); }

[data-theme="dark"] .desglose-table th { background: var(--bg-secondary); color: var(--text-secondary); border-bottom-color: var(--border-primary); }
[data-theme="dark"] .desglose-table td { background: var(--bg-elevated); color: var(--text-primary); border-bottom-color: var(--border-primary); }
[data-theme="dark"] .desglose-table tbody tr:hover td { background: var(--bg-hover); }

[data-theme="dark"] .user-info-cell .name     { color: var(--text-primary); }
[data-theme="dark"] .user-info-cell .document { color: var(--text-muted); }

[data-theme="dark"] .visita-badge  { background: #2e235a; color: #c4b5fd; }

[data-theme="dark"] .checkbox-control       { color: var(--text-secondary); }
[data-theme="dark"] .checkbox-control:hover:not(.disabled) { color: #c4b5fd; }
</style>
