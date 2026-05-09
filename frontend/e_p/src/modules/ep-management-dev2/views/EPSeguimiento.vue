<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../../core/store/auth.store'
import { epService } from '../services/ep.service'

const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.user || { name: 'Usuario', role: 'Invitado' })
const stage = ref(null)
const bitacoras = ref([])
const loading = ref(true)
const error = ref(null)

// --- SISTEMA DE NOTIFICACIONES PREMIUM ---
const notifications = ref([])
const showModal = ref(false)
const modalConfig = ref({ title: '', message: '', type: 'info', callback: null, showInput: false, inputValue: '' })

const notify = (text, type = 'success') => {
  const id = Date.now()
  notifications.value.push({ id, text, type })
  setTimeout(() => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }, 4000)
}

const openDialog = (title, message, type = 'info', callback = null, showInput = false) => {
  modalConfig.value = { title, message, type, callback, showInput, inputValue: '' }
  showModal.value = true
}

const closeDialog = (confirm = false) => {
  if (confirm && modalConfig.value.callback) {
    modalConfig.value.callback(modalConfig.value.inputValue || true)
  }
  showModal.value = false
}

// --- LÓGICA DE NEGOCIO ---
const steps = [
  { label: 'Registro', icon: 'app_registration', key: 'REGISTRO' },
  { label: 'Validación', icon: 'verified', key: 'VALIDACION' },
  { label: 'En Progreso', icon: 'work', key: 'EN_PROGRESO' },
  { label: 'Revisión', icon: 'edit_note', key: 'REVISION' },
  { label: 'Evaluación', icon: 'assignment', key: 'EVALUACION' },
  { label: 'Certificación', icon: 'workspace_premium', key: 'CERTIFICACION' }
]

const currentStepIdx = computed(() => {
  if (!stage.value) return 0
  const estado = stage.value.estado || 'REGISTRO'
  const idx = steps.findIndex(s => s.key === estado)
  return idx !== -1 ? idx : 0
})

const stats = computed(() => {
  const aprobadas = bitacoras.value.filter(b => b.estado === 'APROBADA').length
  const pendientes = bitacoras.value.filter(b => b.estado === 'PENDIENTE' || b.estado === 'REVISION' || b.estado === 'EN REVISIÓN').length
  return { aprobadas, pendientes }
})

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await epService.getAll()
    const stages = res.data?.data || []
    if (stages.length > 0) {
      stage.value = stages[0]
      const bRes = await epService.getBitacorasByStage(stage.value._id)
      bitacoras.value = bRes.data?.data || []
    }
  } catch (err) {
    notify('Error al sincronizar con el servidor', 'error')
    error.value = 'No se pudo sincronizar con el servidor.'
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  openDialog('Cerrar Sesión', '¿Estás seguro de que deseas salir del sistema?', 'warning', () => {
    authStore.logout()
    router.push('/login')
  })
}

const downloadReport = () => {
  notify('Generando Reporte Técnico...', 'success')
  setTimeout(() => window.print(), 1000)
}

const uploadFile = () => {
  openDialog('Subir Documento', 'Selecciona el tipo de archivo que deseas cargar al sistema de seguimiento.', 'info', () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) notify(`Archivo "${file.name}" cargado exitosamente.`, 'success')
    }
    input.click()
  })
}

const sendMessage = () => {
  openDialog('Nuevo Mensaje', 'Escribe el mensaje que deseas enviar al instructor encargado:', 'info', (msg) => {
    if (msg && msg !== true) notify('Mensaje enviado correctamente al instructor.', 'success')
  }, true)
}

const openBitacora = (b) => {
  openDialog(`Bitácora Semana ${b.semana}`, b.descripcion || 'No se registraron observaciones detalladas para esta quincena.', 'info')
}

onMounted(loadData)
</script>

