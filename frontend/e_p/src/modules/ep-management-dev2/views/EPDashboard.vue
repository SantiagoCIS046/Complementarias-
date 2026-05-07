<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../../core/store/auth.store'
import { epService } from '../services/ep.service'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import BtnBack from '@/layouts/btnBackLayout.vue'
import HeaderLayout from '@/layouts/headerViewsLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.user || { name: 'Usuario', role: 'Invitado' })
const stage = ref(null)
const loading = ref(true)
const error = ref(null)

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
  try {
    const res = await epService.getAll()
    const stages = res.data?.data || []
    if (stages.length > 0) {
      stage.value = stages[0]
      const bRes = await epService.getBitacorasByStage(stage.value._id)
      bitacoras.value = bRes.data?.data || []
    }
  } catch (e) { error.value = 'No se pudo cargar la información.' }
  finally { loading.value = false }
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
    const bRes = await epService.getBitacorasByStage(stage.value._id)
    bitacoras.value = bRes.data?.data || []
  } catch (e) { submitError.value = e.response?.data?.message || 'Error al guardar.' }
  finally { saving.value = false }
}

const handleLogout = () => { authStore.logout(); router.push('/login') }

onMounted(load)
</script>

<template>
  <div class="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header />

      <main class="flex-1 overflow-y-auto p-6 lg:p-8">
        <div class="w-full space-y-4">
          <!-- 1. Botón volver -->
          <BtnBack route="/dashboard" />

          <!-- 2. Título de sección con separador verde -->
          <HeaderLayout :title="'Seguimiento: ' + aprendiz.nombre" icon="person_search" />

          <div class="flex items-center justify-between gap-4 mb-2">
            <p class="text-gray-500 font-medium text-xs">Gestión integral de etapa productiva y bitácoras.</p>
            <div class="flex items-center gap-2">
              <div v-if="msgRevision" :style="{ fontSize:'11px', fontWeight:'700', padding:'6px 12px', borderRadius:'8px', background: msgRevision.type==='ok'?'#F0FDF4':'#FFF1F2', color: msgRevision.type==='ok'?'#16A34A':'#E11D48' }">{{ msgRevision.text }}</div>
              <button v-if="puedeEnviarRevision" @click="enviarRevision" :disabled="enviando" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-700 transition-all">
                {{ enviando ? 'Enviando...' : 'Enviar a Revisión' }}
              </button>
              <button @click="showModal = true" class="bg-green-9 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-green-10 transition-all shadow-md">
                <span class="material-symbols-outlined text-sm">add_circle</span>
                Nueva Bitácora
              </button>
            </div>
          </div>

          <!-- SECCIÓN INFO + PROGRESO -->
          <div class="info-grid">
            <div class="company-card">
              <div class="card-header">
                <div class="header-text">
                  <span class="label">INFORMACIÓN DE LA EMPRESA</span>
                  <span class="desc">Detalles del convenio de etapa productiva</span>
                </div>
                <span class="status-badge">ESTADO: {{ aprendiz.estadoActual }}</span>
              </div>
              
              <div class="company-details">
                <div class="detail-item">
                  <div class="icon"><span class="material-symbols-outlined">corporate_fare</span></div>
                  <div class="txt">
                    <span class="key">EMPRESA</span>
                    <span class="val">{{ aprendiz.razonSocial }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="icon"><span class="material-symbols-outlined">badge</span></div>
                  <div class="txt">
                    <span class="key">NIT / ID</span>
                    <span class="val">{{ aprendiz.nit }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="icon"><span class="material-symbols-outlined">person</span></div>
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
            </div>

            <div class="progress-card">
              <div class="card-header">
                <div class="header-text">
                  <span class="label">PROGRESO DE HORAS</span>
                  <span class="desc">Cumplimiento de la etapa</span>
                </div>
                <span class="percentage">{{ aprendiz.progresoPorcentaje }}%</span>
              </div>

              <div class="stats">
                <div class="stat">
                  <span class="stat-val">{{ aprendiz.horasCompletadas }}</span>
                  <span class="stat-lab">Completadas</span>
                </div>
                <div class="stat">
                  <span class="stat-val">{{ aprendiz.horasTotales }}</span>
                  <span class="stat-lab">Requeridas</span>
                </div>
              </div>

              <div class="progress-bar-container">
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" :style="{ width: aprendiz.progresoPorcentaje + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- TABLA BITÁCORAS -->
          <div class="table-container-card">
            <div class="table-header">
              <div class="header-text">
                <span class="label">HISTORIAL DE BITÁCORAS</span>
                <span class="desc">Registro de actividades quincenales</span>
              </div>
              <div class="table-actions">
                <button class="btn-icon"><span class="material-symbols-outlined">filter_list</span></button>
                <button class="btn-icon"><span class="material-symbols-outlined">download</span></button>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="bitacora-table">
                <thead>
                  <tr>
                    <th>SEMANA</th>
                    <th>DETALLE DE ACTIVIDAD</th>
                    <th>HORAS</th>
                    <th>REGISTRO</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="b in bitacoras" :key="b._id">
                    <td><span class="bold">Quincena {{ b.semana }}</span></td>
                    <td>
                      <div class="desc-cell">
                        <span class="val">{{ b.descripcion }}</span>
                        <span class="sub">Actividades realizadas en el periodo</span>
                      </div>
                    </td>
                    <td><span class="bold">{{ b.horasReportadas }}h</span></td>
                    <td>
                      <div class="faded">
                        <span class="material-symbols-outlined mini">calendar_today</span>
                        {{ new Date(b.createdAt).toLocaleDateString() }}
                      </div>
                    </td>
                    <td>
                      <span class="status-pill" :class="b.estado?.toLowerCase()">{{ b.estado || 'PENDIENTE' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- MODAL NUEVA BITÁCORA -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Nueva Bitácora</h3>
          <button @click="showModal = false" class="btn-close">&times;</button>
        </div>
        <form @submit.prevent="crearBitacora" class="modal-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Semana / Quincena</label>
              <input v-model="form.semana" type="number" placeholder="Ej: 1" required>
            </div>
            <div class="form-group">
              <label>Horas Reportadas</label>
              <input v-model="form.horasReportadas" type="number" placeholder="Ej: 40" required>
            </div>
          </div>
          <div class="form-group">
            <label>Descripción de Actividades</label>
            <textarea v-model="form.descripcion" rows="4" placeholder="Describe brevemente tus tareas..." required></textarea>
          </div>
          <p v-if="submitError" class="error-msg">{{ submitError }}</p>
          <div class="form-actions">
            <button type="button" @click="showModal = false" class="btn-cancel">Cancelar</button>
            <button type="submit" :disabled="saving" class="btn-save">{{ saving ? 'Guardando...' : 'Guardar Bitácora' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-header { height: 70px; background: white; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; position: sticky; top: 0; z-index: 100; }
.page-title { font-size: 18px; font-weight: 800; color: #1e293b; margin: 0; }

.info-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 24px; }

.company-card { background: #FFF; border-radius: 20px; padding: 16px; border: 1px solid #F1F5F9; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.header-text .label { display: block; font-size: 11px; font-weight: 900; color: #94A3B8; letter-spacing: 1px; }
.header-text .desc { font-size: 11px; color: #94A3B8; }
.status-badge { background: #F8FAFC; color: #475569; font-size: 10px; font-weight: 800; padding: 6px 12px; border-radius: 8px; border: 1px solid #F1F5F9; }

.company-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.detail-item { display: flex; align-items: center; gap: 12px; }
.detail-item .icon { width: 40px; height: 40px; background: #F8FAFC; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--color_header); border: 1px solid #F1F5F9; }
.detail-item .txt .key { display: block; font-size: 10px; font-weight: 800; color: #94A3B8; }
.detail-item .txt .val { font-size: 13px; font-weight: 700; color: #1E293B; }

.progress-card { background: #FFF; border-radius: 20px; padding: 24px; border: 1px solid #F1F5F9; display: flex; flex-direction: column; }
.percentage { font-size: 24px; font-weight: 900; color: var(--color_header); }
.stats { display: flex; gap: 32px; margin-top: 16px; margin-bottom: 24px; }
.stat .stat-val { display: block; font-size: 18px; font-weight: 800; color: #1E293B; }
.stat .stat-lab { font-size: 12px; color: #94A3B8; font-weight: 600; }

.progress-bar-container { width: 100%; margin-top: auto; }
.progress-bar-bg { height: 10px; background: #F1F5F9; border-radius: 10px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: var(--color_header); border-radius: 10px; }

.table-container-card { background: #FFF; border-radius: 20px; padding: 24px; border: 1px solid #F1F5F9; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.table-actions { display: flex; gap: 8px; }
.btn-icon { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #F1F5F9; background: #FFF; color: #64748B; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.btn-icon:hover { background: #F8FAFC; color: var(--color_header); }

.table-wrapper { overflow-x: auto; }
.bitacora-table { width: 100%; border-collapse: collapse; }
.bitacora-table th {
  background: var(--color_header);
  color: white;
  padding: 8px 16px;
  text-align: left;
  font-size: 10px;
  font-weight: 900;
  color: white;
  letter-spacing: 1px;
}
.bitacora-table td { padding: 10px 16px; border-top: 1px solid #F1F5F9; font-size: 13px; }
.bitacora-table .bold { font-weight: 700; color: #1E293B; }
.bitacora-table .faded { color: #64748B; font-weight: 500; display: flex; align-items: center; gap: 8px; }
.bitacora-table .mini { font-size: 18px; color: #CBD5E1; }

.desc-cell .val { display: block; font-weight: 600; color: #1E293B; }
.desc-cell .sub { font-size: 11px; color: #94A3B8; }

.status-pill { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.status-pill.pendiente { background: #FEF3C7; color: #D97706; }
.status-pill.aprobada { background: #DCFCE7; color: #16A34A; }

/* MODAL */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-card { background: white; border-radius: 24px; width: 100%; max-width: 500px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-header h3 { font-size: 20px; font-weight: 900; color: #1e293b; margin: 0; }
.btn-close { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 12px; font-weight: 800; color: #64748b; margin-bottom: 8px; text-transform: uppercase; }
.form-group input, .form-group textarea { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 14px; color: #1e293b; outline: none; transition: border-color 0.2s; }
.form-group input:focus, .form-group textarea:focus { border-color: var(--color_header); }

.form-actions { display: flex; gap: 12px; margin-top: 12px; }
.btn-cancel { flex: 1; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-weight: 700; cursor: pointer; }
.btn-save { flex: 2; padding: 14px; border-radius: 12px; border: none; background: var(--color_header); color: white; font-weight: 700; cursor: pointer; }

.error-msg { color: #ef4444; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
</style>
