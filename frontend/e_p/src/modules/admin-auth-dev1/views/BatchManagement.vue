<template>
  <div class="repfora-dashboard">
    <Sidebar />
    <div class="main-wrapper">
      <Header title="Gestión de Fichas" />
      <main class="content">
        <div class="page-body">
        <header class="page-header">
          <div class="header-left-group">
            <div class="header-info">
              <h1 class="page-title">Gestión de Fichas</h1>
              <p class="page-description">Administre los grupos de formación e instructores.</p>
            </div>

            <div class="stats-row header-stats">
              <div class="stat-box border-green">
                <p>TOTAL FICHAS</p>
                <h2>{{ stats.total }}</h2>
                <small>Registros globales</small>
              </div>
              <div class="stat-box border-pink">
                <p>ACTIVAS</p>
                <h2>{{ stats.activas }}</h2>
                <small>Con instructor</small>
              </div>
              <div class="stat-box border-dark">
                <p>POR ASIGNAR</p>
                <h2>{{ stats.finalizadas }}</h2>
                <small>Fichas huérfanas</small>
              </div>
            </div>
          </div>

          <div class="header-actions">
            <button class="btn btn-export-outline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; margin-right: 8px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar
            </button>
            <button class="btn btn-primary-sena" @click="openAddFichaModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; margin-right: 8px;">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Registrar Nueva Ficha
            </button>
          </div>
        </header>

        <div class="dashboard-grid">
          <div class="right-col">
            <div class="card main-table-card">
              <div class="table-header">
                <div class="filter-tabs">
                  <button class="filter-btn" :class="{active: currentFilter === 'TODAS'}" @click="setFilter('TODAS')">Todas</button>
                  <button class="filter-btn" :class="{active: currentFilter === 'ACTIVA'}" @click="setFilter('ACTIVA')">Activas</button>
                  <button class="filter-btn" :class="{active: currentFilter === 'PENDIENTE_INSTRUCTOR'}" @click="setFilter('PENDIENTE_INSTRUCTOR')">Por Asignar</button>
                  <button class="filter-btn" :class="{active: currentFilter === 'TERMINADA'}" @click="setFilter('TERMINADA')">Terminadas</button>
                </div>
                <div class="search-box table-search">
                  <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" v-model="searchQuery" placeholder="Buscar ficha o programa..." />
                </div>
              </div>

              <table class="user-table">
                <thead>
                  <tr>
                    <th>FICHA / PROGRAMA</th>
                    <th>JORNADA</th>
                    <th>GESTOR / APRENDICES</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <SkeletonLoader v-if="isLoading" variant="table-tbody" :rows="5" :columns="5" tag="tbody" />
                <tbody v-else>
                  <tr v-for="ficha in filteredFichas" :key="ficha._id">
                    <td>
                      <div class="user-cell">
                        <div class="avatar bg-green">{{ ficha.codigo_ficha.toString().substring(0,2) }}</div>
                        <div class="user-info">
                          <p class="u-name">#{{ ficha.codigo_ficha }}</p>
                          <p class="u-email">{{ ficha.programa }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="date-range">
                        <p class="u-name">{{ formatDate(ficha.fecha_inicio_ep) }}</p>
                        <p class="u-email">Fin: {{ formatDate(ficha.fecha_fin_ep) }}</p>
                      </div>
                    </td>
                    <td>
                      <div class="instructor-info" v-if="ficha.instructor_asignado?.instructor_id">
                        <p class="u-name">{{ ficha.instructor_asignado.nombre }}</p>
                        <p class="u-email">{{ ficha.aprendices_ids.length }} Aprendices</p>
                      </div>
                      <div class="instructor-info huerfana" v-else>
                        <p class="u-name danger-text">POR ASIGNAR</p>
                        <button class="btn-assign-mini" @click="openAssignModal(ficha)">Asignar Ahora</button>
                      </div>
                    </td>
                    <td>
                      <span class="status-pill" :class="getStatusClass(ficha.estado)">
                        {{ ficha.estado }}
                      </span>
                    </td>
                    <td>
                      <div class="action-btns">
                        <button class="act-btn view" title="Ver Grupo" @click="openViewGroup(ficha)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></button>
                        <button class="act-btn edit" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ═══════ MODAL: Ver Grupo ═══════ -->
    <div class="modal-overlay" v-if="showViewModal" @click.self="showViewModal = false">
      <div class="modal-card modal-lg">
        <div class="modal-head">
          <div class="head-info">
            <h2>Listado de Aprendices</h2>
            <p class="u-email">Ficha #{{ selectedFicha?.codigo_ficha }} - {{ selectedFicha?.programa }}</p>
          </div>
          <button class="modal-close" @click="showViewModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="loadingAprendices" class="table-loading">
            <div class="spin-ring-lg"></div>
          </div>
          <table class="user-table" v-else>
            <thead>
              <tr>
                <th>APRENDIZ</th>
                <th>DOCUMENTO</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="apr in currentAprendices" :key="apr._id">
                <td>{{ apr.name }}</td>
                <td>{{ apr.documento }}</td>
                <td><span class="status-pill active">{{ apr.status }}</span></td>
              </tr>
              <tr v-if="currentAprendices.length === 0">
                <td colspan="3" class="empty-state">No hay aprendices vinculados a esta ficha.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="btn btn-export-outline" @click="showViewModal = false">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- ═══════ MODAL: Asignar Instructor (Premium & Filtered) ═══════ -->
    <div class="modal-overlay" v-if="showAssignModal" @click.self="showAssignModal = false">
      <div class="modal-card modal-md">
        <div class="modal-head head-premium">
          <div class="head-info">
            <h2>Asignar Responsable de Ficha</h2>
            <div class="ficha-badge">#{{ selectedFicha?.codigo_ficha }}</div>
          </div>
          <button class="modal-close" @click="showAssignModal = false">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="info-alert mb-5">
            <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div class="alert-content">
              <p class="alert-title">Filtrado por Área Académica</p>
              <p class="alert-desc">Mostrando instructores con contrato activo especialistas en: <strong>{{ selectedFicha?.programa }}</strong>.</p>
            </div>
          </div>
          
          <div class="form-group-premium">
            <label class="label-premium">Instructores Disponibles (Área {{ selectedFicha?.programa }})</label>
            <div class="select-wrapper-premium">
              <select v-model="assignmentId" class="select-premium">
                <option value="" disabled>Seleccione un instructor especializado...</option>
                <option v-for="ins in instructors" :key="ins._id" :value="ins._id">
                  👨‍🏫 {{ ins.name }} — (Documento: {{ ins.documento }})
                </option>
              </select>
              <div class="select-arrow"></div>
            </div>
          </div>

          <div v-if="instructors.length === 0" class="empty-results-mini">
            <p>⚠️ No se encontraron instructores activos para esta área específica.</p>
          </div>
        </div>

        <div class="modal-footer footer-premium">
          <button class="btn-cancel-premium" @click="showAssignModal = false">Descartar</button>
          <button class="btn-confirm-premium" @click="handleAssign" :disabled="!assignmentId || assigning">
            <span v-if="!assigning">Vincular a Ficha</span>
            <div v-else class="spin-mini"></div>
          </button>
        </div>
      </div>
    </div>
    <!-- ═══════ MODAL: Registrar Nueva Ficha ═══════ -->
    <div class="modal-overlay" v-if="showAddModal" @click.self="showAddModal = false">
      <div class="modal-card modal-full">
        <div class="modal-head head-premium">
          <div class="head-info">
            <h2>Registrar Nueva Ficha</h2>
            <p class="u-email">Defina el grupo de formación y periodos de etapa productiva.</p>
          </div>
          <button class="modal-close-premium" @click="showAddModal = false">&times;</button>
        </div>
        
        <div class="modal-body modal-body-scroll">
          <div class="form-section-premium">
            <h3 class="section-title">📊 Información General de la Ficha</h3>
            <div class="form-grid-2 mb-4">
              <div class="form-group-premium">
                <label class="label-premium">Código de Ficha</label>
                <input type="number" v-model="nuevaFicha.codigo_ficha" placeholder="Ej: 2670687" class="select-premium" />
              </div>

              <div class="form-group-premium">
                <label class="label-premium">Programa de Formación</label>
                <input type="text" v-model="nuevaFicha.programa" placeholder="Ej: Análisis y Desarrollo de Software" class="select-premium" />
              </div>
            </div>
          </div>

          <div class="form-section-premium mt-6">
            <h3 class="section-title">📅 Cronograma de Etapa Productiva</h3>
            <div class="form-grid-2 mb-4">
              <div class="form-group-premium">
                <label class="label-premium">Inicio Etapa Productiva</label>
                <input type="date" v-model="nuevaFicha.fecha_inicio_ep" class="select-premium" />
              </div>
              <div class="form-group-premium">
                <label class="label-premium">Fin Etapa Productiva</label>
                <input type="date" v-model="nuevaFicha.fecha_fin_ep" class="select-premium" />
              </div>
            </div>
          </div>

          <div class="form-section-premium mt-6">
            <h3 class="section-title">⚙️ Configuración del Sistema</h3>
            <div class="form-group-premium">
              <label class="label-premium">Estado Inicial</label>
              <select v-model="nuevaFicha.estado" class="select-premium">
                <option value="PENDIENTE_INSTRUCTOR">Por Asignar Instructor</option>
                <option value="ACTIVA">Activa</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer footer-premium">
          <button class="btn-cancel-premium" @click="showAddModal = false">Cancelar</button>
          <button class="btn-confirm-premium" @click="handleAddFicha" :disabled="isSubmitting">
            <span v-if="!isSubmitting">Crear Ficha</span>
            <div v-else class="spin-mini"></div>
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../core/store/auth.store';
import { batchesService } from '../services/batches.service';
import Sidebar from '../../../components/layout/Sidebar.vue';
import Header from '../../../components/layout/Header.vue';
import SkeletonLoader from '../../../components/ui/SkeletonLoader.vue';

const router = useRouter();
const authStore = useAuthStore();

const isLoading = ref(false);
const searchQuery = ref('');
const currentFilter = ref('TODAS');
const showModal = ref(false);

const fichas = ref([]);
const instructors = ref([]);
const currentAprendices = ref([]);
const selectedFicha = ref(null);
const assignmentId = ref('');
const assigning = ref(false);
const loadingAprendices = ref(false);

const loadFichas = async () => {
  try {
    isLoading.value = true;
    const response = await batchesService.getAll();
    fichas.value = response.data.data || [];
  } catch (err) {
    console.error('Error cargando fichas:', err);
  } finally {
    isLoading.value = false;
  }
};

const loadInstructors = async (programa) => {
  try {
    // Filtramos por rol INSTRUCTOR, estado ACTIVO y el área específica (programa)
    let url = '/users?role=INSTRUCTOR&status=ACTIVO';
    if (programa) {
      url += `&programa=${encodeURIComponent(programa)}`;
    }
    const response = await authStore.axios.get(url);
    instructors.value = response.data.data.users || [];
  } catch (err) {
    console.error('Error cargando instructores:', err);
  }
};

const openAssignModal = (ficha) => {
  selectedFicha.value = ficha;
  assignmentId.value = ficha.instructor_asignado?.instructor_id || '';
  showAssignModal.value = true;
  loadInstructors(ficha.programa); 
};

const handleAssign = async () => {
  try {
    assigning.value = true;
    await batchesService.asignarInstructor(selectedFicha.value._id, assignmentId.value);
    showAssignModal.value = false;
    loadFichas();
  } catch (err) {
    alert('Error al asignar: ' + err.message);
  } finally {
    assigning.value = false;
  }
};

const openViewGroup = async (ficha) => {
  selectedFicha.value = ficha;
  showViewModal.value = true;
  loadingAprendices.value = true;
  try {
    const response = await batchesService.getAprendices(ficha._id);
    currentAprendices.value = response.data.data || [];
  } catch (err) {
    console.error('Error:', err);
  } finally {
    loadingAprendices.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return '---';
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const stats = computed(() => {
  const total = fichas.value.length;
  const activas = fichas.value.filter(f => f.estado === 'ACTIVA').length;
  const pendientes = fichas.value.filter(f => f.estado === 'PENDIENTE_INSTRUCTOR').length;
  return { total, activas, finalizadas: pendientes };
});

const filteredFichas = computed(() => {
  return fichas.value.filter(f => {
    const codeStr = (f.codigo_ficha || '').toString();
    const progStr = (f.programa || '').toLowerCase();
    const query = searchQuery.value.toLowerCase();
    
    const matchesSearch = codeStr.includes(query) || progStr.includes(query);
    const matchesFilter = currentFilter.value === 'TODAS' || f.estado === currentFilter.value;
    return matchesSearch && matchesFilter;
  });
});

const getStatusClass = (estado) => {
  if (estado === 'ACTIVA') return 'activo';
  if (estado === 'PENDIENTE_INSTRUCTOR') return 'contract_ended';
  if (estado === 'TERMINADA') return 'inactivo';
  return '';
};

const showViewModal = ref(false);
const showAssignModal = ref(false);
const showAddModal = ref(false);
const isSubmitting = ref(false);

const nuevaFicha = ref({
  codigo_ficha: '',
  programa: '',
  fecha_inicio_ep: '',
  fecha_fin_ep: '',
  estado: 'PENDIENTE_INSTRUCTOR'
});

const openAddFichaModal = () => {
  nuevaFicha.value = {
    codigo_ficha: '',
    programa: '',
    fecha_inicio_ep: '',
    fecha_fin_ep: '',
    estado: 'PENDIENTE_INSTRUCTOR'
  };
  showAddModal.value = true;
};

const handleAddFicha = async () => {
  if (!nuevaFicha.value.codigo_ficha || !nuevaFicha.value.programa) {
    alert('Código de Ficha y Programa son obligatorios');
    return;
  }

  isSubmitting.value = true;
  try {
    await batchesService.create(nuevaFicha.value);
    showAddModal.value = false;
    loadFichas();
    alert('Ficha creada exitosamente');
  } catch (err) {
    console.error('Error:', err);
    alert('Error al crear la ficha: ' + (err.response?.data?.message || err.message));
  } finally {
    isSubmitting.value = false;
  }
};

const setFilter = (f) => currentFilter.value = f;
const handleLogout = () => { authStore.logout(); router.push('/login'); };

const adminName = computed(() => authStore.user?.name || 'Admin');
const adminInitials = computed(() => {
  const parts = adminName.value.split(' ');
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : adminName.value.substring(0, 2).toUpperCase();
});

onMounted(() => {
  loadFichas();
});
</script>

<style scoped>

/* Page Content */
.page-body { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 32px; }
.page-title { font-size: 1.1rem; font-weight: 800; margin: 0; }
.page-description { font-size: 0.75rem; color: #64748b; }

.header-left-group { display: flex; align-items: center; gap: 32px; flex: 1; }
.header-info { min-width: 200px; }
.stats-row { display: flex; gap: 20px; }
.stat-box { background: #fff; padding: 10px 14px; border-radius: 12px; border: 1px solid #e2e8f0; border-left: 4px solid; min-width: 140px; flex-shrink: 0; }
.border-green { border-left-color: #1b5e20; }
.border-pink { border-left-color: #db2777; }
.border-dark { border-left-color: #1e293b; }
.stat-box p { font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 4px; }
.stat-box h2 { font-size: 1.4rem; margin: 0 0 2px 0; font-weight: 800; }
.stat-box small { font-size: 0.65rem; color: #22c55e; font-weight: 600; }

.header-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.btn-primary-sena {
  background: #1b5e20; color: #fff; border: none; padding: 8px 14px; border-radius: 8px;
  font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center;
}
.btn-export-outline {
  background: #fff; color: #1e293b; border: 1px solid #e2e8f0; padding: 8px 14px; border-radius: 8px;
  font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center;
}

/* Table Section */
.main-table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0; }
.table-header { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.table-search { width: 40%; position: relative; }
.search-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); width: 12px; color: #94a3b8; }
.table-search input {
  width: 100%; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 10px 5px 28px; font-size: 0.75rem; outline: none;
}
.filter-tabs { display: flex; gap: 8px; }
.filter-btn { background: transparent; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: #64748b; cursor: pointer; }
.filter-btn.active { background: #f0fdf4; color: #1b5e20; }

.user-table { width: 100%; border-collapse: collapse; }
.user-table th { background: #1b5e20; text-align: left; padding: 12px 16px; font-size: 0.75rem; color: white; text-transform: uppercase; font-weight: 700; }
.user-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
.user-table tbody tr:nth-child(even) { background: #f8fafc; }

.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 0.75rem; }
.bg-green { background: #1b5e20; }
.u-name { font-weight: 700; margin: 0; }
.u-email { font-size: 0.75rem; color: #94a3b8; margin: 0; }
.role-badge { font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 4px; background: #e0f2fe; color: #0369a1; }

.instructor-info.huerfana {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.danger-text { color: #dc2626; font-weight: 800; }
.btn-assign-mini {
  background: #fdf2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  width: fit-content;
}
.btn-assign-mini:hover {
  background: #dc2626;
  color: #fff;
}
</style>