<template>
  <div class="repfora-dashboard">
    <!-- BARRA LATERAL -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-icon"><span class="material-symbols-outlined">school</span></div>
        <div class="logo-text">
          <span class="title">Administración Académica</span>
          <span class="subtitle">DIVISIÓN REGIONAL</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <router-link to="/mi-ep" custom v-slot="{ navigate, isActive }">
          <button @click="navigate" :class="['nav-item', { active: isActive }]">
            <span class="material-symbols-outlined">grid_view</span> Mi Etapa Productiva
          </button>
        </router-link>
        <router-link to="/registro-ep" custom v-slot="{ navigate, isActive }">
          <button @click="navigate" :class="['nav-item', { active: isActive }]">
            <span class="material-symbols-outlined">app_registration</span> Formalizar EP
          </button>
        </router-link>
        <router-link to="/seguimiento-ep" custom v-slot="{ navigate, isActive }">
          <button @click="navigate" :class="['nav-item', { active: isActive }]">
            <span class="material-symbols-outlined">assessment</span> Seguimientos Técnicos
          </button>
        </router-link>
        <router-link to="/certificacion" custom v-slot="{ navigate, isActive }">
          <button @click="navigate" :class="['nav-item', { active: isActive }]">
            <span class="material-symbols-outlined">workspace_premium</span> Certificación Final
          </button>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button @click="handleLogout" class="nav-item logout-btn">
          <span class="material-symbols-outlined">logout</span> Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- CONTENIDO -->
    <div class="main-wrapper">
      <header class="topbar">
        <h2 class="page-title">Seguimiento de Aprendiz</h2>
        <div class="topbar-actions">
          <button class="btn-new" style="background:#1A4D2E" @click="downloadReport">
            <span class="material-symbols-outlined">download</span> Descargar Reporte
          </button>
          <div class="divider"></div>
          <span class="material-symbols-outlined notification" @click="notify('Sincronización en tiempo real activa.', 'info')">notifications</span>
          <div class="user-profile">
            <span class="user-name">{{ currentUser.name }}</span>
            <div class="user-avatar">
              <img :src="`https://ui-avatars.com/api/?name=${currentUser.name}&background=2e7d32&color=fff`" alt="Avatar">
            </div>
          </div>
        </div>
      </header>

      <main class="content">
        <!-- Subtítulo de Monitoreo -->
        <div class="monitoring-subtitle">
          <p>Monitoreo detallado del progreso para: <span class="highlight">{{ stage?.apprenticeId?.name || currentUser.name }}</span></p>
        </div>

        <div v-if="error" class="error-banner">
          <span class="material-symbols-outlined">warning</span>
          {{ error }}
          <button @click="loadData">Reintentar</button>
        </div>

        <div class="tracking-grid">
          
          <!-- COLUMNA PRINCIPAL -->
          <div class="main-col">
            
            <!-- FLUJO DE PROCESO -->
            <section class="card stepper-card">
              <div class="card-top">
                <div class="header-label">
                  <span class="material-symbols-outlined icon-green">account_tree</span>
                  <span class="label-text">FLUJO DE PROCESO</span>
                </div>
                <div class="status-badge-inline">
                  <span class="dot"></span>
                  <span class="status-txt">ESTADO ACTUAL: <span class="bold">{{ stage?.estado || 'REGISTRO' }}</span></span>
                </div>
              </div>

              <div class="stepper-container">
                <div class="stepper-bg-line"></div>
                <div class="stepper-active-line" :style="{ width: (currentStepIdx / (steps.length - 1)) * 100 + '%' }"></div>
                <div v-for="(step, idx) in steps" :key="step.label" class="step-point" :class="{ completed: idx < currentStepIdx, active: idx === currentStepIdx }">
                  <div class="point-circle" :title="step.label">
                    <span class="material-symbols-outlined">{{ idx < currentStepIdx ? 'check' : step.icon }}</span>
                  </div>
                  <span class="point-label">{{ step.label }}</span>
                </div>
              </div>
            </section>

            <!-- INFORMACIÓN DE LA EMPRESA -->
            <section class="card company-card">
              <div class="card-top">
                <div class="header-label">
                  <span class="material-symbols-outlined icon-green">domain</span>
                  <span class="label-text">INFORMACIÓN DE LA EMPRESA</span>
                </div>
                <div class="company-mini-logo">
                  <img :src="`https://ui-avatars.com/api/?name=${stage?.companyId?.razonSocial || 'EP'}&background=F8FAFC&color=1A4D2E&bold=true`" alt="Logo">
                </div>
              </div>

              <div class="info-details-grid">
                <div class="info-item">
                  <label>Razón Social</label>
                  <p>{{ stage?.companyId?.razonSocial || stage?.companySnapshot?.razonSocial || '---' }}</p>
                </div>
                <div class="info-item">
                  <label>Email de Contacto</label>
                  <p>{{ stage?.companySnapshot?.emailContacto || '---' }}</p>
                </div>
                <div class="info-item">
                  <label>NIT</label>
                  <p>{{ stage?.companyId?.nit || stage?.companySnapshot?.nit || '---' }}</p>
                </div>
                <div class="info-item">
                  <label>Ubicación</label>
                  <p>{{ stage?.companySnapshot?.ubicacion || '---' }}</p>
                </div>
                <div class="info-item">
                  <label>Jefe Inmediato</label>
                  <p>{{ stage?.companySnapshot?.jefeInmediato || '---' }}</p>
                </div>
                <div class="info-item">
                  <label>Modalidad</label>
                  <div class="modal-tag">
                    <span class="tag-dot"></span>
                    <p>{{ stage?.modalidad || '---' }}</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- SEGUIMIENTO DE BITÁCORAS -->
            <section class="card table-card">
              <div class="card-top no-border">
                <span class="label-text">Seguimiento de Bitácoras</span>
                <div class="stats-group">
                  <span class="stat-pill success">{{ stats.aprobadas }} APROBADAS</span>
                  <span class="stat-pill danger">{{ stats.pendientes }} PENDIENTES</span>
                </div>
              </div>

              <div class="table-scroller">
                <table class="dashboard-table">
                  <thead>
                    <tr>
                      <th>BITÁCORA</th>
                      <th>PERIODO / SEMANA</th>
                      <th class="center">ESTADO</th>
                      <th class="right">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="bitacoras.length === 0">
                      <td colspan="4" class="empty-row">No hay bitácoras registradas para este aprendiz.</td>
                    </tr>
                    <tr v-for="b in bitacoras" :key="b._id">
                      <td class="bold">Bitácora #{{ b.semana }}</td>
                      <td class="faded">{{ b.periodo || 'Semana ' + b.semana }}</td>
                      <td class="center">
                        <span class="status-chip" :class="b.estado.toLowerCase().replace(' ', '-')">
                          {{ b.estado }}
                        </span>
                      </td>
                      <td class="right">
                        <button class="icon-btn" @click="openBitacora(b)">
                          <span class="material-symbols-outlined">visibility</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <!-- COLUMNA LATERAL -->
          <div class="side-col">
            
            <!-- FECHAS CRÍTICAS -->
            <section class="card side-card">
              <div class="card-top">
                <div class="header-label">
                  <span class="material-symbols-outlined icon-green">event_available</span>
                  <span class="label-text">FECHAS CRÍTICAS</span>
                </div>
              </div>

              <div class="critical-dates-list">
                <div class="date-box green">
                  <label>Inicio Etapa</label>
                  <p>{{ stage?.fechaInicio ? new Date(stage.fechaInicio).toLocaleDateString() : 'Pendiente' }}</p>
                </div>
                <div class="date-box red">
                  <div class="date-main">
                    <label>Próxima Bitácora</label>
                    <p>En 2 días</p>
                  </div>
                  <span class="days-pill">30 May</span>
                </div>
                <div class="date-box gray">
                  <label>Finalización</label>
                  <p>{{ stage?.fechaFin ? new Date(stage.fechaFin).toLocaleDateString() : 'Pendiente' }}</p>
                </div>
              </div>
            </section>

            <!-- ACCIONES RÁPIDAS -->
            <section class="card side-card bg-gray">
              <span class="label-text centered">Acciones Rápidas</span>
              <div class="actions-grid">
                <button class="action-tile" @click="uploadFile">
                  <div class="tile-icon green"><span class="material-symbols-outlined">upload</span></div>
                  <span class="tile-text">Subir Archivo</span>
                </button>
                <button class="action-tile" @click="sendMessage">
                  <div class="tile-icon gray"><span class="material-symbols-outlined">mail</span></div>
                  <span class="tile-text">Mensaje</span>
                </button>
              </div>
            </section>

            <!-- Floating Chat -->
            <div class="fab-wrapper">
              <button class="fab" @click="sendMessage">
                <span class="material-symbols-outlined">chat_bubble</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Sincronizando información...</p>
      </div>
    </div>

    <!-- --- NOTIFICACIONES (TOASTS) --- -->
    <div class="notification-center">
      <TransitionGroup name="toast">
        <div v-for="n in notifications" :key="n.id" class="toast-card" :class="n.type">
          <span class="material-symbols-outlined toast-icon">
            {{ n.type === 'success' ? 'check_circle' : n.type === 'error' ? 'error' : 'info' }}
          </span>
          <span class="toast-text">{{ n.text }}</span>
        </div>
      </TransitionGroup>
    </div>

    <!-- --- MODAL / DIALOG PREMIUM --- -->
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeDialog(false)">
        <div class="modal-content" :class="modalConfig.type">
          <div class="modal-header">
            <div class="modal-icon-wrapper">
              <span class="material-symbols-outlined">{{ modalConfig.type === 'warning' ? 'warning' : modalConfig.type === 'error' ? 'error' : 'info' }}</span>
            </div>
            <h3 class="modal-title">{{ modalConfig.title }}</h3> 
          </div>
          <div class="modal-body">
            <p class="modal-message">{{ modalConfig.message }}</p>
            <div v-if="modalConfig.showInput" class="modal-input-group">
              <textarea v-model="modalConfig.inputValue" placeholder="Escribe aquí tu mensaje..." class="custom-textarea"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="modal-btn btn-cancel" @click="closeDialog(false)">Cancelar</button>
            <button class="modal-btn btn-confirm" @click="closeDialog(true)">Confirmar</button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined');

