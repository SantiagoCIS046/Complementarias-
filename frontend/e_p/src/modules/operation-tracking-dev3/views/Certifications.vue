<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import HeaderLayout from '@/layouts/headerViewsLayout.vue'
import { trackingService } from '../services/tracking.service'

const searchCert = ref('')
const currentFilter = ref('Todos')
const certifications = ref([])
const isLoading = ref(true)

const setFilter = (filter) => {
  if (!document.startViewTransition) {
    currentFilter.value = filter
    return
  }
  document.startViewTransition(() => {
    currentFilter.value = filter
  })
}

const fetchCerts = async () => {
  isLoading.value = true
  try {
    const res = await trackingService.getMyApprentices()
    const allStages = res.data.data || []
    
    certifications.value = allStages.map(s => ({
      id: s._id,
      name: s.apprenticeId?.name || 'Desconocido',
      doc: s.apprenticeId?.documento || 'S/D',
      ficha: s.radicado || s.ficha || 'S/N',
      status: s.estado,
      date: s.estado === 'CERTIFICADO' ? new Date(s.updatedAt).toLocaleDateString() : '---'
    }))
  } catch (error) {
    console.error('Error fetching certs:', error)
  } finally {
    isLoading.value = false
  }
}

const filteredCerts = computed(() => {
  return certifications.value.filter(c => {
    const q = searchCert.value.toLowerCase()
    const matchesSearch = c.name.toLowerCase().includes(q) || 
                          c.doc.includes(q) || 
                          c.ficha.toLowerCase().includes(q)
    
    if (currentFilter.value === 'Todos') return matchesSearch
    if (currentFilter.value === 'Por Revisar') return matchesSearch && (c.status === 'POR REVISAR' || c.status === 'PENDIENTE')
    if (currentFilter.value === 'Certificados') return matchesSearch && c.status === 'CERTIFICADO'
    
    return matchesSearch
  })
})

onMounted(fetchCerts)
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header title="Certificación de Etapa Productiva" />

      <main class="content">
        <div class="page-body">
          <header class="page-header">
            <div class="header-left-group">
              <div class="header-info">
                <h1 class="page-title">Certificación de Etapa Productiva</h1>
                <p class="page-description">Gestione los procesos de certificación final de sus aprendices.</p>
              </div>
            </div>
          </header>

          <div class="dashboard-grid">
            <div class="right-col" style="width: 100%">
              <div class="card main-table-card">
                <div class="table-header">
                  <div class="filter-tabs">
                    <button class="filter-btn" :class="{active: currentFilter === 'Todos'}" @click="setFilter('Todos')">Todos</button>
                    <button class="filter-btn" :class="{active: currentFilter === 'Por Revisar'}" @click="setFilter('Por Revisar')">Por Revisar</button>
                    <button class="filter-btn" :class="{active: currentFilter === 'Certificados'}" @click="setFilter('Certificados')">Certificados</button>
                  </div>
                  <div class="search-box table-search">
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input type="text" v-model="searchCert" placeholder="Buscar por aprendiz, documento o ficha..." />
                  </div>
                </div>

                <div class="table-responsive">
                  <div v-if="isLoading" class="p-12 text-center text-gray-500">
                    <div class="spin-ring-lg mx-auto mb-4"></div>
                    Cargando aprendices...
                  </div>
                  <table v-else class="user-table">
                    <thead>
                      <tr>
                        <th>APRENDIZ</th>
                        <th>FICHA</th>
                        <th>ESTADO</th>
                        <th>FECHA CERT.</th>
                        <th>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="cert in filteredCerts" :key="cert.id">
                        <td>
                          <div class="user-cell">
                            <div class="avatar bg-green">{{ cert.name.substring(0, 2).toUpperCase() }}</div>
                            <div class="user-info">
                              <p class="u-name">{{ cert.name }}</p>
                              <p class="u-email">{{ cert.doc }}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="role-badge">#{{ cert.ficha }}</span>
                        </td>
                        <td>
                          <span class="status-pill" :class="cert.status === 'CERTIFICADO' ? 'activo' : 'contract_ended'">
                            {{ cert.status }}
                          </span>
                        </td>
                        <td>
                          <span class="u-email">{{ cert.date }}</span>
                        </td>
                        <td>
                          <button class="btn-primary-sena" style="padding: 6px 12px; font-size: 0.7rem;">
                            Gestionar
                          </button>
                        </td>
                      </tr>
                      <tr v-if="filteredCerts.length === 0">
                        <td colspan="5" class="text-center py-12 text-gray-400 italic">No se encontraron resultados</td>
                      </tr>
                    </tbody>
                  </table>
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
/* Page Header */
.page-body { flex: 1; overflow-y: auto; padding: 12px 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 1.1rem; font-weight: 800; margin: 0; color: var(--text-primary); }
.page-description { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }
.header-left-group { display: flex; align-items: center; gap: 32px; flex: 1; }
.header-info { min-width: 200px; }

