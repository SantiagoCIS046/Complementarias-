<template>
  <div class="repfora-dashboard">
    <Sidebar />
    <div class="main-wrapper">
      <Header title="Gestión de Empresas" />
      <main class="content">
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

              <table class="user-table">
                <thead>
                  <tr>
                    <th>EMPRESA / NIT</th>
                    <th>REPRESENTANTE</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <SkeletonLoader v-if="isLoading" variant="table-tbody" :rows="5" :columns="4" tag="tbody" />
                <tbody v-else>
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
                        {{ formatEstado(c.estado) }}
                      </span>
                    </td>
                    <td>
                      <div class="action-btns">
                        <button class="act-btn view" title="Ver Detalles" @click="openDetails(c)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                        <button class="act-btn edit" title="Editar" @click="openEditModal(c)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button class="act-btn delete" title="Eliminar" @click="handleDeleteCompany(c)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
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
              <button class="btn btn-danger" @click="showDetailModal = false">Cerrar</button>
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
                <h2>{{ isEditing ? 'Editar Empresa' : 'Registrar Nueva Empresa' }}</h2>
                <p class="u-email">{{ isEditing ? 'Modifica los datos de la empresa seleccionada.' : 'Vinculación institucional al Centro Agroturístico.' }}</p>
              </div>
              <div class="modal-tabs" v-if="!isEditing">
                <button class="modal-tab" :class="{active: registroTab === 'manual'}" @click="registroTab = 'manual'">
                  <span class="material-symbols-outlined" style="font-size: 1.1rem;">edit</span> Registro Manual
                </button>
                <button class="modal-tab" :class="{active: registroTab === 'bulk'}" @click="registroTab = 'bulk'">
                  <span class="material-symbols-outlined" style="font-size: 1.1rem;">bolt</span> Carga Rápida (SGVA)
                </button>
              </div>
              <button class="modal-close-premium" @click="showAddModal = false">&times;</button>
            </div>

            <div class="modal-body modal-body-scroll">

              <!-- ===== TAB: CARGA RÁPIDA (SGVA) ===== -->
              <div v-if="registroTab === 'bulk'">
                <!-- Descarga de Plantilla Excel -->
                <div class="excel-download-card">
                  <div class="download-info">
                    <span class="material-symbols-outlined download-icon">download_for_offline</span>
                    <div class="download-text">
                      <h4>Formato Oficial de Registro</h4>
                      <p>Descargue la plantilla macro formato_registro_empresas_REPFORAEP (.xlsm) para el registro masivo.</p>
                    </div>
                  </div>
                  <button class="btn-download-template" @click="handleDownloadTemplate" :disabled="isDownloadingTemplate">
                    <span v-if="!isDownloadingTemplate">Descargar Formato</span>
                    <div v-else class="spin-mini"></div>
                  </button>
                </div>

                <!-- Zona drag & drop para Excel -->
                <div
                  class="drop-zone"
                  :class="{ 'drop-zone-over': isDragOver, 'has-file': xlsxFile }"
                  @dragover.prevent="isDragOver = true"
                  @dragleave="isDragOver = false"
                  @drop.prevent="handleFileDrop"
                  @click="$refs.xlsxFileInput.click()"
                >
                  <svg v-if="!xlsxFile" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;color:var(--color_button);"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span v-else class="material-symbols-outlined file-selected-icon">task</span>
                  <p class="drop-text" v-if="!xlsxFile">Arrastra tu archivo Excel aquí (.xlsm, .xlsx)<br><span>o haz clic para seleccionar</span></p>
                  <p class="drop-text" v-else>Archivo listo para importar:<br><strong class="file-name-highlight">{{ xlsxFile.name }}</strong></p>
                  <input ref="xlsxFileInput" type="file" accept=".xlsm,.xlsx,.xls" style="display:none" @change="handleFileSelect" />
                </div>

                <!-- Resultado de la importación y Reporte de Errores por Pestaña -->
                <div v-if="bulkResult" class="bulk-result">
                  <div class="result-row success-row">
                    <span>✅ Empresas registradas exitosamente:</span>
                    <strong>{{ bulkResult.creadas }}</strong>
                  </div>
                  <div class="result-row warn-row" v-if="bulkResult.omitidas > 0">
                    <span>⚠️ Omitidas o con errores:</span>
                    <strong>{{ bulkResult.omitidas }}</strong>
                  </div>

                  <!-- Detalle de Omitidas -->
                  <div class="bulk-errors-detail" v-if="bulkResult.detalle_omitidas && bulkResult.detalle_omitidas.length > 0">
                    <h5 class="errors-detail-title">Detalle de registros no cargados:</h5>
                    <div class="preview-table-wrap">
                      <table class="preview-table">
                        <thead>
                          <tr>
                            <th>Pestaña</th>
                            <th>NIT</th>
                            <th>Motivo</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(err, i) in bulkResult.detalle_omitidas" :key="i">
                            <td style="font-weight: 700; color: #1e293b;">{{ err.fila }}</td>
                            <td><code>{{ err.nit }}</code></td>
                            <td><span class="reason-pill">{{ err.motivo }}</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ===== TAB: REGISTRO MANUAL ===== -->
              <div v-else>
              <!-- Bloque 1: Información Legal -->
              <div class="form-section-premium">
                <h3 class="section-title">
                  <span class="material-symbols-outlined" style="font-size: 1.25rem;">domain</span>
                  Bloque 1: Información Legal (Obligatorio)
                </h3>
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
                <h3 class="section-title">
                  <span class="material-symbols-outlined" style="font-size: 1.25rem;">location_on</span>
                  Bloque 2: Ubicación y Contacto Corporativo
                </h3>
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
                    <input type="text" v-model="nuevaEmpresa.telefono" placeholder="Ej: 300..." class="input-premium" inputmode="numeric" pattern="[0-9]*" />
                  </div>
                  <div class="field-group">
                    <label class="label-premium">Correo Corporativo</label>
                    <input type="email" v-model="nuevaEmpresa.correo_corporativo" placeholder="contacto@empresa.com" class="input-premium" />
                  </div>
                </div>
              </div>

              <!-- Bloque 3: Jefe Inmediato -->
              <div class="form-section-premium mt-6">
                <h3 class="section-title">
                  <span class="material-symbols-outlined" style="font-size: 1.25rem;">person</span>
                  Bloque 3: Datos del Jefe Inmediato (Supervisor)
                </h3>
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
                    <input type="text" v-model="nuevaEmpresa.jefe_telefono" placeholder="Móvil personal" class="input-premium" inputmode="numeric" pattern="[0-9]*" />
                  </div>
                  <div class="field-group">
                    <label class="label-premium">Correo del Jefe</label>
                    <input type="email" v-model="nuevaEmpresa.jefe_correo" placeholder="jefe@empresa.com" class="input-premium" />
                  </div>
                </div>
              </div>

              <!-- Bloque 4: Documentación y Estado -->
              <div class="form-section-premium mt-6">
                <h3 class="section-title">
                  <span class="material-symbols-outlined" style="font-size: 1.25rem;">attachment</span>
                  Bloque 4: Documentación y Estado (Admin)
                </h3>
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
            </div>

            <div class="modal-footer footer-premium">
              <button class="btn-cancel-premium" @click="showAddModal = false">{{ isEditing ? 'Cancelar' : 'Descartar' }}</button>
              <button v-if="registroTab === 'bulk'" class="btn-confirm-premium btn-bulk" @click="handleBulkImport" :disabled="isSubmitting || !xlsxFile">
                <span v-if="!isSubmitting" style="display: flex; align-items: center; gap: 6px; justify-content: center;"><span class="material-symbols-outlined" style="font-size: 1.2rem;">upload</span> Procesar Carga Masiva</span>
                <div v-else class="spin-mini"></div>
              </button>
              <!-- Botón para Registro Manual / Edición -->
              <button v-else class="btn-confirm-premium" @click="handleAddCompany" :disabled="isSubmitting">
                <span v-if="!isSubmitting">{{ isEditing ? 'Guardar Cambios' : 'Finalizar Registro' }}</span>
                <div v-else class="spin-mini"></div>
              </button>
            </div>
          </div>
        </div>
      </Transition>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../core/store/auth.store';
