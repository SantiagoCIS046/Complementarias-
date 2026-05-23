<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import { trackingService } from '../services/tracking.service'

// ── Estado ───────────────────────────────────────────────────────
const allStages   = ref([])
const isLoading   = ref(true)
const errorMsg    = ref(null)
const searchQuery = ref('')
const filterMonth = ref('TODOS')
const expandedIds = ref(new Set())

// ── Meses para filtro ────────────────────────────────────────────
const MONTHS = [
  { value: 'TODOS', label: 'Todos los meses' },
  { value: '0',  label: 'Enero' },   { value: '1',  label: 'Febrero' },
  { value: '2',  label: 'Marzo' },   { value: '3',  label: 'Abril' },
  { value: '4',  label: 'Mayo' },    { value: '5',  label: 'Junio' },
  { value: '6',  label: 'Julio' },   { value: '7',  label: 'Agosto' },
  { value: '8',  label: 'Septiembre' }, { value: '9',  label: 'Octubre' },
  { value: '10', label: 'Noviembre' }, { value: '11', label: 'Diciembre' },
]

// ── Carga datos ───────────────────────────────────────────────────
const fetchData = async () => {
  isLoading.value = true
  errorMsg.value  = null
  try {
    const res = await trackingService.getMyApprentices()
    allStages.value = res.data.data || []
  } catch (err) {
    errorMsg.value = 'Error al cargar los datos: ' + (err.response?.data?.message || err.message)
  } finally {
    isLoading.value = false
  }
}
onMounted(fetchData)

// ── KPI globales ─────────────────────────────────────────────────
const globalKPI = computed(() => {
  const requeridas  = allStages.value.reduce((s, st) => s + (st.horasRequeridas || 864), 0)
  const completadas = allStages.value.reduce((s, st) => s + (st.horasCompletadas || 0), 0)
  const pendientes  = Math.max(0, requeridas - completadas)
  return { requeridas, completadas, pendientes }
})

// ── Fila de cada aprendiz procesada ─────────────────────────────
const processedRows = computed(() => {
  return allStages.value.map(st => {
    const apprentice = st.apprenticeId || {}
    const bitacoras  = st.bitacoras || []

    // Filtrar por mes si aplica
    const filteredBitacoras = filterMonth.value === 'TODOS'
      ? bitacoras
      : bitacoras.filter(b => {
          const d = new Date(b.createdAt || b.fechaCreacion || '')
          return !isNaN(d) && String(d.getMonth()) === filterMonth.value
        })

    const horasAprobadas  = filteredBitacoras
      .filter(b => b.estado === 'APROBADA')
      .reduce((s, b) => s + (b.horasReportadas || 0), 0)

    const horasPendientes = filteredBitacoras
      .filter(b => b.estado !== 'APROBADA')
      .reduce((s, b) => s + (b.horasReportadas || 0), 0)

    const horasRequeridas = st.horasRequeridas || 864
    const progreso = horasRequeridas > 0 ? Math.min(100, Math.round((horasAprobadas / horasRequeridas) * 100)) : 0

    return {
      id: st._id,
      name: apprentice.name || 'Sin nombre',
      doc: apprentice.documento || 'S/N',
      initials: (apprentice.name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      ficha: apprentice.ficha || 'S/F',
      horasRequeridas,
      horasAprobadas,
      horasPendientes,
      progreso,
      bitacoras: filteredBitacoras,
    }
  })
})

// ── Filtro búsqueda ───────────────────────────────────────────────
const filteredRows = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return processedRows.value
  return processedRows.value.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.doc.toLowerCase().includes(q) ||
    r.ficha.toLowerCase().includes(q)
  )
})

// ── Toggle expansión ──────────────────────────────────────────────
const toggleExpand = (id) => {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}
const isExpanded = (id) => expandedIds.value.has(id)

