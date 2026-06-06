<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '../../../core/store/auth.store'
import { epService } from '../services/ep.service'
import Sidebar from '../../../components/layout/Sidebar.vue'
import Header from '../../../components/layout/Header.vue'
import SkeletonLoader from '../../../components/ui/SkeletonLoader.vue'

const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.user || { name: 'Usuario', role: 'Invitado' })
const stage = ref(null)
const loading = ref(true)
const error = ref(null)

// Animated progress bar
const animatedProgress = ref(0)
const animatedPercentage = ref(0)

function animateProgress(targetPct) {
  animatedProgress.value = 0
  animatedPercentage.value = 0
  if (targetPct <= 0) return
  // Small delay so the DOM renders the 0-width bar first
  setTimeout(() => {
    animatedProgress.value = targetPct
    // Animate the counter number
    const duration = 1200
    const steps = 60
    const increment = targetPct / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= targetPct) {
        animatedPercentage.value = targetPct
        clearInterval(interval)
      } else {
        animatedPercentage.value = Math.round(current)
      }
    }, duration / steps)
  }, 80)
}

const aprendiz = computed(() => {
  if (!stage.value) return { nombre: '---', estadoActual: '---', horasCompletadas: 0, horasTotales: 864, progresoPorcentaje: 0, razonSocial: '---', nit: '---', jefe: '---', telefono: '---' }
  const s = stage.value
  const hasStarted = ['EN_CURSO', 'FINALIZADO', 'CERTIFICADO'].includes(s.estado)
  return {
    nombre: s.apprenticeId?.name || currentUser.value.name,
    estadoActual: s.estado || '---',
    horasCompletadas: hasStarted ? (s.horasCompletadas || 0) : 0,
    horasTotales: s.horasRequeridas || 864,
    progresoPorcentaje: (hasStarted && s.horasRequeridas > 0) ? Math.round((s.horasCompletadas / s.horasRequeridas) * 100) : 0,
    razonSocial: s.companyId?.razon_social || s.companyId?.razonSocial || s.companySnapshot?.razonSocial || '---',
    nit: s.companyId?.nit || s.companySnapshot?.nit || '---',
    jefe: s.companySnapshot?.jefeInmediato || s.companyId?.jefe_inmediato?.nombre_completo || s.companyId?.jefeInmediato || '---',
    telefono: s.companySnapshot?.telefonoJefe || s.companySnapshot?.telefono || s.companyId?.jefe_inmediato?.telefono || s.companyId?.datos_contacto?.telefono || s.companyId?.telefono || '---'
  }
})

const hasActiveStage = computed(() => {
  return stage.value && stage.value.estado !== 'RECHAZADO'
})

const bitacoras = ref([])

const checklist = computed(() => {
  const list = []
  for (let i = 1; i <= 12; i++) {
    const found = bitacoras.value.find(b => b.semana === i)
    list.push({
      semana: i,
      cargado: !!found,
      bitacora: found || null,
      estado: found ? found.estado : 'NO_CARGADO'
    })
  }
  return list
})

// Funcionalidad extra: Búsqueda, Paginación, Modales
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

const filteredBitacoras = computed(() => {
  let filtered = bitacoras.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(b => 
      b.descripcion.toLowerCase().includes(q) || 
      String(b.semana).includes(q) ||
      b.estado.toLowerCase().includes(q)
    )
  }
  return filtered
})

const totalPages = computed(() => Math.ceil(filteredBitacoras.value.length / itemsPerPage) || 1)

const paginatedBitacoras = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredBitacoras.value.slice(start, start + itemsPerPage)
})

const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }

// Modales adicionales
const showViewModal = ref(false)
const selectedBitacora = ref(null)

const showEditModal = ref(false)
const editForm = ref({ id: '', semana: '', descripcion: '', horasReportadas: '' })

const showCalendarModal = ref(false)

// Toast
const toastMsg = ref(null)
const showToast = (msg, type = 'ok') => {
  toastMsg.value = { text: msg, type }
  setTimeout(() => toastMsg.value = null, 3000)
}

function openView(bitacora) {
  selectedBitacora.value = bitacora
  showViewModal.value = true
}

function openEdit(bitacora) {
  editForm.value = { 
    id: bitacora._id, 
    semana: bitacora.semana, 
    descripcion: bitacora.descripcion, 
    horasReportadas: bitacora.horasReportadas 
  }
  showEditModal.value = true
}

async function saveEdit() {
  try {
    const data = {
      semana: Number(editForm.value.semana),
      descripcion: editForm.value.descripcion,
      horasReportadas: Number(editForm.value.horasReportadas)
    }
    await epService.actualizarBitacora(editForm.value.id, data)
    showEditModal.value = false
    showToast('Bitácora actualizada exitosamente.')
    await load()
  } catch (err) {
    showToast(err.response?.data?.message || 'Error al actualizar bitácora', 'err')
  }
}

// Modal nueva bitácora
const showModal = ref(false)
const saving = ref(false)
const submitError = ref(null)
const form = ref({ semana: '', descripcion: '', horasReportadas: '' })

// Enviar a revisión
const enviando = ref(false)
const msgRevision = ref(null)
const puedeEnviarRevision = computed(() => stage.value?.estado === 'REGISTRO')
const puedeCrearBitacora = computed(() => stage.value?.estado === 'EN_CURSO')

async function load(silent = false) {
  if (!silent) {
    loading.value = true; error.value = null
    animatedProgress.value = 0
    animatedPercentage.value = 0
  }
  try {
    const res = await epService.getAll()
    const stages = res.data?.data || []
    if (stages.length > 0) {
      const newStage = stages[0]
      const oldProgress = aprendiz.value.progresoPorcentaje
      const oldEstado = stage.value?.estado
      
      stage.value = newStage
      const bRes = await epService.getBitacorasByStage(stage.value._id)
      bitacoras.value = bRes.data?.data || []
      
      if (silent && (oldProgress !== aprendiz.value.progresoPorcentaje || oldEstado !== newStage.estado)) {
        await nextTick()
        animateProgress(aprendiz.value.progresoPorcentaje)
      }
    }
  } catch (e) { 
    if (!silent) error.value = 'No se pudo cargar la información.' 
  }
  finally {
    if (!silent) {
      loading.value = false
      await nextTick()
      animateProgress(aprendiz.value.progresoPorcentaje)
    }
  }
}