import { companiesService } from '../services/companies.service';
import Sidebar from '../../../components/layout/Sidebar.vue';
import Header from '../../../components/layout/Header.vue';
import SkeletonLoader from '../../../components/ui/SkeletonLoader.vue';
import { useAlert } from '../../../core/composables/useAlert';

const router = useRouter();
const authStore = useAuthStore();
const { showSuccess, showError, showWarning, showConfirm } = useAlert();

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

const formatEstado = (estado) => {
  if (!estado) return '';
  return estado.replace(/_/g, ' ');
};

// Modales
const showDetailModal = ref(false);
const showAddModal = ref(false);
const isSubmitting = ref(false);
const selectedCompany = ref(null);
const isEditing = ref(false);
const editingCompanyId = ref(null);

// Tab del modal de registro
const registroTab = ref('manual');

// Bulk upload state
const csvPreview = ref([]);
const xlsxFile = ref(null);
const isDownloadingTemplate = ref(false);
const isDragOver = ref(false);
const bulkResult = ref(null);

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
  isEditing.value = false;
  editingCompanyId.value = null;
  nuevaEmpresa.value = {
    nit: '', razon_social: '', sector_economico: '', direccion: '', municipio: 'San Gil',
    telefono: '', correo_corporativo: '', jefe_nombre: '', jefe_cargo: '', jefe_telefono: '',
    jefe_correo: '', rut_url: '', camara_comercio_url: '', estado: 'EN_REVISION'
  };
  registroTab.value = 'manual';
  csvPreview.value = [];
  bulkResult.value = null;
  showAddModal.value = true;
};