// ── Helpers ───────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' }) : '---'
const estadoBadgeClass = (estado) => ({
  'bit-badge-aprobada':   estado === 'APROBADA',
  'bit-badge-pendiente':  estado === 'PENDIENTE' || estado === 'ENVIADA',
  'bit-badge-rechazada':  estado === 'RECHAZADA',
  'bit-badge-borrador':   !estado || estado === 'BORRADOR',
})
const quincena = (idx) => `Q${idx + 1}`
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />
    <div class="main-wrapper">
      <Header title="Informe de Horas" />

      <main class="content">
        <div class="page-body">

          <!-- Header -->
          <header class="page-header">
            <div class="header-info">
              <h1 class="page-title">Informe de Horas de Aprendices</h1>
              <p class="page-description">Consulta consolidada de horas reportadas por aprendiz en sus bitácoras quincenales.</p>
            </div>
            <button id="btn-sincronizar-horas" class="btn-refresh" @click="fetchData" :disabled="isLoading">
              <span class="material-symbols-outlined" :class="{ 'spin': isLoading }">sync</span>
              {{ isLoading ? 'Cargando...' : 'Sincronizar' }}
            </button>
          </header>

          <!-- KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card kpi-total">
              <div class="kpi-icon-wrap"><span class="material-symbols-outlined">schedule</span></div>
              <div class="kpi-content">
                <span class="kpi-value">{{ globalKPI.requeridas.toLocaleString() }}</span>
                <span class="kpi-label">Horas Totales Requeridas</span>
              </div>
            </div>
            <div class="kpi-card kpi-done">
              <div class="kpi-icon-wrap"><span class="material-symbols-outlined">task_alt</span></div>
              <div class="kpi-content">
                <span class="kpi-value">{{ globalKPI.completadas.toLocaleString() }}</span>
                <span class="kpi-label">Horas Ejecutadas (Aprobadas)</span>
              </div>
            </div>
            <div class="kpi-card kpi-pending">
              <div class="kpi-icon-wrap"><span class="material-symbols-outlined">pending_actions</span></div>
              <div class="kpi-content">
                <span class="kpi-value">{{ globalKPI.pendientes.toLocaleString() }}</span>
                <span class="kpi-label">Horas Pendientes / En Revisión</span>
              </div>
            </div>
          </div>

          <!-- Filtros -->
          <div class="hrs-filters-bar">
            <div class="search-box-wrapper">
              <span class="material-symbols-outlined search-icon">search</span>
              <input
                id="input-buscar-horas"
                v-model="searchQuery"
                class="hrs-search-input"
                type="text"
                placeholder="Buscar por nombre, documento o ficha..."
              />
            </div>
            <div class="filter-group">
              <label class="filter-label">Mes</label>
              <select id="select-mes-horas" v-model="filterMonth" class="hrs-select">
                <option v-for="m in MONTHS" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
          </div>

          <!-- Tabla principal -->
          <div class="hrs-table-card">
            <div v-if="isLoading" class="hrs-loading">
              <span class="material-symbols-outlined spin">sync</span>
              <span>Cargando informe de horas...</span>
            </div>
            <div v-else-if="errorMsg" class="hrs-empty">
              <span class="material-symbols-outlined">error_outline</span>
              <p>{{ errorMsg }}</p>
            </div>
            <div v-else-if="filteredRows.length === 0" class="hrs-empty">
              <span class="material-symbols-outlined">analytics</span>
              <p>No se encontraron aprendices con los filtros aplicados.</p>
            </div>
            <template v-else>
              <table class="hrs-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Aprendiz</th>
                    <th>Ficha</th>
                    <th class="text-right">Requeridas</th>
                    <th class="text-right">Aprobadas</th>
                    <th class="text-right">Pendientes</th>
                    <th>Progreso</th>
                    <th>Desglose</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="row in filteredRows" :key="row.id">
                    <!-- Fila principal del aprendiz -->
                    <tr :class="['hrs-row', { 'expanded': isExpanded(row.id) }]">
                      <td class="td-expand">
                        <button
                          :id="'btn-expand-' + row.id"
                          class="btn-expand"
                          @click="toggleExpand(row.id)"
                          :title="isExpanded(row.id) ? 'Colapsar' : 'Ver desglose'"
                        >
                          <span class="material-symbols-outlined expand-icon" :class="{ 'rotated': isExpanded(row.id) }">
                            chevron_right
                          </span>
                        </button>
                      </td>
                      <td>
                        <div class="apprentice-cell">
                          <div class="apprentice-avatar">{{ row.initials }}</div>
                          <div>
                            <div class="apprentice-name">{{ row.name }}</div>
                            <div class="apprentice-doc">{{ row.doc }}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="ficha-chip">{{ row.ficha }}</span>
                      </td>
                      <td class="text-right font-semibold">{{ row.horasRequeridas }}h</td>
                      <td class="text-right">
                        <span class="hrs-num-aprobadas">{{ row.horasAprobadas }}h</span>
                      </td>
                      <td class="text-right">
                        <span class="hrs-num-pendientes">{{ row.horasPendientes }}h</span>
                      </td>
                      <td class="td-progreso">
                        <div class="progress-bar-wrapper">
                          <div class="progress-bar">
                            <div
                              class="progress-fill"
                              :style="{ width: row.progreso + '%' }"
                              :class="{ 'fill-high': row.progreso >= 80, 'fill-mid': row.progreso >= 40 && row.progreso < 80 }"
                            ></div>
                          </div>
                          <span class="progress-pct">{{ row.progreso }}%</span>
                        </div>
                      </td>
                      <td>
                        <button class="btn-desglose" @click="toggleExpand(row.id)">
                          <span class="material-symbols-outlined">{{ isExpanded(row.id) ? 'unfold_less' : 'unfold_more' }}</span>
                          {{ isExpanded(row.id) ? 'Colapsar' : 'Ver Desglose' }}
                        </button>
                      </td>
                    </tr>
                    <!-- Sub-tabla de bitácoras -->
                    <tr v-if="isExpanded(row.id)" class="subtable-row">
                      <td colspan="8" class="subtable-cell">
                        <div class="subtable-wrapper">
                          <div v-if="!row.bitacoras || row.bitacoras.length === 0" class="subtable-empty">
                            <span class="material-symbols-outlined">book_2</span>
                            <p>Sin bitácoras registradas para el período seleccionado.</p>
                          </div>
                          <table v-else class="subtable">
                            <thead>
                              <tr>
                                <th>Quincena</th>
                                <th>Fecha de Envío</th>
                                <th class="text-right">Horas Reportadas</th>
                                <th>Estado</th>
                                <th>Mes de Registro</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(bit, idx) in row.bitacoras" :key="bit._id || idx" class="subtable-bit-row">
                                <td>
                                  <span class="quincena-chip">{{ quincena(idx) }}</span>
                                </td>
                                <td class="subtable-date">{{ fmtDate(bit.createdAt || bit.fechaCreacion) }}</td>
                                <td class="text-right font-bold">
                                  <span class="hrs-reportadas">{{ bit.horasReportadas || 0 }}h</span>
                                </td>
                                <td>
                                  <span :class="['bit-badge', estadoBadgeClass(bit.estado)]">
                                    {{ bit.estado || 'BORRADOR' }}
                                  </span>
                                </td>
                                <td class="subtable-mes">
                                  {{ bit.createdAt ? new Date(bit.createdAt).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }) : '---' }}
                                </td>
                              </tr>
                            </tbody>
                            <tfoot>
                              <tr class="subtable-total-row">
                                <td colspan="2" class="total-label">Total del período</td>
                                <td class="text-right font-bold total-hrs">
                                  {{ row.bitacoras.reduce((s, b) => s + (b.horasReportadas || 0), 0) }}h
                                </td>
                                <td colspan="2"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>

              <!-- Contador -->
              <div class="table-footer-count">
                Mostrando <strong>{{ filteredRows.length }}</strong> de <strong>{{ allStages.length }}</strong> aprendices
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
.page-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.page-title { font-size: 1.6rem; font-weight: 700; color: var(--text-primary, #1e293b); margin: 0; }
.page-description { font-size: 0.875rem; color: var(--text-secondary, #64748b); margin: 0.25rem 0 0; }

.btn-refresh {
  display: flex; align-items: center; gap: 0.5rem;
  background: linear-gradient(135deg, #0369a1, #0284c7);
  color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.2rem;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 14px rgba(3,105,161,0.3);
  transition: transform 0.15s;
}
.btn-refresh:hover:not(:disabled) { transform: translateY(-2px); }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ── KPI ── */
.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
@media (max-width: 768px) { .kpi-grid { grid-template-columns: 1fr; } }

.kpi-card {
  display: flex; align-items: center; gap: 1rem;
  background: var(--surface-card, #fff); border-radius: 14px; padding: 1.25rem 1.5rem;
  border: 1.5px solid transparent;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}
.kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }

.kpi-total { border-color: #bfdbfe; background: linear-gradient(135deg, #fff, #eff6ff); }
.kpi-done  { border-color: #bbf7d0; background: linear-gradient(135deg, #fff, #f0fdf4); }
.kpi-pending { border-color: #fde68a; background: linear-gradient(135deg, #fff, #fffbeb); }

.kpi-icon-wrap { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kpi-total .kpi-icon-wrap  { background: #dbeafe; color: #2563eb; }
.kpi-done .kpi-icon-wrap   { background: #dcfce7; color: #16a34a; }
.kpi-pending .kpi-icon-wrap { background: #fef9c3; color: #ca8a04; }
.kpi-icon-wrap .material-symbols-outlined { font-size: 1.5rem; }

.kpi-content { display: flex; flex-direction: column; gap: 0.15rem; }
.kpi-value { font-size: 1.8rem; font-weight: 800; line-height: 1; color: #0f172a; }
.kpi-label { font-size: 0.78rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

/* ── Filtros ── */
.hrs-filters-bar {
  display: flex; align-items: flex-end; gap: 1rem; flex-wrap: wrap;
  background: var(--surface-card, #fff); padding: 1rem 1.25rem;
  border-radius: 12px; border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.search-box-wrapper { position: relative; flex: 1; min-width: 220px; }
.search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.1rem; }
.hrs-search-input { width: 100%; padding: 0.65rem 0.75rem 0.65rem 2.3rem; border-radius: 8px; border: 1.5px solid var(--border-color, #e2e8f0); font-size: 0.875rem; background: #f8fafc; transition: border-color 0.2s; }
.hrs-search-input:focus { outline: none; border-color: #0369a1; }

.filter-group { display: flex; flex-direction: column; gap: 0.3rem; }
.filter-label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.hrs-select { padding: 0.65rem 0.75rem; border-radius: 8px; border: 1.5px solid var(--border-color, #e2e8f0); font-size: 0.875rem; background: #f8fafc; cursor: pointer; }

/* ── Tabla principal ── */
.hrs-table-card {
  background: var(--surface-card, #fff); border-radius: 14px;
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden;
}

.hrs-loading, .hrs-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.75rem; padding: 4rem 2rem; color: #94a3b8;
}
.hrs-loading .spin, .hrs-empty .material-symbols-outlined { font-size: 2.5rem; }

.hrs-table { width: 100%; border-collapse: collapse; }
.hrs-table thead tr { background: linear-gradient(135deg, #f0fdf4, #dcfce7); }
.hrs-table th { padding: 0.85rem 1rem; text-align: left; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #166534; border-bottom: 2px solid #bbf7d0; white-space: nowrap; }
.hrs-table th.text-right { text-align: right; }

.hrs-row { border-bottom: 1px solid var(--border-color, #f1f5f9); transition: background 0.15s; }
.hrs-row:hover { background: #f8fafc; }
.hrs-row.expanded { background: #f0fdf4; border-left: 3px solid #22c55e; }
.hrs-table td { padding: 0.9rem 1rem; font-size: 0.875rem; color: #1e293b; vertical-align: middle; }
.hrs-table td.text-right { text-align: right; }

.td-expand { width: 40px; }
.btn-expand { background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; color: #64748b; transition: background 0.15s, color 0.15s; }
.btn-expand:hover { background: #f1f5f9; color: #0f172a; }
.expand-icon { font-size: 1.2rem; transition: transform 0.2s; }
.expand-icon.rotated { transform: rotate(90deg); }

.apprentice-cell { display: flex; align-items: center; gap: 0.65rem; }
.apprentice-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0; }
.apprentice-name { font-weight: 600; }
.apprentice-doc { font-size: 0.76rem; color: #94a3b8; }

.ficha-chip { display: inline-block; background: #e0f2fe; color: #0369a1; border-radius: 8px; padding: 0.2rem 0.65rem; font-size: 0.8rem; font-weight: 700; }

.hrs-num-aprobadas { font-weight: 800; color: #16a34a; }
.hrs-num-pendientes { font-weight: 700; color: #d97706; }
.font-semibold { font-weight: 600; }

.td-progreso { min-width: 160px; }
.progress-bar-wrapper { display: flex; align-items: center; gap: 0.6rem; }
.progress-bar { flex: 1; height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 99px; background: #94a3b8; transition: width 0.5s ease; }
.fill-high { background: linear-gradient(90deg, #22c55e, #16a34a); }
.fill-mid  { background: linear-gradient(90deg, #f59e0b, #d97706); }
.progress-pct { font-size: 0.78rem; font-weight: 700; color: #475569; white-space: nowrap; min-width: 38px; text-align: right; }

.btn-desglose {
  display: inline-flex; align-items: center; gap: 0.35rem;
  background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 8px;
  padding: 0.35rem 0.75rem; font-size: 0.78rem; font-weight: 600; color: #16a34a; cursor: pointer;
  transition: background 0.15s;
}
.btn-desglose:hover { background: #dcfce7; }

/* ── Sub-tabla ── */
.subtable-row { background: #f8fffe; }
.subtable-cell { padding: 0 !important; }
.subtable-wrapper { padding: 0.75rem 1.5rem 1rem 3rem; border-top: 1px solid #bbf7d0; }

.subtable-empty { display: flex; align-items: center; gap: 0.5rem; color: #94a3b8; font-size: 0.83rem; padding: 1rem 0; }
.subtable-empty .material-symbols-outlined { font-size: 1.3rem; }

.subtable { width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.subtable thead tr { background: #ecfdf5; }
.subtable th { padding: 0.65rem 0.85rem; font-size: 0.75rem; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1.5px solid #bbf7d0; }
.subtable th.text-right { text-align: right; }
.subtable-bit-row { border-bottom: 1px solid #f1f5f9; }
.subtable-bit-row:last-child { border-bottom: none; }
.subtable td { padding: 0.65rem 0.85rem; font-size: 0.84rem; color: #334155; }
.subtable td.text-right { text-align: right; }
.subtable td.font-bold { font-weight: 700; }

.quincena-chip { display: inline-block; background: #dbeafe; color: #1d4ed8; border-radius: 6px; padding: 0.15rem 0.5rem; font-weight: 800; font-size: 0.8rem; }
.subtable-date { color: #64748b; }
.hrs-reportadas { font-weight: 800; color: #0369a1; }
.subtable-mes { color: #94a3b8; font-size: 0.8rem; }

.bit-badge { display: inline-block; border-radius: 20px; padding: 0.15rem 0.65rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
.bit-badge-aprobada  { background: #dcfce7; color: #166534; }
.bit-badge-pendiente { background: #fef9c3; color: #854d0e; }
.bit-badge-rechazada { background: #fee2e2; color: #991b1b; }
.bit-badge-borrador  { background: #f1f5f9; color: #64748b; }

.subtable-total-row { background: #f0fdf4; font-weight: 700; }
.total-label { color: #166534; font-weight: 700; text-align: right; }
.total-hrs { color: #15803d; font-size: 1rem; text-align: right; }

.table-footer-count { padding: 0.75rem 1rem; font-size: 0.82rem; color: #94a3b8; text-align: right; border-top: 1px solid #f1f5f9; }
.table-footer-count strong { color: #475569; }
</style>