/* Dashboard Grid */
.dashboard-grid { display: flex; flex-direction: column; gap: 24px; margin-bottom: 24px; }
.card { background: var(--bg-elevated); border: 1px solid var(--border-primary); border-radius: 12px; padding: 16px; }

/* Table Elements */
.main-table-card { padding: 0; }
.table-header { padding: 12px 16px; border-bottom: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: center; background: var(--bg-elevated); border-radius: 12px 12px 0 0; }
.table-search { width: 40%; position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; color: var(--text-muted); }
.table-search input { width: 100%; background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 8px; padding: 6px 10px 6px 32px; font-size: 0.75rem; outline: none; color: var(--text-primary); }
.table-search input:focus { border-color: var(--color_button); background: var(--bg-elevated); box-shadow: 0 0 0 3px rgba(46,125,50,0.15); }
.filter-tabs { display: flex; gap: 8px; }
.filter-btn { background: transparent; border: 1px solid transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: 0.2s; }
.filter-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.filter-btn.active { 
  background: var(--bg-active); 
  color: var(--color_button); 
  border-color: #bbf7d0; 
  view-transition-name: active-filter-tab; 
}

.user-table { width: 100%; border-collapse: collapse; }
.user-table th { background: #1b5e20; text-align: left; padding: 12px 16px; font-size: 0.75rem; color: white; text-transform: uppercase; font-weight: 700; white-space: nowrap; }
.user-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-primary); vertical-align: middle; white-space: nowrap; background: var(--bg-elevated); color: var(--text-primary); }
.user-table tbody tr:nth-child(even) td { background: var(--bg-secondary); }
.user-table tbody tr:hover td { background: var(--bg-hover); }

.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 0.75rem; }
.bg-green { background: #1b5e20; }

.status-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; white-space: nowrap; }
.status-pill.activo { background: #1b5e20; color: white; }
.status-pill.contract_ended { background: #ea580c; color: white; }

.u-name { font-weight: 700; margin: 0; color: var(--text-primary); font-size: 0.85rem; }
.u-email { font-size: 0.75rem; color: var(--text-muted); margin: 0; font-weight: 600; }

.role-badge { font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; background: #e0f2fe; color: #0369a1; display: inline-block; }

.btn-primary-sena { background: var(--color_button); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(46, 125, 50, 0.2); white-space: nowrap; }
.btn-primary-sena:hover { background: #1b5e20; transform: translateY(-1px); }

.spin-ring-lg { width: 40px; height: 40px; border: 3px solid var(--bg-hover); border-top-color: var(--color_header); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* --- Responsive fixes --- */
@media (max-width: 768px) {
  .table-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .table-search { width: 100%; }
  .filter-tabs { flex-wrap: wrap; }
  
  .table-responsive {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .user-table {
    min-width: 800px;
  }
}
</style>