const openEditModal = (company) => {
  isEditing.value = true;
  editingCompanyId.value = company._id;
  nuevaEmpresa.value = {
    nit:                 company.nit || '',
    razon_social:        company.razon_social || '',
    sector_economico:    company.sector_economico || '',
    direccion:           company.direccion || '',
    municipio:           company.municipio || 'San Gil',
    telefono:            company.datos_contacto?.telefono || '',
    correo_corporativo:  company.datos_contacto?.correo_corporativo || '',
    jefe_nombre:         company.jefe_inmediato?.nombre_completo || '',
    jefe_cargo:          company.jefe_inmediato?.cargo || '',
    jefe_telefono:       company.jefe_inmediato?.telefono || '',
    jefe_correo:         company.jefe_inmediato?.correo || '',
    rut_url:             company.documentacion?.rut_url || '',
    camara_comercio_url: company.documentacion?.camara_comercio_url || '',
    estado:              company.estado || 'EN_REVISION'
  };
  registroTab.value = 'manual';
  showAddModal.value = true;
};

const handleDeleteCompany = (company) => {
  showConfirm(
    '¿Eliminar Empresa?',
    `¿Estás seguro de que deseas eliminar permanentemente esta empresa? Esta acción no se puede deshacer.`,
    async () => {
      await companiesService.delete(company._id);
      loadCompanies();
      showSuccess('¡Eliminado!', 'La empresa ha sido eliminada correctamente del sistema.');
    },
    {
      isDanger: true,
      okText: 'Eliminar',
      cancelText: 'Cancelar',
      companyName: company.razon_social
    }
  );
};

const validateNit = (val) => {
  // Solo permite números y un guion
  nuevaEmpresa.value.nit = val.replace(/[^0-9-]/g, '');
};

const handleAddCompany = async () => {
  if (!nuevaEmpresa.value.nit || !nuevaEmpresa.value.razon_social) {
    showWarning('Campos Obligatorios', 'El NIT y la Razón Social son obligatorios para poder guardar la empresa.');
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

    if (isEditing.value) {
      await companiesService.update(editingCompanyId.value, payload);
      showSuccess('¡Actualizado!', 'La empresa ha sido actualizada correctamente en el sistema.');
    } else {
      await companiesService.create(payload);
      showSuccess('¡Registrado!', 'La empresa ha sido registrada correctamente en el sistema.');
    }
    showAddModal.value = false;
    loadCompanies();
  } catch (err) {
    console.error('Error:', err);
    showError('Error', 'Ocurrió un error al procesar la solicitud: ' + (err.response?.data?.message || err.message));
  } finally {
    isSubmitting.value = false;
  }
};

const setFilter = (f) => currentFilter.value = f;
const handleLogout = () => { authStore.logout(); router.push('/login'); };

