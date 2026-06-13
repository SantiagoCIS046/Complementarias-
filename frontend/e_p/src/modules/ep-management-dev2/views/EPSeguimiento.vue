<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
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
  
  const stateMapping = {
    'SOLICITUD': 'REGISTRO',
    'REGISTRO': 'REGISTRO',
    'VALIDACION': 'VALIDACION',
    'APROBADO': 'EN_PROGRESO',
    'EN_CURSO': 'EN_PROGRESO',
    'FINALIZADO': 'EVALUACION',
    'CERTIFICADO': 'CERTIFICACION',
    'RECHAZADO': 'REGISTRO'
  }
  
  const mappedKey = stateMapping[estado] || 'REGISTRO'
  const idx = steps.findIndex(s => s.key === mappedKey)
  return idx !== -1 ? idx : 0
})

const hasActiveStage = computed(() => {
  return stage.value && stage.value.estado !== 'RECHAZADO'
})

const stats = computed(() => {
  const aprobadas = bitacoras.value.filter(b => b.estado === 'APROBADA').length
  const pendientes = bitacoras.value.filter(b => b.estado === 'PENDIENTE' || b.estado === 'REVISION' || b.estado === 'EN REVISIÓN').length
  return { aprobadas, pendientes }
})

const nextBitacoraInfo = computed(() => {
  if (!stage.value || !stage.value.fechaInicio) {
    return { label: 'Mes 1', daysText: 'No iniciada', dateText: 'Pendiente' }
  }

  // 1. Encontrar el siguiente mes de bitácora pendiente (1 a 6)
  let nextMonth = 1
  for (let i = 1; i <= 6; i++) {
    const found = bitacoras.value.find(b => b.semana === i)
    if (!found || found.estado === 'RECHAZADA') {
      nextMonth = i
      break
    }
  }

  // 2. Calcular la fecha límite de ese mes (cada mes son 30 días adicionales)
  const fechaInicio = new Date(stage.value.fechaInicio)
  const dueDate = new Date(fechaInicio.getTime())
  dueDate.setDate(dueDate.getDate() + (nextMonth * 30))

  // 3. Calcular la diferencia en días con la fecha actual
  const today = new Date()
  today.setHours(0,0,0,0)
  const dueZeroHours = new Date(dueDate.getTime())
  dueZeroHours.setHours(0,0,0,0)

  const diffTime = dueZeroHours.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let daysText = ''
  if (diffDays < 0) {
    daysText = `Vencida hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'}`
  } else if (diffDays === 0) {
    daysText = 'Hoy'
  } else if (diffDays === 1) {
    daysText = 'Mañana'
  } else {
    daysText = `En ${diffDays} días`
  }

  // Formato de fecha del badge (ej: "30 May", "14 Jun", etc.)
  const options = { day: 'numeric', month: 'short' }
  const dateText = dueDate.toLocaleDateString('es-ES', options)

  return {
    label: `Mes ${nextMonth}`,
    daysText,
    dateText
  }
})

const loadData = async (silent = false) => {
  if (!silent) {
    loading.value = true
    error.value = null
  }
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
    if (!silent) {
      notify('Error al sincronizar con el servidor', 'error')
      error.value = 'No se pudo sincronizar con el servidor.'
    }
  } finally {
    if (!silent) {
      loading.value = false
    }
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
const chatTextareaRef = ref(null)

// Auto-resize del textarea tipo WhatsApp
const autoResizeTextarea = () => {
  const el = chatTextareaRef.value
  if (!el) return
  el.style.height = 'auto'         // colapsa a 1 línea
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'  // max 5 líneas (~120px)
}

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
    // Resetear altura del textarea al enviar
    if (chatTextareaRef.value) {
      chatTextareaRef.value.style.height = 'auto'
    }
    notify('Mensaje enviado al chat de observaciones.', 'success')
  } catch (err) {
    console.error('Error al enviar mensaje de chat:', err)
    notify('Error al enviar el mensaje al servidor.', 'error')
  } finally {
    isSendingChatMessage.value = false
  }
}

const openBitacora = (b) => {
  openDialog(`Bitácora Mes ${b.semana}`, b.descripcion || 'No se registraron observaciones detalladas para este mes.', 'info')
}