async function enviarRevision() {
  enviando.value = true; msgRevision.value = null
  try {
    await epService.enviarARevision(stage.value._id)
    msgRevision.value = { type: 'ok', text: 'EP enviada a revisión exitosamente.' }
    await load()
  } catch (e) {
    msgRevision.value = { type: 'err', text: e.response?.data?.message || 'Error al enviar.' }
  } finally { 
    enviando.value = false 
    // Auto-hide alert after 15 seconds
    setTimeout(() => {
      msgRevision.value = null
    }, 15000)
  }
}

async function crearBitacora() {
  saving.value = true; submitError.value = null
  try {
    await epService.crearBitacora({ stageId: stage.value._id, semana: Number(form.value.semana), descripcion: form.value.descripcion, horasReportadas: Number(form.value.horasReportadas) })
    showModal.value = false
    form.value = { semana: '', descripcion: '', horasReportadas: '' }
    await load()
    showToast('Bitácora registrada correctamente.')
  } catch (e) { submitError.value = e.response?.data?.message || 'Error al guardar.' }
  finally { saving.value = false }
}

const handleLogout = () => { authStore.logout(); router.push('/login') }

const handleOpenModal = () => {
  showModal.value = true
}

let intervalId = null

const startPollingData = () => {
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(async () => {
    await load(true)
  }, 20000)
}

onMounted(async () => {
  await load()
  if (router.currentRoute.value.query.openModal === '1') {
    showModal.value = true
    router.replace({ path: '/mi-ep', query: {} })
  }
  window.addEventListener('open-new-bitacora', handleOpenModal)
  startPollingData()
})

onUnmounted(() => {
  window.removeEventListener('open-new-bitacora', handleOpenModal)
  if (intervalId) {
    clearInterval(intervalId)
  }
})

