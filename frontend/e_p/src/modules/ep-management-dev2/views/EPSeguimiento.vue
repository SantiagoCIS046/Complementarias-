<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../../core/store/auth.store'
import { useThemeStore } from '../../../core/store/theme.store'
import { epService } from '../services/ep.service'
import { trackingService } from '../../operation-tracking-dev3/services/tracking.service'
import Sidebar from '../../../components/layout/Sidebar.vue'
import Header from '../../../components/layout/Header.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const currentUser = computed(() => authStore.user || { name: 'Usuario', role: 'Invitado' })
const stage = ref(null)
const bitacoras = ref([])
const trackings = ref([])
const cupo = ref({ maxSeguimientos: 3, nivelFormacion: 'Tecnólogo' })
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
      
      const tRes = await trackingService.getAllTrackings({ stageId: stage.value._id })
      trackings.value = tRes.data?.data || []
      if (tRes.data?.cupo) {
        cupo.value = tRes.data.cupo
      }
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
  openChatDrawer()
}

// --- OBSERVACIONES CHAT DRAWER (RF-INS-30) ---
const showChatDrawer = ref(false)
const chatMessageText = ref('')
const isSendingChatMessage = ref(false)

const openChatDrawer = () => {
  showChatDrawer.value = true
}

const closeChatDrawer = () => {
  showChatDrawer.value = false
}

const sendChatMessage = async () => {
  if (!chatMessageText.value || chatMessageText.value.trim() === '') return
  if (!stage.value) return

  isSendingChatMessage.value = true
  try {
    const res = await epService.agregarMensajeChat(stage.value._id, {
      remitente: 'Aprendiz',
      texto: chatMessageText.value.trim()
    })
    
    // Recargar datos para ver el mensaje de inmediato
    await loadData()
    chatMessageText.value = ''
    notify('Mensaje enviado al chat de observaciones.', 'success')
  } catch (err) {
    console.error('Error al enviar mensaje de chat:', err)
    notify('Error al enviar el mensaje al servidor.', 'error')
  } finally {
    isSendingChatMessage.value = false
  }
}

const openBitacora = (b) => {
  openDialog(`Bitácora Semana ${b.semana}`, b.descripcion || 'No se registraron observaciones detalladas para esta quincena.', 'info')
}

