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
                        {{ formatEstado(ficha.estado) }}
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
                <td><span class="status-pill active">{{ formatEstado(apr.status) }}</span></td>
              </tr>
              <tr v-if="currentAprendices.length === 0">
                <td colspan="3" class="empty-state">No hay aprendices vinculados a esta ficha.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" @click="showViewModal = false">Cerrar</button>
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
            <h3 class="section-title">
              <span class="material-symbols-outlined" style="font-size: 1.25rem;">assignment</span>
              Información General de la Ficha
            </h3>
            <div class="form-grid-2 mb-4">
              <div class="form-group-premium">
                <label class="label-premium">Código de Ficha</label>
                <input type="text" v-model="nuevaFicha.codigo_ficha" placeholder="Ej: 2670687" class="select-premium" inputmode="numeric" pattern="[0-9]*" />
              </div>

              <div class="form-group-premium">
                <label class="label-premium">Programa de Formación</label>
                <input type="text" v-model="nuevaFicha.programa" placeholder="Ej: Análisis y Desarrollo de Software" class="select-premium" />
              </div>
            </div>
          </div>

          <div class="form-section-premium mt-6">
            <h3 class="section-title">
              <span class="material-symbols-outlined" style="font-size: 1.25rem;">calendar_today</span>
              Cronograma de Etapa Productiva
            </h3>
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
            <h3 class="section-title">
              <span class="material-symbols-outlined" style="font-size: 1.25rem;">settings</span>
              Configuración del Sistema
            </h3>
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
import { useAlert } from '../../../core/composables/useAlert';
import Sidebar from '../../../components/layout/Sidebar.vue';
import Header from '../../../components/layout/Header.vue';
import SkeletonLoader from '../../../components/ui/SkeletonLoader.vue';

const router = useRouter();
const authStore = useAuthStore();
const { showSuccess, showError, showWarning } = useAlert();

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
    showError('Error de Asignación', 'No se pudo asignar el instructor: ' + err.message);
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

const formatEstado = (estado) => {
  if (!estado) return '';
  return estado.replace(/_/g, ' ');
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
    showWarning('Campos Incompletos', 'El Código de Ficha y el Programa de formación son obligatorios.');
    return;
  }

  // Validación local para evitar duplicados en la interfaz antes de enviar
  const codigoExiste = fichas.value.some(
    f => f.codigo_ficha.toString().trim() === nuevaFicha.value.codigo_ficha.toString().trim()
  );
  if (codigoExiste) {
    showError('Código Duplicado', 'Ya existe una ficha registrada con el código: ' + nuevaFicha.value.codigo_ficha);
    return;
  }

  const programaExiste = fichas.value.some(
    f => f.programa.toLowerCase().trim() === nuevaFicha.value.programa.toLowerCase().trim()
  );
  if (programaExiste) {
    showError('Programa Duplicado', 'Ya existe un programa de formación registrado con el nombre: ' + nuevaFicha.value.programa);
    return;
  }

  isSubmitting.value = true;
  try {
    await batchesService.create(nuevaFicha.value);
    showAddModal.value = false;
    loadFichas();
    showSuccess('Ficha Creada', 'La ficha se ha registrado exitosamente.');
  } catch (err) {
    console.error('Error:', err);
    showError('Error al crear ficha', 'No se pudo registrar la ficha: ' + (err.response?.data?.message || err.message));
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
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 1.1rem; font-weight: 800; margin: 0; color: var(--text-primary); }
.page-description { font-size: 0.75rem; color: var(--text-secondary); }

