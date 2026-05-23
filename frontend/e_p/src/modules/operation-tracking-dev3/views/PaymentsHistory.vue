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

// ── Acción rápida: Marcar como Cobrado ─────────────────────────────
const marcarCobrado = async (hourId) => {
  if (isUpdating.value) return
  isUpdating.value = hourId
  try {
    await http.patch(`/hours/${hourId}/estado`, {
      cobrado: true,
      pendiente: false
    })
    // Sincronizar de forma atómica para actualizar KPIs y gráficos
    await fetchData()
  } catch (err) {
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
        <div class="page-body">

          <!-- Page Header -->
          <header class="page-header">
            <div class="header-info">
              <h1 class="page-title">Histórico de Pagos por Mes</h1>
              <p class="page-description">Consolidación financiera de visitas extraordinarias y horas adicionales devengadas.</p>
            </div>
            
            <div class="header-actions">
              <!-- Filtro Admin -->
              <div v-if="isAdmin" class="admin-filter-group">
                <span class="material-symbols-outlined filter-icon">person</span>
                <select id="select-instructor-pagos" v-model="selectedInst" @change="fetchData" class="premium-select">
                  <option value="">Todos los Instructores</option>
                  <option v-for="inst in instructores" :key="inst._id" :value="inst._id">{{ inst.name }}</option>
                </select>
              </div>

              <button id="btn-sincronizar-pagos" class="btn-refresh" @click="fetchData" :disabled="isLoading">
                <span class="material-symbols-outlined" :class="{ 'spin': isLoading }">sync</span>
                {{ isLoading ? 'Cargando...' : 'Sincronizar' }}
              </button>
            </div>
          </header>

          <!-- KPI Cards Premium (HSL curado) -->
          <div class="kpi-grid">
            <div class="kpi-card kpi-cobradas">
              <div class="kpi-icon-wrap"><span class="material-symbols-outlined">payments</span></div>
              <div class="kpi-content">
                <span class="kpi-value">{{ resumenGlobal.totalCobrado }}h</span>
                <span class="kpi-label">Horas Cobradas</span>
              </div>
            </div>
            <div class="kpi-card kpi-pendientes">
              <div class="kpi-icon-wrap"><span class="material-symbols-outlined">pending</span></div>
              <div class="kpi-content">
                <span class="kpi-value">{{ resumenGlobal.totalPendiente }}h</span>
                <span class="kpi-label">Horas Pendientes</span>
              </div>
            </div>
            <div class="kpi-card kpi-visitas">
              <div class="kpi-icon-wrap"><span class="material-symbols-outlined">local_activity</span></div>
              <div class="kpi-content">
                <span class="kpi-value">{{ resumenGlobal.visitasEjecutadas }}</span>
                <span class="kpi-label">Visitas Especiales Ejecutadas</span>
              </div>
            </div>
          </div>

          <!-- Tabla de Historial agrupado por mes -->
          <div class="history-card">
            <div v-if="isLoading" class="state-container">
              <span class="material-symbols-outlined spin">sync</span>
              <span>Cargando histórico de pagos...</span>
            </div>
            <div v-else-if="errorMsg" class="state-container error">
              <span class="material-symbols-outlined">error_outline</span>
              <p>{{ errorMsg }}</p>
            </div>
            <div v-else-if="meses.length === 0" class="state-container empty">
              <span class="material-symbols-outlined font-size-3">receipt_long</span>
              <p class="empty-title">SIN REGISTROS FINANCIEROS</p>
              <p class="empty-subtitle">Las horas adicionales aparecerán listadas aquí una vez que se registren visitas extraordinarias.</p>
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
                          <th>Estado Pago</th>
                          <th class="text-center">Acciones</th>
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
                            <span class="ficha-badge">#{{ det.apprentice.ficha }}</span>
                          </td>
                          <td>
                            <span class="visita-badge">Especial N°{{ det.visitaNumero }}</span>
                          </td>
                          <td>{{ fmtDate(det.fecha) }}</td>
                          <td class="font-bold">2.0h</td>
                          <td>
                            <span :class="['state-badge', det.cobrado ? 'badge-success' : 'badge-warning']">
                              {{ det.cobrado ? 'COBRADA' : 'PENDIENTE' }}
                            </span>
                          </td>
                          <td class="text-center">
                            <!-- Botón de acción rápida si el registro está pendiente de pago -->
                            <button
                              v-if="!det.cobrado"
                              :id="'btn-cobrar-' + det.hourId"
                              class="btn-cobrar-accion"
                              @click="marcarCobrado(det.hourId)"
                              :disabled="isUpdating === det.hourId"
                            >
                              <span class="material-symbols-outlined icon-btn-sm" :class="{ 'spin': isUpdating === det.hourId }">
                                {{ isUpdating === det.hourId ? 'sync' : 'paid' }}
                              </span>
                              {{ isUpdating === det.hourId ? 'Guardando...' : 'Cobrar' }}
                            </button>
                            <span v-else class="text-muted-check">
                              <span class="material-symbols-outlined check-icon">check_circle</span>
                              Pagado
                            </span>
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
/* ── Layout & Variables HSL ── */
.page-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.page-title { font-size: 1.6rem; font-weight: 700; color: var(--text-primary, #1e293b); margin: 0; }
.page-description { font-size: 0.875rem; color: var(--text-secondary, #64748b); margin: 0.25rem 0 0; }

.header-actions { display: flex; align-items: center; gap: 1rem; }
.admin-filter-group { display: flex; align-items: center; gap: 0.5rem; background: var(--surface-card, #fff); border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 0 0.75rem; height: 38px; }
.admin-filter-group .filter-icon { color: #64748b; font-size: 1.2rem; }
.premium-select { border: none; background: transparent; font-size: 0.82rem; font-weight: 700; color: #1e293b; outline: none; cursor: pointer; height: 100%; }

.btn-refresh {
  display: flex; align-items: center; gap: 0.5rem;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.2rem;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 14px rgba(15,23,42,0.25);
  transition: transform 0.15s, opacity 0.15s;
}
.btn-refresh:hover:not(:disabled) { transform: translateY(-2px); }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ── KPI Grid (HSL curado) ── */
.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
@media (max-width: 768px) { .kpi-grid { grid-template-columns: 1fr; } }

.kpi-card {
  display: flex; align-items: center; gap: 1.25rem;
  background: var(--surface-card, #fff); border-radius: 14px; padding: 1.25rem 1.5rem;
  border: 1.5px solid transparent;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}
.kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }

.kpi-cobradas   { border-color: #ddd6fe; background: linear-gradient(135deg, #fff, #f5f3ff); }
.kpi-pendientes  { border-color: #fed7aa; background: linear-gradient(135deg, #fff, #fff7ed); }
.kpi-visitas     { border-color: #a7f3d0; background: linear-gradient(135deg, #fff, #f0fdf4); }

.kpi-icon-wrap { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kpi-cobradas .kpi-icon-wrap   { background: #ede9fe; color: #6d28d9; }
.kpi-pendientes .kpi-icon-wrap  { background: #ffedd5; color: #ea580c; }
.kpi-visitas .kpi-icon-wrap     { background: #d1fae5; color: #059669; }
.kpi-icon-wrap .material-symbols-outlined { font-size: 1.5rem; }

.kpi-content { display: flex; flex-direction: column; gap: 0.15rem; }
.kpi-value { font-size: 1.8rem; font-weight: 855; line-height: 1; color: #0f172a; }
.kpi-label { font-size: 0.76rem; font-weight: 650; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

/* ── Historial ── */
.history-card {
  background: var(--surface-card, #fff); border-radius: 14px;
  border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  overflow: hidden;
}

.state-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; padding: 4.5rem 2rem; color: #94a3b8; text-align: center; }
.state-container .spin, .state-container .material-symbols-outlined { font-size: 2.6rem; }
.font-size-3 { font-size: 3.2rem !important; }
.empty-title { font-size: 0.95rem; font-weight: 800; color: #475569; margin: 0.5rem 0 0.15rem; }
.empty-subtitle { font-size: 0.74rem; color: #94a3b8; max-width: 340px; margin: 0; line-height: 1.45; }

.meses-list { display: flex; flex-direction: column; }
.mes-block { border-bottom: 1px solid #f1f5f9; }
.mes-block:last-child { border-bottom: none; }

/* Cabecera mensual de acordeón */
.mes-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem 1.5rem; background: var(--surface-card, #fff);
  cursor: pointer; transition: background 0.15s;
}
.mes-header:hover { background: #f8fafc; }
.mes-header.expanded { background: #faf5ff; border-left: 3px solid #7c3aed; }

.mes-title-group { display: flex; align-items: center; gap: 0.65rem; }
.expand-chevron { color: #94a3b8; transition: transform 0.2s, color 0.15s; }
.expand-chevron.rotated { transform: rotate(180deg); color: #7c3aed; }
.mes-nombre { font-size: 0.95rem; font-weight: 800; color: #1e293b; }

.mes-progress-wrapper { display: flex; align-items: center; gap: 0.65rem; min-width: 170px; }
.progress-bar-container { flex: 1; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #7c3aed); border-radius: 99px; }
.progress-percent { font-size: 0.72rem; font-weight: 800; color: #6d28d9; white-space: nowrap; min-width: 65px; }

.mes-totals { display: flex; gap: 0.5rem; }
.badge { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 6px; font-size: 0.74rem; font-weight: 750; }
.badge-cobradas { background: #f5f3ff; color: #6d28d9; }
.badge-pendientes { background: #fff7ed; color: #c2410c; }

/* Sub-tabla mensual de visitas extraordinarias */
.mes-body { background: #fafcff; padding: 0.5rem 1.5rem 1.25rem 1.5rem; border-top: 1px solid #f1f5f9; }
.desglose-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
.desglose-table th { background: #f1f5f9; color: #475569; font-size: 0.74rem; font-weight: 750; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.65rem 0.85rem; text-align: left; border-bottom: 1.5px solid #e2e8f0; }
.desglose-table td { padding: 0.75rem 0.85rem; font-size: 0.84rem; color: #334155; border-bottom: 1px solid #f1f5f9; background: #fff; vertical-align: middle; }
.desglose-table tbody tr:last-child td { border-bottom: none; }

.user-info-cell { display: flex; flex-direction: column; }
.user-info-cell .name { font-weight: 700; color: #0f172a; }
.user-info-cell .document { font-size: 0.72rem; color: #94a3b8; margin-top: 0.05rem; }

.ficha-badge { display: inline-block; background: #e0f2fe; color: #0369a1; border-radius: 6px; padding: 0.15rem 0.5rem; font-size: 0.76rem; font-weight: 800; }
.visita-badge { display: inline-block; background: #f3e8ff; color: #7c3aed; border-radius: 6px; padding: 0.15rem 0.5rem; font-size: 0.74rem; font-weight: 800; }
.font-bold { font-weight: 700; }

.state-badge { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
.badge-success { background: #dcfce7; color: #15803d; }
.badge-warning { background: #ffedd5; color: #c2410c; }

.text-center { text-align: center; }

/* Botones de acción rápida */
.btn-cobrar-accion {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem;
  background: #ede9fe; border: 1.5px solid #ddd6fe; border-radius: 8px;
  padding: 0.3rem 0.75rem; font-size: 0.74rem; font-weight: 750; color: #7c3aed;
  cursor: pointer; transition: all 0.15s;
}
.btn-cobrar-accion:hover:not(:disabled) { background: #7c3aed; color: #fff; border-color: #7c3aed; }
.btn-cobrar-accion:disabled { opacity: 0.6; cursor: not-allowed; }
.icon-btn-sm { font-size: 0.95rem !important; }

.text-muted-check { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.78rem; font-weight: 700; color: #059669; }
.check-icon { font-size: 1rem !important; color: #10b981; }
</style>