onMounted(async () => {
  await loadData()
  if (route.query.openChat === 'true') {
    showChatDrawer.value = true
  }
})
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header title="Seguimiento de Aprendiz">
        <template #actions>
          <div class="desktop-actions-only">
            <button class="btn-new" @click="downloadReport">
              <span class="material-symbols-outlined">download</span> Descargar Reporte
            </button>
          </div>
        </template>
      </Header>

      <main class="content">
        <!-- ACCIONES MÓVILES (visibles solo en celulares/tablets) -->
        <div class="mobile-actions-bar">
          <button class="btn-new" @click="downloadReport" style="flex: 1; justify-content: center;">
            <span class="material-symbols-outlined">download</span> Descargar Reporte
          </button>
        </div>

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
                  <img :src="`https://ui-avatars.com/api/?name=${stage?.companyId?.razonSocial || 'EP'}&background=${themeStore.isDark ? '1f2937' : 'F8FAFC'}&color=${themeStore.isDark ? 'f3f4f6' : '1A4D2E'}&bold=true`" alt="Logo">
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

            <!-- VISITAS DE SEGUIMIENTO OBLIGATORIO (RF-INS-08) -->
            <section class="card table-card" style="margin-top: 24px;">
              <div class="card-top no-border" style="padding: 24px 24px 0;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined icon-green" style="color: #2563eb;">assignment_turned_in</span>
                  <span class="label-text" style="color: #2563eb; font-weight: bold;">Visitas de Seguimiento Técnico (AI-Validated)</span>
                </div>
                <div class="stats-group">
                  <span class="stat-pill success" style="background: #eff6ff; color: #2563eb; font-weight: 800;">
                    {{ trackings.filter(t => !t.esExtraordinario).length }} de {{ cupo.maxSeguimientos }} completados
                  </span>
                </div>
              </div>

              <!-- Barra de progreso inteligente -->
              <div style="padding: 8px 24px 16px;">
                <div class="mini-bar" style="height: 6px; background: var(--bg-secondary); border-radius: 10px; overflow: hidden; width: 100%;">
                  <div class="mini-fill" :style="{ width: (Math.min(trackings.filter(t => !t.esExtraordinario).length, cupo.maxSeguimientos) / cupo.maxSeguimientos) * 100 + '%', backgroundColor: '#2563eb' }" style="height: 100%; border-radius: 10px; transition: width 0.4s ease;"></div>
                </div>
              </div>

              <div class="table-scroller">
                <table class="dashboard-table">
                  <thead>
                    <tr>
                      <th>VISITA</th>
                      <th>FECHA / LUGAR</th>
                      <th>CALIFICACIÓN</th>
                      <th class="right">ACTA PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="trackings.length === 0">
                      <td colspan="4" class="empty-row">No hay visitas de seguimiento registradas por el instructor.</td>
                    </tr>
                    <tr v-for="track in trackings" :key="track._id">
                      <td class="bold">
                        Visita #{{ track.numeroVisita }}
                        <span v-if="track.esExtraordinario" style="margin-left: 6px; background: rgba(37, 99, 235, 0.1); color: #2563eb; font-size: 0.55rem; font-weight: 800; padding: 2px 6px; border-radius: 20px; display: inline-flex; align-items: center; gap: 2px; vertical-align: middle;">
                          <span class="material-symbols-outlined" style="font-size: 0.65rem;">star</span> Especial
                        </span>
                      </td>
                      <td class="faded">
                        {{ new Date(track.fechaVisita).toLocaleDateString() }} 
                        <span style="display: block; font-size: 10px; color: var(--text-muted); margin-top: 2px;">{{ track.lugarVisita || 'Presencial' }}</span>
                      </td>
                      <td>
                        <span class="status-chip" :class="track.calificacion ? track.calificacion.toLowerCase() : 'pendiente'" style="background: #eff6ff; color: #2563eb; font-weight: 800;">
                          {{ track.calificacion || 'Sin calificar' }}
                        </span>
                      </td>
                      <td class="right">
                        <a v-if="track.evidenciaUrl" :href="track.evidenciaUrl" target="_blank" class="icon-btn" style="color: #2563eb; display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; text-decoration: none; font-weight: 700;">
                          <span class="material-symbols-outlined" style="font-size: 1.1rem;">download</span> Descargar
                        </a>
                        <span v-else class="text-xs text-gray-400 italic">No disponible</span>
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

    <!-- ═══ CAJÓN DE OBSERVACIONES FLOW CHAT (RF-INS-30) ═══ -->
    <Transition name="drawer">
      <div v-if="showChatDrawer" class="chat-drawer-backdrop" @click="closeChatDrawer">
        <div class="chat-drawer-content" @click.stop>
          <div class="chat-drawer-header">
            <div class="chat-drawer-title">
              <span class="material-symbols-outlined chat-title-icon">forum</span>
              <div>
                <h3>Observaciones del Flujo</h3>
                <p>Chat de seguimiento y aclaraciones generales</p>
              </div>
            </div>
            <button class="chat-close-btn" @click="closeChatDrawer">&times;</button>
          </div>

          <!-- Feed de mensajes -->
          <div class="chat-drawer-body">
            <div v-if="!stage?.chatObservaciones || stage.chatObservaciones.length === 0" class="chat-empty-state">
              <span class="material-symbols-outlined">chat_bubble</span>
              <p>No hay mensajes en este flujo todavía.</p>
              <span class="empty-sub">Las observaciones generales del Administrador o Instructor se mostrarán aquí.</span>
            </div>
            
            <div v-else class="chat-feed-list">
              <div 
                v-for="(msg, idx) in stage.chatObservaciones" 
                :key="idx" 
                class="chat-bubble-wrapper"
                :class="msg.remitente.toLowerCase()"
              >
                <div class="chat-bubble-meta">
                  <span class="bubble-sender">{{ msg.remitente === 'ADMIN' ? 'Coordinador / Admin' : msg.remitente }}</span>
                  <span class="bubble-time">{{ new Date(msg.fecha).toLocaleString('es-CO') }}</span>
                </div>
                <div class="chat-bubble-text-box">
                  <p>{{ msg.texto }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Formulario de envío -->
          <div class="chat-drawer-footer">
            <textarea 
              v-model="chatMessageText" 
              placeholder="Escribe tu mensaje o aclaración..." 
              class="chat-input"
              rows="2"
              @keydown.enter.prevent="sendChatMessage"
            ></textarea>
            <button 
              class="btn-send-message" 
              @click="sendChatMessage" 
              :disabled="isSendingChatMessage || !chatMessageText.trim()"
            >
              <span class="material-symbols-outlined" :class="{ 'animate-spin': isSendingChatMessage }">
                {{ isSendingChatMessage ? 'sync' : 'send' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined');

/* --- Responsiveness & Actions bar --- */
.desktop-actions-only {
  display: flex;
  gap: 12px;
  align-items: center;
}

.mobile-actions-bar {
  display: none;
  width: 100%;
  gap: 12px;
  margin-bottom: 20px;
  background: var(--bg-primary);
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--border-primary);
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .desktop-actions-only {
    display: none;
  }
  .mobile-actions-bar {
    display: flex;
    flex-wrap: wrap;
  }
}

.btn-new {
  background: var(--color_button);
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

/* --- SEGUIMIENTO CONTENT AREA --- */
.content { padding: 24px; max-width: 1400px; width: 100%; box-sizing: border-box; }

.monitoring-subtitle { margin-bottom: 24px; }
.monitoring-subtitle p { font-size: 13px; color: var(--text-secondary); font-weight: 500; margin: 0; }
.monitoring-subtitle .highlight { color: var(--color_button); font-weight: 800; }

.error-banner { background: #FFF1F2; color: #E11D48; padding: 12px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.error-banner button { background: #E11D48; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 11px; margin-left: auto; }
[data-theme="dark"] .error-banner { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
[data-theme="dark"] .error-banner button { background: #ef4444; color: #fff; }

.tracking-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }

@media (max-width: 1200px) {
  .tracking-grid { grid-template-columns: 1fr; }
}

.main-col, .side-col { display: flex; flex-direction: column; gap: 20px; }

/* --- CARDS --- */
.card {
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--border-primary);
  box-shadow: 0 2px 10px rgba(0,0,0,0.01);
}

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.card-top.no-border { margin-bottom: 16px; }

.header-label { display: flex; align-items: center; gap: 10px; }
.icon-green { color: var(--color_button); font-size: 20px; }
.label-text { font-size: 11px; font-weight: 900; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; }
.label-text.centered { text-align: center; display: block; width: 100%; }

/* Stepper inside Card */
.status-badge-inline { display: flex; align-items: center; gap: 8px; }
.status-badge-inline .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color_button); }
.status-badge-inline .status-txt { font-size: 10px; font-weight: 900; color: var(--text-secondary); }
.status-badge-inline .bold { color: var(--color_button); }

.stepper-container { position: relative; display: flex; justify-content: space-between; align-items: center; padding: 10px 0 20px; }
.stepper-bg-line { position: absolute; top: 18px; left: 10px; right: 10px; height: 2px; background: var(--border-primary); z-index: 0; }
.stepper-active-line { position: absolute; top: 18px; left: 10px; height: 2px; background: var(--color_button); z-index: 0; transition: width 1s; }

.step-point { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; width: 60px; }
.point-circle { width: 36px; height: 36px; border-radius: 10px; background: var(--bg-primary); border: 2px solid var(--border-primary); display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: all 0.3s; cursor: help; }
.step-point.completed .point-circle { background: var(--color_button); border-color: var(--color_button); color: #FFF; }
.step-point.active .point-circle { border-color: var(--color_button); color: var(--color_button); box-shadow: 0 0 0 4px var(--bg-active); }

.point-label { font-size: 8px; font-weight: 900; color: var(--text-muted); margin-top: 12px; text-align: center; white-space: normal; max-width: 70px; line-height: 1.2; }
.step-point.completed .point-label, .step-point.active .point-label { color: var(--color_button); }

/* Company Info Grid */
.company-mini-logo { width: 40px; height: 40px; background: var(--bg-secondary); border-radius: 10px; border: 1px solid var(--border-primary); overflow: hidden; }
.company-mini-logo img { width: 100%; height: 100%; object-fit: cover; }

.info-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.info-item { background: var(--bg-secondary); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-primary); }
.info-item label { display: block; font-size: 9px; font-weight: 900; color: var(--text-muted); margin-bottom: 4px; }
.info-item p { font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 0; }
.modal-tag { display: flex; align-items: center; gap: 6px; }
.tag-dot { width: 6px; height: 6px; border-radius: 50%; background: #16A34A; }

/* Table inside Card */
.table-card { padding: 0; overflow: hidden; }
.table-card .card-top { padding: 24px 24px 0; }
.table-scroller { width: 100%; overflow-x: auto; }
.empty-row { text-align: center; padding: 40px !important; color: var(--text-muted); font-size: 13px; font-weight: 500; }

.stats-group { display: flex; gap: 10px; }
.stat-pill { font-size: 9px; font-weight: 900; padding: 4px 10px; border-radius: 20px; }
.stat-pill.success { background: #F0FDF4; color: #16A34A; }
.stat-pill.danger { background: #FFF1F2; color: #E11D48; }
[data-theme="dark"] .stat-pill.success { background: rgba(22, 163, 74, 0.15); color: #4ade80; }
[data-theme="dark"] .stat-pill.danger { background: rgba(225, 29, 72, 0.15); color: #fda4af; }

.dashboard-table { width: 100%; border-collapse: collapse; min-width: 600px; }
.dashboard-table th { background: var(--bg-secondary); padding: 12px 24px; text-align: left; font-size: 10px; font-weight: 900; color: var(--text-muted); letter-spacing: 1px; }
.dashboard-table td { padding: 16px 24px; border-top: 1px solid var(--border-primary); font-size: 13px; }
.dashboard-table .bold { font-weight: 700; color: var(--text-primary); }
.dashboard-table .faded { color: var(--text-secondary); font-weight: 500; font-size: 12px; }
.dashboard-table .center { text-align: center; }
.dashboard-table .right { text-align: right; }

.status-chip { font-size: 9px; font-weight: 900; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
.status-chip.aprobada { background: #F0FDF4; color: #16A34A; }
.status-chip.en-revisión, .status-chip.revision, .status-chip.revision { background: #FFF1F2; color: #E11D48; }
.status-chip.pendiente { background: var(--bg-secondary); color: var(--text-muted); }
[data-theme="dark"] .status-chip.aprobada { background: rgba(22, 163, 74, 0.15); color: #4ade80; }
[data-theme="dark"] .status-chip.en-revisión, [data-theme="dark"] .status-chip.revision { background: rgba(225, 29, 72, 0.15); color: #fda4af; }

.icon-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 6px; border-radius: 8px; transition: all 0.2s; }
.icon-btn:hover { background: var(--bg-hover); color: var(--color_button); }

/* Side Column Cards */
.critical-dates-list { display: flex; flex-direction: column; gap: 12px; }
.date-box { padding: 14px 16px; border-radius: 12px; border-left: 4px solid var(--border-primary); background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center; }
.date-box.green { border-left-color: #16A34A; }
.date-box.red { border-left-color: #E11D48; }
[data-theme="dark"] .date-box.green { border-left-color: #22c55e; }
[data-theme="dark"] .date-box.red { border-left-color: #ef4444; }

.date-box label { font-size: 9px; font-weight: 900; color: var(--text-muted); display: block; margin-bottom: 2px; }
.date-box p { font-size: 13px; font-weight: 800; color: var(--text-primary); margin: 0; }
.days-pill { font-size: 8px; font-weight: 900; background: #FFE4E6; color: #E11D48; padding: 2px 6px; border-radius: 4px; }
[data-theme="dark"] .days-pill { background: rgba(239, 68, 68, 0.2); color: #fda4af; }

.bg-gray { background: var(--bg-secondary); }
.actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
.action-tile { background: var(--bg-primary); padding: 20px; border-radius: 16px; border: 1px solid transparent; display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s; width: 100%; }
.action-tile:hover { border-color: var(--border-primary); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }

.tile-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.tile-icon.green { background: var(--bg-active); color: var(--color_button); }
.tile-icon.gray { background: var(--bg-secondary); color: var(--text-secondary); }
.action-tile:hover .tile-icon.green { background: var(--color_button); color: var(--color_text_button); }
.action-tile:hover .tile-icon.gray { background: var(--text-primary); color: var(--bg-primary); }

.tile-text { font-size: 9px; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }

/* Floating FAB */
.fab-wrapper { display: flex; justify-content: flex-end; padding-top: 10px; }
.fab { width: 48px; height: 48px; background: var(--color_button); color: #FFF; border-radius: 12px; border: none; cursor: pointer; box-shadow: 0 10px 20px rgba(26, 77, 46, 0.2); transition: transform 0.2s; }
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
  background: var(--bg-primary);
  padding: 14px 20px;
  border-radius: 16px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  border-left: 6px solid var(--color_button);
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

.toast-text { font-size: 13px; font-weight: 700; color: var(--text-primary); }

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
  background: var(--bg-elevated);
  width: 100%;
  max-width: 440px;
  border-radius: 28px;
  box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-primary);
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
  background: var(--bg-active);
  color: var(--color_button);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning .modal-icon-wrapper { background: #FFF7ED; color: #EA580C; }
[data-theme="dark"] .warning .modal-icon-wrapper { background: rgba(234, 88, 12, 0.15); color: #fdba74; }
.error .modal-icon-wrapper { background: #FFE4E6; color: #EF4444; }
[data-theme="dark"] .error .modal-icon-wrapper { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }

.modal-icon-wrapper span { font-size: 32px; }

.modal-title { font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.02em; }

.modal-body { padding: 0 32px 32px; text-align: center; }
.modal-message { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin: 0; font-weight: 500; }

.modal-input-group { margin-top: 24px; }
.custom-textarea {
  width: 100%;
  border: 2px solid var(--border-primary);
  border-radius: 18px;
  padding: 16px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  height: 120px;
  outline: none;
  transition: all 0.2s;
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.custom-textarea:focus { border-color: var(--color_button); background: var(--bg-primary); box-shadow: 0 0 0 4px rgba(26, 77, 46, 0.05); }

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

.btn-cancel { background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-primary); }
.btn-cancel:hover { background: var(--bg-hover); }

.btn-confirm { background: var(--color_button); color: var(--color_text_button); }
.btn-confirm:hover { background: var(--color_button); filter: brightness(0.9); transform: translateY(-1px); }

.fade-enter-active, .fade-leave-active { transition: all 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(1.05); }

/* --- LOADING OVERLAY --- */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 1000;
}

[data-theme="dark"] .loading-overlay {
  background: rgba(11, 15, 25, 0.65);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.15);
  border-top-color: var(--color_button);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-overlay p {
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* --- OBSERVACIONES CHAT DRAWER GLASSMORPHISM (RF-INS-30) --- */
.chat-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(6px);
  z-index: 2100;
  display: flex;
  justify-content: flex-end;
}

.chat-drawer-content {
  width: 100%;
  max-width: 420px;
  height: 100%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(190%);
  border-left: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: -10px 0 35px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

[data-theme="dark"] .chat-drawer-content {
  background: rgba(30, 41, 59, 0.8);
  border-left: 1px solid rgba(255, 255, 255, 0.05);
}

.chat-drawer-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-drawer-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-title-icon {
  font-size: 1.6rem;
  color: var(--color_button);
}

.chat-drawer-title h3 {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.chat-drawer-title p {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
  font-weight: 500;
}

.chat-close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
  padding: 0;
}

.chat-close-btn:hover {
  color: var(--text-primary);
}

.chat-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.chat-empty-state {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: var(--text-muted);
  max-width: 280px;
}

.chat-empty-state .material-symbols-outlined {
  font-size: 3rem;
  opacity: 0.4;
  margin-bottom: 12px;
  color: var(--color_button);
}

.chat-empty-state p {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
}

.chat-empty-state .empty-sub {
  font-size: 0.68rem;
  line-height: 1.4;
}

.chat-feed-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-bubble-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.chat-bubble-wrapper.aprendiz {
  align-self: flex-end;
  align-items: flex-end;
}

.chat-bubble-wrapper.admin,
.chat-bubble-wrapper.instructor {
  align-self: flex-start;
  align-items: flex-start;
}

.chat-bubble-meta {
  display: flex;
  gap: 8px;
  font-size: 0.6rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 4px;
}

.chat-bubble-text-box {
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid var(--border-primary);
  font-size: 0.78rem;
  line-height: 1.4;
}

.chat-bubble-text-box p {
  margin: 0;
}

.chat-bubble-wrapper.aprendiz .chat-bubble-text-box {
  background: var(--bg-active);
  border-color: rgba(26, 77, 46, 0.15);
  color: var(--text-primary);
  border-bottom-right-radius: 2px;
}

.chat-bubble-wrapper.admin .chat-bubble-text-box,
.chat-bubble-wrapper.instructor .chat-bubble-text-box {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-bottom-left-radius: 2px;
}

.chat-drawer-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border-primary);
  display: flex;
  gap: 12px;
  align-items: center;
}

.chat-input {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 0.78rem;
  font-family: inherit;
  color: var(--text-primary);
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: var(--color_button);
}

.btn-send-message {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color_button);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(26, 77, 46, 0.15);
}

.btn-send-message:hover:not(:disabled) {
  transform: scale(1.05);
  filter: brightness(0.95);
}

.btn-send-message:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--border-primary);
  box-shadow: none;
}

/* Transición del Drawer */
.drawer-enter-active, .drawer-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-enter-active .chat-drawer-content,
.drawer-leave-active .chat-drawer-content {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-enter-from {
  opacity: 0;
}

.drawer-enter-from .chat-drawer-content {
  transform: translateX(100%);
}

.drawer-leave-to {
  opacity: 0;
}

.drawer-leave-to .chat-drawer-content {
  transform: translateX(100%);
}

/* Utility Overrides */
.material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }

@media (max-width: 480px) {
  .info-details-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .card.stepper-card {
    padding: 16px 12px;
  }
  .stepper-container {
    padding: 10px 0 10px;
  }
  .step-point {
    width: 50px;
  }
  .point-circle {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }
  .point-circle span {
    font-size: 18px;
  }
}
</style>
