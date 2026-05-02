<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../core/store/auth.store'
import { trackingService } from '../services/tracking.service'

const router = useRouter()
const authStore = useAuthStore()
const instructorName = computed(() => authStore.user?.name || 'Instructor')
const isAuthenticated = computed(() => !!authStore.user)

// ── Estado ──────────────────────────────────
const apprentices = ref([])
const isLoading = ref(true)
const errorMsg = ref(null)

// ── Filtros UI ──────────────────────────────────
const searchQuery = ref('')
const semaphoreFilter = ref('TODOS')
const phaseFilter = ref('TODOS')
const modalityFilter = ref('TODOS')
const fichaFilter = ref('TODOS')

// ── Modo de Desarrollo (Bypass) ────────────────
const isDevMode = ref(true) 

// ── Carga de Datos Inteligente ──────────────────────────────────
const fetchApprentices = async () => {
  isLoading.value = true
  errorMsg.value = null
  
  try {
    const res = await trackingService.getMyApprentices()
    const data = res.data.data || []
    
    if (data.length > 0) {
      apprentices.value = data.map(item => ({
        id: item._id,
        doc: item.apprenticeId?.documento || 'S/N',
        name: item.apprenticeId?.name || 'Aprendiz sin nombre',
        initials: (item.apprenticeId?.name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        avatarColor: '#E6F4EA',
        company: item.razonSocial || 'Empresa',
        hours: item.horasAcomuladas || 0,
        limit: 864,
        progress: Math.min(Math.round(((item.horasAcomuladas || 0) / 864) * 100), 100),
        status: 'AL DÍA',
        lastReport: 0,
        phase: item.estadoEP || 'ACTIVO',
        modality: item.modalidad || 'CONTRATO',
        ficha: item.ficha || '2670687'
      }))
    } else if (isDevMode.value) {
      loadMockData()
    } else {
      errorMsg.value = 'Lo siento no puedes tener acceso puesto que no tienes aprendices.'
    }
  } catch (err) {
    if (isDevMode.value) {
      loadMockData()
    } else {
      errorMsg.value = 'Error de conexión con el servidor.'
    }
  } finally {
    isLoading.value = false
  }
}

const loadMockData = () => {
  apprentices.value = [
    { id: 1, doc: '99999999', name: 'Aprendiz Mancilla', initials: 'AM', avatarColor: '#E6F4EA', company: 'TechSolutions', hours: 145, limit: 864, progress: 17, status: 'AL DÍA', lastReport: 5, phase: 'ACTIVO', modality: 'CONTRATO DE APRENDIZAJE', ficha: '2670687' },
    { id: 2, doc: '77777777', name: 'Aprendiz Carlos', initials: 'AC', avatarColor: '#FCE4EC', company: 'Construcciones SENA', hours: 72, limit: 864, progress: 8, status: 'ATRASADO', lastReport: 18, phase: 'EN REVISIÓN', modality: 'PASANTÍA', ficha: '2670687' },
    { id: 3, doc: '1100976876', name: 'Santiago Cisneros (Prueba)', initials: 'SC', avatarColor: '#E8F5E9', company: 'Software Innovación', hours: 864, limit: 864, progress: 100, status: 'AL DÍA', lastReport: 2, phase: 'LISTO PARA CIERRE', modality: 'VÍNCULO LABORAL', ficha: '2558342' },
    { id: 4, doc: '1037112564', name: 'Daniela Palacio', initials: 'DP', avatarColor: '#E8F5E9', company: 'Logística S.A.', hours: 450, limit: 864, progress: 52, status: 'AL DÍA', lastReport: 10, phase: 'ACTIVO', modality: 'PROYECTO PRODUCTIVO', ficha: '2558342' },
  ]
}

onMounted(fetchApprentices)

const availableFichas = computed(() => [...new Set(apprentices.value.map(a => a.ficha))].sort())

const filteredApprentices = computed(() => {
  return apprentices.value.filter(a => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = a.name.toLowerCase().includes(q) || a.doc.includes(q) || a.ficha.includes(q)
    let matchesSemaphore = true
    if (semaphoreFilter.value === 'AL DÍA') matchesSemaphore = a.lastReport <= 15
    if (semaphoreFilter.value === 'ATRASADO') matchesSemaphore = a.lastReport > 15 && a.lastReport <= 30
    if (semaphoreFilter.value === 'CRÍTICO') matchesSemaphore = a.lastReport > 30
    return matchesSearch && matchesSemaphore && 
           (phaseFilter.value === 'TODOS' || a.phase === phaseFilter.value) && 
           (modalityFilter.value === 'TODOS' || a.modality === modalityFilter.value) && 
           (fichaFilter.value === 'TODOS' || a.ficha === fichaFilter.value)
  })
})