/* --- LAYOUT DEL DASHBOARD --- */
.repfora-dashboard {
  display: flex;
  min-height: 100vh;
  background: #F4F7F6;
  font-family: 'Inter', sans-serif;
  color: #334155;
  overflow: hidden;
  width: 100%;
}

/* --- SIDEBAR --- */
.sidebar {
  width: 230px;
  background: #FFFFFF;
  border-right: 1px solid #F1F5F9;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: #1A4D2E;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFF;
  flex-shrink: 0;
}

.logo-text .title {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: #0F172A;
  line-height: 1;
}

.logo-text .subtitle {
  font-size: 9px;
  font-weight: 700;
  color: #94A3B8;
  letter-spacing: 1px;
}

.sidebar-nav {
  padding: 0 16px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #94A3B8;
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.2s;
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
  text-align: left;
}

.nav-item:hover { color: #334155; background: #F8FAFC; }
.nav-item.active {
  color: #1A4D2E;
  background: #F0FDF4;
  border-left: 4px solid #1A4D2E;
  border-radius: 4px 12px 12px 4px;
}

.sidebar-footer { padding: 24px 16px; border-top: 1px solid #F1F5F9; display: flex; flex-direction: column; gap: 12px; }
.btn-new-visit-sidebar {
  width: 100%;
  background: #1A4D2E;
  color: #FFF;
  border: none;
  padding: 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  margin-bottom: 8px;
}

.logout-btn:hover { color: #EF4444; }

/* --- MAIN CONTENT --- */
.main-wrapper {
  flex: 1;
  margin-left: 230px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  min-width: 0;
}

.topbar {
  height: 64px;
  background: #FFF;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 90;
  flex-shrink: 0;
}

.page-title { font-size: 20px; font-weight: 800; color: #1E293B; }
.topbar-actions { display: flex; align-items: center; gap: 20px; }

.btn-new {
  color: #FFF;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(26, 77, 46, 0.15);
}

.divider { width: 1px; height: 32px; background: #F1F5F9; }
.notification { color: #94A3B8; cursor: pointer; }

.user-profile { display: flex; align-items: center; gap: 12px; }
.user-name { font-size: 12px; font-weight: 800; color: #1E293B; }
.user-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid #F1F5F9; }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* --- SEGUIMIENTO CONTENT AREA --- */
.content { padding: 24px; max-width: 1400px; width: 100%; box-sizing: border-box; }

.monitoring-subtitle { margin-bottom: 24px; }
.monitoring-subtitle p { font-size: 13px; color: #64748B; font-weight: 500; margin: 0; }
.monitoring-subtitle .highlight { color: #1A4D2E; font-weight: 800; }

.error-banner { background: #FFF1F2; color: #E11D48; padding: 12px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.error-banner button { background: #E11D48; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 11px; margin-left: auto; }

.tracking-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }

@media (max-width: 1200px) {
  .tracking-grid { grid-template-columns: 1fr; }
}

.main-col, .side-col { display: flex; flex-direction: column; gap: 20px; }

/* --- CARDS --- */
.card {
  background: #FFF;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid #F1F5F9;
  box-shadow: 0 2px 10px rgba(0,0,0,0.01);
}

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.card-top.no-border { margin-bottom: 16px; }

.header-label { display: flex; align-items: center; gap: 10px; }
.icon-green { color: #1A4D2E; font-size: 20px; }
.label-text { font-size: 11px; font-weight: 900; color: #94A3B8; letter-spacing: 1px; text-transform: uppercase; }
.label-text.centered { text-align: center; display: block; width: 100%; }

/* Stepper inside Card */
.status-badge-inline { display: flex; align-items: center; gap: 8px; }
.status-badge-inline .dot { width: 6px; height: 6px; border-radius: 50%; background: #1A4D2E; }
.status-badge-inline .status-txt { font-size: 10px; font-weight: 900; color: #64748B; }
.status-badge-inline .bold { color: #1A4D2E; }

.stepper-container { position: relative; display: flex; justify-content: space-between; align-items: center; padding: 10px 0 20px; }
.stepper-bg-line { position: absolute; top: 18px; left: 10px; right: 10px; height: 2px; background: #F1F5F9; z-index: 0; }
.stepper-active-line { position: absolute; top: 18px; left: 10px; height: 2px; background: #1A4D2E; z-index: 0; transition: width 1s; }

.step-point { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; width: 60px; }
.point-circle { width: 36px; height: 36px; border-radius: 10px; background: #FFF; border: 2px solid #F1F5F9; display: flex; align-items: center; justify-content: center; color: #CBD5E1; transition: all 0.3s; cursor: help; }
.step-point.completed .point-circle { background: #1A4D2E; border-color: #1A4D2E; color: #FFF; }
.step-point.active .point-circle { border-color: #1A4D2E; color: #1A4D2E; box-shadow: 0 0 0 4px #F0FDF4; }

.point-label { font-size: 8px; font-weight: 900; color: #CBD5E1; margin-top: 12px; text-align: center; white-space: nowrap; }
.step-point.completed .point-label, .step-point.active .point-label { color: #1A4D2E; }

/* Company Info Grid */
.company-mini-logo { width: 40px; height: 40px; background: #F8FAFC; border-radius: 10px; border: 1px solid #F1F5F9; overflow: hidden; }
.company-mini-logo img { width: 100%; height: 100%; object-fit: cover; }

.info-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.info-item { background: #F8FAFC; padding: 12px 16px; border-radius: 12px; border: 1px solid #F1F5F9; }
.info-item label { display: block; font-size: 9px; font-weight: 900; color: #94A3B8; margin-bottom: 4px; }
.info-item p { font-size: 13px; font-weight: 700; color: #1E293B; margin: 0; }
.modal-tag { display: flex; align-items: center; gap: 6px; }
.tag-dot { width: 6px; height: 6px; border-radius: 50%; background: #16A34A; }

/* Table inside Card */
.table-card { padding: 0; overflow: hidden; }
.table-card .card-top { padding: 24px 24px 0; }
.table-scroller { width: 100%; overflow-x: auto; }
.empty-row { text-align: center; padding: 40px !important; color: #94A3B8; font-size: 13px; font-weight: 500; }

.stats-group { display: flex; gap: 10px; }
.stat-pill { font-size: 9px; font-weight: 900; padding: 4px 10px; border-radius: 20px; }
.stat-pill.success { background: #F0FDF4; color: #16A34A; }
.stat-pill.danger { background: #FFF1F2; color: #E11D48; }

.dashboard-table { width: 100%; border-collapse: collapse; min-width: 600px; }
.dashboard-table th { background: #F8FAFC; padding: 12px 24px; text-align: left; font-size: 10px; font-weight: 900; color: #94A3B8; letter-spacing: 1px; }
.dashboard-table td { padding: 16px 24px; border-top: 1px solid #F1F5F9; font-size: 13px; }
.dashboard-table .bold { font-weight: 700; color: #1E293B; }
.dashboard-table .faded { color: #64748B; font-weight: 500; font-size: 12px; }
.dashboard-table .center { text-align: center; }
.dashboard-table .right { text-align: right; }

.status-chip { font-size: 9px; font-weight: 900; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
.status-chip.aprobada { background: #F0FDF4; color: #16A34A; }
.status-chip.en-revisión, .status-chip.revision, .status-chip.revision { background: #FFF1F2; color: #E11D48; }
.status-chip.pendiente { background: #F1F5F9; color: #94A3B8; }

.icon-btn { background: none; border: none; color: #CBD5E1; cursor: pointer; padding: 6px; border-radius: 8px; transition: all 0.2s; }
.icon-btn:hover { background: #F8FAFC; color: #1A4D2E; }

/* Side Column Cards */
.critical-dates-list { display: flex; flex-direction: column; gap: 12px; }
.date-box { padding: 14px 16px; border-radius: 12px; border-left: 4px solid #CBD5E1; background: #F8FAFC; display: flex; justify-content: space-between; align-items: center; }
.date-box.green { border-left-color: #16A34A; }
.date-box.red { border-left-color: #E11D48; }

.date-box label { font-size: 9px; font-weight: 900; color: #94A3B8; display: block; margin-bottom: 2px; }
.date-box p { font-size: 13px; font-weight: 800; color: #1E293B; margin: 0; }
.days-pill { font-size: 8px; font-weight: 900; background: #FFE4E6; color: #E11D48; padding: 2px 6px; border-radius: 4px; }

.bg-gray { background: #F8FAFC; }
.actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
.action-tile { background: #FFF; padding: 20px; border-radius: 16px; border: 1px solid transparent; display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s; width: 100%; }
.action-tile:hover { border-color: #F1F5F9; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }

.tile-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.tile-icon.green { background: #F0FDF4; color: #16A34A; }
.tile-icon.gray { background: #F8FAFC; color: #64748B; }
.action-tile:hover .tile-icon.green { background: #16A34A; color: #FFF; }
.action-tile:hover .tile-icon.gray { background: #1E293B; color: #FFF; }

.tile-text { font-size: 9px; font-weight: 900; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }

/* Floating FAB */
.fab-wrapper { display: flex; justify-content: flex-end; padding-top: 10px; }
.fab { width: 48px; height: 48px; background: #1A4D2E; color: #FFF; border-radius: 12px; border: none; cursor: pointer; box-shadow: 0 10px 20px rgba(26, 77, 46, 0.2); transition: transform 0.2s; }
.fab:hover { transform: scale(1.1); }

/* --- NOTIFICACIONES (TOASTS) --- */
.notification-center {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast-card {
  pointer-events: auto;
  background: #FFF;
  padding: 14px 20px;
  border-radius: 16px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  border-left: 6px solid #1A4D2E;
  position: relative;
  overflow: hidden;
}

.toast-card.success { border-left-color: #16A34A; }
.toast-card.error { border-left-color: #EF4444; }
.toast-card.info { border-left-color: #3B82F6; }

.toast-icon { font-size: 22px; }
.success .toast-icon { color: #16A34A; }
.error .toast-icon { color: #EF4444; }
.info .toast-icon { color: #3B82F6; }

.toast-text { font-size: 13px; font-weight: 700; color: #1E293B; }

.toast-enter-active, .toast-leave-active { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.toast-enter-from { opacity: 0; transform: translateX(50px) scale(0.9); }
.toast-leave-to { opacity: 0; transform: scale(0.8) translateY(-20px); }

/* --- MODAL (DIALOGS) --- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(8px);
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  background: #FFF;
  width: 100%;
  max-width: 440px;
  border-radius: 28px;
  box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  padding: 32px 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}

.modal-icon-wrapper {
  width: 64px;
  height: 64px;
  background: #F0FDF4;
  color: #16A34A;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning .modal-icon-wrapper { background: #FFF7ED; color: #EA580C; }

.modal-icon-wrapper span { font-size: 32px; }

.modal-title { font-size: 22px; font-weight: 800; color: #1E293B; margin: 0; letter-spacing: -0.02em; }

.modal-body { padding: 0 32px 32px; text-align: center; }
.modal-message { font-size: 14px; color: #64748B; line-height: 1.6; margin: 0; font-weight: 500; }

.modal-input-group { margin-top: 24px; }
.custom-textarea {
  width: 100%;
  border: 2px solid #F1F5F9;
  border-radius: 18px;
  padding: 16px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  height: 120px;
  outline: none;
  transition: all 0.2s;
  background: #F8FAFC;
}
.custom-textarea:focus { border-color: #1A4D2E; background: #FFF; box-shadow: 0 0 0 4px rgba(26, 77, 46, 0.05); }

.modal-footer {
  padding: 16px 32px 32px;
  display: flex;
  gap: 12px;
}

.modal-btn {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel { background: #F1F5F9; color: #475569; }
.btn-cancel:hover { background: #E2E8F0; }

.btn-confirm { background: #1A4D2E; color: #FFF; }
.btn-confirm:hover { background: #143B23; transform: translateY(-1px); }

.fade-enter-active, .fade-leave-active { transition: all 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(1.05); }

/* Utility Overrides */
.material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
</style>