// ── Excel / Bulk helpers ─────────────────────────────────────────────────
const handleDownloadTemplate = async () => {
  isDownloadingTemplate.value = true;
  try {
    const response = await companiesService.downloadTemplate();
    const blob = new Blob([response.data], { type: 'application/vnd.ms-excel.sheet.macroEnabled.12' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'formato_registro_empresas_REPFORAEP.xlsm';
    link.click();
    window.URL.revokeObjectURL(link.href);
    showSuccess('Descarga Exitosa', 'El formato oficial formato_registro_empresas_REPFORAEP.xlsm se ha descargado correctamente.');
  } catch (err) {
    console.error('Error al descargar plantilla:', err);
    showError('Error', 'No se pudo descargar la plantilla Excel: ' + (err.response?.data?.message || err.message));
  } finally {
    isDownloadingTemplate.value = false;
  }
};

const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  xlsxFile.value = file;
  bulkResult.value = null;
};

const handleFileDrop = (e) => {
  isDragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (!file) return;
  xlsxFile.value = file;
  bulkResult.value = null;
};

const handleBulkImport = async () => {
  if (!xlsxFile.value) return;
  isSubmitting.value = true;
  try {
    const response = await companiesService.uploadXlsx(xlsxFile.value);
    bulkResult.value = {
      creadas: response.data.creadas,
      omitidas: response.data.omitidas,
      detalle_omitidas: response.data.detalle_omitidas || []
    };
    xlsxFile.value = null;
    loadCompanies();
    showSuccess('¡Carga Exitosa!', `Se han registrado exitosamente ${response.data.creadas} empresas desde el archivo Excel.`);
  } catch (err) {
    console.error('Error en importación masiva Excel:', err);
    showError('Error de Importación', 'Ocurrió un error al procesar el archivo Excel: ' + (err.response?.data?.message || err.message));
  } finally {
    isSubmitting.value = false;
  }
};
// ────────────────────────────────────────────────────────────────────────

const adminName = computed(() => authStore.user?.name || 'Admin');
const adminInitials = computed(() => {
  const parts = adminName.value.split(' ');
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : adminName.value.substring(0, 2).toUpperCase();
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
.user-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-primary); font-size: 0.85rem; color: var(--text-primary); }
.user-table tbody tr:nth-child(even) { background: var(--bg-secondary); }

.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 0.75rem; }
.bg-green { background: #1b5e20; }
.u-name { font-weight: 700; margin: 0; font-size: 0.88rem; }
.u-email { font-size: 0.75rem; color: var(--text-muted); margin: 0; }

.supervisor-info { display: flex; flex-direction: column; gap: 2px; }
.s-name { font-weight: 600; font-size: 0.88rem; margin: 0; color: var(--text-primary); }
.s-role { font-size: 0.76rem; color: var(--text-muted); margin: 0; text-transform: uppercase; }

.status-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; white-space: nowrap; }
.status-pill.activo { background: #1b5e20; color: white; }
.status-pill.contract_ended { background: #ea580c; color: white; }
.status-pill.inactivo { background: #c10015; color: white; }

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
.act-btn.delete {
  color: #dc2626;
}
.act-btn.delete:hover {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
}

.empty-state { text-align: center; padding: 24px !important; color: var(--text-muted); font-weight: 500; font-style: italic; }

.table-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; gap: 16px; color: var(--text-muted); }
.spin-ring-lg { width: 32px; height: 32px; border: 3px solid var(--border-primary); border-top-color: var(--color_button); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ─── Modal Tabs ─────────────────────────────────────────────────── */
.modal-tabs {
  display: flex;
  gap: 6px;
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 4px;
  flex-shrink: 0;
}
.modal-tab {
  background: transparent;
  border: none;
  padding: 7px 18px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}
.modal-tab.active {
  background: var(--bg-primary);
  color: #1b5e20;
  box-shadow: var(--shadow-sm);
}
.modal-tab:hover:not(.active) { color: var(--text-primary); }

/* ─── Bulk Info Banner ───────────────────────────────────────────── */
.bulk-info-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--bg-active);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  padding: 14px 18px;
  font-size: 0.88rem;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 20px;
}
.bulk-info-banner code {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: monospace;
  color: var(--text-primary);
}

/* ─── Drop Zone ──────────────────────────────────────────────────── */
.drop-zone {
  border: 2px dashed var(--border-primary);
  border-radius: 14px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-secondary);
  margin-bottom: 20px;
}
.drop-zone:hover, .drop-zone-over {
  border-color: #1b5e20;
  background: var(--bg-active);
}
.drop-text {
  text-align: center;
  font-size: 0.95rem;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.6;
}
.drop-text span { font-size: 0.82rem; color: var(--text-muted); }