const viewDetails = (app) => {
  router.push({ name: 'bitacoras', query: { id: app.id, name: app.name, ficha: app.ficha } })
}

const resetFilters = () => {
  searchQuery.value = ''; semaphoreFilter.value = 'TODOS'; phaseFilter.value = 'TODOS'; modalityFilter.value = 'TODOS'; fichaFilter.value = 'TODOS';
}

const getStatusStyle = (status) => {
  if (status === 'AL DÍA') return { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' }
  if (status === 'ATRASADO') return { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' }
  if (status === 'CRÍTICO') return { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' }
  return { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' }
}

const getModalityIcon = (modality) => {
  if (modality.includes('CONTRATO')) return 'handshake'
  if (modality.includes('PASANTÍA')) return 'school'
  if (modality.includes('VÍNCULO')) return 'work'
  return 'apartment'
}

const getPhaseStyle = (phase) => {
  if (phase === 'ACTIVO') return { backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }
  if (phase === 'EN REVISIÓN') return { backgroundColor: '#fffbeb', color: '#ca8a04', borderColor: '#fef3c7' }
  if (phase === 'LISTO PARA CIERRE') return { backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#dbeafe' }
  return { backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }
}
</script>

<template>
  <div class="instructor-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header />

      <main class="content-view">
        
        <div v-if="(!isAuthenticated && !isDevMode) || (errorMsg && !isDevMode)" class="access-denied-container">
          <div class="denied-card">
            <span class="material-symbols-outlined icon-denied">lock_person</span>
            <h2>Acceso Restringido</h2>
            <p>{{ !isAuthenticated ? 'Debe iniciar sesión para acceder.' : errorMsg }}</p>
            <a href="/login" class="btn-login-return">Regresar al Inicio</a>
          </div>
        </div>

        <div v-else class="dashboard-inner">
          
          <div class="dashboard-top-row">
            <div class="page-title-group">
              <h1 class="page-main-title">Aprendices de {{ instructorName }}</h1>
              <p class="page-subtitle">Seguimiento exclusivo para el programa de formación asignado.</p>
            </div>

            <div class="header-indicators" v-if="!isLoading">
              <div class="mini-indicator-card" @click="semaphoreFilter = 'AL DÍA'">
                <div class="mini-card-content">
                  <p class="mini-tag">AL DÍA</p>
                  <p class="mini-num">{{ apprentices.filter(a => a.status === 'AL DÍA').length }}</p>
                </div>
                <div class="mini-icon bg-green-light"><span class="material-symbols-outlined text-green">check_circle</span></div>
              </div>
              <div class="mini-indicator-card" @click="semaphoreFilter = 'ATRASADO'">
                <div class="mini-card-content">
                  <p class="mini-tag">ATRASADOS</p>
                  <p class="mini-num text-yellow">{{ apprentices.filter(a => a.status === 'ATRASADO').length }}</p>
                </div>
                <div class="mini-icon bg-yellow-light"><span class="material-symbols-outlined text-yellow">schedule</span></div>
              </div>
              <div class="mini-indicator-card" @click="semaphoreFilter = 'CRÍTICO'">
                <div class="mini-card-content">
                  <p class="mini-tag">CRÍTICOS</p>
                  <p class="mini-num text-red">{{ apprentices.filter(a => a.status === 'CRÍTICO').length }}</p>
                </div>
                <div class="mini-icon bg-red-light"><span class="material-symbols-outlined text-red">error</span></div>
              </div>
            </div>
          </div>

          <div class="filters-bar-card">
            <div class="filters-grid">
              <div class="filter-item">
                <label>Búsqueda Rápida</label>
                <div class="search-input-wrapper">
                  <span class="material-symbols-outlined">search</span>
                  <input type="text" v-model="searchQuery" placeholder="Doc, Nombre o Ficha..." />
                </div>
              </div>

              <div class="filter-item">
                <label>Fichas Asignadas</label>
                <select v-model="fichaFilter" class="premium-select">
                  <option value="TODOS">Todas las Fichas</option>
                  <option v-for="f in availableFichas" :key="f" :value="f">Ficha: {{ f }}</option>
                </select>
              </div>

              <div class="filter-item">
                <label>Semáforo</label>
                <select v-model="semaphoreFilter" class="premium-select">
                  <option value="TODOS">Todos</option>
                  <option value="AL DÍA">🟢 Al Día</option>
                  <option value="ATRASADO">🟡 Atrasados</option>
                  <option value="CRÍTICO">🔴 Críticos</option>
                </select>
              </div>

              <div class="filter-item">
                <label>Fase</label>
                <select v-model="phaseFilter" class="premium-select">
                  <option value="TODOS">Todas</option>
                  <option value="EN REVISIÓN">En Revisión</option>
                  <option value="ACTIVO">Activos</option>
                  <option value="LISTO PARA CIERRE">Listos para Cierre</option>
                </select>
              </div>

              <div class="filter-item">
                <label>Modalidad</label>
                <select v-model="modalityFilter" class="premium-select">
                  <option value="TODOS">Todas</option>
                  <option value="CONTRATO DE APRENDIZAJE">Contrato</option>
                  <option value="PASANTÍA">Pasantía</option>
                  <option value="VÍNCULO LABORAL">Vínculo</option>
                </select>
              </div>

              <div class="filter-actions">
                <button class="btn-clean" @click="resetFilters" title="Limpiar Filtros">
                  <span class="material-symbols-outlined">filter_alt_off</span>
                </button>
                <button class="btn-primary-sena">
                  <span class="material-symbols-outlined">download</span> Exportar
                </button>
              </div>
            </div>
          </div>

          <div class="table-container-card">
            <div v-if="isLoading" class="loading-state-overlay"><div class="spin-ring-lg"></div><p>Cargando...</p></div>
            <div class="scrollable-table" v-else>
              <table class="apprentices-table">
                <thead>
                  <tr>
                    <th>APRENDIZ</th>
                    <th>FICHA</th>
                    <th>MODALIDAD / EMPRESA</th>
                    <th>FASE</th>
                    <th>CUMPLIMIENTO</th>
                    <th>ESTADO</th>
                    <th class="text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="app in filteredApprentices" :key="app.id">
                    <td>
                      <div class="user-cell">
                        <div class="avatar" :style="{ backgroundColor: app.avatarColor }">{{ app.initials }}</div>
                        <div class="user-info">
                          <p class="user-name">{{ app.name }}</p>
                          <p class="user-sub">C.C. {{ app.doc }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="ficha-cell-premium">
                        <span class="ficha-number">#{{ app.ficha }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="modality-cell-premium">
                        <div class="company-row">
                          <span class="material-symbols-outlined icon-company">{{ getModalityIcon(app.modality) }}</span>
                          <span class="company-name">{{ app.company }}</span>
                        </div>
                        <div class="mod-tags-row">
                          <span class="mod-pill">{{ app.modality }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="phase-badge" :style="getPhaseStyle(app.phase)">
                        {{ app.phase }}
                      </span>
                    </td>
                    <td class="td-progress">
                      <div class="progress-info"><span>{{ app.hours }}h</span><span>{{ app.progress }}%</span></div>
                      <div class="mini-bar"><div class="mini-fill" :style="{ width: app.progress + '%', backgroundColor: app.progress > 70 ? '#39A900' : (app.progress > 40 ? '#f59e0b' : '#C62828') }"></div></div>
                    </td>
                    <td>
                      <span class="status-pill-admin" :style="{ backgroundColor: getStatusStyle(app.status).bg, color: getStatusStyle(app.status).text }">
                        <div class="status-dot-admin" :style="{ backgroundColor: getStatusStyle(app.status).dot }"></div>
                        {{ app.status }}
                      </span>
                    </td>
                    <td class="text-center">
                      <button class="btn-view" title="Ver Seguimiento"><span class="material-symbols-outlined">visibility</span></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="pagination-row" v-if="!isLoading">
              <p class="pag-info">Mostrando <b>{{ filteredApprentices.length }}</b> de <b>{{ apprentices.length }}</b> aprendices</p>
              <div class="pag-btns">
                <button class="btn-p-nav"><span class="material-symbols-outlined">chevron_left</span></button>
                <button class="btn-p active">1</button>
                <button class="btn-p-nav"><span class="material-symbols-outlined">chevron_right</span></button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<style scoped>
.instructor-dashboard { display: flex; height: 100vh; background-color: #F8FAF9; overflow: hidden; font-family: 'Inter', sans-serif; }
.main-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.content-view { flex: 1; overflow-y: auto; padding: 1.5rem; background: #fbfcfb; }
.dashboard-inner { max-width: 1400px; margin: 0 auto; }

/* ACCESS DENIED */
.access-denied-container { display: flex; align-items: center; justify-content: center; height: 70vh; }
.denied-card { background: white; padding: 3rem; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.06); text-align: center; max-width: 450px; border: 1px solid #f1f5f9; }
.icon-denied { font-size: 4rem !important; color: #fca5a5; margin-bottom: 1.5rem; }
.btn-login-return { background: #39A900; color: white; padding: 0.75rem 2rem; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-block; }

/* TOP ROW */
.dashboard-top-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; }
.page-main-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.5px; }
.page-subtitle { font-size: 0.7rem; color: #64748b; margin: 2px 0 0; }
.header-indicators { display: flex; gap: 1rem; }
.mini-indicator-card { background: white; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #edf2f7; display: flex; align-items: center; gap: 1rem; min-width: 130px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
.mini-indicator-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); border-color: #39A900; }
.mini-num { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0; }
.mini-tag { font-size: 0.6rem; font-weight: 800; color: #94a3b8; margin: 0; text-transform: uppercase; }
.mini-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }

/* FILTERS */
.filters-bar-card { background: white; padding: 1.25rem; border-radius: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; margin-bottom: 1.5rem; }
.filters-grid { display: grid; grid-template-columns: 1.2fr 1fr 0.8fr 0.8fr 0.8fr 180px; gap: 1rem; align-items: flex-end; }
.filter-item label { display: block; font-size: 0.6rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; }
.search-input-wrapper { position: relative; }
.search-input-wrapper span { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: #94a3b8; }
.search-input-wrapper input, .premium-select { width: 100%; height: 38px; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.75rem; padding: 0 12px; outline: none; transition: 0.2s; }
.search-input-wrapper input { padding-left: 35px; }
.search-input-wrapper input:focus, .premium-select:focus { border-color: #39A900; background: white; box-shadow: 0 0 0 4px rgba(57, 169, 0, 0.05); }
.filter-actions { display: flex; gap: 0.5rem; }
.btn-clean { width: 38px; height: 38px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; color: #94a3b8; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
.btn-clean:hover { color: #dc2626; border-color: #fca5a5; background: #fef2f2; }
.btn-primary-sena { flex: 1; height: 38px; background: #39A900; color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: 0.2s; }
.btn-primary-sena:hover { background: #2d8500; box-shadow: 0 6px 15px rgba(57, 169, 0, 0.2); }

/* TABLE */
.table-container-card { background: white; border-radius: 14px; box-shadow: 0 15px 35px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; overflow: hidden; position: relative; }
.apprentices-table { width: 100%; border-collapse: collapse; }
.apprentices-table th { background: #39A900; color: white; padding: 1rem; text-align: left; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.apprentices-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }
.apprentices-table tbody tr:nth-child(even) { background: #fafbfc; }
.apprentices-table tbody tr:hover { background: #f1fdf4; }

.user-cell { display: flex; align-items: center; gap: 0.75rem; }
.avatar { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; color: #15803d; }
.user-name { font-size: 0.8rem; font-weight: 800; color: #1e293b; margin: 0; }
.user-sub { font-size: 0.65rem; color: #94a3b8; margin: 0; }

/* MODALITY CELL PREMIUM */
.modality-cell-premium { display: flex; flex-direction: column; gap: 6px; }
.company-row { display: flex; align-items: center; gap: 6px; }
.icon-company { font-size: 1.1rem !important; color: #39A900; }
.company-name { font-size: 0.8rem; font-weight: 800; color: #1e293b; letter-spacing: -0.2px; }
.mod-tags-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.mod-pill { background: #f1f5f9; color: #475569; font-size: 0.58rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; border: 1px solid #e2e8f0; }

/* FICHA CELL */
.ficha-cell-premium { background: #e0f2fe; padding: 4px 10px; border-radius: 8px; border: 1px solid #bae6fd; display: inline-block; }
.ficha-number { color: #0369a1; font-size: 0.75rem; font-weight: 900; font-family: 'JetBrains Mono', monospace; }

.phase-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; border: 1px solid transparent; text-transform: uppercase; }

.td-progress { width: 140px; }
.progress-info { display: flex; justify-content: space-between; font-size: 0.6rem; font-weight: 800; margin-bottom: 4px; color: #475569; }
.mini-bar { height: 5px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
.mini-fill { height: 100%; transition: width 0.4s ease; }

.status-pill-admin { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 0.6rem; font-weight: 800; }
.status-dot-admin { width: 6px; height: 6px; border-radius: 50%; }

.btn-view { width: 34px; height: 34px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; color: #39A900; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
.btn-view:hover { background: #e8f7e1; transform: scale(1.1); border-color: #39A900; }

/* PAGINATION */
.pagination-row { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; background: #fff; border-top: 1px solid #f1f5f9; }
.pag-info { font-size: 0.75rem; color: #64748b; font-weight: 500; margin: 0; }
.pag-btns { display: flex; gap: 8px; }
.btn-p, .btn-p-nav { width: 34px; height: 34px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 0.75rem; font-weight: 700; }
.btn-p:hover, .btn-p-nav:hover { border-color: #39A900; color: #39A900; background: #f0fdf4; }
.btn-p.active { background: #39A900; color: white; border-color: #39A900; box-shadow: 0 4px 10px rgba(57, 169, 0, 0.2); }

/* UTILS */
.bg-green-light { background: #f0fdf4; }
.bg-yellow-light { background: #fffbeb; }
.bg-red-light { background: #fef2f2; }
.text-green { color: #16a34a; }
.text-yellow { color: #ca8a04; }
.text-red { color: #dc2626; }
.loading-state-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem; gap: 1rem; }
.spin-ring-lg { width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: #39A900; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
