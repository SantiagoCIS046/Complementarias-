<template>
  <div class="admin-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-area">
          <span class="logo-text">REPFORA</span>
          <span class="logo-subtext">ARQUITECTO INSTITUCIONAL</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group">
          <a href="#" class="nav-item active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Gestión de Usuarios</span>
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        <a href="#" class="nav-item" @click.prevent="showPasswordModal = true">
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
        <div class="topbar-left">
          <nav class="top-nav">
            <a href="#" class="top-nav-item active">Gestión de Usuarios</a>
          </nav>
        </div>
        
        <div class="topbar-right">
          <div class="user-profile">
            <div class="admin-avatar" :title="adminName">{{ adminInitials }}</div>
          </div>
        </div>
      </header>

      <div class="page-body">
        <!-- Bootstrap-style Alert -->
        <Transition name="fade">
          <div v-if="alertBox.show" class="alert-bootstrap" :class="alertBox.type">
            <div class="alert-content">
              <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ alertBox.message }}</span>
            </div>
            <button class="alert-close" @click="alertBox.show = false">&times;</button>
          </div>
        </Transition>

        <header class="page-header">
          <div class="header-info">
            <h1 class="page-title">Gestión de Usuarios</h1>
            <p class="page-description">Supervise el estado de la red institucional y administre accesos.</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-export" @click="handleExport">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; margin-right: 8px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar
            </button>
            <input type="file" ref="fileInput" accept=".xlsx,.csv" style="display:none" @change="handleFileUpload" />
          </div>
        </header>

        <div class="dashboard-grid">
            <!-- Columna Izquierda: Acciones Rápidas -->
            <div class="left-col">
              <!-- El espacio se mantiene para otros estados o futuras acciones -->

            <!-- Processing State -->
            <div class="card status-card" v-if="importState.isProcessing">
              <div class="card-header-sm">
                <span class="status-label">PROCESANDO {{ importState.fileName }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill indeterminate"></div>
              </div>
            </div>

            <!-- Success Result -->
            <div class="card success-import-card" v-if="!importState.isProcessing && importState.result">
              <div class="error-header">
                <div class="success-icon">✓</div>
                <div class="error-info-text">
                  <h3>Importación Completa</h3>
                  <p class="success-text">{{ importState.result.creados }} usuarios creados</p>
                </div>
              </div>
              <button class="btn-clear-errors" @click="importState.result = null">Cerrar</button>
            </div>

            <!-- Error Summary State -->
            <div class="card error-summary-card" v-if="!importState.isProcessing && importState.errors.length > 0">
              <div class="error-header">
                <div class="error-icon">!</div>
                <div class="error-info-text">
                  <h3>Resumen de Errores</h3>
                  <p>{{ importState.errors.length }} BLOQUEADOS</p>
                </div>
              </div>
              <div class="error-items">
                <div class="error-detail-pill" v-for="(err, index) in importState.errors" :key="index">
                  <span class="error-code">E-{{ index + 1 }}</span>
                  <div class="error-txt">
                    <strong>{{ err.error }}</strong>
                    <p>{{ err.fila?.email || 'Sin email' }}</p>
                  </div>
                </div>
                <button class="btn-clear-errors" @click="importState.errors = []">Limpiar</button>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Tabla Principal -->
          <div class="right-col">
            <div class="card main-table-card">
              <div class="table-header">
                <div class="filter-tabs">
                  <button class="filter-btn" :class="{active: currentFilter === 'TODOS'}" @click="setFilter('TODOS')">Todos</button>
                  <button class="filter-btn" :class="{active: currentFilter === 'APRENDIZ'}" @click="setFilter('APRENDIZ')">Aprendices</button>
                  <button class="filter-btn" :class="{active: currentFilter === 'INSTRUCTOR'}" @click="setFilter('INSTRUCTOR')">Instructores</button>
                  <button class="filter-btn" :class="{active: currentFilter === 'ADMIN'}" @click="setFilter('ADMIN')">Admin</button>
                </div>
                <div class="search-box table-search">
                  <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" v-model="searchQuery" @input="debouncedSearch" placeholder="Buscar por cédula, nombre o email..." />
                </div>
              </div>

              <!-- Loading -->
              <div v-if="isLoading" class="table-loading">
                <div class="spin-ring-lg"></div>
                <p>Cargando usuarios...</p>
              </div>

              <table class="user-table" v-else>
                <thead>
                  <tr>
                    <th>MIEMBRO</th>
                    <th>ROL</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in users" :key="user._id">
                    <td>
                      <div class="user-cell">
                        <div class="avatar" :class="getAvatarColor(user.role)">{{ getInitials(user.name) }}</div>
                        <div class="user-info">
                          <p class="u-name">{{ user.name }}</p>
                          <p class="u-email">{{ user.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td><span class="role-badge" :class="user.role.toLowerCase()">{{ user.role }}</span></td>
                    <td><span class="status-dot" :class="{ active: user.status === 'ACTIVO' }"></span> {{ user.status }}</td>
                    <td>
                      <div class="action-btns">
                        <button class="act-btn edit" @click="openEditModal(user)" title="Editar">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="act-btn delete" @click="confirmDelete(user)" title="Eliminar">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="users.length === 0">
                    <td colspan="4" class="empty-state">No hay usuarios en esta categoría</td>
                  </tr>
                </tbody>
              </table>
              <div class="table-footer">
                <span>{{ showingText }}</span>
                <div class="pagination">
                  <button class="page-btn" @click="changePage(pagination.page - 1)" :disabled="pagination.page === 1">&lt;</button>
                  <button 
                    v-for="page in pagination.totalPages" 
                    :key="page"
                    class="page-btn" 
                    :class="{ active: pagination.page === page }"
                    @click="changePage(page)"
                  >
                    {{ page }}
                  </button>
                  <button class="page-btn" @click="changePage(pagination.page + 1)" :disabled="pagination.page === pagination.totalPages">&gt;</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Fila Inferior: Estadísticas -->
        <div class="stats-row">
          <div class="stat-box border-green">
            <p>TOTAL USUARIOS</p>
            <h2>{{ pagination.total }}</h2>
            <small>Basado en registros actuales</small>
          </div>
          <div class="stat-box border-pink">
            <p>INSTRUCTORES</p>
            <h2>{{ stats.instructors }}</h2>
            <small>Usuarios con rol instructor</small>
          </div>
          <div class="stat-box border-dark">
            <p>APRENDICES</p>
            <h2>{{ stats.aprendices }}</h2>
            <small>Usuarios con rol aprendiz</small>
          </div>
        </div>
      </div>
    </main>

    <!-- ═══════ MODAL: Editar Usuario ═══════ -->
    <div class="modal-overlay" v-if="editModal.show" @click.self="editModal.show = false">
      <div class="modal-card">
        <div class="modal-head">
          <h2>Editar Usuario</h2>
          <button class="modal-close" @click="editModal.show = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="field-sm">
            <label>Nombre</label>
            <input v-model="editModal.data.name" />
          </div>
          <div class="field-sm">
            <label>Email</label>
            <input v-model="editModal.data.email" />
          </div>
          <div class="field-sm">
            <label>Documento</label>
            <input v-model="editModal.data.documento" />
          </div>
          <div class="field-row">
            <div class="field-sm">
              <label>Rol</label>
              <select v-model="editModal.data.role">
                <option value="ADMIN">Admin</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="APRENDIZ">Aprendiz</option>
                <option value="EMPRESA">Empresa</option>
              </select>
            </div>
            <div class="field-sm">
              <label>Estado</label>
              <select v-model="editModal.data.status">
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="ELEGIBLE">Elegible</option>
                <option value="CONTRATO_TERMINADO">Contrato Terminado</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="editModal.show = false">Cancelar</button>
          <button class="btn btn-primary" @click="saveEdit" :disabled="editModal.saving">
            {{ editModal.saving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════ MODAL: Confirmar Eliminación ═══════ -->
    <div class="modal-overlay" v-if="deleteModal.show" @click.self="deleteModal.show = false">
      <div class="modal-card modal-sm">
        <div class="modal-head">
          <h2>Eliminar Usuario</h2>
          <button class="modal-close" @click="deleteModal.show = false">&times;</button>
        </div>
        <div class="modal-body">
          <p class="delete-warning">¿Estás seguro de que deseas eliminar a <strong>{{ deleteModal.user?.name }}</strong>?</p>
          <p class="delete-sub">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="deleteModal.show = false">Cancelar</button>
          <button class="btn btn-danger" @click="executeDelete" :disabled="deleteModal.deleting">
            {{ deleteModal.deleting ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════ MODAL: Cambiar Contraseña ═══════ -->
    <div class="modal-overlay" v-if="showPasswordModal" @click.self="showPasswordModal = false">
      <div class="modal-card modal-sm">
        <div class="modal-head">
          <h2>Cambiar Contraseña</h2>
          <button class="modal-close" @click="showPasswordModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="field-sm">
            <label>Nueva contraseña</label>
            <input type="password" v-model="newPassword" placeholder="Mínimo 6 caracteres" />
          </div>
          <div class="field-sm">
            <label>Confirmar contraseña</label>
            <input type="password" v-model="confirmPassword" />
          </div>
          <p v-if="passwordMsg" :class="passwordMsg.type === 'error' ? 'error-msg' : 'success-msg'">{{ passwordMsg.text }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showPasswordModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="handleChangePassword" :disabled="changingPassword">
            {{ changingPassword ? 'Cambiando...' : 'Cambiar Clave' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════ MODAL: Seleccionar Formato de Exportación ═══════ -->
    <div class="modal-overlay" v-if="exportModal.show" @click.self="exportModal.show = false">
      <div class="modal-card modal-sm">
        <div class="modal-head">
          <h2>Seleccionar Formato</h2>
          <button class="modal-close" @click="exportModal.show = false">&times;</button>
        </div>
        <div class="modal-body">
          <p class="format-intro">Seleccione el formato de salida para el listado de <strong>{{ exportModal.target }}</strong>:</p>
          <div class="format-grid">
            <button class="format-card excel" @click="executeExport('Excel')">
              <div class="format-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2v7H8z"/><path d="M14 13h2v7h-2z"/><path d="M11 13h2v7h-2z"/></svg>
              </div>
              <div class="format-info">
                <h3>Microsoft Excel</h3>
                <p>Ideal para análisis de datos y filtrado avanzado.</p>
              </div>
            </button>

            <button class="format-card pdf" @click="executeExport('PDF')">
              <div class="format-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 3 3 3-3"/></svg>
              </div>
              <div class="format-info">
                <h3>Documento PDF</h3>
                <p>Formato estándar para impresión y lectura segura.</p>
              </div>
            </button>

            <button class="format-card text" @click="executeExport('Texto')">
              <div class="format-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              </div>
              <div class="format-info">
                <h3>Archivo de Texto</h3>
                <p>Exportación rápida en texto plano legible.</p>
              </div>
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
import { usersService } from '../services/users.service';
import { authService } from '../services/auth.service';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const router = useRouter();
const authStore = useAuthStore();

// ── Estado Principal ──────────────────────────────────
const users = ref([]);
const isLoading = ref(true);
const currentFilter = ref('TODOS');
const searchQuery = ref('');
const pagination = ref({ total: 0, page: 1, limit: 10, totalPages: 1 });
const stats = ref({ instructors: 0, aprendices: 0 });

// Alert state (Bootstrap style)
const alertBox = ref({ show: false, message: '', type: 'success' });

// Export Modal state
const exportModal = ref({ show: false, target: '' });

// ── Cargar Usuarios ──────────────────────────────────
const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    };
    if (currentFilter.value !== 'TODOS') params.role = currentFilter.value;
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim();

    const res = await usersService.getAll(params);
    users.value = res.data.users;
    pagination.value = res.data.pagination;
  } catch (err) {
    console.error('Error cargando usuarios:', err);
  } finally {
    isLoading.value = false;
  }
};

// Cargar estadísticas globales (sin filtros)
const fetchStats = async () => {
  try {
    const [allRes, insRes, aprRes] = await Promise.all([
      usersService.getAll({ limit: 1 }),
      usersService.getAll({ limit: 1, role: 'INSTRUCTOR' }),
      usersService.getAll({ limit: 1, role: 'APRENDIZ' })
    ]);
    stats.value.instructors = insRes.data.pagination.total;
    stats.value.aprendices = aprRes.data.pagination.total;
  } catch (err) {
    console.error('Error cargando estadísticas:', err);
  }
};

onMounted(() => {
  fetchUsers();
  fetchStats();
});

// ── Filtros & Paginación ─────────────────────────────
const setFilter = (filter) => {
  currentFilter.value = filter;
  pagination.value.page = 1;
  fetchUsers();
};

let searchTimeout = null;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    fetchUsers();
  }, 400);
};

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page;
    fetchUsers();
  }
};

const showingText = computed(() => {
  const { total, page, limit } = pagination.value;
  if (total === 0) return 'No hay miembros para mostrar';
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return `Mostrando ${from}-${to} de ${total} miembros`;
});

// ── Helpers Visuales ─────────────────────────────────
const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length >= 2 
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() 
    : parts[0].substring(0, 2).toUpperCase();
};

const getAvatarColor = (role) => {
  const map = { ADMIN: 'bg-green', INSTRUCTOR: 'bg-pink', APRENDIZ: 'bg-blue', EMPRESA: 'bg-orange' };
  return map[role] || 'bg-blue';
};

// ── Admin Info ───────────────────────────────────────
const adminName = computed(() => authStore.user?.name || 'Admin');
const adminInitials = computed(() => getInitials(adminName.value));

// ── Editar Usuario ───────────────────────────────────
const editModal = ref({ show: false, data: {}, saving: false });

const openEditModal = (user) => {
  editModal.value.data = { ...user };
  editModal.value.show = true;
};

const saveEdit = async () => {
  editModal.value.saving = true;
  try {
    await usersService.update(editModal.value.data._id, {
      name: editModal.value.data.name,
      email: editModal.value.data.email,
      documento: editModal.value.data.documento,
      role: editModal.value.data.role,
      status: editModal.value.data.status
    });
    editModal.value.show = false;
    fetchUsers();
    fetchStats();
  } catch (err) {
    alert('Error al guardar: ' + (err.response?.data?.message || err.message));
  } finally {
    editModal.value.saving = false;
  }
};

// ── Eliminar Usuario ─────────────────────────────────
const deleteModal = ref({ show: false, user: null, deleting: false });

const confirmDelete = (user) => {
  deleteModal.value.user = user;
  deleteModal.value.show = true;
};

const executeDelete = async () => {
  deleteModal.value.deleting = true;
  try {
    await usersService.remove(deleteModal.value.user._id);
    deleteModal.value.show = false;
    fetchUsers();
    fetchStats();
  } catch (err) {
    alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
  } finally {
    deleteModal.value.deleting = false;
  }
};

const handleExport = () => {
  let target = '';
  switch (currentFilter.value) {
    case 'ADMIN': target = 'Administradores'; break;
    case 'INSTRUCTOR': target = 'Instructores'; break;
    case 'APRENDIZ': target = 'Aprendices'; break;
    case 'EMPRESA': target = 'Empresas'; break;
    default: target = 'todos los usuarios';
  }
  
  exportModal.value = { show: true, target };
};

const executeExport = (format) => {
  exportModal.value.show = false;
  
  // Clonar y ordenar datos alfabéticamente por nombre
  const data = [...users.value].sort((a, b) => a.name.localeCompare(b.name));

  if (!data || data.length === 0) {
    alertBox.value = { show: true, message: 'No hay datos para exportar.', type: 'danger' };
    return;
  }

  const fileName = `Exportacion_${exportModal.value.target.replace(/ /g, '_')}_${new Date().toLocaleDateString()}`;

  try {
    if (format === 'Excel') {
      // Exportar como CSV con BOM para soporte de tildes/UTF-8 en Excel
      const headers = ['Nombre', 'Email', 'Documento', 'Rol', 'Estado'];
      const rows = data.map(u => [
        `"${u.name}"`, 
        `"${u.email}"`, 
        `"${u.documento}"`, 
        `"${u.role}"`, 
        `"${u.status}"`
      ].join(';')); // Usamos punto y coma para mejor compatibilidad en Excel español
      
      const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\n');
      downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8;');
    } 
    else if (format === 'Texto') {
      // Reporte de texto profesional con estructura de tabla
      let txt = `╔══════════════════════════════════════════════════════════════════════════╗\n`;
      txt += `║                REPORTE INSTITUCIONAL DE USUARIOS - REPFORA               ║\n`;
      txt += `╠══════════════════════════════════════════════════════════════════════════╣\n`;
      txt += `║ Categoría: ${exportModal.value.target.padEnd(61)}║\n`;
      txt += `║ Fecha: ${new Date().toLocaleString().padEnd(65)}║\n`;
      txt += `╠══════════════════════════════════════════════════════════════════════════╣\n\n`;
      
      txt += `${'NOMBRE'.padEnd(30)} | ${'DOCUMENTO'.padEnd(15)} | ${'ROL'.padEnd(12)} | ${'ESTADO'}\n`;
      txt += `${'-'.repeat(80)}\n`;
      
      data.forEach(u => {
        txt += `${u.name.substring(0, 28).padEnd(30)} | ${u.documento.padEnd(15)} | ${u.role.padEnd(12)} | ${u.status}\n`;
        txt += `   Email: ${u.email}\n`;
        txt += `${'-'.repeat(80)}\n`;
      });
      
      downloadFile(txt, `${fileName}.txt`, 'text/plain;charset=utf-8;');
    }
    else if (format === 'PDF') {
      alertBox.value = { show: true, message: 'Generando documento PDF de alta calidad...', type: 'success' };
      
      const doc = new jsPDF();
      
      // Título y Metadatos
      doc.setFontSize(18);
      doc.setTextColor(57, 169, 0); // Verde SENA
      doc.text('REPORTE INSTITUCIONAL DE USUARIOS', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Categoría: ${exportModal.value.target}`, 14, 30);
      doc.text(`Fecha de emisión: ${new Date().toLocaleString()}`, 14, 35);
      doc.text('Plataforma: REPFORA - SENA', 14, 40);

      // Tabla de datos
      const tableColumn = ["Nombre", "Email", "Documento", "Rol", "Estado"];
      const tableRows = data.map(u => [u.name, u.email, u.documento, u.role, u.status]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'striped',
        headStyles: { fillStyle: 'dark', fillColor: [57, 169, 0], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        styles: { fontSize: 9, cellPadding: 3 }
      });

      doc.save(`${fileName}.pdf`);
    }

    alertBox.value = { show: true, message: `¡Éxito! Reporte ordenado y guardado correctamente.`, type: 'success' };
  } catch (err) {
    alertBox.value = { show: true, message: 'Error al procesar la exportación.', type: 'danger' };
  }

  setTimeout(() => alertBox.value.show = false, 4000);
};

const downloadFile = (content, fileName, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ── Importación Masiva Real ──────────────────────────
const fileInput = ref(null);
const importState = ref({
  isProcessing: false,
  fileName: '',
  errors: [],
  result: null
});

const triggerImport = () => {
  if (importState.value.isProcessing) return;
  fileInput.value.click();
};

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  importState.value.isProcessing = true;
  importState.value.fileName = file.name;
  importState.value.errors = [];
  importState.value.result = null;

  try {
    const res = await usersService.importExcel(file);
    importState.value.result = res.data.data;
    if (res.data.data.errores?.length > 0) {
      importState.value.errors = res.data.data.errores;
    }
    fetchUsers();
    fetchStats();
  } catch (err) {
    importState.value.errors = [{ error: err.response?.data?.message || 'Error al importar', fila: {} }];
  } finally {
    importState.value.isProcessing = false;
    fileInput.value.value = '';
  }
};

// ── Cambiar Contraseña ───────────────────────────────
const showPasswordModal = ref(false);
const newPassword = ref('');
const confirmPassword = ref('');
const changingPassword = ref(false);
const passwordMsg = ref(null);

const handleChangePassword = async () => {
  if (newPassword.value.length < 6) {
    passwordMsg.value = { type: 'error', text: 'Mínimo 6 caracteres' };
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordMsg.value = { type: 'error', text: 'Las contraseñas no coinciden' };
    return;
  }

  changingPassword.value = true;
  passwordMsg.value = null;
  try {
    const API = import.meta.env.VITE_API_URL;
    await axios.post(`${API}/auth/change-password`, 
      { password: newPassword.value },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    passwordMsg.value = { type: 'success', text: '¡Contraseña actualizada!' };
    newPassword.value = '';
    confirmPassword.value = '';
    setTimeout(() => { showPasswordModal.value = false; passwordMsg.value = null; }, 2000);
  } catch (err) {
    passwordMsg.value = { type: 'error', text: err.response?.data?.message || 'Error al cambiar contraseña' };
  } finally {
    changingPassword.value = false;
  }
};

// ── Logout ───────────────────────────────────────────
const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

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
.logo-text { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
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
.nav-item.active { background: #f0fdf4; color: #39a900; font-weight: 700; border-right: 3px solid #39a900; }
.nav-icon { width: 16px; height: 16px; }
.sidebar-footer { margin-top: auto; padding: 16px 0; border-top: 1px solid #f1f5f9; }
.logout { color: #dc2626 !important; }

/* Content Area */
.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* Topbar */
.topbar {
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  padding: 0 24px;
}
.topbar-left, .topbar-right { display: flex; align-items: center; height: 100%; }
.top-nav { display: flex; gap: 24px; height: 100%; }
.top-nav-item {
  text-decoration: none;
  color: #64748b;
  font-weight: 600;
  font-size: 0.85rem;
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
}
.top-nav-item.active { color: #39a900; }
.top-nav-item.active::after {
  content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: #39a900;
}

.search-box { position: relative; }
.search-box input {
  width: 100%; background: #f1f5f9; border: 1px solid transparent; border-radius: 8px; padding: 6px 12px 6px 32px; font-size: 0.8rem; outline: none; transition: 0.2s;
}
.search-box input:focus { border-color: #cbd5e1; background: #fff; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; color: #94a3b8; }

.admin-avatar {
  width: 34px;
  height: 34px;
  background: #1e293b;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
  border: 2px solid #e2e8f0;
  transition: border-color 0.2s;
}
.admin-avatar:hover { border-color: #39a900; }

/* Page Content */
.page-body { flex: 1; overflow-y: auto; padding: 24px 32px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 1.4rem; font-weight: 800; margin: 0; }
.page-description { font-size: 0.8rem; color: #64748b; }

.btn-primary { background: #39a900; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; }
.btn-primary:hover { background: #2e8b00; }
.btn-export { 
  background: #f0fdf4; 
  color: #39a900; 
  border: 1px solid #bbf7d0; 
  padding: 10px 20px; 
  border-radius: 8px; 
  font-weight: 700; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(57, 169, 0, 0.05);
}
.btn-export:hover { 
  background: #39a900; 
  color: #fff;
  border-color: #39a900;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px -4px rgba(57, 169, 0, 0.25);
}
.btn-export svg {
  transition: transform 0.3s ease;
}
.btn-export:hover svg {
  transform: translateY(2px);
}
.btn-danger { background: #dc2626; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; }
/* Bootstrap Style Alert */
.alert-bootstrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 600;
  border: 1px solid transparent;
  animation: slideIn 0.3s ease-out;
}
.alert-bootstrap.success {
  background-color: #d1e7dd;
  color: #0f5132;
  border-color: #badbcc;
}
.alert-bootstrap.danger {
  background-color: #f8d7da;
  color: #842029;
  border-color: #f5c2c7;
}
.alert-content { display: flex; align-items: center; gap: 12px; }
.alert-icon { width: 18px; height: 18px; }
.alert-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: inherit;
  cursor: pointer;
  line-height: 1;
  opacity: 0.5;
  transition: opacity 0.2s;
}
.alert-close:hover { opacity: 1; }

@keyframes slideIn {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }

/* Export Modal Refined */
.format-intro { font-size: 0.9rem; color: #64748b; margin-bottom: 20px; line-height: 1.5; }
.format-grid { display: flex; flex-direction: column; gap: 12px; }
.format-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
}
.format-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #64748b;
  flex-shrink: 0;
  transition: all 0.3s;
}
.format-icon svg { width: 22px; height: 22px; }
.format-info h3 { font-size: 0.95rem; font-weight: 700; margin: 0 0 2px 0; color: #1e293b; }
.format-info p { font-size: 0.75rem; color: #94a3b8; margin: 0; }

.format-card:hover {
  border-color: #cbd5e1;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.format-card.excel:hover { border-color: #39a900; background: #f0fdf4; }
.format-card.excel:hover .format-icon { background: #39a900; color: #fff; }

.format-card.pdf:hover { border-color: #ef4444; background: #fef2f2; }
.format-card.pdf:hover .format-icon { background: #ef4444; color: #fff; }

.format-card.text:hover { border-color: #3b82f6; background: #eff6ff; }
.format-card.text:hover .format-icon { background: #3b82f6; color: #fff; }

.btn-danger:hover { background: #b91c1c; }

/* Dashboard Grid */
.dashboard-grid { display: flex; flex-direction: column; gap: 24px; margin-bottom: 24px; }

.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }

/* States cards (Processing, Success, Error) */
.card-header-sm { display: flex; justify-content: space-between; margin-bottom: 8px; }
.status-label { font-size: 0.65rem; font-weight: 800; color: #39a900; }
.progress-bar { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: #39a900; transition: width 0.3s ease; }
.progress-fill.indeterminate { width: 40%; animation: indeterminate 1.2s ease-in-out infinite; }
@keyframes indeterminate { 0% { margin-left: 0; } 50% { margin-left: 60%; } 100% { margin-left: 0; } }

.success-import-card { border-left: 4px solid #39a900; }
.success-icon { background: #39a900; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }
.success-text { color: #39a900 !important; font-weight: 700; }

.error-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.error-icon { background: #ef4444; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; }
.error-info-text h3 { font-size: 0.9rem; margin: 0; }
.error-info-text p { font-size: 0.7rem; color: #ef4444; font-weight: 700; margin: 0; }

.error-items { display: flex; flex-direction: column; gap: 8px; }
.error-detail-pill { background: #fff; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; padding: 8px; border-radius: 8px; display: flex; gap: 12px; }
.error-code { font-weight: 800; color: #f97316; font-size: 0.75rem; }
.error-txt strong { display: block; font-size: 0.75rem; }
.error-txt p { font-size: 0.65rem; color: #64748b; margin: 0; }
.btn-clear-errors { margin-top: 8px; background: none; border: none; color: #94a3b8; font-size: 0.75rem; font-weight: 600; cursor: pointer; text-decoration: underline; }
.btn-clear-errors:hover { color: #64748b; }

/* Loading */
.table-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; gap: 16px; color: #94a3b8; }
.spin-ring-lg { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #39a900; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Table Section */
.main-table-card { padding: 0; }
.table-header { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.table-search { width: 40%; }
.filter-tabs { display: flex; gap: 8px; }
.filter-btn { background: transparent; border: 1px solid transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: #64748b; cursor: pointer; transition: 0.2s; }
.filter-btn:hover { background: #f1f5f9; color: #0f172a; }
.filter-btn.active { background: #f0fdf4; color: #39a900; border-color: #bbf7d0; }

.user-table { width: 100%; border-collapse: collapse; }
.user-table th { background: #f8fafc; text-align: left; padding: 12px 16px; font-size: 0.7rem; color: #64748b; text-transform: uppercase; }
.user-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
.empty-state { text-align: center; padding: 24px !important; color: #94a3b8; font-weight: 500; font-style: italic; }

.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 0.75rem; }
.bg-green { background: #39a900; }
.bg-pink { background: #db2777; }
.bg-blue { background: #3b82f6; }
.bg-orange { background: #f97316; }
.u-name { font-weight: 700; margin: 0; }
.u-email { font-size: 0.75rem; color: #94a3b8; margin: 0; }
.role-badge { font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 4px; }
.role-badge.admin { background: #dcfce7; color: #15803d; }
.role-badge.instructor { background: #fce7f3; color: #9d174d; }
.role-badge.aprendiz { background: #e0f2fe; color: #0369a1; }
.role-badge.empresa { background: #fff7ed; color: #c2410c; }
.status-dot { width: 8px; height: 8px; background: #94a3b8; border-radius: 50%; display: inline-block; }
.status-dot.active { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
.table-footer { padding: 12px 16px; font-size: 0.75rem; color: #64748b; display: flex; justify-content: space-between; align-items: center; }
.pagination { display: flex; gap: 4px; }
.page-btn { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; font-weight: 600; font-size: 0.75rem; transition: 0.2s; }
.page-btn:hover:not(:disabled) { border-color: #cbd5e1; background: #f8fafc; }
.page-btn.active { background: #39a900; color: #fff; border-color: #39a900; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Action Buttons */
.action-btns { display: flex; gap: 6px; }
.act-btn { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
.act-btn svg { width: 14px; height: 14px; }
.act-btn.edit { color: #3b82f6; }
.act-btn.edit:hover { background: #eff6ff; border-color: #93c5fd; }
.act-btn.delete { color: #ef4444; }
.act-btn.delete:hover { background: #fef2f2; border-color: #fca5a5; }

/* Stats Row */
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.stat-box { background: #fff; padding: 16px 20px; border-radius: 12px; border-left: 4px solid; border-bottom: 1px solid #e2e8f0; }
.border-green { border-left-color: #39a900; }
.border-pink { border-left-color: #db2777; }
.border-dark { border-left-color: #1e293b; }
.stat-box p { font-size: 0.7rem; font-weight: 800; color: #64748b; margin-bottom: 8px; }
.stat-box h2 { font-size: 1.8rem; margin: 0; font-weight: 800; }
.stat-box small { font-size: 0.7rem; color: #22c55e; font-weight: 600; }

/* ═══ Modales ═══ */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-card {
  background: #fff; border-radius: 16px; width: 480px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
}
.modal-sm { width: 400px; }
.modal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
}
.modal-head h2 { font-size: 1.1rem; font-weight: 800; margin: 0; }
.modal-close { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; line-height: 1; }
.modal-close:hover { color: #475569; }
.modal-body { padding: 24px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; }

.field-sm { margin-bottom: 16px; }
.field-sm label { display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 6px; }
.field-sm input, .field-sm select {
  width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 0.85rem; outline: none; transition: 0.2s; background: #f8fafc;
  box-sizing: border-box;
}
.field-sm input:focus, .field-sm select:focus { border-color: #39a900; background: #fff; box-shadow: 0 0 0 3px rgba(57,169,0,0.1); }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.btn-cancel { background: #f1f5f9; color: #475569; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #e2e8f0; }

.delete-warning { font-size: 0.9rem; margin-bottom: 4px; }
.delete-sub { font-size: 0.75rem; color: #ef4444; }

.error-msg { color: #dc2626; font-size: 0.8rem; background: #fef2f2; padding: 8px 12px; border-radius: 6px; margin-top: 8px; }
.success-msg { color: #166534; font-size: 0.8rem; background: #f0fdf4; padding: 8px 12px; border-radius: 6px; margin-top: 8px; }
</style>
