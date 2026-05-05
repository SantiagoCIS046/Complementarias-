<template>
  <div class="dashboard-layout">
    <Sidebar />
    <div class="main-content">
      <Header />
      
      <main class="page-container">
        <!-- Header de la Página -->
        <header class="page-header-premium">
          <div class="header-titles">
            <h1 class="page-main-title">Agenda de Seguimientos Técnicos</h1>
            <p class="page-subtitle">Gestione las visitas y acompañamiento a sus aprendices en etapa productiva.</p>
          </div>
          <div class="header-date">
            <span class="label">HOY</span>
            <span class="date">{{ currentDate }}</span>
          </div>
        </header>

        <!-- Tarjetas de Estadísticas -->
        <section class="stats-grid-agenda">
          <div class="stat-card-agenda">
            <div class="stat-content">
              <span class="stat-label">Visitas Pendientes</span>
              <h2 class="stat-value">5</h2>
            </div>
            <div class="stat-icon-agenda bg-yellow-soft">
              <span class="material-symbols-outlined">work_history</span>
            </div>
          </div>
          
          <div class="stat-card-agenda">
            <div class="stat-content">
              <span class="stat-label">Visitas Realizadas</span>
              <h2 class="stat-value">12</h2>
            </div>
            <div class="stat-icon-agenda bg-green-soft">
              <span class="material-symbols-outlined">task_alt</span>
            </div>
          </div>

          <div class="stat-card-agenda">
            <div class="stat-content">
              <span class="stat-label">Próximas a Vencer</span>
              <h2 class="stat-value">1</h2>
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

          <button class="btn-programar">
            <span class="material-symbols-outlined">add</span>
            Programar Visita
          </button>
        </section>

        <!-- Tabla de Seguimientos -->
        <section class="table-container-agenda">
          <div class="scrollable-table-wrapper">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>APRENDIZ</th>
                  <th>EMPRESA / FICHA</th>
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
                  <td><span class="badge-type" :class="seg.type.toLowerCase()">{{ seg.type }}</span></td>
                  <td><span class="badge-logs" :class="seg.logsStatus.replace(' ', '-').toLowerCase()">{{ seg.logsStatus }}</span></td>
                  <td><span class="visit-date">{{ seg.date }}</span></td>
                  <td><span class="badge-status" :class="seg.status.toLowerCase()">{{ seg.status }}</span></td>
                  <td>
                    <div class="actions-cell">
                      <button v-if="seg.status === 'PENDIENTE'" class="btn-upload">
                        <span class="material-symbols-outlined">description</span>
                        Subir Acta PDF
                      </button>
                      <button v-else class="btn-view-acta">
                        <span class="material-symbols-outlined">visibility</span>
                        Ver Acta
                      </button>
                      <button class="btn-edit-inline"><span class="material-symbols-outlined">edit</span></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Paginación -->
          <footer class="table-footer">
            <span class="results-info">Mostrando {{ filteredSeguimientos.length }} de 17 registros encontrados</span>
            <div class="pagination">
              <button class="p-btn"><span class="material-symbols-outlined">chevron_left</span></button>
              <button class="p-num active">1</button>
              <button class="p-num">2</button>
              <button class="p-num">3</button>
              <button class="p-btn"><span class="material-symbols-outlined">chevron_right</span></button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'

const currentDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
const searchQuery = ref('')
const typeFilter = ref('TODOS')
const statusFilter = ref('TODOS')

const seguimientos = ref([
  { id: 1, name: 'Antonio Mancilla', initials: 'AM', company: 'TechSolutions', ficha: '2567890', type: 'INICIAL', logsStatus: 'ATRASADO', date: '10 Jun 2026', status: 'PENDIENTE' },
  { id: 2, name: 'Daniela Palacio', initials: 'DP', company: 'Logística S.A.', ficha: '2450012', type: 'PARCIAL', logsStatus: 'AL DÍA', date: '20 May 2026', status: 'REALIZADA' },
  { id: 3, name: 'Javier Ruiz', initials: 'JR', company: 'ConstruCivil', ficha: '2611234', type: 'FINAL', logsStatus: 'PENDIENTE', date: '15 Jun 2026', status: 'PROGRAMADA' }
])

const filteredSeguimientos = computed(() => {
  return seguimientos.value.filter(s => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = s.name.toLowerCase().includes(q) || s.ficha.includes(q)
    const matchesType = typeFilter.value === 'TODOS' || s.type === typeFilter.value
    const matchesStatus = statusFilter.value === 'TODOS' || s.status === statusFilter.value
    return matchesSearch && matchesType && matchesStatus
  })
})
</script>

<style scoped>
.dashboard-layout { display: flex; height: 100vh; background-color: #f4f7f6; overflow: hidden; }
.main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
.page-container { padding: 1rem 1.5rem; max-width: 100%; margin: 0; width: 100%; }

/* Scrollbar Style */
.main-content::-webkit-scrollbar { width: 6px; }
.main-content::-webkit-scrollbar-track { background: transparent; }
.main-content::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 10px; }
.main-content::-webkit-scrollbar-thumb:hover { background: #A0AEC0; }

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
.premium-table th { background: #2e7d32; color: white; padding: 1rem 1.25rem; text-align: left; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
.premium-table td { padding: 0.9rem 1.25rem; border-bottom: 1px solid #f7fafc; }

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
.badge-status.realizada { background: #2e7d32; color: white; }
.badge-status.programada { color: #A0AEC0; font-weight: 600; border: 1px solid #edf2f7; }

.visit-date { font-weight: 700; color: #4a5568; font-size: 0.8rem; }

/* Actions */
.actions-cell { display: flex; align-items: center; gap: 8px; }
.btn-upload { background: #F0FDF4; color: #16A34A; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 4px; cursor: pointer; }
.btn-view-acta { background: #2e7d32; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 4px; cursor: pointer; }
.btn-edit-inline { background: transparent; border: none; color: #CBD5E0; cursor: pointer; }
.btn-edit-inline .material-symbols-outlined { font-size: 1.1rem; }

/* Footer */
.table-footer { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-top: 1px solid #edf2f7; }
.results-info { font-size: 0.75rem; color: #718096; font-weight: 700; }
.pagination { display: flex; align-items: center; gap: 6px; }
.p-num { width: 28px; height: 28px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; font-size: 0.75rem; font-weight: 700; color: #4a5568; cursor: pointer; }
.p-num.active { background: #2e7d32; color: white; border-color: #2e7d32; }
.p-btn { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px; color: #a0aec0; cursor: pointer; }
.p-btn .material-symbols-outlined { font-size: 1.1rem; }
</style>
