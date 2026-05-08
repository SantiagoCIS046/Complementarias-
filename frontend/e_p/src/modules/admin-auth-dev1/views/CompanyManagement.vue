<template>
  <div class="admin-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-area" style="display: flex; flex-direction: column;">
          <span class="logo-text" style="font-size: 1.1rem; font-weight: 900; color: #1b5e20; line-height: 1.1;">REPFORA</span>
          <span class="logo-subtext" style="font-size: 0.5rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">ARQUITECTO INSTITUCIONAL</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group">
          <router-link to="/usuarios" class="nav-item" :class="{ active: $route.path === '/usuarios' || $route.path === '/dashboard' }">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Gestión de Usuarios</span>
          </router-link>
          <router-link to="/gestion-empresas" class="nav-item" :class="{ active: $route.path === '/gestion-empresas' }">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7"/><path d="M4 21V10"/><path d="M10 21V10"/><path d="M16 21V10"/><path d="M20 21V10"/><path d="M9 2l1 5h4l1-5z"/>
            </svg>
            <span>Gestión de Empresas</span>
          </router-link>
          <router-link to="/fichas" class="nav-item" :class="{ active: $route.path === '/fichas' }">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span>Gestión de Fichas</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <a href="#" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Cambiar Clave</span>
        </a>
        <a href="#" class="nav-item logout" @click.prevent="handleLogout">Cerrar Sesión</a>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="topbar">
        <div class="topbar-left"></div>
        <div class="topbar-right">
          <div class="user-profile">
            <div class="admin-avatar" :title="adminName">{{ adminInitials }}</div>
          </div>
        </div>
      </header>

      <div class="page-body">
        <header class="page-header">
          <div class="header-left-group">
            <div class="header-info">
              <h1 class="page-title">Gestión de Empresas</h1>
              <p class="page-description">Supervise y administre las organizaciones aliadas.</p>
            </div>

            <div class="stats-row header-stats">
              <div class="stat-box border-green">
                <p>TOTAL</p>
                <h2>{{ stats.total }}</h2>
                <small>Empresas aliadas</small>
              </div>
              <div class="stat-box border-pink">
                <p>ACTIVAS</p>
                <h2>{{ stats.habilitadas }}</h2>
                <small>Convenio vigente</small>
              </div>
              <div class="stat-box border-dark">
                <p>REVISIÓN</p>
                <h2>{{ stats.revision }}</h2>
                <small>Pendientes</small>
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
            <button class="btn btn-primary-sena" @click="openAddModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; margin-right: 8px;">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Registrar Nueva Empresa
            </button>
          </div>
        </header>

        <div class="dashboard-grid">
          <div class="right-col">
            <div class="card main-table-card">
              <div class="table-header">
                <div class="filter-tabs">
                  <button class="filter-btn" :class="{active: currentFilter === 'TODOS'}" @click="setFilter('TODOS')">Todas</button>
                  <button class="filter-btn" :class="{active: currentFilter === 'HABILITADA'}" @click="setFilter('HABILITADA')">Habilitadas</button>
                  <button class="filter-btn" :class="{active: currentFilter === 'EN_REVISION'}" @click="setFilter('EN_REVISION')">Revisión</button>
                  <button class="filter-btn" :class="{active: currentFilter === 'RECHAZADA'}" @click="setFilter('RECHAZADA')">Rechazadas</button>
                </div>
                <div class="search-box table-search">
                  <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" v-model="searchQuery" placeholder="Buscar empresa o NIT..." />
                </div>
              </div>

              <div v-if="isLoading" class="table-loading">
                <div class="spin-ring-lg"></div>
                <p>Cargando empresas...</p>
              </div>

              <table class="user-table" v-else>
                <thead>
                  <tr>
                    <th>EMPRESA / NIT</th>
                    <th>REPRESENTANTE</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in filteredCompanies" :key="c._id">
                    <td>
                      <div class="user-cell">
                        <div class="avatar bg-green">{{ (c.razon_social || 'E').substring(0,2).toUpperCase() }}</div>
                        <div class="user-info">
                          <p class="u-name">{{ c.razon_social }}</p>
                          <p class="u-email">{{ c.nit }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="supervisor-info">
                        <p class="s-name">{{ c.jefe_inmediato?.nombre_completo || 'No asignado' }}</p>
                        <p class="s-role">{{ c.jefe_inmediato?.cargo || '---' }}</p>
                      </div>
                    </td>
                    <td>
                      <span class="status-pill" :class="getStatusClass(c.estado)">
                        {{ c.estado }}
                      </span>
                    </td>
                    <td>
                      <div class="action-btns">
                        <button class="act-btn view" title="Ver Detalles" @click="openDetails(c)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                        <button class="act-btn edit" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="filteredCompanies.length === 0">
                    <td colspan="4" class="empty-state">No se encontraron empresas</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════ MODAL: Detalles de Empresa ═══════ -->
      <Transition name="fade">
        <div class="modal-overlay" v-if="showDetailModal" @click.self="showDetailModal = false">
          <div class="modal-card modal-md">
            <div class="modal-head">
              <div class="head-info">
                <h2>Detalles Institucionales</h2>
                <p class="u-email">{{ selectedCompany?.razon_social }} (NIT: {{ selectedCompany?.nit }})</p>
              </div>
              <button class="modal-close" @click="showDetailModal = false">&times;</button>
            </div>
            
            <div class="modal-body">
              <div class="detail-section">
                <h3 class="section-title">Datos de Contacto y Ubicación</h3>
                <div class="info-grid-compact">
                  <div class="info-item">
                    <label>Dirección</label>
                    <span>{{ selectedCompany?.direccion || '---' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Municipio</label>
                    <span>{{ selectedCompany?.municipio || '---' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Sector Económico</label>
                    <span>{{ selectedCompany?.sector_economico || '---' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Correo Corporativo</label>
                    <span>{{ selectedCompany?.datos_contacto?.correo_corporativo || '---' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Teléfono</label>
                    <span>{{ selectedCompany?.datos_contacto?.telefono || '---' }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section mt-4">
                <h3 class="section-title">Jefe Inmediato / Responsable</h3>
                <div class="info-grid-compact">
                  <div class="info-item">
                    <label>Nombre Completo</label>
                    <span>{{ selectedCompany?.jefe_inmediato?.nombre_completo || '---' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Cargo</label>
                    <span>{{ selectedCompany?.jefe_inmediato?.cargo || '---' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Teléfono Jefe</label>
                    <span>{{ selectedCompany?.jefe_inmediato?.telefono || '---' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Correo Jefe</label>
                    <span>{{ selectedCompany?.jefe_inmediato?.correo || '---' }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section mt-4">
                <h3 class="section-title">Documentación REPFORA (Google Drive)</h3>
                <div class="doc-links-grid">
                  <a :href="selectedCompany?.documentacion?.rut_url" target="_blank" class="doc-link" v-if="selectedCompany?.documentacion?.rut_url">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Ver RUT
                  </a>
                  <a :href="selectedCompany?.documentacion?.camara_comercio_url" target="_blank" class="doc-link" v-if="selectedCompany?.documentacion?.camara_comercio_url">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Cámara de Comercio
                  </a>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-export-outline" @click="showDetailModal = false">Cerrar</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ═══════ MODAL: Registrar Nueva Empresa ═══════ -->
      <Transition name="fade">
        <div class="modal-overlay" v-if="showAddModal" @click.self="showAddModal = false">
          <div class="modal-card modal-full">
            <div class="modal-head head-premium">
              <div class="head-info">
                <h2>Registrar Nueva Empresa</h2>
                <p class="u-email">Vinculación institucional al Centro Agroturístico.</p>
              </div>
              <button class="modal-close-premium" @click="showAddModal = false">&times;</button>
            </div>

            <div class="modal-body modal-body-scroll">
              <!-- Bloque 1: Información Legal -->
              <div class="form-section-premium">
                <h3 class="section-title">🏢 Bloque 1: Información Legal (Obligatorio)</h3>
                <div class="form-grid-3">
                  <div class="field-group">
                    <label class="label-premium">NIT</label>
                    <input type="text" v-model="nuevaEmpresa.nit" @input="validateNit($event.target.value)" placeholder="900123456-1" class="input-premium" />
                  </div>
                  <div class="field-group span-2">
                    <label class="label-premium">Razón Social</label>
                    <input type="text" v-model="nuevaEmpresa.razon_social" placeholder="Nombre completo de la empresa" class="input-premium" />
                  </div>
                </div>
                <div class="field-group mt-3">
                  <label class="label-premium">Sector Económico</label>
                  <select v-model="nuevaEmpresa.sector_economico" class="select-premium">
                    <option value="" disabled>Seleccione un sector...</option>
                    <option value="Tecnología">Tecnología</option>
                    <option value="Agricultura">Agricultura</option>
                    <option value="Comercio">Comercio</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Construcción">Construcción</option>
                  </select>
                </div>
              </div>

              <!-- Bloque 2: Ubicación y Contacto -->
              <div class="form-section-premium mt-6">
                <h3 class="section-title">📍 Bloque 2: Ubicación y Contacto Corporativo</h3>
                <div class="form-grid-2">
                  <div class="field-group">
                    <label class="label-premium">Dirección Principal</label>
                    <input type="text" v-model="nuevaEmpresa.direccion" placeholder="Calle, Carrera, Av..." class="input-premium" />
                  </div>
                  <div class="field-group">
                    <label class="label-premium">Municipio</label>
                    <select v-model="nuevaEmpresa.municipio" class="select-premium">
                      <option value="San Gil">San Gil</option>
                      <option value="Socorro">Socorro</option>
                      <option value="Barichara">Barichara</option>
                      <option value="Villanueva">Villanueva</option>
                      <option value="Pinchote">Pinchote</option>
                    </select>
                  </div>
                  <div class="field-group">
                    <label class="label-premium">Teléfono Empresa</label>
                    <input type="number" v-model="nuevaEmpresa.telefono" placeholder="Ej: 300..." class="input-premium" />
                  </div>
                  <div class="field-group">
                    <label class="label-premium">Correo Corporativo</label>
                    <input type="email" v-model="nuevaEmpresa.correo_corporativo" placeholder="contacto@empresa.com" class="input-premium" />
                  </div>
                </div>
              </div>

              <!-- Bloque 3: Jefe Inmediato -->
              <div class="form-section-premium mt-6">
                <h3 class="section-title">👤 Bloque 3: Datos del Jefe Inmediato (Supervisor)</h3>
                <div class="form-grid-2">
                  <div class="field-group">
                    <label class="label-premium">Nombre Completo</label>
                    <input type="text" v-model="nuevaEmpresa.jefe_nombre" placeholder="Responsable del aprendiz" class="input-premium" />
                  </div>
                  <div class="field-group">
                    <label class="label-premium">Cargo</label>
                    <input type="text" v-model="nuevaEmpresa.jefe_cargo" placeholder="Director, Coordinador..." class="input-premium" />
                  </div>
                  <div class="field-group">
                    <label class="label-premium">Celular de Contacto</label>
                    <input type="number" v-model="nuevaEmpresa.jefe_telefono" placeholder="Móvil personal" class="input-premium" />
                  </div>
                  <div class="field-group">
                    <label class="label-premium">Correo del Jefe</label>
                    <input type="email" v-model="nuevaEmpresa.jefe_correo" placeholder="jefe@empresa.com" class="input-premium" />
                  </div>
                </div>
              </div>

              <!-- Bloque 4: Documentación y Estado -->
              <div class="form-section-premium mt-6">
                <h3 class="section-title">📎 Bloque 4: Documentación y Estado (Admin)</h3>
                <div class="form-grid-2">
                  <div class="field-group">
                    <label class="label-premium">URL del RUT (Google Drive)</label>
                    <input type="text" v-model="nuevaEmpresa.rut_url" placeholder="https://drive.google.com/..." class="input-premium" />
                  </div>
                  <div class="field-group">
                    <label class="label-premium">URL Cámara Comercio</label>
                    <input type="text" v-model="nuevaEmpresa.camara_comercio_url" placeholder="Enlace de Drive" class="input-premium" />
                  </div>
                </div>
                <div class="field-group mt-4">
                  <label class="label-premium">Estado de Aprobación</label>
                  <div class="toggle-group">
                    <select v-model="nuevaEmpresa.estado" class="select-premium" :class="nuevaEmpresa.estado.toLowerCase()">
                      <option value="EN_REVISION">🟠 EN REVISIÓN</option>
                      <option value="HABILITADA">🟢 HABILITADA</option>
                      <option value="RECHAZADA">🔴 RECHAZADA</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer footer-premium">
              <button class="btn-cancel-premium" @click="showAddModal = false">Descartar</button>
              <button class="btn-confirm-premium" @click="handleAddCompany" :disabled="isSubmitting">
                <span v-if="!isSubmitting">Finalizar Registro</span>
                <div v-else class="spin-mini"></div>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../core/store/auth.store';
import { companiesService } from '../services/companies.service';

const router = useRouter();
const authStore = useAuthStore();

// Reactive State
const companies = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const currentFilter = ref('TODOS');

const loadCompanies = async () => {
  try {
    isLoading.value = true;
    const response = await companiesService.getAll();
    companies.value = response.data.data || [];
  } catch (err) {
    console.error('Error cargando empresas:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => { loadCompanies(); });

const stats = computed(() => {
  return {
    total: companies.value.length,
    habilitadas: companies.value.filter(c => c.estado === 'HABILITADA').length,
    revision: companies.value.filter(c => c.estado === 'EN_REVISION').length
  };
});

const filteredCompanies = computed(() => {
  return companies.value.filter(c => {
    const matchesSearch = (c.razon_social || '').toLowerCase().includes(searchQuery.value.toLowerCase()) || (c.nit || '').includes(searchQuery.value);
    const matchesFilter = currentFilter.value === 'TODOS' || c.estado === currentFilter.value;
    return matchesSearch && matchesFilter;
  });
});

const getStatusClass = (estado) => {
  if (estado === 'HABILITADA') return 'activo';
  if (estado === 'EN_REVISION') return 'contract_ended';
  if (estado === 'RECHAZADA') return 'inactivo';
  return '';
};

// Modales
const showDetailModal = ref(false);
const showAddModal = ref(false);
const isSubmitting = ref(false);
const selectedCompany = ref(null);

// Formulario Nueva Empresa (Flat para v-model, se mapea al enviar)
const nuevaEmpresa = ref({
  nit: '',
  razon_social: '',
  sector_economico: '',
  direccion: '',
  municipio: 'San Gil',
  telefono: '',
  correo_corporativo: '',
  jefe_nombre: '',
  jefe_cargo: '',
  jefe_telefono: '',
  jefe_correo: '',
  rut_url: '',
  camara_comercio_url: '',
  estado: 'EN_REVISION'
});

const openDetails = (company) => {
  selectedCompany.value = company;
  showDetailModal.value = true;
};

const openAddModal = () => {
  nuevaEmpresa.value = {
    nit: '', razon_social: '', sector_economico: '', direccion: '', municipio: 'San Gil',
    telefono: '', correo_corporativo: '', jefe_nombre: '', jefe_cargo: '', jefe_telefono: '',
    jefe_correo: '', rut_url: '', camara_comercio_url: '', estado: 'EN_REVISION'
  };
  showAddModal.value = true;
};

const validateNit = (val) => {
  // Solo permite números y un guion
  nuevaEmpresa.value.nit = val.replace(/[^0-9-]/g, '');
};

const handleAddCompany = async () => {
  if (!nuevaEmpresa.value.nit || !nuevaEmpresa.value.razon_social) {
    alert('NIT y Razón Social son obligatorios');
    return;
  }

  isSubmitting.value = true;
  try {
    // Mapeo a estructura del backend
    const payload = {
      nit: nuevaEmpresa.value.nit,
      razon_social: nuevaEmpresa.value.razon_social,
      sector_economico: nuevaEmpresa.value.sector_economico,
      direccion: nuevaEmpresa.value.direccion,
      municipio: nuevaEmpresa.value.municipio,
      datos_contacto: {
        telefono: nuevaEmpresa.value.telefono,
        correo_corporativo: nuevaEmpresa.value.correo_corporativo
      },
      jefe_inmediato: {
        nombre_completo: nuevaEmpresa.value.jefe_nombre,
        cargo: nuevaEmpresa.value.jefe_cargo,
        telefono: nuevaEmpresa.value.jefe_telefono,
        correo: nuevaEmpresa.value.jefe_correo
      },
      documentacion: {
        rut_url: nuevaEmpresa.value.rut_url,
        camara_comercio_url: nuevaEmpresa.value.camara_comercio_url
      },
      estado: nuevaEmpresa.value.estado
    };

    await companiesService.create(payload);
    showAddModal.value = false;
    loadCompanies();
    alert('Empresa registrada correctamente');
  } catch (err) {
    console.error('Error:', err);
    alert('Error al registrar la empresa: ' + (err.response?.data?.message || err.message));
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
</script>

<style scoped>
.admin-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  font-size: 13px;
}

/* Sidebar */
.sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  flex-shrink: 0;
}
.sidebar-header { padding: 0 20px 20px; }
.logo-text { font-size: 1.1rem; font-weight: 800; color: #1b5e20; }
.logo-subtext { font-size: 0.55rem; color: #94a3b8; font-weight: 700; display: block; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  font-size: 0.85rem;
}
.nav-item.active { background: #f0fdf4; color: #1b5e20; font-weight: 700; border-right: 3px solid #1b5e20; }
.nav-icon { width: 16px; height: 16px; }
.sidebar-footer { margin-top: auto; padding: 16px 0; border-top: 1px solid #f1f5f9; }
.logout { color: #dc2626 !important; }

.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* Topbar */
.topbar {
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
}
.topbar-right { display: flex; align-items: flex-end; height: 100%; padding-bottom: 8px; }

.admin-avatar {
  width: 32px !important;
  height: 32px !important;
  background-color: #1e293b !important;
  color: #ffffff !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-weight: 800 !important;
  font-size: 0.8rem !important;
  cursor: pointer;
  border: 2px solid #e2e8f0;
  transition: all 0.2s;
  flex-shrink: 0;
}

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

.supervisor-info { display: flex; flex-direction: column; gap: 2px; }
.s-name { font-weight: 600; font-size: 0.8rem; margin: 0; color: #1e293b; }
.s-role { font-size: 0.7rem; color: #94a3b8; margin: 0; text-transform: uppercase; }

.status-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.status-pill.activo { background: #1b5e20; color: white; }
.status-pill.contract_ended { background: #ea580c; color: white; }
.status-pill.inactivo { background: #c10015; color: white; }

.action-btns { display: flex; gap: 6px; }
.act-btn { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
.act-btn svg { width: 14px; height: 14px; }

.empty-state { text-align: center; padding: 24px !important; color: #94a3b8; font-weight: 500; font-style: italic; }

.table-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; gap: 16px; color: #94a3b8; }
.spin-ring-lg { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #1b5e20; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════════════════════════════
   ESTILOS PREMIUM: MODAL INMERSIVO (FULL SCREEN)
   ══════════════════════════════════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999; /* Asegura estar sobre la sidebar */
  padding: 20px;
}

.modal-card.modal-full {
  width: 95vw;
  height: 90vh;
  max-width: 1200px; /* Evita que sea demasiado ancho en ultra-wide */
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.head-premium {
  padding: 24px 40px !important;
  background: #fff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.head-premium h2 {
  color: #1e293b;
  font-weight: 900;
  font-size: 1.4rem;
  margin: 0;
}

.u-email {
  font-size: 0.85rem;
  color: #64748b;
  margin: 4px 0 0;
  font-weight: 500;
}

.modal-body-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 40px;
  background: #f8fafc; /* Color de fondo sutil para contraste */
}

.footer-premium {
  padding: 20px 40px;
  background: #fff;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  flex-shrink: 0;
}

/* Close Button Positioning */
.modal-close-premium {
  background: #f1f5f9;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.2rem;
}
.modal-close-premium:hover {
  background: #fee2e2;
  color: #dc2626;
  transform: rotate(90deg);
}

/* Sections Structure */
.form-section-premium {
  background: #fff;
  border: 1px solid #e2e8f0;
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.section-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: #1b5e20;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.label-premium {
  font-size: 0.65rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 6px;
  display: block;
}

.input-premium, .select-premium {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  transition: all 0.2s;
}
.input-premium:focus, .select-premium:focus {
  border-color: #1b5e20;
  box-shadow: 0 0 0 4px rgba(27, 94, 32, 0.1);
  outline: none;
}

.btn-confirm-premium {
  background: #1b5e20;
  color: #fff;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-confirm-premium:hover:not(:disabled) {
  background: #144d1a;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(27, 94, 32, 0.3);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
