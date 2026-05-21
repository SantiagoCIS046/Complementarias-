<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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
  return {
    nombre: s.apprenticeId?.name || currentUser.value.name,
    estadoActual: s.estado || '---',
    horasCompletadas: s.horasCompletadas || 0,
    horasTotales: s.horasRequeridas || 864,
    progresoPorcentaje: s.horasRequeridas > 0 ? Math.round((s.horasCompletadas / s.horasRequeridas) * 100) : 0,
    razonSocial: s.companyId?.razonSocial || s.companySnapshot?.razonSocial || '---',
    nit: s.companyId?.nit || s.companySnapshot?.nit || '---',
    jefe: s.companySnapshot?.jefeInmediato || '---',
    telefono: s.companySnapshot?.telefonoJefe || s.companySnapshot?.telefonoContacto || '---'
  }
})

const bitacoras = ref([])

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

async function load() {
  loading.value = true; error.value = null
  animatedProgress.value = 0
  animatedPercentage.value = 0
  try {
    const res = await epService.getAll()
    const stages = res.data?.data || []
    if (stages.length > 0) {
      stage.value = stages[0]
      const bRes = await epService.getBitacorasByStage(stage.value._id)
      bitacoras.value = bRes.data?.data || []
    }
  } catch (e) { error.value = 'No se pudo cargar la información.' }
  finally {
    loading.value = false
    await nextTick()
    animateProgress(aprendiz.value.progresoPorcentaje)
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
  } finally { enviando.value = false }
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

onMounted(load)
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <!-- CONTENIDO -->
    <div class="main-wrapper">
      <Header title="Seguimiento de Aprendiz">
        <template #actions>
          <button v-if="puedeEnviarRevision" @click="enviarRevision" :disabled="enviando" class="btn-new" style="background:#3B82F6">{{ enviando ? 'Enviando...' : 'Enviar a Revisión' }}</button>
          <button @click="showModal = true" class="btn-new"><span class="material-symbols-outlined">add</span> Nueva Bitácora</button>
          <div v-if="msgRevision" :style="{ fontSize:'11px', fontWeight:'700', padding:'6px 12px', borderRadius:'8px', background: msgRevision.type==='ok'?'#F0FDF4':'#FFF1F2', color: msgRevision.type==='ok'?'#16A34A':'#E11D48' }">{{ msgRevision.text }}</div>
        </template>
      </Header>

      <main class="content">
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
              
              <div class="company-details" v-if="!loading">
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
            <div class="company-footer">
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

        <!-- TABLA BITACORAS -->
        <div class="table-container">
          <div class="table-header">
            <h3>Mis Bitácoras Quincenales</h3>
            <div class="table-icons" style="display:flex;align-items:center;gap:12px">
              <div style="display:flex;align-items:center;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:0 12px;height:36px">
                <span class="material-symbols-outlined" style="font-size:18px;color:#94A3B8">search</span>
                <input v-model="searchQuery" type="text" placeholder="Buscar bitácora..." style="border:none;background:transparent;outline:none;font-size:12px;color:#334155;width:150px;margin-left:8px" />
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
                <td colspan="5" style="text-align:center;padding:32px;color:#94A3B8;font-size:13px">No tienes bitácoras que coincidan con la búsqueda.</td>
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
                  <button v-if="item.estado === 'APROBADA'" @click="openView(item)" style="background:none;border:none;color:#16A34A;cursor:pointer;padding:6px;border-radius:8px" title="Ver Detalle" class="action-btn-hover">
                    <span class="material-symbols-outlined">visibility</span>
                  </button>
                  <button v-else @click="openEdit(item)" style="background:none;border:none;color:#3B82F6;cursor:pointer;padding:6px;border-radius:8px" title="Editar Bitácora" class="action-btn-hover">
                    <span class="material-symbols-outlined">edit_square</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
      <div v-if="error && !loading" style="margin:24px;padding:16px 20px;background:#FFF1F2;border-radius:12px;color:#E11D48;font-size:13px;font-weight:600;display:flex;align-items:center;gap:12px">
        <span class="material-symbols-outlined">error</span> {{ error }}
        <button @click="load" style="margin-left:auto;background:#E11D48;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">Reintentar</button>
      </div>
    </div>

    <!-- MODAL NUEVA BITÁCORA -->
    <div v-if="showModal" @click.self="showModal = false" style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,.15)">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #F1F5F9">
          <h3 style="font-size:16px;font-weight:800;color:#1E293B;margin:0">Nueva Bitácora</h3>
          <button @click="showModal = false" style="background:none;border:none;cursor:pointer;color:#94A3B8;display:flex;align-items:center"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:11px;font-weight:700;color:#64748B">Número de Semana</label>
            <input v-model="form.semana" type="number" min="1" placeholder="Ej: 1" style="border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px;font-size:13px;color:#1E293B;outline:none;width:100%" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:11px;font-weight:700;color:#64748B">Descripción de Actividades</label>
            <textarea v-model="form.descripcion" rows="4" placeholder="Describe las actividades realizadas..." style="border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px;font-size:13px;color:#1E293B;outline:none;width:100%;resize:vertical;font-family:inherit"></textarea>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:11px;font-weight:700;color:#64748B">Horas Reportadas</label>
            <input v-model="form.horasReportadas" type="number" min="0" placeholder="Ej: 40" style="border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px;font-size:13px;color:#1E293B;outline:none;width:100%" />
          </div>
          <div v-if="submitError" style="font-size:12px;font-weight:600;padding:8px 12px;border-radius:8px;background:#FFF1F2;color:#E11D48">{{ submitError }}</div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px">
            <button @click="showModal = false" style="background:#F1F5F9;color:#475569;border:none;padding:10px 18px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">Cancelar</button>
            <button @click="crearBitacora" :disabled="saving" class="btn-new">{{ saving ? 'Guardando...' : 'Guardar Bitácora' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL EDITAR BITÁCORA -->
    <div v-if="showEditModal" @click.self="showEditModal = false" style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,.15)">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #F1F5F9">
          <h3 style="font-size:16px;font-weight:800;color:#1E293B;margin:0">Editar Bitácora</h3>
          <button @click="showEditModal = false" style="background:none;border:none;cursor:pointer;color:#94A3B8;display:flex;align-items:center"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:11px;font-weight:700;color:#64748B">Número de Semana</label>
            <input v-model="editForm.semana" type="number" min="1" placeholder="Ej: 1" style="border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px;font-size:13px;color:#1E293B;outline:none;width:100%" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:11px;font-weight:700;color:#64748B">Descripción de Actividades</label>
            <textarea v-model="editForm.descripcion" rows="4" placeholder="Describe las actividades realizadas..." style="border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px;font-size:13px;color:#1E293B;outline:none;width:100%;resize:vertical;font-family:inherit"></textarea>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:11px;font-weight:700;color:#64748B">Horas Reportadas</label>
            <input v-model="editForm.horasReportadas" type="number" min="0" placeholder="Ej: 40" style="border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px;font-size:13px;color:#1E293B;outline:none;width:100%" />
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px">
            <button @click="showEditModal = false" style="background:#F1F5F9;color:#475569;border:none;padding:10px 18px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">Cancelar</button>
            <button @click="saveEdit" class="btn-new">Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL VER DETALLES -->
    <div v-if="showViewModal && selectedBitacora" @click.self="showViewModal = false" style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,.15);overflow:hidden">
        <div style="background:#F8FAFC;padding:24px;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <span style="font-size:11px;font-weight:800;color:#16A34A;letter-spacing:1px;display:block;margin-bottom:4px">BITÁCORA {{ selectedBitacora.estado }}</span>
            <h3 style="font-size:18px;font-weight:800;color:#1E293B;margin:0">Semana {{ selectedBitacora.semana }}</h3>
          </div>
          <button @click="showViewModal = false" style="background:#fff;border:none;cursor:pointer;color:#94A3B8;display:flex;align-items:center;padding:4px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,.05)"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:20px">
          <div>
            <label style="font-size:11px;font-weight:800;color:#94A3B8;display:block;margin-bottom:6px">ACTIVIDADES REALIZADAS</label>
            <p style="font-size:13px;color:#334155;line-height:1.6;margin:0;background:#F8FAFC;padding:16px;border-radius:12px;border:1px solid #F1F5F9">{{ selectedBitacora.descripcion }}</p>
          </div>
          <div style="display:flex;gap:24px">
            <div>
              <label style="font-size:11px;font-weight:800;color:#94A3B8;display:block;margin-bottom:4px">HORAS REPORTADAS</label>
              <span style="font-size:16px;font-weight:800;color:#1E293B">{{ selectedBitacora.horasReportadas }} h</span>
            </div>
            <div>
              <label style="font-size:11px;font-weight:800;color:#94A3B8;display:block;margin-bottom:4px">ESTADO</label>
              <span v-if="selectedBitacora.estado === 'APROBADA'" style="font-size:12px;font-weight:700;color:#16A34A;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:16px">check_circle</span> Aprobada</span>
              <span v-else-if="selectedBitacora.estado === 'RECHAZADA'" style="font-size:12px;font-weight:700;color:#E11D48;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:16px">cancel</span> Rechazada</span>
              <span v-else style="font-size:12px;font-weight:700;color:#CA8A04;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:16px">schedule</span> Pendiente</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CALENDARIO -->
    <div v-if="showCalendarModal" @click.self="showCalendarModal = false" style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:20px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.15);padding:32px;text-align:center">
        <div style="width:64px;height:64px;background:#F0FDF4;color:#16A34A;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <span class="material-symbols-outlined" style="font-size:32px">event</span>
        </div>
        <h3 style="font-size:18px;font-weight:800;color:#1E293B;margin:0 0 8px">Fechas de Corte Quincenales</h3>
        <p style="font-size:13px;color:#64748B;line-height:1.5;margin:0 0 24px">Las bitácoras deben enviarse los días 15 y 30 de cada mes. Asegúrate de tenerlas firmadas por tu jefe inmediato.</p>
        <button @click="showCalendarModal = false" class="btn-new" style="width:100%;justify-content:center;background:#1A4D2E">Entendido</button>
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
  background: #F4F7F6;
  font-family: 'Inter', sans-serif;
  color: #334155;
  overflow: hidden;
  width: 100%;
}