/* ─── Bulk Preview Table ─────────────────────────────────────────── */
.bulk-preview { margin-top: 4px; }
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.preview-count { font-size: 0.88rem; font-weight: 700; color: #1b5e20; }
.btn-clear-csv {
  background: #fee2e2;
  color: #b91c1c;
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-clear-csv:hover { background: #fecaca; }
.preview-table-wrap {
  max-height: 220px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
}
.preview-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
.preview-table th {
  background: #1b5e20;
  color: #fff;
  padding: 9px 11px;
  text-align: left;
  font-weight: 700;
  position: sticky;
  top: 0;
}
.preview-table td { padding: 8px 11px; border-bottom: 1px solid var(--border-secondary); color: var(--text-primary); }
.preview-table tbody tr:nth-child(even) { background: var(--bg-secondary); }

/* ─── Bulk Result ────────────────────────────────────────────────── */
.bulk-result {
  margin-top: 20px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border-primary);
  animation: fadeSlideIn 0.3s ease;
}
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  font-size: 0.92rem;
  font-weight: 600;
}
.success-row { background: var(--bg-active); color: var(--text-primary); }
.warn-row { background: var(--bg-secondary); color: var(--text-secondary); border-top: 1px solid var(--border-primary); }
.result-row strong { font-size: 1.1rem; }

/* ─── Bulk confirm button variant ───────────────────────────────── */
.btn-bulk {
  background: linear-gradient(135deg, #1b5e20 0%, #166534 100%) !important;
  box-shadow: 0 4px 12px rgba(27, 94, 32, 0.3);
}
.btn-bulk:disabled { opacity: 0.5; cursor: not-allowed; }

/* ─── Excel Template Download Card ───────────────────────────────── */
.excel-download-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-active);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  margin-bottom: 20px;
  gap: 16px;
}
.download-info {
  display: flex;
  align-items: center;
  gap: 14px;
}
.download-icon {
  font-size: 2.2rem;
  color: var(--text-primary);
}
.download-text h4 {
  margin: 0 0 2px 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}
.download-text p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}
.btn-download-template {
  background: #1b5e20;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-download-template:hover {
  background: #14532d;
  transform: translateY(-1px);
}
.btn-download-template:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── File State in Drop Zone ────────────────────────────────────── */
.drop-zone.has-file {
  border-color: #22c55e;
  background: var(--bg-active);
}
.file-selected-icon {
  font-size: 3rem;
  color: #166534;
}
.file-name-highlight {
  font-size: 1rem;
  color: var(--text-primary);
  display: inline-block;
  margin-top: 4px;
}

/* ─── Carga Masiva Detalle de Errores por Pestaña ───────────────── */
.bulk-errors-detail {
  padding: 16px 20px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
}
.errors-detail-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
}
.reason-pill {
  font-size: 0.78rem;
  font-weight: 600;
  color: #b91c1c;
  background: #fee2e2;
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-block;
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
.modal-md { width: 580px; }
.modal-sm { width: 400px; }
.modal-full { width: 850px; max-width: 96vw; }
.modal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid var(--border-primary);
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

/* ─── Detail Modal Styles ────────────────────────────────────────── */
.detail-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: left;
}
.detail-section:last-child {
  margin-bottom: 0;
}
.detail-section .section-title {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color_button);
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border-primary);
  padding-bottom: 8px;
}
.info-grid-compact {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px 20px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-item label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.info-item span {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-all;
}
.doc-links-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.doc-link {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 10px 16px;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 700;
  transition: all 0.2s ease;
}
.doc-link svg {
  width: 16px;
  height: 16px;
  color: var(--color_button);
}
.doc-link:hover {
  border-color: var(--color_button);
  background: var(--bg-hover);
  transform: translateY(-1px);
}
</style>