let intervalId = null

const startPollingData = () => {
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(async () => {
    await loadData(true)
  }, 20000)
}

watch(() => route.query, (newQuery) => {
  if (newQuery.openChat === 'true') {
    showChatDrawer.value = true
  }
  loadData(true)
})

watch(showChatDrawer, (newVal) => {
  if (newVal) {
    document.documentElement.classList.add('chat-drawer-active')
  } else {
    document.documentElement.classList.remove('chat-drawer-active')
  }
})

onMounted(async () => {
  await loadData()
  if (route.query.openChat === 'true') {
    showChatDrawer.value = true
  }
  startPollingData()
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
  document.documentElement.classList.remove('chat-drawer-active')
})
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header title="Seguimiento de Aprendiz">
        <template #title-area>
          <!-- Vista móvil del título, breadcrumbs y logo SENA -->
          <div class="tracking-mobile-header-title-container">
            <img src="/logoSena.png" alt="SENA Logo" class="sena-logo-mobile-header" />
            <div class="title-details">
              <h2 class="page-title-mobile">Seguimiento de Aprendiz</h2>
            </div>
          </div>
          
          <!-- Vista desktop estándar -->
          <div class="header-title-container desktop-only-flex">
            <h2 class="page-title">Seguimiento de Aprendiz</h2>
            <nav class="breadcrumbs">
              <span class="crumb-item">
                <router-link to="/" class="crumb-link">Inicio</router-link>
                <span class="crumb-separator">/</span>
              </span>
              <span class="crumb-item active">Seguimiento Técnico</span>
            </nav>
          </div>
        </template>

        <template #actions>
          <div class="tracking-header-actions">
            <button class="btn-download-report" @click="downloadReport">
              <span class="material-symbols-outlined">download</span>
              <span class="btn-text">Descargar Reporte</span>
            </button>
          </div>
        </template>
      </Header>

      <main class="content">
        <!-- VISTA DE ESCRITORIO -->
        <div class="desktop-layout">
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
              
              <!-- OBSERVACIONES DEL INSTRUCTOR -->
              <div v-if="stage?.observaciones" class="card observations-card" style="border-left: 4px solid var(--color_button); border-left-color: #EF4444; background: rgba(239, 68, 68, 0.02); display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 850; font-size: 11px; color: #EF4444; letter-spacing: 0.5px; text-transform: uppercase;">
                  <span class="material-symbols-outlined" style="font-size: 18px;">warning</span>
                  Observaciones de la Etapa Productiva
                </div>
                <p style="margin: 0; font-size: 13px; color: var(--text-secondary); white-space: pre-wrap; font-weight: 500; line-height: 1.5;">{{ stage.observaciones }}</p>
              </div>

              <!-- INFORMACIÓN DE LA EMPRESA -->
              <section class="card company-card">
                <div class="card-top">
                  <div class="header-label">
                    <span class="material-symbols-outlined icon-green">domain</span>
                    <span class="label-text">INFORMACIÓN DE LA EMPRESA</span>
                  </div>
                  <div class="company-mini-logo" v-if="hasActiveStage">
                    <img :src="`https://ui-avatars.com/api/?name=${stage?.companyId?.razon_social || stage?.companyId?.razonSocial || 'EP'}&background=${themeStore.isDark ? '1f2937' : 'F8FAFC'}&color=${themeStore.isDark ? 'f3f4f6' : '1A4D2E'}&bold=true`" alt="Logo">
                  </div>
                </div>

                <div class="info-details-grid" v-if="hasActiveStage">
                  <div class="info-item">
                    <label>Razón Social</label>
                    <p>{{ stage?.companyId?.razon_social || stage?.companyId?.razonSocial || stage?.companySnapshot?.razonSocial || '---' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Email de Contacto</label>
                    <p>{{ stage?.companySnapshot?.emailContacto || stage?.companyId?.datos_contacto?.correo_corporativo || stage?.companyId?.emailContacto || '---' }}</p>
                  </div>
                  <div class="info-item">
                    <label>NIT</label>
                    <p>{{ stage?.companyId?.nit || stage?.companySnapshot?.nit || '---' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Ubicación</label>
                    <p>{{ stage?.companySnapshot?.direccion || stage?.companySnapshot?.ubicacion || stage?.companyId?.direccion || '---' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Jefe Inmediato</label>
                    <p>{{ stage?.companySnapshot?.jefeInmediato || stage?.companyId?.jefe_inmediato?.nombre_completo || stage?.companyId?.jefeInmediato || '---' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Modalidad</label>
                    <div class="modal-tag">
                      <span class="tag-dot"></span>
                      <p>{{ stage?.modalidad || '---' }}</p>
                    </div>
                  </div>
                </div>
                <div class="company-details-empty" v-else style="padding: 24px 16px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; border: 1px dashed var(--border-primary); border-radius: 16px; margin-top: 8px;">
                  <span class="material-symbols-outlined" style="font-size: 44px; color: var(--text-muted); opacity: 0.6;">domain_disabled</span>
                  <div style="max-width: 420px; display: flex; flex-direction: column; align-items: center; gap: 6px; margin: 0 auto;">
                    <h4 style="font-weight: 800; font-size: 14px; margin: 0; color: var(--text-primary);">Sin vinculación activa</h4>
                    <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                      {{ stage?.estado === 'RECHAZADO' 
                         ? 'La solicitud de etapa productiva anterior fue rechazada. Por favor registra una nueva empresa para iniciar el proceso.'
                         : 'Aún no se ha registrado información de etapa productiva. Completa la formalización para comenzar.' }}
                    </p>
                    <router-link to="/registro-ep" class="btn-new" style="display: inline-flex; align-items: center; gap: 6px; justify-content: center; text-decoration: none; padding: 8px 16px; margin-top: 6px; font-size: 11px;">
                      <span class="material-symbols-outlined" style="font-size: 16px;">app_registration</span>
                      Registrar Etapa Productiva
                    </router-link>
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
                        <td class="faded">{{ b.periodo || 'Mes ' + b.semana }}</td>
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
                      <label>Próxima Bitácora ({{ nextBitacoraInfo.label }})</label>
                      <p>{{ nextBitacoraInfo.daysText }}</p>
                    </div>
                    <span class="days-pill">{{ nextBitacoraInfo.dateText }}</span>
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
        </div>

        <!-- VISTA DE MÓVIL -->
        <div class="mobile-layout">
          <!-- Subtítulo de Monitoreo Premium Card -->
          <div class="monitoring-info-banner" style="background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 4px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);">
            <div style="width: 36px; height: 36px; background: rgba(16, 185, 129, 0.1); color: #10B981; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="material-symbols-outlined" style="font-size: 22px;">account_circle</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 8px; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px;">Monitoreo de Progreso</span>
              <span style="font-size: 14px; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1.2;">{{ stage?.apprenticeId?.name || currentUser.name }}</span>
            </div>
          </div>

          <div v-if="error" class="error-banner">
            <span class="material-symbols-outlined">warning</span>
            {{ error }}
            <button @click="loadData">Reintentar</button>
          </div>

          <!-- 1. Flujo de Proceso Stepper -->
          <section class="card stepper-card">
            <div class="card-top">
              <div class="header-label">
                <span class="material-symbols-outlined icon-green">account_tree</span>
                <span class="label-text">FLUJO DE PROCESO</span>
              </div>
              <div class="status-badge-inline">
                <span class="dot"></span>
                <span class="status-txt">ESTADO ACTUAL: <span class="bold">{{ stage?.estado?.replace('_', ' ') || 'REGISTRO' }}</span></span>
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

          <!-- 2. Observaciones del Instructor -->
          <div v-if="stage?.observaciones" class="card observations-card" style="border-left: 4px solid var(--color_button); border-left-color: #EF4444; background: rgba(239, 68, 68, 0.02); display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 850; font-size: 11px; color: #EF4444; letter-spacing: 0.5px; text-transform: uppercase;">
              <span class="material-symbols-outlined" style="font-size: 18px;">warning</span>
              Observaciones de la Etapa Productiva
            </div>
            <p style="margin: 0; font-size: 13px; color: var(--text-secondary); white-space: pre-wrap; font-weight: 500; line-height: 1.5;">{{ stage.observaciones }}</p>
          </div>

          <!-- 3. Fechas Críticas & Acciones Rápidas (Side-by-side Row) -->
          <div class="side-by-side-row" style="display: flex; gap: 16px;">
            <!-- Fechas Críticas -->
            <section class="card side-card" style="flex: 1; margin: 0; padding: 16px;">
              <div class="card-top" style="margin-bottom: 12px;">
                <div class="header-label">
                  <span class="material-symbols-outlined icon-green">event_available</span>
                  <span class="label-text">FECHAS CRÍTICAS</span>
                </div>
              </div>
              <div class="critical-dates-list">
                <div class="date-box green" style="padding: 10px 12px; border-radius: 8px; border-left: 4px solid #16A34A; background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; flex-direction: column;">
                    <label style="font-size: 8px; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2px;">Inicio Etapa</label>
                    <p style="font-size: 12px; font-weight: 800; color: var(--text-primary); margin: 0;">{{ stage?.fechaInicio ? new Date(stage.fechaInicio).toLocaleDateString() : 'Pendiente' }}</p>
                  </div>
                </div>
                <div class="date-box red" style="padding: 10px 12px; border-radius: 8px; border-left: 4px solid #E11D48; background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; flex-direction: column;">
                    <label style="font-size: 8px; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2px;">Próxima Bitácora ({{ nextBitacoraInfo.label }})</label>
                    <p style="font-size: 11px; font-weight: 800; color: var(--text-primary); margin: 0;">{{ nextBitacoraInfo.daysText }}</p>
                  </div>
                  <span class="days-pill" style="font-size: 8px; font-weight: 900; background: #FFE4E6; color: #E11D48; padding: 2px 6px; border-radius: 4px;">{{ nextBitacoraInfo.dateText }}</span>
                </div>
                <div class="date-box gray" style="padding: 10px 12px; border-radius: 8px; border-left: 4px solid var(--border-primary); background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; flex-direction: column;">
                    <label style="font-size: 8px; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2px;">Finalización</label>
                    <p style="font-size: 12px; font-weight: 800; color: var(--text-primary); margin: 0;">{{ stage?.fechaFin ? new Date(stage.fechaFin).toLocaleDateString() : 'Pendiente' }}</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Acciones Rápidas -->
            <section class="card side-card bg-gray" style="flex: 1; margin: 0; padding: 16px; display: flex; flex-direction: column;">
              <div class="card-top" style="margin-bottom: 12px;">
                <div class="header-label">
                  <span class="material-symbols-outlined icon-green">bolt</span>
                  <span class="label-text">ACCIONES RÁPIDAS</span>
                </div>
              </div>
              <div class="actions-grid-vertical" style="display: flex; flex-direction: row; gap: 12px; width: 100%;">
                <button class="action-tile" @click="uploadFile" style="flex: 1;">
                  <div class="tile-icon green"><span class="material-symbols-outlined">upload</span></div>
                  <span class="tile-text">Subir Archivo</span>
                </button>
                <button class="action-tile" @click="sendMessage" style="flex: 1;">
                  <div class="tile-icon gray"><span class="material-symbols-outlined">mail</span></div>
                  <span class="tile-text">Mensaje</span>
                </button>
              </div>
            </section>
          </div>

          <!-- 4. Información de la Empresa -->
          <section class="card company-card" style="margin-top: 16px;">
            <div class="card-top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div class="header-label">
                <span class="material-symbols-outlined icon-green">domain</span>
                <span class="label-text">INFORMACIÓN DE LA EMPRESA</span>
              </div>
              <div class="company-mini-logo-badge" style="width: 36px; height: 36px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-primary); display: flex; align-items: center; justify-content: center; font-weight: 850; font-size: 12px; color: var(--text-primary);">
                {{ companyInitials }}
              </div>
            </div>

            <div class="info-details-grid" v-if="hasActiveStage" style="display: grid; grid-template-columns: 1fr; gap: 12px;">
              <div class="info-item">
                <label>Razón Social</label>
                <p>{{ stage?.companyId?.razon_social || stage?.companyId?.razonSocial || stage?.companySnapshot?.razonSocial || '---' }}</p>
              </div>
              <div class="info-item">
                <label>Email de Contacto</label>
                <p>{{ stage?.companySnapshot?.emailContacto || stage?.companyId?.datos_contacto?.correo_corporativo || stage?.companyId?.emailContacto || '---' }}</p>
              </div>
              <div class="info-item">
                <label>NIT</label>
                <p>{{ stage?.companyId?.nit || stage?.companySnapshot?.nit || '---' }}</p>
              </div>
              <div class="info-item">
                <label>Ubicación</label>
                <p>{{ stage?.companySnapshot?.direccion || stage?.companySnapshot?.ubicacion || stage?.companyId?.direccion || '---' }}</p>
              </div>
              <div class="info-item">
                <label>Jefe Inmediato</label>
                <p>{{ stage?.companySnapshot?.jefeInmediato || stage?.companyId?.jefe_inmediato?.nombre_completo || stage?.companyId?.jefeInmediato || '---' }}</p>
              </div>
              <div class="info-item">
                <label>Modalidad</label>
                <div class="modal-tag">
                  <span class="tag-dot"></span>
                  <p>{{ stage?.modalidad || '---' }}</p>
                </div>
              </div>
            </div>
            <div class="company-details-empty" v-else style="padding: 24px 16px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; border: 1px dashed var(--border-primary); border-radius: 16px; margin-top: 8px;">
              <span class="material-symbols-outlined" style="font-size: 44px; color: var(--text-muted); opacity: 0.6;">domain_disabled</span>
              <div style="max-width: 420px; display: flex; flex-direction: column; align-items: center; gap: 6px; margin: 0 auto;">
                <h4 style="font-weight: 800; font-size: 14px; margin: 0; color: var(--text-primary);">Sin vinculación activa</h4>
                <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                  {{ stage?.estado === 'RECHAZADO' 
                     ? 'La solicitud de etapa productiva anterior fue rechazada. Por favor registra una nueva empresa para iniciar el proceso.'
                     : 'Aún no se ha registrado información de etapa productiva. Completa la formalización para comenzar.' }}
                </p>
                <router-link to="/registro-ep" class="btn-new" style="display: inline-flex; align-items: center; gap: 6px; justify-content: center; text-decoration: none; padding: 8px 16px; margin-top: 6px; font-size: 11px;">
                  <span class="material-symbols-outlined" style="font-size: 16px;">app_registration</span>
                  Registrar Etapa Productiva
                </router-link>
              </div>
            </div>
          </section>

          <!-- 5. Seguimiento de Bitácoras (Móvil) -->
          <section class="card table-card" style="margin-top: 16px;">
            <div class="card-top no-border" style="padding: 16px 16px 0;">
              <span class="label-text">Seguimiento de Bitácoras</span>
              <div class="stats-group">
                <span class="stat-pill success">{{ stats.aprobadas }} APROBADAS</span>
                <span class="stat-pill danger">{{ stats.pendientes }} PENDIENTES</span>
              </div>
            </div>

            <div class="mobile-cards-container" style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
              <div v-if="bitacoras.length === 0" class="empty-card-state" style="text-align: center; padding: 24px; color: var(--text-muted); border: 1px dashed var(--border-primary); border-radius: 12px; font-size: 13px;">
                No hay bitácoras registradas para este aprendiz.
              </div>
              <div v-else v-for="b in bitacoras" :key="b._id" class="mobile-item-card" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 800; font-size: 14px; color: var(--text-primary);">Bitácora #{{ b.semana }}</span>
                  <span class="status-chip" :class="b.estado.toLowerCase().replace(' ', '-')" style="font-size: 10px; padding: 4px 8px; border-radius: 20px;">
                    {{ b.estado }}
                  </span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-size: 9px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Periodo / Mes</span>
                    <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ b.periodo || 'Mes ' + b.semana }}</span>
                  </div>
                  <button class="icon-btn" @click="openBitacora(b)" style="background: var(--bg-primary); width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-primary); cursor: pointer; transition: all 0.2s;">
                    <span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-primary);">visibility</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- 6. Visitas de Seguimiento Técnico (Móvil) -->
          <section class="card table-card" style="margin-top: 16px;">
            <div class="card-top no-border" style="padding: 16px 16px 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="material-symbols-outlined icon-green" style="color: #2563eb;">assignment_turned_in</span>
                <span class="label-text" style="color: #2563eb; font-weight: bold;">Visitas de Seguimiento Técnico</span>
              </div>
              <div class="stats-group">
                <span class="stat-pill success" style="background: #eff6ff; color: #2563eb; font-weight: 800;">
                  {{ trackings.filter(t => !t.esExtraordinario).length }} de {{ cupo.maxSeguimientos }} completados
                </span>
              </div>
            </div>

            <div style="padding: 8px 16px 12px;">
              <div class="mini-bar" style="height: 6px; background: var(--bg-secondary); border-radius: 10px; overflow: hidden; width: 100%;">
                <div class="mini-fill" :style="{ width: (Math.min(trackings.filter(t => !t.esExtraordinario).length, cupo.maxSeguimientos) / cupo.maxSeguimientos) * 100 + '%', backgroundColor: '#2563eb' }" style="height: 100%; border-radius: 10px; transition: width 0.4s ease;"></div>
              </div>
            </div>

            <div class="mobile-cards-container" style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
              <div v-if="trackings.length === 0" class="empty-card-state" style="text-align: center; padding: 24px; color: var(--text-muted); border: 1px dashed var(--border-primary); border-radius: 12px; font-size: 13px;">
                No hay visitas de seguimiento registradas por el instructor.
              </div>
              <div v-else v-for="track in trackings" :key="track._id" class="mobile-item-card" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 800; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                    Visita #{{ track.numeroVisita }}
                    <span v-if="track.esExtraordinario" style="background: rgba(37, 99, 235, 0.1); color: #2563eb; font-size: 8px; font-weight: 900; padding: 2px 6px; border-radius: 20px; display: inline-flex; align-items: center; gap: 2px;">
                      <span class="material-symbols-outlined" style="font-size: 10px;">star</span> Especial
                    </span>
                  </span>
                  <span class="status-chip" :class="track.calificacion ? track.calificacion.toLowerCase() : 'pendiente'" style="background: #eff6ff; color: #2563eb; font-weight: 800; font-size: 10px; padding: 4px 8px; border-radius: 20px;">
                    {{ track.calificacion || 'Sin calificar' }}
                  </span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-size: 8px; font-weight: 900; color: var(--text-muted); text-transform: uppercase;">Fecha</span>
                      <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ new Date(track.fechaVisita).toLocaleDateString() }}</span>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-size: 8px; font-weight: 900; color: var(--text-muted); text-transform: uppercase;">Lugar</span>
                      <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">{{ track.lugarVisita || 'Presencial' }}</span>
                    </div>
                  </div>
                  
                  <div>
                    <a v-if="track.evidenciaUrl" :href="track.evidenciaUrl" target="_blank" style="background: #eff6ff; color: #2563eb; padding: 8px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; text-decoration: none; font-weight: 800; border: 1px solid rgba(37, 99, 235, 0.1); cursor: pointer; transition: all 0.2s;">
                      <span class="material-symbols-outlined" style="font-size: 16px;">download</span> Descargar
                    </a>
                    <span v-else style="font-size: 11px; color: var(--text-muted); font-style: italic; font-weight: 500;">No disponible</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <!-- Floating Chat FAB (Visible only on Mobile) -->
      <div class="fab-mobile-fixed">
        <button class="fab-btn" @click="sendMessage">
          <span class="material-symbols-outlined">chat_bubble</span>
        </button>
      </div>

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
              ref="chatTextareaRef"
              v-model="chatMessageText" 
              placeholder="Escribe tu mensaje o aclaración..." 
              class="chat-input"
              rows="1"
              @keydown.enter.exact.prevent="sendChatMessage"
              @keydown.enter.shift.exact="() => {}"
              @input="autoResizeTextarea"
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

/* ── Hide Chat Scrollbars ── */
.chat-feed,
.chat-drawer-body,
.chat-input {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
.chat-feed::-webkit-scrollbar,
.chat-drawer-body::-webkit-scrollbar,
.chat-input::-webkit-scrollbar {
  display: none !important;
}

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
  z-index: 10005 !important;
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
  padding: 16px 20px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-primary);
  display: flex;
  gap: 12px;
  align-items: flex-end;
  box-sizing: border-box;
}

.chat-input {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 14px;
  padding: 10px 14px;
  font-size: 15px;
  font-weight: 500;
  font-family: inherit;
  color: var(--text-primary);
  resize: none;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02);
  /* Auto-resize: empieza en 1 linea, crece hasta 5 */
  min-height: 42px;
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.45;
  word-break: break-word;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chat-input:focus {
  border-color: #10B981;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.02), 0 0 0 2px rgba(16, 185, 129, 0.1);
  background: var(--bg-primary);
}

.chat-input::placeholder {
  color: var(--text-muted);
  font-weight: 500;
}

.btn-send-message {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #10B981;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.btn-send-message:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
  filter: brightness(1.05);
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

/* ═════ ESTILOS RESPONSIVOS PARA VISTA MÓVIL (MOCKUP) ═════ */
.mobile-layout {
  display: none;
}
.desktop-layout {
  display: block;
}
.desktop-only-flex {
  display: flex !important;
}
.tracking-mobile-header-title-container {
  display: none;
}
.sena-logo-mobile-header {
  display: none;
}

/* Botón Descargar Reporte Verde Premium */
.btn-download-report {
  background-color: #10B981; /* Verde esmeralda del mockup */
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  transition: all 0.2s;
  height: 36px;
}
.btn-download-report:hover {
  filter: brightness(0.9);
  transform: translateY(-1px);
}
.btn-download-report span.material-symbols-outlined {
  font-size: 18px;
}

.tracking-header-actions {
  display: flex;
  align-items: center;
}

.fab-mobile-fixed {
  display: none;
}

@media (max-width: 780px) {
  .desktop-layout {
    display: none !important;
  }
  .mobile-layout {
    display: flex !important;
    flex-direction: column;
    gap: 16px;
  }
  .desktop-only-flex {
    display: none !important;
  }

  /* Ocultar Logo SENA por defecto para dar espacio al título */
  :deep(.header-logo-mobile) {
    display: none !important;
  }

  /* Estilos para el Título y Logo SENA Móvil */
  .tracking-mobile-header-title-container {
    display: flex !important;
    align-items: center;
    gap: 12px;
  }
  .sena-logo-mobile-header {
    display: block !important;
    width: 32px;
    height: 32px;
    object-fit: contain;
  }
  .title-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .page-title-mobile {
    font-size: 15px;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.2;
  }
  .breadcrumbs-mobile {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 9px;
    color: var(--text-muted);
  }
  .crumb-item-mobile {
    color: var(--text-muted);
    font-weight: 650;
  }
  .crumb-item-mobile.active {
    color: var(--text-muted);
  }
  .crumb-separator-mobile {
    color: var(--border-primary);
    font-size: 8px;
    margin: 0 2px;
  }

  /* Botón Descargar Reporte Adaptado */
  .btn-download-report {
    padding: 6px 10px;
    font-size: 10px;
    border-radius: 6px;
    height: 32px;
  }

  /* Floating Chat FAB */
  .fab-mobile-fixed {
    display: block;
    position: fixed;
    bottom: 96px; /* Posicionado por encima del menú inferior flotante */
    right: 20px;
    z-index: 1000;
  }
  .fab-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: #10B981;
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  }
  .fab-btn:hover {
    transform: scale(1.05);
  }
  .fab-btn .material-symbols-outlined {
    font-size: 24px;
    font-variation-settings: 'FILL' 1;
  }

  /* Estructura Apilada en Móvil (Fechas Críticas y Acciones Rápidas) */
  .side-by-side-row {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    max-width: 440px;
    margin: 0 auto !important;
    box-sizing: border-box;
  }
  .side-by-side-row .card {
    margin: 0 !important;
    flex: 1;
  }

  /* Ajustar la carta de acción rápida en móvil */
  .action-tile {
    padding: 14px 8px !important;
    border-radius: 12px !important;
    border: 1px solid var(--border-primary) !important;
  }

  /* Ajustar las celdas de las tablas en móvil */
  .dashboard-table td, .dashboard-table th {
    padding: 12px 14px;
    font-size: 11px;
  }

  /* Reducir tamaño de cartas generales en móvil */
  .mobile-layout .card {
    padding: 16px !important;
  }
  .mobile-layout .card-top .label-text {
    font-size: 11px !important;
  }
  .mobile-layout .header-label span.material-symbols-outlined {
    font-size: 18px !important;
  }

  /* Reducir tamaño de tarjetas de Bitácora/Visitas (Móvil) */
  .mobile-item-card {
    padding: 10px 12px !important;
    gap: 8px !important;
  }
  .mobile-item-card > div:first-child > span:first-child {
    font-size: 12px !important;
  }
  .mobile-item-card span[style*="font-size: 9px"], 
  .mobile-item-card span[style*="font-size: 8px"] {
    font-size: 7.5px !important;
  }
  .mobile-item-card span[style*="font-size: 12px"],
  .mobile-item-card span[style*="font-size: 11px"] {
    font-size: 11px !important;
  }
  .mobile-item-card .status-chip {
    font-size: 8px !important;
    padding: 3px 6px !important;
  }
  .mobile-item-card .icon-btn {
    width: 30px !important;
    height: 30px !important;
    border-radius: 6px !important;
  }
  .mobile-item-card .icon-btn span {
    font-size: 16px !important;
  }
  .mobile-item-card a[target="_blank"] {
    padding: 6px 10px !important;
    font-size: 10px !important;
    border-radius: 6px !important;
  }

  /* Reducir tamaño de Acciones Rápidas (Móvil) */
  .action-tile {
    padding: 10px 6px !important;
    border-radius: 10px !important;
    gap: 6px !important;
  }
  .action-tile .tile-icon {
    width: 28px !important;
    height: 28px !important;
    border-radius: 8px !important;
  }
  .action-tile .tile-icon span {
    font-size: 16px !important;
  }
  .action-tile .tile-text {
    font-size: 8px !important;
  }

  /* Reducir tamaño de Fechas Críticas (Móvil) */
  .date-box {
    padding: 8px 10px !important;
    border-radius: 8px !important;
  }
  .date-box label {
    font-size: 7.5px !important;
  }
  .date-box p {
    font-size: 11px !important;
  }

  /* Reducir tamaño de Stepper y Observaciones (Móvil) */
  .step-point .point-label {
    font-size: 8px !important;
  }
  .observations-card {
    padding: 12px !important;
    gap: 6px !important;
  }
  .observations-card p {
    font-size: 11px !important;
  }

  /* Ajustes para el Chat Drawer en Móvil (Centrado y Flotante) */
  .chat-drawer-backdrop {
    justify-content: center !important;
    align-items: center !important;
    padding: 16px !important;
  }

  .chat-drawer-content {
    width: 100% !important;
    max-width: 340px !important;
    height: 75vh !important;
    max-height: 520px !important;
    border-radius: 24px !important;
    border: 1px solid var(--border-primary) !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
    overflow: hidden !important;
  }

  .drawer-enter-from .chat-drawer-content {
    transform: translateY(30px) scale(0.95) !important;
    opacity: 0 !important;
  }

  .drawer-leave-to .chat-drawer-content {
    transform: translateY(30px) scale(0.95) !important;
    opacity: 0 !important;
  }
  .chat-drawer-header {
    padding: 12px 16px !important;
  }
  .chat-drawer-title h3 {
    font-size: 13px !important;
  }
  .chat-drawer-title p {
    font-size: 10px !important;
  }
  .chat-close-btn {
    font-size: 1.5rem !important;
  }
  .chat-drawer-body {
    padding: 16px !important;
  }
  .chat-bubble-text-box {
    padding: 8px 12px !important;
    font-size: 11px !important;
    border-radius: 10px !important;
  }
  .chat-bubble-meta {
    font-size: 8px !important;
  }
  .chat-drawer-footer {
    padding: 8px 12px !important;
    gap: 8px !important;
  }
  .chat-input {
    padding: 6px 10px !important;
    font-size: 11px !important;
    border-radius: 8px !important;
    border: 1px solid var(--border-primary) !important;
  }
  .chat-input:focus {
    border-color: #10B981 !important;
    box-shadow: none !important;
  }
  .btn-send-message {
    width: 30px !important;
    height: 30px !important;
    border-radius: 6px !important;
    box-shadow: none !important;
  }
  .btn-send-message span {
    font-size: 14px !important;
  }
}

@media (max-width: 420px) {
  .btn-download-report .btn-text {
    display: none; /* Solo icono en pantallas extremadamente angostas */
  }
}
</style>