/* --- Sidebar --- */
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
  color: var(--color_button);
  background: #F0FDF4;
  border-left: 4px solid var(--color_button);
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
  transition: background 0.2s;
  margin-bottom: 8px;
}
.btn-new-visit-sidebar:hover { background: #143b23; }
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

.topbar-actions { display: flex; align-items: center; gap: 24px; }
.btn-new {
  background: var(--color_card);
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
  box-shadow: 0 4px 12px rgba(57, 169, 0, 0.2);
}

.divider { width: 1px; height: 32px; background: #F1F5F9; }
.notification { color: #94A3B8; cursor: pointer; }

.user-profile { display: flex; align-items: center; gap: 12px; }
.user-name { font-size: 12px; font-weight: 800; color: #1E293B; }
.user-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid #F1F5F9; flex-shrink: 0; }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* --- Content --- */
.content { padding: 24px; max-width: 1400px; width: 100%; box-sizing: border-box; }

.info-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 24px; }

.company-card { background: #FFF; border-radius: 20px; border: 1px solid #F1F5F9; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
.company-card-body { padding: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.header-text .label { display: block; font-size: 11px; font-weight: 900; color: #94A3B8; letter-spacing: 1px; }
.header-text .desc { font-size: 11px; color: #94A3B8; }
.status-badge { background: #FFF1F2; color: #E11D48; padding: 6px 12px; border-radius: 8px; font-size: 9px; font-weight: 900; }

.company-details { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.detail-item { display: flex; align-items: center; gap: 12px; background: #F8FAFC; padding: 12px; border-radius: 12px; border: 1px solid #F1F5F9; transition: all 0.3s; }
.detail-item:hover { background: #FFF; border-color: var(--color_button); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.detail-item .icon { width: 36px; height: 36px; background: #FFF; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--color_button); box-shadow: 0 2px 8px rgba(0,0,0,0.02); flex-shrink: 0; }
.detail-item .key { display: block; font-size: 9px; font-weight: 900; color: #94A3B8; margin-bottom: 2px; }
.detail-item .val { font-size: 13px; font-weight: 700; color: #1E293B; }

.company-footer { background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); padding: 16px 24px; border-top: 1px solid #F1F5F9; }
.footer-progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.footer-progress-header .label { font-size: 10px; font-weight: 900; color: #64748B; letter-spacing: 1px; }
.footer-progress-header .stats { font-size: 11px; color: #94A3B8; margin: 4px 0 0; }
.footer-progress-header .stats b { color: #1A4D2E; }
.progress-percentage { font-size: 20px; font-weight: 900; color: #1A4D2E; letter-spacing: -0.5px; }
.progress-bar-container-mini {
  width: 100%;
  height: 14px;
  background: #E2E8F0;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
}
.progress-bar-mini {
  height: 100%;
  background: linear-gradient(90deg, #1A4D2E 0%, #2d7a4a 50%, #1A4D2E 100%);
  background-size: 200% 100%;
  border-radius: 20px;
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: progress-shimmer 2.5s linear infinite;
  box-shadow: 0 2px 8px rgba(26, 77, 46, 0.35);
  position: relative;
}
.progress-bar-mini::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 6px;
  right: 6px;
  height: 4px;
  background: rgba(255,255,255,0.25);
  border-radius: 10px;
}
@keyframes progress-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* --- Table --- */
.table-container { background: #FFF; border-radius: 20px; border: 1px solid #F1F5F9; overflow: hidden; }
.table-header { padding: 24px; display: flex; justify-content: space-between; align-items: center; }
.table-header h3 { font-size: 15px; font-weight: 700; color: #1E293B; }
.table-icons { display: flex; gap: 16px; color: #CBD5E1; }

.bitacora-table { width: 100%; border-collapse: collapse; }
.bitacora-table th { background: #F8FAFC; padding: 12px 24px; text-align: left; font-size: 10px; font-weight: 900; color: #94A3B8; letter-spacing: 1px; }
.bitacora-table td { padding: 16px 24px; border-top: 1px solid #F1F5F9; font-size: 13px; }
.bitacora-table .bold { font-weight: 700; color: #1E293B; }
.bitacora-table .faded { color: #64748B; font-weight: 500; display: flex; align-items: center; gap: 8px; }
.bitacora-table .mini { font-size: 18px; color: #CBD5E1; }
.bitacora-table .center { text-align: center; }
.bitacora-table .right { text-align: right; }

.hours-badge { background: #F1F5F9; color: #64748B; padding: 6px 12px; border-radius: 8px; font-size: 10px; font-weight: 900; }
.badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 9px; font-weight: 900; letter-spacing: 0.5px; border: 1px solid transparent; }
.badge.success { background: #F0FDF4; color: #16A34A; border-color: #DCFCE7; }
.badge.pending { background: #FFF1F2; color: #E11D48; border-color: #FFE4E6; }
.badge .dot { width: 6px; height: 6px; border-radius: 50%; }
.badge.success .dot { background: #16A34A; }
.badge.pending .dot { background: #E11D48; }

.action-btn { color: #CBD5E1; cursor: pointer; transition: color 0.2s; }
.action-btn:hover { color: var(--color_button); }

.table-footer { padding: 24px 32px; background: #F8FAFC; border-top: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }
.footer-stats { font-size: 10px; font-weight: 900; color: #94A3B8; letter-spacing: 0.5px; }
.pagination { display: flex; gap: 8px; }
.pag-btn { background: #FFF; border: 1px solid #E2E8F0; padding: 8px 16px; border-radius: 8px; font-size: 10px; font-weight: 700; color: #475569; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

/* --- Banner --- */
.reminder-banner { background: #F1F5F9; border-radius: 24px; padding: 32px; display: flex; justify-content: space-between; align-items: center; margin-top: 32px; border: 1px solid #E2E8F0; }
.reminder-content { display: flex; align-items: center; gap: 24px; }
.lamp-icon { width: 56px; height: 56px; background: #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--color_button); border: 1px solid #E2E8F0; flex-shrink: 0; }
.rtitle { display: block; font-size: 14px; font-weight: 700; color: #1E293B; margin-bottom: 4px; }
.rdesc { font-size: 12px; color: #94A3B8; font-weight: 500; max-width: 500px; margin: 0; }
.btn-cal { background: #E2E8F0; border: none; padding: 12px 24px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #475569; cursor: pointer; white-space: nowrap; }

/* --- Material Symbols --- */
.material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }

/* --- Spinner --- */
.ep-spinner { width: 40px; height: 40px; border: 4px solid #F1F5F9; border-top: 4px solid #1A4D2E; border-radius: 50%; animation: ep-spin .8s linear infinite; }
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

.action-btn-hover:hover { background: #F1F5F9 !important; }
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
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
  background-size: 800px 100%;
  animation: shimmer 1.8s ease-in-out infinite;
  border-radius: 6px;
}
.skel-badge { width: 80px; height: 24px; border-radius: 8px; }
.progress-card .skel-line { background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 37%, rgba(255,255,255,0.1) 63%); }
</style>

