<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../core/store/auth.store'
import { trackingService } from '../services/tracking.service'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'

const router = useRouter()
const authStore = useAuthStore()
const instructorName = computed(() => authStore.user?.name || 'Instructor')
const isAuthenticated = computed(() => !!authStore.user)

// ── Estado REAL ──────────────────────────────────
const apprentices = ref([])
const fichasMaster = ref([])
const isLoading = ref(true)
const errorMsg = ref(null)

// ── Filtros UI ──────────────────────────────────
const searchQuery = ref('')
const fichaFilter = ref('TODOS')

// Estados para Menús Desplegables
const activeMenus = ref({ time: false, module: false, problems: false })
const filters = ref({
  time: 'TODOS',
  module: 'APRENDICES',
  problem: 'TODOS'
})

const toggleMenu = (menu) => {
  // Cerrar los demás al abrir uno
  Object.keys(activeMenus.value).forEach(k => {
    if (k !== menu) activeMenus.value[k] = false
  })
  activeMenus.value[menu] = !activeMenus.value[menu]
}

const setFilterValue = (type, value) => {
  filters.value[type] = value
  activeMenus.value[type] = false
}

// ── Carga de Datos Únicamente desde BD ───────────────────────────
const fetchApprentices = async () => {
  isLoading.value = true
  errorMsg.value = null
  
  try {
    const [stagesRes, fichasRes] = await Promise.all([
      trackingService.getMyApprentices(),
      trackingService.getFichas()
    ])
    
    const data = stagesRes.data.data || []
    fichasMaster.value = fichasRes.data.data || []
    
    if (data.length > 0) {
      apprentices.value = data.map(item => ({
        id: item._id,
        doc: item.apprenticeId?.documento || 'S/N',
        name: item.apprenticeId?.name || 'Aprendiz sin nombre',
        initials: (item.apprenticeId?.name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        avatarColor: '#E6F4EA',
        company: item.companyId?.razonSocial || item.companySnapshot?.razonSocial || item.razonSocial || 'Sin empresa',
        hours: item.horasCompletadas || 0,
        limit: item.horasRequeridas || 864,
        progress: item.horasRequeridas > 0 ? Math.min(Math.round(((item.horasCompletadas || 0) / item.horasRequeridas) * 100), 100) : 0,
        status: item.estado === 'COMPLETADA' ? 'AL DÍA' : 'EN CURSO',
        lastReport: item.seguimientos?.length || 0,
        phase: item.estadoEP || 'ACTIVO',
        modality: item.modalidad || 'CONTRATO',
        ficha: item.ficha || item.apprenticeId?.ficha || 'S/F',
        createdAt: item.createdAt
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Orden Cronológico (Más reciente primero)
    } else {
      errorMsg.value = 'No se encontraron aprendices asignados en la base de datos.'
    }
  } catch (err) {
    console.error('Error de conexión:', err)
    errorMsg.value = 'Error al conectar con el servidor de datos.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchApprentices)

const availableFichas = computed(() => [...new Set(apprentices.value.map(a => a.ficha))].sort())

// ── Lógica de Agrupación para Módulo FICHAS ──────────────────
const groupedFichas = computed(() => {
  // Primero mapeamos todas las fichas maestras
  const groups = {}
  
  fichasMaster.value.forEach(f => {
    groups[f.codigo] = {
      numero: f.codigo,
      programa: f.programa,
      total: f.aprendices || 0,
      alDia: 0,
      retrasados: 0,
      enEP: 0
    }
  })

  // Luego sumamos los estados de los aprendices que están en etapa productiva
  apprentices.value.forEach(app => {
    if (!groups[app.ficha]) {
      groups[app.ficha] = {
        numero: app.ficha,
        programa: 'Programa No Definido',
        total: 1,
        alDia: 0,
        retrasados: 0,
        enEP: 0
      }
    }
    
    groups[app.ficha].enEP++
    if (app.status === 'AL DÍA') groups[app.ficha].alDia++
    else groups[app.ficha].retrasados++
  })
  
  return Object.values(groups).filter(f => {
    const q = searchQuery.value.toLowerCase()
    return f.numero.toLowerCase().includes(q) || f.programa.toLowerCase().includes(q)
  })
})

// ── Lógica de Filtrado para Módulo APRENDICES ────────────────
const filteredApprentices = computed(() => {
  return apprentices.value.filter(a => {
    // Búsqueda
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = a.name.toLowerCase().includes(q) || a.doc.includes(q) || a.ficha.includes(q)
    
    // Filtro Ficha (si se usa desde el select anterior o lógica interna)
    const matchesFicha = fichaFilter.value === 'TODOS' || a.ficha === fichaFilter.value
    
    // Filtro Tiempo
    let matchesTime = true
    if (filters.value.time === 'AL DÍA') matchesTime = a.status === 'AL DÍA'
    if (filters.value.time === 'RETRASADO') matchesTime = a.status !== 'AL DÍA' && a.hours > 0
    if (filters.value.time === 'NO ENTREGADO') matchesTime = a.hours === 0

    // Filtro Problemas
    let matchesProblem = true
    if (filters.value.problem === 'DESERTORES') matchesProblem = a.phase === 'DESERCIÓN'
    if (filters.value.problem === 'REPORTADOS') matchesProblem = a.lastReport > 0
    if (filters.value.problem === 'NO CUMPLIDOS') matchesProblem = a.progress < 50

    return matchesSearch && matchesFicha && matchesTime && matchesProblem
  })
})

const viewDetails = (app) => {
  router.push({ name: 'BitacorasReview', query: { id: app.id, name: app.name, ficha: app.ficha } })
}

const resetFilters = () => {
  searchQuery.value = ''
  fichaFilter.value = 'TODOS'
  filters.value = {
    time: 'TODOS',
    module: 'APRENDICES',
    problem: 'TODOS'
  }
  // Cerrar menús abiertos
  Object.keys(activeMenus.value).forEach(k => activeMenus.value[k] = false)
}

const getStatusStyle = (status) => {
  if (status === 'AL DÍA' || status === 'COMPLETADA') return { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' }
  return { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' }
}

const getModalityIcon = (modality) => {
  if (modality.includes('CONTRATO')) return 'handshake'
  if (modality.includes('PASANTÍA')) return 'school'
  if (modality.includes('VÍNCULO')) return 'work'
  return 'apartment'
}

const getPhaseStyle = (phase) => {
  if (phase === 'ACTIVO') return { backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }
  return { backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }
}
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header :title="'Panel del Instructor: ' + instructorName" />

      <main class="content">
        <div class="w-full space-y-2">

          <div class="flex items-center justify-between gap-4 mb-2">
            <p class="text-gray-500 font-medium text-xs">Visualización en tiempo real de la base de datos oficial.</p>
          </div>

          <!-- Filtros -->
          <div class="filters-bar-card">
            <div class="filters-grid">
              <div class="filter-item">
                <label>Búsqueda Rápida</label>
                <div class="search-input-wrapper">
                  <span class="material-symbols-outlined">search</span>
                  <input type="text" v-model="searchQuery" placeholder="Doc, Nombre o Ficha..." />
                </div>
              </div>



              <!-- Botón Tiempo -->
              <div class="filter-item dropdown-wrapper">
                <label>Tiempo</label>
                <button class="btn-dropdown" @click="toggleMenu('time')">
                  <span>{{ filters.time === 'TODOS' ? 'Estado de Entrega' : filters.time }}</span>
                  <span class="material-symbols-outlined">expand_more</span>
                </button>
                <div v-if="activeMenus.time" class="dropdown-menu">
                  <button @click="setFilterValue('time', 'AL DÍA')">Al día</button>
                  <button @click="setFilterValue('time', 'RETRASADO')">Retrasado</button>
                  <button @click="setFilterValue('time', 'NO ENTREGADO')">No entregado</button>
                  <hr />
                  <button @click="setFilterValue('time', 'TODOS')">Ver Todos</button>
                </div>
              </div>

              <!-- Botón Módulo -->
              <div class="filter-item dropdown-wrapper">
                <label>Módulo</label>
                <button class="btn-dropdown" @click="toggleMenu('module')">
                  <span>{{ filters.module }}</span>
                  <span class="material-symbols-outlined">expand_more</span>
                </button>
                <div v-if="activeMenus.module" class="dropdown-menu">
                  <button @click="setFilterValue('module', 'FICHAS')">Fichas</button>
                  <button @click="setFilterValue('module', 'APRENDICES')">Aprendices</button>
                </div>
              </div>

              <!-- Botón Problemas -->
              <div class="filter-item dropdown-wrapper">
                <label>Problemas</label>
                <button class="btn-dropdown btn-warning-soft" @click="toggleMenu('problems')">
                  <span>{{ filters.problem === 'TODOS' ? 'Alertas' : filters.problem }}</span>
                  <span class="material-symbols-outlined">warning</span>
                </button>
                <div v-if="activeMenus.problems" class="dropdown-menu menu-danger">
                  <button @click="setFilterValue('problem', 'DESERTORES')">Desertores</button>
                  <button @click="setFilterValue('problem', 'REPORTADOS')">Reportados</button>
                  <button @click="setFilterValue('problem', 'NO CUMPLIDOS')">No cumplidos</button>
                  <hr />
                  <button @click="setFilterValue('problem', 'TODOS')">Sin Filtro de Problemas</button>
                </div>
              </div>

              <div class="filter-actions">
                <button class="btn-clean" @click="resetFilters" title="Limpiar Filtros">
                  <span class="material-symbols-outlined">filter_alt_off</span>
                </button>
                <button class="btn-primary-sena" @click="fetchApprentices">
                  <span class="material-symbols-outlined">sync</span> Sincronizar BD
                </button>
              </div>
            </div>
          </div>

          <div class="table-container-card">
            <SkeletonLoader v-if="isLoading" variant="table" :rows="6" :columns="6" />
            <div class="scrollable-table" v-else>
              <table class="apprentices-table">
                <thead>
                  <!-- Encabezados para FICHAS -->
                  <tr v-if="filters.module === 'FICHAS'">
                    <th>FICHA # / PROGRAMA</th>
                    <th class="text-center">TOTAL APRENDICES</th>
                    <th class="text-center">AL DÍA</th>
                    <th class="text-center">PENDIENTES</th>
                    <th class="text-center">ACCIONES</th>
                  </tr>
                  <!-- Encabezados para APRENDICES -->
                  <tr v-else>
                    <th>APRENDIZ</th>
                    <th>FICHA</th>
                    <th>MODALIDAD / EMPRESA</th>
                    <th>CUMPLIMIENTO</th>
                    <th>ESTADO</th>
                    <th class="text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Render para FICHAS -->
                  <template v-if="filters.module === 'FICHAS'">
                    <tr v-for="f in groupedFichas" :key="f.numero">
                      <td>
                        <div class="ficha-cell-premium">
                          <span class="ficha-number">#{{ f.numero }}</span>
                          <div class="text-[9px] font-bold text-gray-500 mt-1 uppercase">{{ f.programa }}</div>
                        </div>
                      </td>
                      <td class="text-center font-bold">{{ f.total }} Alumnos</td>
                      <td class="text-center"><span class="text-green font-bold">{{ f.alDia }}</span></td>
                      <td class="text-center"><span class="text-red font-bold">{{ f.retrasados }}</span></td>
                      <td class="text-center">
                        <button class="btn-action-view" @click="setFilterValue('module', 'APRENDICES'); fichaFilter = f.numero">
                          <span class="material-symbols-outlined">visibility</span> Ver Grupo
                        </button>
                      </td>
                    </tr>
                  </template>
                  <template v-else>
                    <tr v-for="app in filteredApprentices" :key="app.id">
                      <td>
                        <div class="user-cell">
                          <div class="avatar" :style="{ backgroundColor: '#E6F4EA' }">{{ app.initials }}</div>
                          <div class="user-info">
                            <p class="user-name">{{ app.name }}</p>
                            <p class="user-sub">Doc: {{ app.doc }}</p>
                          </div>
                        </div>
                      </td>
                      <td><div class="ficha-cell-premium"><span class="ficha-number">#{{ app.ficha }}</span></div></td>
                      <td>
                        <div class="modality-cell-premium">
                          <div class="company-row">
                            <span class="material-symbols-outlined icon-company">{{ getModalityIcon(app.modality) }}</span>
                            <span class="company-name">{{ app.company }}</span>
                          </div>
                          <span class="mod-pill">{{ app.modality }}</span>
                        </div>
                      </td>
                      <td class="td-progress">
                        <div class="progress-info"><span>{{ app.hours }}h</span><span>{{ app.progress }}%</span></div>
                        <div class="mini-bar"><div class="mini-fill" :style="{ width: app.progress + '%', backgroundColor: 'var(--color_button)' }"></div></div>
                      </td>
                      <td>
                        <span class="status-pill-admin" :style="{ backgroundColor: getStatusStyle(app.status).bg, color: getStatusStyle(app.status).text }">
                          <div class="status-dot-admin" :style="{ backgroundColor: getStatusStyle(app.status).dot }"></div>
                          {{ app.status }}
                        </span>
                      </td>
                      <td class="text-center">
                        <button class="btn-view" @click="viewDetails(app)"><span class="material-symbols-outlined">visibility</span></button>
                      </td>
                    </tr>
                  </template>

                  <tr v-if="(filters.module === 'APRENDICES' && filteredApprentices.length === 0) || (filters.module === 'FICHAS' && groupedFichas.length === 0)">
                    <td colspan="6" class="text-center" style="padding: 3rem; color: #94a3b8; font-weight: 600;">No hay datos que coincidan con la búsqueda.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ESTILOS SINCRONIZADOS */
.instructor-dashboard { display: flex; height: 100vh; background-color: var(--bg-secondary); overflow: hidden; font-family: 'Inter', sans-serif; }
.main-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.content-view { flex: 1; overflow-y: auto; padding: 1.5rem; background: var(--bg-secondary); }
.dashboard-inner { width: 100%; }

.access-denied-container { display: flex; align-items: center; justify-content: center; height: 70vh; }
.denied-card { background: var(--bg-elevated); padding: 3rem; border-radius: 20px; box-shadow: var(--shadow-lg); text-align: center; max-width: 450px; border: 1px solid var(--border-primary); }
.icon-denied { font-size: 4rem !important; color: var(--text-muted); margin-bottom: 1.5rem; }
.btn-login-return { background: var(--color_button); color: white; padding: 0.75rem 2rem; border-radius: 10px; font-weight: 700; border: none; cursor: pointer; display: inline-block; }

.dashboard-top-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; }
.page-main-title { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.5px; }
.page-subtitle { font-size: 0.7rem; color: var(--text-secondary); margin: 2px 0 0; }

.filters-bar-card { background: var(--bg-elevated); padding: 1.25rem; border-radius: 14px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-primary); margin-bottom: 1.5rem; }
.filters-grid { display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr auto; gap: 1rem; align-items: flex-end; }
.filter-item label { display: block; font-size: 0.6rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem; }
.search-input-wrapper { position: relative; }
.search-input-wrapper span { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: var(--text-muted); }
.search-input-wrapper input, .premium-select { width: 100%; height: 38px; border-radius: 10px; border: 1px solid var(--border-primary); background: var(--bg-secondary); color: var(--text-primary); font-size: 0.75rem; padding: 0 12px; outline: none; }
.search-input-wrapper input { padding-left: 35px; }

.filter-actions { display: flex; gap: 0.5rem; }
.btn-clean { width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--border-primary); background: var(--bg-elevated); color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.btn-primary-sena { height: 38px; background: var(--color_button); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; padding: 0 15px; }

/* DROPDOWN STYLES */
.dropdown-wrapper { position: relative; }
.btn-dropdown { width: 100%; height: 38px; background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 10px; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s; }
.btn-dropdown span { font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); }
.btn-dropdown .material-symbols-outlined { font-size: 1.2rem; color: var(--text-muted); }
.btn-dropdown:hover { border-color: var(--color_button); background: var(--bg-hover); }

.btn-warning-soft { border-color: rgba(197, 48, 48, 0.3); }
.btn-warning-soft span { color: #C53030; }
.btn-warning-soft .material-symbols-outlined { color: #E53E3E; }

.dropdown-menu { position: absolute; top: calc(100% + 5px); left: 0; width: 100%; background: var(--bg-elevated); border-radius: 12px; border: 1px solid var(--border-primary); box-shadow: var(--shadow-lg); z-index: 100; overflow: hidden; padding: 4px; animation: slideDown 0.2s ease-out; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.dropdown-menu button { width: 100%; padding: 10px 12px; border: none; background: none; text-align: left; font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); cursor: pointer; border-radius: 8px; transition: all 0.2s; }
.dropdown-menu button:hover { background: var(--bg-hover); color: var(--color_button); }
.dropdown-menu hr { border: none; border-top: 1px solid var(--border-primary); margin: 4px 0; }

.menu-danger button:hover { background: rgba(197, 48, 48, 0.1); color: #C53030; }

/* UTILS & VIEW SWITCHER */
.text-green { color: #16a34a; }
.text-red { color: #dc2626; }
.font-bold { font-weight: 800; }
.btn-action-view { background: var(--bg-hover); border: 1px solid var(--border-primary); color: var(--text-secondary); padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s; margin: 0 auto; }
.btn-action-view:hover { background: var(--color_button); color: white; border-color: var(--color_button); }
.btn-action-view .material-symbols-outlined { font-size: 1rem; }

.bg-green-9 { background-color: var(--color_button); }
.bg-green-10 { background-color: #1b5e20; }

.apprentices-table { width: 100%; border-collapse: separate; border-spacing: 0 0.5rem; }
.apprentices-table th { background: var(--color_header); color: white; padding: 0.75rem 1rem; text-align: left; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; }
.apprentices-table td { padding: 0.65rem 1rem; border-bottom: 1px solid var(--border-primary); background: var(--bg-elevated); color: var(--text-primary); }

.user-cell { display: flex; align-items: center; gap: 0.75rem; }
.avatar { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; color: #15803d; }
.user-name { font-size: 0.8rem; font-weight: 800; color: var(--text-primary); margin: 0; }
.user-sub { font-size: 0.65rem; color: var(--text-muted); margin: 0; }

.ficha-cell-premium { background: #e0f2fe; padding: 4px 10px; border-radius: 8px; border: 1px solid #bae6fd; display: inline-block; }
.ficha-number { color: #0369a1; font-size: 0.75rem; font-weight: 900; }

.modality-cell-premium { display: flex; flex-direction: column; gap: 4px; }
.company-row { display: flex; align-items: center; gap: 6px; }
.icon-company { font-size: 1.1rem !important; color: var(--color_button); }
.company-name { font-size: 0.8rem; font-weight: 800; color: var(--text-primary); }
.mod-pill { background: var(--bg-hover); color: var(--text-secondary); font-size: 0.58rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; width: fit-content; }

.td-progress { width: 140px; }
.progress-info { display: flex; justify-content: space-between; font-size: 0.6rem; font-weight: 800; margin-bottom: 4px; color: var(--text-secondary); }
.mini-bar { height: 5px; background: var(--bg-hover); border-radius: 10px; }
.mini-fill { height: 100%; border-radius: 10px; }

.status-pill-admin { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 0.6rem; font-weight: 800; }
.status-dot-admin { width: 6px; height: 6px; border-radius: 50%; }

.btn-view { width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--border-primary); background: var(--bg-elevated); color: var(--color_button); cursor: pointer; display: flex; align-items: center; justify-content: center; }

.loading-state-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem; gap: 1rem; color: var(--text-muted); }
.spin-ring-lg { width: 40px; height: 40px; border: 3px solid var(--bg-hover); border-top-color: var(--color_header); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