.header-left-group { display: flex; align-items: center; gap: 24px; flex: 1; min-width: 0; }
.header-info { min-width: 200px; }
.stats-row { display: flex; gap: 12px; flex-wrap: wrap; flex: 1; max-width: 600px; }
.stat-box {
  background: var(--bg-primary);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--border-primary);
  border-left: 4px solid;
  min-width: 120px;
  flex: 1 1 120px;
  box-sizing: border-box;
  height: 88px;
  max-height: 88px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.border-green { border-left-color: #1b5e20; }
.border-pink { border-left-color: #db2777; }
.border-dark { border-left-color: var(--text-secondary); }
.stat-box p { font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 4px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stat-box h2 { font-size: 1.4rem; margin: 0 0 2px 0; font-weight: 800; color: var(--text-primary); }
.stat-box small { font-size: 0.65rem; color: #22c55e; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  white-space: nowrap;
}
.btn-primary-sena {
  background: var(--color_button); color: #fff; border: none; padding: 8px 14px; border-radius: 8px;
  font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center;
  transition: all 0.2s;
}
.btn-primary-sena:hover {
  background: #1b5e20;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(46, 125, 50, 0.3);
}
.btn-export-outline {
  background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-primary); padding: 8px 14px; border-radius: 8px;
  font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center;
  transition: all 0.2s;
}
.btn-export-outline:hover { background: var(--bg-hover); border-color: var(--border-primary); }

/* Table Section */
.main-table-card { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 12px; padding: 0; }
.table-header { padding: 12px 16px; border-bottom: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: center; }
.table-search { width: 40%; position: relative; }
.search-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); width: 12px; color: var(--text-muted); }
.table-search input {
  width: 100%; background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 6px; padding: 5px 10px 5px 28px; font-size: 0.75rem; outline: none; transition: 0.2s; color: var(--text-primary);
}
.table-search input:focus { border-color: var(--color_button); background: var(--bg-primary); }

.filter-tabs { display: flex; gap: 8px; }
.filter-btn { background: transparent; border: 1px solid transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: 0.2s; }
.filter-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.filter-btn.active { background: var(--bg-active); color: var(--color_button); border-color: rgba(46, 125, 50, 0.3); }

.user-table { width: 100%; border-collapse: collapse; }
.user-table th { background: var(--color_button); text-align: left; padding: 12px 16px; font-size: 0.75rem; color: white; text-transform: uppercase; font-weight: 700; }
.user-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-primary); color: var(--text-primary); }
.user-table tbody tr:nth-child(even) { background: var(--bg-secondary); }

.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 0.75rem; }
.bg-green { background: #1b5e20; }
.u-name { font-weight: 700; margin: 0; color: var(--text-primary); }
.u-email { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
.role-badge { font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 4px; background: rgba(3, 105, 161, 0.15); color: #38bdf8; }

.status-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; white-space: nowrap; }
.status-pill.activo, .status-pill.active, .status-pill.en_curso { background: #1b5e20; color: white; }
.status-pill.contract_ended { background: #ea580c; color: white; }
.status-pill.inactivo { background: #c10015; color: white; }

.instructor-info.huerfana {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.danger-text { color: #dc2626; font-weight: 800; }
.btn-assign-mini {
  background: rgba(220, 38, 38, 0.1);
  color: #ef4444;
  border: 1px solid rgba(220, 38, 38, 0.25);
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

.action-btns { display: flex; gap: 6px; }
.act-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}
.act-btn svg { width: 14px; height: 14px; }
.act-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
}
.act-btn.view:hover {
  color: #166534;
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.act-btn.edit {
  color: var(--color_button);
}
.act-btn.edit:hover {
  color: var(--color_button);
  background: var(--bg-active);
  border-color: rgba(46, 125, 50, 0.3);
}

.empty-state { text-align: center; padding: 24px !important; color: var(--text-muted); font-weight: 500; font-style: italic; }

.table-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; gap: 16px; color: var(--text-muted); }
.spin-ring-lg { width: 32px; height: 32px; border: 3px solid var(--border-primary); border-top-color: var(--color_button); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Asignación styles */
.info-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--bg-active);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
}
.alert-icon {
  width: 20px;
  height: 20px;
  color: var(--color_button);
  flex-shrink: 0;
  margin-top: 2px;
}
.alert-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.alert-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}
.alert-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.empty-results-mini {
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.ficha-badge {
  background: var(--color_button);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 6px;
  width: fit-content;
  margin-top: 4px;
}

/* ═══ Modales ═══ */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-card {
  background: var(--bg-primary); border-radius: 16px; width: 480px; max-height: 90vh; overflow-y: auto;
  box-shadow: var(--shadow-lg);
}
.modal-lg { width: 750px; }
.modal-md { width: 580px; }
.modal-sm { width: 400px; }
.modal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid var(--border-primary);
  text-align: left;
}
.modal-head h2 { font-size: 1.1rem; font-weight: 800; margin: 0; }
.modal-close { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; line-height: 1; }
.modal-close:hover { color: var(--text-primary); }
.modal-body { padding: 24px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--border-primary); display: flex; justify-content: flex-end; gap: 10px; }
.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-danger:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}
</style>