watch(() => router.currentRoute.value.query.openModal, (newVal) => {
  if (newVal === '1') {
    showModal.value = true
    router.replace({ path: '/mi-ep', query: {} })
  }
})
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <!-- CONTENIDO -->
    <div class="main-wrapper">
      <Header title="Mi Etapa Productiva">
        <template #actions>
          <div class="desktop-actions-only">
            <button v-if="puedeEnviarRevision" @click="enviarRevision" :disabled="enviando" class="btn-new" style="background:#3B82F6">{{ enviando ? 'Enviando...' : 'Enviar a Revisión' }}</button>
            <button v-if="puedeCrearBitacora" @click="showModal = true" class="btn-new"><span class="material-symbols-outlined">add</span> Nueva Bitácora</button>
          </div>
        </template>
      </Header>

      <main class="content">
        <!-- Banner de mensaje de revisión (auto-ocultable y sutil) -->
        <transition name="toast">
          <div v-if="msgRevision" class="revision-msg-banner" :class="[msgRevision.type, { 'marquee-mode': msgRevision.text.length > 40 }]">
            <span :class="{ 'marquee-text': msgRevision.text.length > 40 }">{{ msgRevision.text }}</span>
          </div>
        </transition>

        <!-- SECCIÓN INFO + PROGRESO INTEGRADO -->
        <div class="info-grid">
          <div class="company-card">
            <div class="company-card-body">
              <div class="card-header">
                <div class="header-text">
                  <span class="label">INFORMACIÓN DE LA EMPRESA</span>
                  <span class="desc">Detalles del convenio de etapa productiva</span>
                </div>
                <span v-if="!loading" class="status-badge">ESTADO: {{ aprendiz.estadoActual }}</span>
                <div v-else class="skel-badge"></div>
              </div>
              
              <div class="company-details" v-if="!loading && hasActiveStage">
                <div class="detail-item">
                  <div class="icon"><span class="material-symbols-outlined">corporate_fare</span></div>
                  <div class="txt">
                    <span class="key">EMPRESA</span>
                    <span class="val">{{ aprendiz.razonSocial }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="icon"><span class="material-symbols-outlined">fingerprint</span></div>
                  <div class="txt">
                    <span class="key">NIT</span>
                    <span class="val">{{ aprendiz.nit }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="icon"><span class="material-symbols-outlined">contact_page</span></div>
                  <div class="txt">
                    <span class="key">JEFE INMEDIATO</span>
                    <span class="val">{{ aprendiz.jefe }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="icon"><span class="material-symbols-outlined">call</span></div>
                  <div class="txt">
                    <span class="key">TELÉFONO</span>
                    <span class="val">{{ aprendiz.telefono }}</span>
                  </div>
                </div>
              </div>
              <div class="company-details-empty" v-else-if="!loading && !hasActiveStage" style="padding: 24px 16px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; border: 1px dashed var(--border-primary); border-radius: 16px; margin: 16px 0;">
                <span class="material-symbols-outlined" style="font-size: 44px; color: var(--text-muted); opacity: 0.6;">domain_disabled</span>
                <div style="max-width: 420px; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                  <h4 style="font-weight: 800; font-size: 14px; margin: 0; color: var(--text-primary);">Sin vinculación activa</h4>
                  <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                    {{ stage?.estado === 'RECHAZADO' 
                       ? 'Tu solicitud de etapa productiva anterior fue rechazada. Por favor registra una nueva empresa para iniciar el proceso.'
                       : 'Aún no has registrado tu información de etapa productiva. Completa la formalización para comenzar.' }}
                  </p>
                  <router-link to="/registro-ep" class="btn-new" style="display: inline-flex; align-items: center; gap: 6px; justify-content: center; text-decoration: none; padding: 8px 16px; margin-top: 6px; font-size: 11px;">
                    <span class="material-symbols-outlined" style="font-size: 16px;">app_registration</span>
                    Registrar Etapa Productiva
                  </router-link>
                </div>
              </div>
              <div class="company-details" v-else>
                <div class="detail-item" v-for="i in 4" :key="i">
                  <div class="icon skel-anim" style="width: 36px; height: 36px; border-radius: 10px;"></div>
                  <div class="txt" style="width: 100%;">
                    <div class="skel-line" style="width: 40%; height: 8px; margin-bottom: 4px;"></div>
                    <div class="skel-line" style="width: 80%; height: 12px;"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- FOOTER DE PROGRESO INTEGRADO -->
            <div class="company-footer" v-if="hasActiveStage || loading">
              <template v-if="!loading">
                <div class="footer-progress-header">
                  <div class="progress-info">
                    <span class="label">PROGRESO DE ETAPA</span>
                    <p class="stats">Has completado <b>{{ aprendiz.horasCompletadas }}</b> de {{ aprendiz.horasTotales }} horas totales.</p>
                  </div>
                  <div class="progress-percentage">{{ animatedPercentage }}%</div>
                </div>
                <div class="progress-bar-container-mini">
                  <div class="progress-bar-mini" :style="{ width: animatedProgress + '%' }"></div>
                </div>
              </template>
              <template v-else>
                <div class="footer-progress-header">
                  <div class="progress-info">
                    <div class="skel-line" style="width: 100px; height: 10px; margin-bottom: 6px;"></div>
                    <div class="skel-line" style="width: 180px; height: 12px;"></div>
                  </div>
                  <div class="skel-line" style="width: 40px; height: 24px; border-radius: 8px;"></div>
                </div>
                <div class="progress-bar-container-mini">
                  <div class="progress-bar-mini" style="width: 0%"></div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- CHECKLIST DE ENTREGAS -->
        <div class="checklist-container">
          <div class="checklist-header">
            <div class="checklist-title-group">
              <span class="material-symbols-outlined icon-checklist">checklist</span>
              <div>
                <h3>Estado de Mis Entregas Quincenales</h3>
                <p class="checklist-subtitle">Estado y control de tus 12 bitácoras de Etapa Productiva</p>
              </div>
            </div>
            <div class="checklist-summary" v-if="!loading">
              <span class="summary-pill total">
                Entregadas: <strong>{{ bitacoras.length }} / 12</strong>
              </span>
              <span class="summary-pill aprobadas">
                Aprobadas: <strong>{{ bitacoras.filter(b => b.estado === 'APROBADA').length }}</strong>
              </span>
            </div>
            <div v-else class="checklist-summary">
              <div class="skel-badge"></div>
            </div>
          </div>
          
          <div v-if="!loading" class="checklist-grid">
            <div 
              v-for="item in checklist" 
              :key="item.semana" 
              class="checklist-card"
              :class="[item.estado.toLowerCase(), { 'is-clickable': item.cargado }]"
              @click="item.cargado && openView(item.bitacora)"
              :title="item.cargado ? 'Ver detalle de Bitácora' : 'Bitácora no cargada aún'"
            >
              <div class="card-top">
                <span class="week-number">Quincena {{ item.semana }}</span>
                <span class="material-symbols-outlined status-icon">
                  {{ 
                    item.estado === 'APROBADA' ? 'check_circle' : 
                    item.estado === 'PENDIENTE' ? 'schedule' : 
                    item.estado === 'RECHAZADA' ? 'warning' : 'draft' 
                  }}
                </span>
              </div>
              <div class="card-bottom">
                <span class="status-label">
                  {{ 
                    item.estado === 'APROBADA' ? 'Aprobada' : 
                    item.estado === 'PENDIENTE' ? 'Pendiente' : 
                    item.estado === 'RECHAZADA' ? 'Rechazada' : 'No Cargado' 
                  }}
                </span>
                <span v-if="item.cargado" class="hours-count">{{ item.bitacora.horasReportadas }}h</span>
              </div>
            </div>
          </div>
          <div v-else class="checklist-grid">
            <div v-for="i in 12" :key="i" class="checklist-card no_cargado skel-anim" style="min-height: 72px;"></div>
          </div>
        </div>

        <!-- TABLA BITACORAS -->
        <div class="table-container">
          <div class="table-header">
            <h3>Mis Bitácoras Quincenales</h3>
            <div class="table-icons" style="display:flex;align-items:center;gap:12px">
              <div class="search-bar-container">
                <span class="material-symbols-outlined search-icon">search</span>
                <input v-model="searchQuery" type="text" placeholder="Buscar bitácora..." class="search-bar-input" />
              </div>
              <span class="material-symbols-outlined action-btn">filter_list</span>
            </div>
          </div>
          <table class="bitacora-table" v-if="!loading">
            <thead>
              <tr>
                <th>NÚMERO</th>
                <th>RANGO DE FECHAS</th>
                <th class="center">HORAS REPORTADAS</th>
                <th class="center">ESTADO</th>
                <th class="right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredBitacoras.length === 0">
                <td colspan="5" class="empty-row">No tienes bitácoras que coincidan con la búsqueda.</td>
              </tr>
              <tr v-for="item in paginatedBitacoras" :key="item._id">
                <td class="bold">Semana {{ item.semana }}</td>
                <td class="faded">
                  <span class="material-symbols-outlined mini">calendar_today</span> <span style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" :title="item.descripcion">{{ item.descripcion }}</span>
                </td>
                <td class="center"><span class="hours-badge">{{ item.horasReportadas }}h</span></td>
                <td class="center">
                  <span class="badge" :class="item.estado === 'APROBADA' ? 'success' : 'pending'">
                    <span class="dot"></span> {{ item.estado }}
                  </span>
                </td>
                <td class="right">
                  <button v-if="item.estado === 'APROBADA'" @click="openView(item)" class="action-table-btn view" title="Ver Detalle">
                    <span class="material-symbols-outlined">visibility</span>
                  </button>
                  <button v-else @click="openEdit(item)" class="action-table-btn edit" title="Editar Bitácora">
                    <span class="material-symbols-outlined">edit_square</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <!-- LISTADO DE TARJETAS PARA MÓVIL (<= 430px) -->
          <div class="bitacoras-mobile-list" v-if="!loading">
            <div v-if="filteredBitacoras.length === 0" class="empty-row">
              No tienes bitácoras que coincidan con la búsqueda.
            </div>
            <div v-for="item in paginatedBitacoras" :key="item._id" class="bitacora-mobile-card">
              <div class="card-header-mobile">
                <span class="bold">Semana {{ item.semana }}</span>
                <span class="badge" :class="item.estado === 'APROBADA' ? 'success' : 'pending'">
                  <span class="dot"></span> {{ item.estado }}
                </span>
              </div>
              <div class="card-body-mobile">
                <div class="desc-row">
                  <span class="material-symbols-outlined mini">calendar_today</span>
                  <span class="desc-text" :title="item.descripcion">{{ item.descripcion }}</span>
                </div>
                <div class="footer-row-mobile">
                  <span class="hours-badge">{{ item.horasReportadas }}h</span>
                  <div class="actions-mobile">
                    <button v-if="item.estado === 'APROBADA'" @click="openView(item)" class="action-mobile-btn view" title="Ver Detalle">
                      <span class="material-symbols-outlined">visibility</span> Ver Detalle
                    </button>
                    <button v-else @click="openEdit(item)" class="action-mobile-btn edit" title="Editar Bitácora">
                      <span class="material-symbols-outlined">edit_square</span> Editar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else style="padding: 24px;">
            <SkeletonLoader variant="table" :rows="4" :columns="5" />
          </div>
          <div class="table-footer">
            <span class="footer-stats">PÁGINA {{ currentPage }} DE {{ totalPages }} ({{ filteredBitacoras.length }} REGISTROS)</span>
            <div class="pagination">
              <button @click="prevPage" :disabled="currentPage === 1" class="pag-btn" :class="{ disabled: currentPage === 1 }">Anterior</button>
              <button @click="nextPage" :disabled="currentPage === totalPages" class="pag-btn" :class="{ disabled: currentPage === totalPages }">Siguiente</button>
            </div>
          </div>
        </div>

        <!-- BANNER DE ESTADO CONTEXTUAL -->
        <div v-if="stage && stage.estado !== 'EN_CURSO' && !loading" class="estado-banner" :class="stage.estado?.toLowerCase()">
          <div class="estado-banner-icon">
            <span class="material-symbols-outlined">
              {{ stage.estado === 'REGISTRO' ? 'assignment' : stage.estado === 'VALIDACION' ? 'pending' : stage.estado === 'RECHAZADO' ? 'cancel' : stage.estado === 'FINALIZADO' ? 'task_alt' : 'info' }}
            </span>
          </div>
          <div class="estado-banner-text">
            <span class="estado-banner-title">
              {{ stage.estado === 'REGISTRO' ? '📋 Tu solicitud está en REGISTRO' :
                 stage.estado === 'VALIDACION' ? '⏳ En espera de revisión del instructor' :
                 stage.estado === 'RECHAZADO' ? '⚠️ Tu Etapa Productiva fue RECHAZADA' :
                 stage.estado === 'FINALIZADO' ? '🎉 Etapa Productiva FINALIZADA' :
                 stage.estado === 'CERTIFICADO' ? '🏆 Etapa Productiva CERTIFICADA' :
                 'Estado: ' + stage.estado }}
            </span>
            <p class="estado-banner-desc">
              {{ stage.estado === 'REGISTRO' ? 'Cuando tengas todos tus documentos listos, haz clic en "Enviar a Revisión" para que el instructor valide tu solicitud.' :
                 stage.estado === 'VALIDACION' ? 'El instructor está revisando tus documentos. Recibirás una notificación cuando se tome una decisión.' :
                 stage.estado === 'RECHAZADO' ? 'Revisa las observaciones del instructor y corrige los documentos necesarios para volver a enviar.' :
                 stage.estado === 'FINALIZADO' ? 'La etapa ha terminado. Espera la certificación final.' :
                 stage.estado === 'CERTIFICADO' ? '¡Felicitaciones! Has completado exitosamente tu Etapa Productiva.' :
                 '' }}
            </p>
            <div v-if="stage.observaciones" class="observations-box" style="margin-top: 12px; background: rgba(255, 255, 255, 0.15); padding: 12px 16px; border-radius: 8px; border-left: 4px solid currentColor;">
              <strong style="display: block; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Observaciones del Instructor:</strong>
              <p style="margin: 0; font-size: 13px; white-space: pre-wrap; font-weight: 500; line-height: 1.5;">{{ stage.observaciones }}</p>
            </div>
          </div>
        </div>

        <!-- BANNER INFO -->
        <div class="reminder-banner">
          <div class="reminder-content">
            <div class="lamp-icon"><span class="material-symbols-outlined">lightbulb</span></div>
            <div class="reminder-text">
              <span class="rtitle">Recordatorio de Cierre</span>
              <p class="rdesc">Recuerda que las bitácoras deben ser firmadas digitalmente por tu jefe inmediato antes de la fecha de corte quincenal.</p>
            </div>
          </div>
          <button @click="showCalendarModal = true" class="btn-cal">Ver Calendario de Fechas</button>
        </div>
      </main>

      <!-- ERROR -->
      <div v-if="error && !loading" class="error-banner">
        <span class="material-symbols-outlined">error</span> {{ error }}
        <button @click="load" class="error-banner-btn">Reintentar</button>
      </div>
    </div>

    <!-- MODAL NUEVA BITÁCORA -->
    <div v-if="showModal" @click.self="showModal = false" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nueva Bitácora</h3>
          <button @click="showModal = false" class="modal-close-btn"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <div class="modal-form-group">
            <label class="modal-label">Número de Semana</label>
            <input v-model="form.semana" type="number" min="1" placeholder="Ej: 1" class="modal-input" />
          </div>
          <div class="modal-form-group">
            <label class="modal-label">Descripción de Actividades</label>
            <textarea v-model="form.descripcion" rows="4" placeholder="Describe las actividades realizadas..." class="modal-textarea"></textarea>
          </div>
          <div class="modal-form-group">
            <label class="modal-label">Horas Reportadas</label>
            <input v-model="form.horasReportadas" type="number" min="0" placeholder="Ej: 40" class="modal-input" />
          </div>
          <div v-if="submitError" class="modal-error-banner">{{ submitError }}</div>
          <div class="modal-footer-actions">
            <button @click="showModal = false" class="modal-btn-cancel">Cancelar</button>
            <button @click="crearBitacora" :disabled="saving" class="modal-btn-confirm">{{ saving ? 'Guardando...' : 'Guardar Bitácora' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL EDITAR BITÁCORA -->
    <div v-if="showEditModal" @click.self="showEditModal = false" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Editar Bitácora</h3>
          <button @click="showEditModal = false" class="modal-close-btn"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <div class="modal-form-group">
            <label class="modal-label">Número de Semana</label>
            <input v-model="editForm.semana" type="number" min="1" placeholder="Ej: 1" class="modal-input" />
          </div>
          <div class="modal-form-group">
            <label class="modal-label">Descripción de Actividades</label>
            <textarea v-model="editForm.descripcion" rows="4" placeholder="Describe las actividades realizadas..." class="modal-textarea"></textarea>
          </div>
          <div class="modal-form-group">
            <label class="modal-label">Horas Reportadas</label>
            <input v-model="editForm.horasReportadas" type="number" min="0" placeholder="Ej: 40" class="modal-input" />
          </div>
          <div class="modal-footer-actions">
            <button @click="showEditModal = false" class="modal-btn-cancel">Cancelar</button>
            <button @click="saveEdit" class="modal-btn-confirm">Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL VER DETALLES -->
    <div v-if="showViewModal && selectedBitacora" @click.self="showViewModal = false" class="modal-overlay">
      <div class="modal-content view-details-modal">
        <div class="modal-header-view">
          <div>
            <span class="modal-view-badge" :class="selectedBitacora.estado.toLowerCase()">BITÁCORA {{ selectedBitacora.estado }}</span>
            <h3 class="modal-view-title">Semana {{ selectedBitacora.semana }}</h3>
          </div>
          <button @click="showViewModal = false" class="modal-close-btn-view"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="modal-body-view">
          <div class="view-section">
            <label class="view-label">ACTIVIDADES REALIZADAS</label>
            <p class="view-desc-text">{{ selectedBitacora.descripcion }}</p>
          </div>
          <div class="view-row-stats">
            <div class="stat-col">
              <label class="view-label">HORAS REPORTADAS</label>
              <span class="stat-value">{{ selectedBitacora.horasReportadas }} h</span>
            </div>
            <div class="stat-col">
              <label class="view-label">ESTADO</label>
              <span v-if="selectedBitacora.estado === 'APROBADA'" class="status-indicator aprobada"><span class="material-symbols-outlined">check_circle</span> Aprobada</span>
              <span v-else-if="selectedBitacora.estado === 'RECHAZADA'" class="status-indicator rechazada"><span class="material-symbols-outlined">cancel</span> Rechazada</span>
              <span v-else class="status-indicator pendiente"><span class="material-symbols-outlined">schedule</span> Pendiente</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CALENDARIO -->
    <div v-if="showCalendarModal" @click.self="showCalendarModal = false" class="modal-overlay">
      <div class="modal-content calendar-modal">
        <div class="calendar-icon-wrapper">
          <span class="material-symbols-outlined">event</span>
        </div>
        <h3 class="modal-title">Fechas de Corte Quincenales</h3>
        <p class="modal-message">Las bitácoras deben enviarse los días 15 y 30 de cada mes. Asegúrate de tenerlas firmadas por tu jefe inmediato antes de la fecha límite.</p>
        <div class="modal-footer-actions single-action">
          <button @click="showCalendarModal = false" class="modal-btn-confirm wide">Entendido</button>
        </div>
      </div>
    </div>

    <!-- TOAST NOTIFICATION -->
    <transition name="toast">
      <div v-if="toastMsg" class="toast-notification" :class="toastMsg.type">
        <span class="material-symbols-outlined">{{ toastMsg.type === 'ok' ? 'check_circle' : 'info' }}</span>
        {{ toastMsg.text }}
      </div>
    </transition>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined');

/* --- Reset & Base --- */
.repfora-dashboard {
  display: flex;
  min-height: 100vh;
  background: var(--bg-app);
  font-family: 'Inter', sans-serif;
  color: var(--text-primary);
  overflow: hidden;
  width: 100%;
}

/* --- Sidebar --- */
.sidebar {
  width: 230px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-primary);
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
  background: var(--color_button);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color_text_button);
  flex-shrink: 0;
}

.logo-text .title {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.logo-text .subtitle {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-muted);
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
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.2s;
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
  text-align: left;
}

.nav-item:hover { color: var(--text-primary); background: var(--bg-hover); }
.nav-item.active {
  color: var(--color_button);
  background: var(--bg-active);
  border-left: 4px solid var(--color_button);
  border-radius: 4px 12px 12px 4px;
}

.sidebar-footer { padding: 24px 16px; border-top: 1px solid var(--border-primary); display: flex; flex-direction: column; gap: 12px; }
.btn-new-visit-sidebar {
  width: 100%;
  background: var(--color_button);
  color: var(--color_text_button);
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
.btn-new-visit-sidebar:hover { filter: brightness(0.9); }
.logout-btn:hover { color: #EF4444; }

/* --- Main Layout --- */
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
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 90;
  flex-shrink: 0;
}

.page-title { font-size: 20px; font-weight: 800; color: var(--text-primary); }

.topbar-actions { display: flex; align-items: center; gap: 24px; }
.btn-new {
  background: var(--color_button);
  color: var(--color_text_button);
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

.divider { width: 1px; height: 32px; background: var(--border-primary); }
.notification { color: var(--text-muted); cursor: pointer; }

.user-profile { display: flex; align-items: center; gap: 12px; }
.user-name { font-size: 12px; font-weight: 800; color: var(--text-primary); }
.user-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid var(--border-primary); flex-shrink: 0; }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* --- Content --- */
.content { padding: 24px; max-width: 1400px; width: 100%; box-sizing: border-box; }

.info-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 24px; }

.company-card { background: var(--bg-primary); border-radius: 20px; border: 1px solid var(--border-primary); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
.company-card-body { padding: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.header-text .label { display: block; font-size: 11px; font-weight: 900; color: var(--text-muted); letter-spacing: 1px; }
.header-text .desc { font-size: 11px; color: var(--text-muted); }
.status-badge { background: #FFF1F2; color: #E11D48; padding: 6px 12px; border-radius: 8px; font-size: 9px; font-weight: 900; }
[data-theme="dark"] .status-badge { background: rgba(225, 29, 72, 0.15); color: #fda4af; }

.company-details { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.detail-item { display: flex; align-items: center; gap: 12px; background: var(--bg-secondary); padding: 12px; border-radius: 12px; border: 1px solid var(--border-primary); transition: all 0.3s; }
.detail-item:hover { background: var(--bg-primary); border-color: var(--color_button); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.detail-item .icon { width: 36px; height: 36px; background: var(--bg-primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--color_button); box-shadow: 0 2px 8px rgba(0,0,0,0.02); flex-shrink: 0; border: 1px solid var(--border-primary); }
.detail-item .key { display: block; font-size: 9px; font-weight: 900; color: var(--text-muted); margin-bottom: 2px; }
.detail-item .val { font-size: 13px; font-weight: 700; color: var(--text-primary); }

.company-footer { background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-hover) 100%); padding: 16px 24px; border-top: 1px solid var(--border-primary); }
.footer-progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.footer-progress-header .label { font-size: 10px; font-weight: 900; color: var(--text-secondary); letter-spacing: 1px; }
.footer-progress-header .stats { font-size: 11px; color: var(--text-muted); margin: 4px 0 0; }
.footer-progress-header .stats b { color: var(--color_button); }
.progress-percentage { font-size: 20px; font-weight: 900; color: var(--color_button); letter-spacing: -0.5px; }
.progress-bar-container-mini {
  width: 100%;
  height: 14px;
  background: var(--border-primary);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
}
.progress-bar-mini {
  height: 100%;
  background: linear-gradient(90deg, var(--color_button) 0%, #2d7a4a 50%, var(--color_button) 100%);
  background-size: 200% 100%;
  border-radius: 20px;
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: progress-shimmer 2.5s linear infinite;
  box-shadow: 0 2px 8px rgba(26, 77, 46, 0.25);
  position: relative;
}
.progress-bar-mini::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 6px;
  right: 6px;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
}
@keyframes progress-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* --- Table --- */
.table-container { background: var(--bg-primary); border-radius: 20px; border: 1px solid var(--border-primary); overflow: hidden; }
.table-header { padding: 24px; display: flex; justify-content: space-between; align-items: center; }
.table-header h3 { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.table-icons { display: flex; gap: 16px; color: var(--text-muted); }

.bitacora-table { width: 100%; border-collapse: collapse; }
.bitacora-table th { background: var(--bg-secondary); padding: 12px 24px; text-align: left; font-size: 10px; font-weight: 900; color: var(--text-muted); letter-spacing: 1px; }
.bitacora-table td { padding: 16px 24px; border-top: 1px solid var(--border-primary); font-size: 13px; }
.bitacora-table .bold { font-weight: 700; color: var(--text-primary); }
.bitacora-table .faded { color: var(--text-secondary); font-weight: 500; display: flex; align-items: center; gap: 8px; }
.bitacora-table .mini { font-size: 18px; color: var(--text-muted); }
.bitacora-table .center { text-align: center; }
.bitacora-table .right { text-align: right; }

.hours-badge { background: var(--bg-secondary); color: var(--text-secondary); padding: 6px 12px; border-radius: 8px; font-size: 10px; font-weight: 900; border: 1px solid var(--border-primary); }
.badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 9px; font-weight: 900; letter-spacing: 0.5px; border: 1px solid transparent; }
.badge.success { background: #F0FDF4; color: #16A34A; border-color: #DCFCE7; }
.badge.pending { background: #FFF1F2; color: #E11D48; border-color: #FFE4E6; }
[data-theme="dark"] .badge.success { background: rgba(22, 163, 74, 0.15); color: #4ade80; border-color: rgba(22, 163, 74, 0.3); }
[data-theme="dark"] .badge.pending { background: rgba(225, 29, 72, 0.15); color: #fda4af; border-color: rgba(225, 29, 72, 0.3); }

.badge .dot { width: 6px; height: 6px; border-radius: 50%; }
.badge.success .dot { background: #16A34A; }
.badge.pending .dot { background: #E11D48; }
[data-theme="dark"] .badge.success .dot { background: #4ade80; }
[data-theme="dark"] .badge.pending .dot { background: #fda4af; }

.action-btn { color: var(--text-muted); cursor: pointer; transition: color 0.2s; }
.action-btn:hover { color: var(--color_button); }

.table-footer { padding: 24px 32px; background: var(--bg-secondary); border-top: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: center; }
.footer-stats { font-size: 10px; font-weight: 900; color: var(--text-muted); letter-spacing: 0.5px; }
.pagination { display: flex; gap: 8px; }
.pag-btn { background: var(--bg-primary); border: 1px solid var(--border-primary); padding: 8px 16px; border-radius: 8px; font-size: 10px; font-weight: 700; color: var(--text-secondary); cursor: pointer; box-shadow: var(--shadow-sm); transition: all 0.2s; }
.pag-btn:hover:not(.disabled) { background: var(--bg-hover); color: var(--text-primary); }

/* --- Banner --- */
.reminder-banner { background: var(--bg-secondary); border-radius: 24px; padding: 32px; display: flex; justify-content: space-between; align-items: center; margin-top: 32px; border: 1px solid var(--border-primary); }
.reminder-content { display: flex; align-items: center; gap: 24px; }
.lamp-icon { width: 56px; height: 56px; background: var(--bg-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--color_button); border: 1px solid var(--border-primary); flex-shrink: 0; box-shadow: var(--shadow-sm); }
.rtitle { display: block; font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.rdesc { font-size: 12px; color: var(--text-muted); font-weight: 500; max-width: 500px; margin: 0; }
.btn-cal { background: var(--border-primary); border: none; padding: 12px 24px; border-radius: 12px; font-size: 11px; font-weight: 700; color: var(--text-secondary); cursor: pointer; white-space: nowrap; transition: all 0.2s; }
.btn-cal:hover { background: var(--bg-hover); color: var(--text-primary); }

/* --- Material Symbols --- */
.material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }

/* --- Spinner --- */
.ep-spinner { width: 40px; height: 40px; border: 4px solid var(--border-primary); border-top: 4px solid var(--color_button); border-radius: 50%; animation: ep-spin .8s linear infinite; }
@keyframes ep-spin { to { transform: rotate(360deg); } }

/* --- Responsiveness fixes --- */
@media (max-width: 1200px) {
  .info-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .company-details { grid-template-columns: 1fr; gap: 12px; }
  .table-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .table-icons { width: 100%; justify-content: space-between; }
  .table-icons > div { width: 100%; }
  .table-icons input { width: 100% !important; }
  
  .table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .bitacora-table { min-width: 600px; }
  
  .footer-progress-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .progress-percentage { font-size: 18px; align-self: flex-end; margin-top: -24px; }
  
  .reminder-banner { flex-direction: column; text-align: center; gap: 16px; padding: 24px 16px; }
  .reminder-content { flex-direction: column; gap: 12px; }
  .btn-cal { width: 100%; }
}

.action-btn-hover:hover { background: var(--bg-hover) !important; }
.pag-btn.disabled { opacity: 0.5; cursor: not-allowed; }

/* --- Toast Notification --- */
.toast-notification { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 500; }
.toast-notification.ok { background: #16A34A; color: #FFF; }
.toast-notification.err { background: #E11D48; color: #FFF; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skel-line, .skel-badge, .skel-anim {
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-hover) 37%, var(--bg-secondary) 63%);
  background-size: 800px 100%;
  animation: shimmer 1.8s ease-in-out infinite;
  border-radius: 6px;
}
.skel-badge { width: 80px; height: 24px; border-radius: 8px; }
.progress-card .skel-line { background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 37%, rgba(255,255,255,0.1) 63%); }

/* ─── MODAL CUSTOM CLASSES FOR PREMIUM DARK MODE ─── */

/* --- Revision Message Banner --- */
.revision-msg-banner {
  font-size: 11.5px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 10px;
  margin-bottom: 16px;
  white-space: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  display: block;
  text-align: center;
  width: 100% !important;
  box-sizing: border-box !important;
  position: relative;
}
.revision-msg-banner::-webkit-scrollbar {
  display: none;
}
.revision-msg-banner.marquee-mode {
  text-align: left;
  overflow: hidden;
  display: flex;
  align-items: center;
  -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
  mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
}
.revision-msg-banner .marquee-text {
  display: inline-block;
  padding-left: 100%;
  animation: marquee-scroll 15s linear infinite;
  flex-shrink: 0;
}
.revision-msg-banner:hover .marquee-text {
  animation-play-state: paused;
}
@keyframes marquee-scroll {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-100%, 0, 0);
  }
}
.revision-msg-banner.ok {
  background: transparent;
  color: #16A34A;
  border: 1px solid rgba(22, 163, 74, 0.2);
}
.revision-msg-banner.err {
  background: transparent;
  color: #E11D48;
  border: 1px solid rgba(225, 29, 72, 0.2);
}
[data-theme="dark"] .revision-msg-banner.ok {
  background: transparent;
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}
[data-theme="dark"] .revision-msg-banner.err {
  background: transparent;
  color: #fda4af;
  border: 1px solid rgba(253, 164, 175, 0.3);
}

/* --- Search Bar --- */
.search-bar-container {
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 0 12px;
  height: 36px;
  transition: all 0.2s;
}
[data-theme="dark"] .search-bar-container {
  background: var(--bg-secondary);
  border-color: var(--border-primary);
}
.search-icon {
  font-size: 18px;
  color: #94A3B8;
}
[data-theme="dark"] .search-icon {
  color: var(--text-muted);
}
.search-bar-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 12px;
  color: #334155;
  width: 150px;
  margin-left: 8px;
}
[data-theme="dark"] .search-bar-input {
  color: var(--text-primary);
}

/* --- Error Banner --- */
.error-banner {
  margin: 24px;
  padding: 16px 20px;
  background: #FFF1F2;
  border-radius: 12px;
  color: #E11D48;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid transparent;
}
[data-theme="dark"] .error-banner {
  background: rgba(225, 29, 72, 0.15);
  color: #fda4af;
  border-color: rgba(225, 29, 72, 0.3);
}
.error-banner-btn {
  margin-left: auto;
  background: #E11D48;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
[data-theme="dark"] .error-banner-btn {
  background: #ef4444;
}

/* --- Action Table Buttons --- */
.action-table-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s;
}
.action-table-btn.view {
  color: #16A34A;
}
[data-theme="dark"] .action-table-btn.view {
  color: #4ade80;
}
.action-table-btn.edit {
  color: #3B82F6;
}
[data-theme="dark"] .action-table-btn.edit {
  color: #60a5fa;
}
.action-table-btn:hover {
  background: var(--bg-hover) !important;
}

/* --- Empty Table Row --- */
.empty-row {
  text-align: center;
  padding: 32px !important;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
}

/* --- Modal Base --- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(8px);
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-content {
  background: var(--bg-elevated);
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-primary);
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-primary);
}
.modal-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}
.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
}
.modal-close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.modal-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
}
.modal-input {
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  outline: none;
  width: 100%;
  transition: all 0.2s;
}
.modal-input:focus {
  border-color: var(--color_button);
  box-shadow: 0 0 0 3px var(--bg-active);
}
.modal-textarea {
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  outline: none;
  width: 100%;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
}
.modal-textarea:focus {
  border-color: var(--color_button);
  box-shadow: 0 0 0 3px var(--bg-active);
}
.modal-error-banner {
  font-size: 12px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(225, 29, 72, 0.15);
  color: #fda4af;
  border: 1px solid rgba(225, 29, 72, 0.2);
}
.modal-footer-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 4px;
}
.modal-btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.modal-btn-cancel:hover {
  background: var(--bg-hover);
}
.modal-btn-confirm {
  background: var(--color_button);
  color: var(--color_text_button);
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.modal-btn-confirm:hover {
  filter: brightness(0.9);
  transform: translateY(-1px);
}
.modal-btn-confirm.wide {
  width: 100%;
  justify-content: center;
}

/* --- View Details Modal --- */
.view-details-modal {
  max-width: 500px;
}
.modal-header-view {
  background: var(--bg-secondary);
  padding: 24px;
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.modal-view-badge {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 4px;
  text-transform: uppercase;
}
.modal-view-badge.aprobada {
  color: #16A34A;
}
[data-theme="dark"] .modal-view-badge.aprobada {
  color: #4ade80;
}
.modal-view-badge.rechazada {
  color: #E11D48;
}
[data-theme="dark"] .modal-view-badge.rechazada {
  color: #fda4af;
}
.modal-view-badge.pendiente {
  color: #CA8A04;
}
[data-theme="dark"] .modal-view-badge.pendiente {
  color: #facc15;
}
.modal-view-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}
.modal-close-btn-view {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}
.modal-close-btn-view:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.modal-body-view {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.view-section {
  display: flex;
  flex-direction: column;
}
.view-label {
  font-size: 11px;
  font-weight: 800;
  color: var(--text-muted);
  display: block;
  margin-bottom: 6px;
}
.view-desc-text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0;
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-primary);
}
.view-row-stats {
  display: flex;
  gap: 24px;
}
.stat-col {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
}
.status-indicator {
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}
.status-indicator.aprobada {
  color: #16A34A;
}
[data-theme="dark"] .status-indicator.aprobada {
  color: #4ade80;
}
.status-indicator.rechazada {
  color: #E11D48;
}
[data-theme="dark"] .status-indicator.rechazada {
  color: #fda4af;
}
.status-indicator.pendiente {
  color: #CA8A04;
}
[data-theme="dark"] .status-indicator.pendiente {
  color: #facc15;
}

/* --- Calendar Modal --- */
.calendar-modal {
  max-width: 400px;
  padding: 32px;
  text-align: center;
  box-sizing: border-box;
}
.calendar-icon-wrapper {
  width: 64px;
  height: 64px;
  background: var(--bg-active);
  color: var(--color_button);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.calendar-icon-wrapper span {
  font-size: 32px;
}

/* --- Checklist Premium Styling --- */
.checklist-container {
  background: var(--bg-primary);
  border-radius: 20px;
  border: 1px solid var(--border-primary);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.02);
}

.checklist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.checklist-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-checklist {
  font-size: 24px;
  color: var(--color_button);
  background: var(--bg-active);
  padding: 8px;
  border-radius: 12px;
}

.checklist-header h3 {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.checklist-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

.checklist-summary {
  display: flex;
  gap: 10px;
}

.summary-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--border-primary);
}

.summary-pill.total {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.summary-pill.aprobadas {
  background: #F0FDF4;
  color: #16A34A;
  border-color: #DCFCE7;
}
[data-theme="dark"] .summary-pill.aprobadas {
  background: rgba(22, 163, 74, 0.15);
  color: #4ade80;
  border-color: rgba(22, 163, 74, 0.3);
}

.checklist-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

@media (max-width: 1024px) {
  .checklist-grid {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    gap: 10px;
    padding-bottom: 6px;
    scrollbar-width: none;
    width: 100%;
    grid-template-columns: none;
  }

  .checklist-grid::-webkit-scrollbar {
    display: none;
  }
}

@media (max-width: 768px) {
  .checklist-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .checklist-summary {
    width: 100%;
    justify-content: space-between;
  }
}

.checklist-card {
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 72px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px dashed var(--color-gray-400);
  background: transparent;
  cursor: default;
}

@media (max-width: 1024px) {
  .checklist-card {
    flex: 0 0 130px;
    min-width: 130px;
    max-width: 130px;
  }
}

@media (max-width: 768px) {
  .checklist-card {
    flex: 0 0 110px;
    min-width: 110px;
    max-width: 110px;
    min-height: 64px;
    padding: 8px 10px;
  }
}

.checklist-card.is-clickable {
  cursor: pointer;
  border-style: solid;
}

.checklist-card.is-clickable:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
}

/* --- Estados de la carta --- */
.checklist-card.no_cargado {
  border: 1px dashed var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-muted);
}
.checklist-card.no_cargado .status-icon {
  color: var(--text-muted);
  opacity: 0.5;
}
.checklist-card.no_cargado .week-number {
  color: var(--text-secondary);
}

.checklist-card.pendiente {
  background: #FFFBEB;
  border-color: #F59E0B;
  color: #B45309;
}
[data-theme="dark"] .checklist-card.pendiente {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.4);
  color: #fbbf24;
}
.checklist-card.pendiente .status-icon {
  color: #D97706;
}
.checklist-card.pendiente .week-number {
  color: #B45309;
}
[data-theme="dark"] .checklist-card.pendiente .week-number {
  color: #fbbf24;
}

.checklist-card.aprobada {
  background: #F0FDF4;
  border-color: #10B981;
  color: #047857;
}
[data-theme="dark"] .checklist-card.aprobada {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.4);
  color: #34d399;
}
.checklist-card.aprobada .status-icon {
  color: #10B981;
}
.checklist-card.aprobada .week-number {
  color: #047857;
}
[data-theme="dark"] .checklist-card.aprobada .week-number {
  color: #34d399;
}

.checklist-card.rechazada {
  background: #FEF2F2;
  border-color: #EF4444;
  color: #B91C1C;
}
[data-theme="dark"] .checklist-card.rechazada {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}
.checklist-card.rechazada .status-icon {
  color: #EF4444;
}
.checklist-card.rechazada .week-number {
  color: #B91C1C;
}
[data-theme="dark"] .checklist-card.rechazada .week-number {
  color: #f87171;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.week-number {
  font-size: 11px;
  font-weight: 800;
}

.status-icon {
  font-size: 18px;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.status-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}

.hours-count {
  font-size: 9px;
  font-weight: 800;
  background: rgba(0,0,0,0.05);
  padding: 2px 6px;
  border-radius: 6px;
}
[data-theme="dark"] .hours-count {
  background: rgba(255,255,255,0.1);
}

.bitacoras-mobile-list {
  display: none;
}

@media (max-width: 430px) {
  .bitacora-table {
    display: none !important;
  }
  .bitacoras-mobile-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }
  .bitacora-mobile-card {
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .bitacora-mobile-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  }
  .card-header-mobile {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-primary);
    padding-bottom: 8px;
  }
  .card-header-mobile .bold {
    font-size: 13px;
    font-weight: 800;
    color: var(--text-primary);
  }
  .card-body-mobile {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .desc-row {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    color: var(--text-secondary);
  }
  .desc-row .mini {
    font-size: 15px;
    color: var(--text-muted);
    margin-top: 1px;
    flex-shrink: 0;
  }
  .desc-text {
    font-size: 11.5px;
    line-height: 1.4;
    color: var(--text-secondary);
    word-break: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .footer-row-mobile {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
  }
  .actions-mobile {
    display: flex;
    gap: 6px;
  }
  .action-mobile-btn {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
    transition: all 0.2s;
  }
  .action-mobile-btn.view {
    color: #16A34A;
  }
  .action-mobile-btn.edit {
    color: #3B82F6;
  }
  .action-mobile-btn:hover {
    background: var(--bg-hover);
  }
  .action-mobile-btn .material-symbols-outlined {
    font-size: 16px;
  }
  .table-footer {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
    text-align: center;
  }
}
</style>

<style scoped>
/* ── Banner Estado Contextual de la EP ── */
.estado-banner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid;
  margin: 0 0 16px 0;
  animation: fadeIn 0.4s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
.estado-banner.registro {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.25);
}
.estado-banner.validacion {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.25);
}
.estado-banner.rechazado {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.25);
}
.estado-banner.finalizado,
.estado-banner.certificado {
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.25);
}
.estado-banner-icon {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.estado-banner.registro .estado-banner-icon { background: rgba(59,130,246,0.15); color: #3B82F6; }
.estado-banner.validacion .estado-banner-icon { background: rgba(245,158,11,0.15); color: #d97706; }
.estado-banner.rechazado .estado-banner-icon { background: rgba(239,68,68,0.15); color: #ef4444; }
.estado-banner.finalizado .estado-banner-icon,
.estado-banner.certificado .estado-banner-icon { background: rgba(34,197,94,0.15); color: #16a34a; }
.estado-banner-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.estado-banner-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-primary);
}
.estado-banner-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}
</style>

