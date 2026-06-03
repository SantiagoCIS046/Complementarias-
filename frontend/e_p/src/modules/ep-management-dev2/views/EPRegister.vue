<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../core/store/auth.store'
import { epService } from '../services/ep.service'
import Sidebar from '../../../components/layout/Sidebar.vue'
import Header from '../../../components/layout/Header.vue'
import SkeletonLoader from '../../../components/ui/SkeletonLoader.vue'

const router = useRouter()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.user || { name: 'Usuario', role: 'Invitado' })

// --- Navegación ---
const activeTab = ref('EP') // 'EP' | 'Empresas' | 'Certificados'

// --- Registro (Etapa Productiva) ---
const currentStep = ref(1)
const totalSteps = 3
const isSubmitting = ref(false)
const formData = reactive({
  modalidad: 'Contrato de Aprendizaje',
  nit: '',
  empresaSeleccionada: null,
  supervisor: { nombre: '', email: '', telefono: '' },
  observaciones: '',
  rutFile: null,
  camaraFile: null
})

const requisitosPorModalidad = computed(() => {
  if (formData.modalidad === 'Contrato de Aprendizaje') {
    return [
      'RUT de la empresa (obligatorio)',
      'Cámara de Comercio (obligatorio)',
      'Copia del Contrato de Aprendizaje firmado (obligatorio)'
    ]
  } else if (formData.modalidad === 'Vínculo Laboral') {
    return [
      'RUT de la empresa (obligatorio)',
      'Cámara de Comercio (obligatorio)',
      'Certificación Laboral con funciones y vigencia (obligatorio)'
    ]
  } else {
    return [
      'RUT de la empresa (obligatorio)',
      'Cámara de Comercio (obligatorio)',
      'Acuerdo/Convenio de Pasantía firmado (obligatorio)'
    ]
  }
})

const errors = reactive({
  nit: '',
  empresa: '',
  supervisorNombre: '',
  supervisorEmail: '',
  supervisorTelefono: '',
  files: ''
})

// --- Control de UI ---
const showSuggestions = ref(false)
const companies = ref([])
const isLoadingCompanies = ref(false)
const searchCompany = ref('')
const certData = ref(null)
const isLoadingCert = ref(false)
const eligibilityInfo = ref(null)
const isCheckingEligibility = ref(false)

// --- Notificaciones ---
const notifications = ref([])
const notify = (text, type = 'success') => {
  const id = Date.now()
  notifications.value.push({ id, text, type })
  setTimeout(() => { notifications.value = notifications.value.filter(n => n.id !== id) }, 4000)
}

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// --- Servicios ---
const loadData = async () => {
  try {
    isLoadingCompanies.value = true
    const resComp = await epService.getCompanies()
    const dataComp = resComp.data?.data || resComp.data || []
    companies.value = Array.isArray(dataComp) ? dataComp : []
    
    isLoadingCert.value = true
    const resCert = await epService.getEstadoCertificacion('current')
    certData.value = resCert.data?.data || { estado: 'Pendiente', mensaje: 'Debes formalizar para continuar.', habilitado: false }

    isCheckingEligibility.value = true
    try {
      const resEleg = await epService.checkElegibility()
      eligibilityInfo.value = resEleg.data?.data || resEleg.data
    } catch (err) {
      eligibilityInfo.value = err.response?.data || { elegible: false, mensaje: 'Error al validar elegibilidad temporal.' }
    }
  } catch (e) {
    console.error(e)
  } finally {
    isLoadingCompanies.value = false
    isLoadingCert.value = false
    isCheckingEligibility.value = false
  }
}

// --- Lógica de Filtros ---
const filteredSuggestions = computed(() => {
  if (!formData.nit || formData.nit.length < 2) return []
  const clean = formData.nit.replace(/\D/g, '')
  return companies.value.filter(c => (c.nit || '').replace(/\D/g, '').includes(clean)).slice(0, 5)
})

const filteredCompaniesList = computed(() => {
  if (!searchCompany.value) return companies.value
  const q = searchCompany.value.toLowerCase()
  return companies.value.filter(c => 
    (c.razonSocial?.toLowerCase().includes(q)) || 
    (c.nit?.includes(q)) || 
    (c.sector?.toLowerCase().includes(q))
  )
})

// --- Acciones ---
const selectCompany = (c) => {
  formData.nit = c.nit
  formData.empresaSeleccionada = { _id: c._id, nombre: c.razonSocial, nit: c.nit, ubicacion: c.direccion || 'Bogotá' }
  errors.empresa = ''
  errors.nit = ''
  showSuggestions.value = false 
}

const handleFileChange = (e, type) => {
  const file = e.target.files[0]
  if (!file) return

  // Validaciones
  if (file.type !== 'application/pdf') {
    notify('Solo se permiten archivos PDF.', 'error')
    e.target.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB
    notify('El archivo es demasiado grande (máximo 5MB).', 'error')
    e.target.value = ''
    return
  }

  if (type === 'rut') formData.rutFile = file
  if (type === 'camara') formData.camaraFile = file
  errors.files = ''
  notify(`Archivo ${type.toUpperCase()} cargado correctamente.`, 'info')
}

const onNitInput = (e) => {
  formData.nit = e.target.value.replace(/\D/g, '') // Solo números
}

const onNameInput = (e) => {
  formData.supervisor.nombre = e.target.value.replace(/[^a-zA-Z\s]/g, '') // Solo letras y espacios
}

const onPhoneInput = (e) => {
  formData.supervisor.telefono = e.target.value.replace(/\D/g, '') // Solo números
}

const validateStep = () => {
  let isValid = true
  // Reset errors
  Object.keys(errors).forEach(k => errors[k] = '')

  if (currentStep.value === 1) {
    if (!formData.empresaSeleccionada) {
      errors.empresa = 'Debes seleccionar una empresa válida.'
      isValid = false
    }
  } else if (currentStep.value === 2) {
    if (!formData.supervisor.nombre || formData.supervisor.nombre.length < 3) {
      errors.supervisorNombre = 'Ingresa el nombre completo del jefe.'
      isValid = false
    }
    if (!formData.supervisor.email) {
      errors.supervisorEmail = 'El correo es obligatorio.'
      isValid = false
    } else if (!validateEmail(formData.supervisor.email)) {
      errors.supervisorEmail = 'Formato de correo inválido.'
      isValid = false
    }
    if (!formData.supervisor.telefono) {
      errors.supervisorTelefono = 'El teléfono es obligatorio.'
      isValid = false
    } else if (formData.supervisor.telefono.length < 7) {
      errors.supervisorTelefono = 'El teléfono debe tener al menos 7 dígitos.'
      isValid = false
    }
  } else if (currentStep.value === 3) {
    if (!formData.rutFile && !formData.camaraFile) {
      errors.files = 'Faltan ambos documentos obligatorios (RUT y Cámara).'
      isValid = false
    } else if (!formData.rutFile) {
      errors.files = 'Falta adjuntar el RUT de la empresa.'
      isValid = false
    } else if (!formData.camaraFile) {
      errors.files = 'Falta adjuntar la Cámara de Comercio.'
      isValid = false
    }
  }
  return isValid
}

const handleNext = () => {
  if (validateStep()) {
    currentStep.value++
  } else {
    notify('Por favor corrige los errores.', 'error')
  }
}

const handleFinish = async () => {
  if (!validateStep()) return
  
  isSubmitting.value = true
  try {
    const fData = new FormData()
    fData.append('companyId', formData.empresaSeleccionada._id)
    fData.append('modalidad', formData.modalidad)
    fData.append('jefeInmediato', formData.supervisor.nombre)
    fData.append('emailContacto', formData.supervisor.email)
    fData.append('telefonoJefe', formData.supervisor.telefono)
    fData.append('observaciones', formData.observaciones)
    fData.append('rutFile', formData.rutFile)
    fData.append('camaraFile', formData.camaraFile)

    const res = await epService.create(fData)
    const stageId = res.data?.data?.stage?._id;
    if (stageId) {
      try {
        await epService.enviarARevision(stageId)
      } catch (err) {
        console.error('Error auto-submitting to validation:', err)
      }
    }
    notify('¡Etapa Productiva registrada y enviada a revisión con éxito!', 'success')
    setTimeout(() => router.push('/mi-ep'), 2000)
  } catch (e) { 
    const msg = e.response?.data?.message || 'Error al procesar el registro.'
    notify(msg, 'error') 
  } finally { 
    isSubmitting.value = false 
  }
}

const handleDownload = async () => {
  try {
    notify('Generando documento...', 'info')
    const res = await epService.descargarCertificado('current')
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Certificado_${currentUser.value.name}.pdf`)
    document.body.appendChild(link)
    link.click()
    notify('Descarga iniciada.', 'success')
  } catch (e) { notify('No disponible aún.', 'error') }
}

onMounted(loadData)
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header>
        <template #title-area>
          <div class="topbar-left" style="display:flex;align-items:center;gap:48px;">
            <div class="top-logo">REPFORA</div>
            <nav class="top-tabs">
              <span :class="['tab', { active: activeTab === 'EP' }]" @click="activeTab = 'EP'">Etapa Productiva</span>
              <span :class="['tab', { active: activeTab === 'Empresas' }]" @click="activeTab = 'Empresas'">Empresas</span>
              <span :class="['tab', { active: activeTab === 'Certificados' }]" @click="activeTab = 'Certificados'">Certificación</span>
            </nav>
          </div>
        </template>
      </Header>

      <main class="content-scrollable">
        <div class="content-container">
          
          <!-- SECCIÓN: REGISTRO (EP) -->
          <div v-if="activeTab === 'EP'" class="fade-in">
            <div class="page-header-text"><h1>Registro de Etapa Productiva</h1><p>Formaliza tu proceso institucional ante el SENA.</p></div>

            <!-- Cargando elegibilidad -->
            <div v-if="isCheckingEligibility" class="card mt-16" style="padding: 24px; text-align: center;">
              <p style="font-weight: 600; color: #64748B; margin: 0;">Validando elegibilidad temporal en el sistema institucional...</p>
            </div>

            <!-- BANNER DE ELEGIBILIDAD (No Elegible) -->
            <div v-else-if="eligibilityInfo && !eligibilityInfo.elegible" class="card eligibility-warning-card mt-16" style="border: 2px solid #EF4444; background: #FEF2F2; color: #991B1B; margin-bottom: 24px; border-radius: 16px; padding: 24px; display: flex; align-items: flex-start; gap: 16px;">
              <span class="material-symbols-outlined" style="font-size: 32px; color: #EF4444; margin-top: 2px;">gpp_maybe</span>
              <div>
                <h3 style="font-weight: 800; font-size: 16px; margin: 0 0 6px 0; color: #991B1B;">Registro Bloqueado por Elegibilidad Temporal</h3>
                <p style="margin: 0; font-size: 14px; font-weight: 600; line-height: 1.5;">{{ eligibilityInfo.mensaje }}</p>
                <div style="margin-top: 12px; font-size: 13px; font-weight: 500; color: #7F1D1D;">
                  Comunícate con la coordinación académica o tu instructor asignado para evaluar tu situación.
                </div>
              </div>
            </div>

            <template v-else>
              <!-- BANNER DE ADVERTENCIA (Elegible pero cerca del límite) -->
              <div v-if="eligibilityInfo && eligibilityInfo.elegible && eligibilityInfo.diasRestantes !== undefined && eligibilityInfo.diasRestantes <= 10" class="card eligibility-warning-card mt-16" style="border: 2px solid #F59E0B; background: #FEF3C7; color: #92400E; margin-bottom: 24px; border-radius: 16px; padding: 24px; display: flex; align-items: flex-start; gap: 16px;">
                <span class="material-symbols-outlined" style="font-size: 32px; color: #D97706; margin-top: 2px;">warning</span>
                <div>
                  <h3 style="font-weight: 800; font-size: 16px; margin: 0 0 6px 0; color: #92400E;">Plazo Próximo a Vencer</h3>
                  <p style="margin: 0; font-size: 14px; font-weight: 600; line-height: 1.5;">{{ eligibilityInfo.mensaje }}</p>
                  <div style="margin-top: 4px; font-size: 13px; font-weight: 500; color: #B45309;">
                    Completa tu registro antes de que venza el plazo para evitar sanciones o deserción del programa.
                  </div>
                </div>
              </div>

              <div class="stepper-box card">
              <div class="stepper-line"><div class="stepper-progress" :style="{ width: ((currentStep - 1) / (totalSteps - 1)) * 100 + '%' }"></div></div>
              <div class="steps-container">
                <div v-for="s in 3" :key="s" :class="['step-item', { active: currentStep === s, completed: currentStep > s }]">
                  <div class="step-num">{{ s }}</div>
                  <div class="step-desc">{{ s === 1 ? 'Empresa' : s === 2 ? 'Jefe' : 'Finalizar' }}</div>
                </div>
              </div>
            </div>
            <div class="main-grid">
              <div class="side-col">
                <div class="card instruction-card"><h3>Instrucciones</h3><p>Busca tu empresa por NIT e ingresa los datos de contacto del supervisor.</p></div>
                <div class="card smart-validation-card"><span class="material-symbols-outlined">verified</span><p>NIT validado automáticamente.</p></div>
              </div>
              <div class="form-col">
                <div class="card form-card">
                  <div v-if="currentStep === 1">
                    <div class="form-group"><label>MODALIDAD</label><select v-model="formData.modalidad" class="custom-select"><option>Contrato de Aprendizaje</option><option>Vínculo Laboral</option><option>Pasantía</option></select></div>
                    <div v-if="!formData.empresaSeleccionada" class="form-group mt-32">
                      <label>NIT EMPRESA</label>
                      <input 
                        v-model="formData.nit" 
                        :class="['search-input', { 'has-error': errors.empresa }]" 
                        @focus="showSuggestions = true" 
                        @input="onNitInput"
                        placeholder="NIT sin puntos ni guiones..."
                      >
                      <span v-if="errors.empresa" class="error-text">{{ errors.empresa }}</span>
                      <div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions-list">
                        <div v-for="c in filteredSuggestions" :key="c._id" class="suggestion-item" @click="selectCompany(c)">
                          <strong>{{ c.razonSocial }}</strong> (NIT: {{ c.nit }})
                        </div>
                      </div>
                    </div>

                    <div v-if="formData.empresaSeleccionada" class="company-result-card">
                      <div class="res-content">
                        <span>Empresa: <strong>{{ formData.empresaSeleccionada.nombre }}</strong></span>
                      </div>
                      <button class="btn-change" @click="formData.empresaSeleccionada = null; formData.nit = ''">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                    </div>
                  </div>
                  <div v-if="currentStep === 2">
                    <div class="form-group">
                      <label>NOMBRE JEFE</label>
                      <input 
                        v-model="formData.supervisor.nombre" 
                        :class="['search-input no-icon', { 'has-error': errors.supervisorNombre }]" 
                        @input="onNameInput"
                        placeholder="Nombre completo"
                      >
                      <span v-if="errors.supervisorNombre" class="error-text">{{ errors.supervisorNombre }}</span>
                    </div>
                    <div class="form-group mt-32">
                      <label>CORREO ELECTRÓNICO</label>
                      <input v-model="formData.supervisor.email" :class="['search-input no-icon', { 'has-error': errors.supervisorEmail }]" placeholder="correo@empresa.com">
                      <span v-if="errors.supervisorEmail" class="error-text">{{ errors.supervisorEmail }}</span>
                    </div>
                    <div class="form-group mt-32">
                      <label>TELÉFONO DE CONTACTO</label>
                      <input 
                        v-model="formData.supervisor.telefono" 
                        type="tel"
                        :class="['search-input no-icon', { 'has-error': errors.supervisorTelefono }]" 
                        @input="onPhoneInput"
                        placeholder="Ej: 3001234567"
                      >
                      <span v-if="errors.supervisorTelefono" class="error-text">{{ errors.supervisorTelefono }}</span>
                    </div>
                  </div>
                  <div v-if="currentStep === 3">
                    <div class="summary-card">
                      <p><strong>Empresa:</strong> {{ formData.empresaSeleccionada?.nombre }}</p>
                      <p><strong>Modalidad:</strong> {{ formData.modalidad }}</p>
                      <p><strong>Jefe:</strong> {{ formData.supervisor.nombre }}</p>
                      <p><strong>Teléfono:</strong> {{ formData.supervisor.telefono }}</p>
                    </div>

                    <!-- Requisitos según modalidad (RF-APR-04) -->
                    <div class="requirements-checklist mt-16" style="background:#F8FAFC; padding: 12px; border-radius: 12px; border: 1px solid #E2E8F0;">
                      <h4 style="font-size:10px; font-weight:800; color:#64748B; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">REQUISITOS REQUERIDOS:</h4>
                      <div v-for="(reqText, rIdx) in requisitosPorModalidad" :key="rIdx" style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                        <span class="material-symbols-outlined" style="font-size:16px; color:#16A34A; font-variation-settings: 'FILL' 1;">task_alt</span>
                        <span style="font-size:12px; color:#475569; font-weight:600;">{{ reqText }}</span>
                      </div>
                    </div>

                    <div class="doc-upload-section mt-32">
                      <div class="form-group">
                        <label>RUT DE LA EMPRESA (PDF - MÁX 5MB)</label>
                        <div class="file-input-wrapper">
                          <input type="file" @change="handleFileChange($event, 'rut')" accept=".pdf" class="file-input">
                          <div v-if="formData.rutFile" class="file-selected-tag">
                            <span class="material-symbols-outlined">check_circle</span> {{ formData.rutFile.name }}
                          </div>
                        </div>
                      </div>
                      <div class="form-group mt-16">
                        <label>CÁMARA DE COMERCIO (PDF - MÁX 5MB)</label>
                        <div class="file-input-wrapper">
                          <input type="file" @change="handleFileChange($event, 'camara')" accept=".pdf" class="file-input">
                          <div v-if="formData.camaraFile" class="file-selected-tag">
                            <span class="material-symbols-outlined">check_circle</span> {{ formData.camaraFile.name }}
                          </div>
                        </div>
                      </div>
                      <span v-if="errors.files" class="error-text">{{ errors.files }}</span>
                    </div>

                    <textarea v-model="formData.observaciones" class="custom-textarea mt-32" placeholder="Observaciones adicionales..."></textarea>
                  </div>
                  <div class="form-footer">
                    <button v-if="currentStep > 1" class="btn-text" @click="currentStep--">VOLVER</button>
                    <div v-else></div> <!-- Espaciador para mantener SIGUIENTE a la derecha -->
                    <button class="btn-primary" @click="currentStep === 3 ? handleFinish() : handleNext()" :disabled="isSubmitting">{{ currentStep === 3 ? 'FINALIZAR' : 'SIGUIENTE' }}</button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

          <!-- SECCIÓN: EMPRESAS -->
          <div v-if="activeTab === 'Empresas'" class="fade-in">
            <div class="page-header-text"><h1>Directorio de Empresas</h1></div>
            <div class="card table-card">
              <div class="search-bar"><span class="material-symbols-outlined">search</span><input v-model="searchCompany" placeholder="Filtrar empresas..."></div>
              <table class="modern-table">
                <thead><tr><th>EMPRESA</th><th>NIT</th><th>SECTOR</th><th>UBICACIÓN</th></tr></thead>
                <tbody>
                  <tr v-if="isLoadingCompanies"><td colspan="4" style="padding:0; border:none;"><SkeletonLoader variant="table" :rows="5" :columns="4" /></td></tr>
                  <tr v-for="c in filteredCompaniesList" :key="c._id"><td><strong>{{ c.razonSocial }}</strong></td><td>{{ c.nit }}</td><td>{{ c.sector || 'General' }}</td><td>{{ c.direccion || 'Colombia' }}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- SECCIÓN: CERTIFICADO -->
          <div v-if="activeTab === 'Certificados'" class="fade-in">
            <div class="page-header-text"><h1>Certificación</h1></div>
            <div class="card cert-view">
              <div class="cert-status-box">
                <div class="cert-icon"><span class="material-symbols-outlined">workspace_premium</span></div>
                <div class="cert-details"><h3>Estado: {{ certData?.estado || 'Pendiente' }}</h3><p>{{ certData?.mensaje || 'Aún no disponible.' }}</p></div>
              </div>
              <button class="btn-primary" @click="handleDownload" :disabled="!certData?.habilitado">Descargar Certificado</button>
            </div>
          </div>

        </div>
      </main>
    </div>
    <div class="notification-center">
      <TransitionGroup name="toast"><div v-for="n in notifications" :key="n.id" class="toast-card" :class="n.type">{{ n.text }}</div></TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined');

.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }

@media (max-width: 768px) {
  .stepper-box {
    padding: 20px 16px !important;
    margin-bottom: 24px;
  }
  .stepper-line {
    left: 30px;
    right: 30px;
    top: 36px;
  }
  .step-num {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    font-size: 12px;
  }
  .step-desc {
    font-size: 8px;
    margin-top: 6px;
  }
  .main-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .content-container {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .card {
    padding: 16px;
    border-radius: 16px;
  }
  .form-footer {
    flex-direction: column-reverse;
    gap: 12px;
    padding-top: 20px;
  }
  .btn-primary {
    width: 100%;
    padding: 14px 24px;
    border-radius: 12px;
    font-size: 14px;
    min-width: unset;
  }
  .btn-text {
    width: 100%;
    text-align: center;
    padding: 10px;
    font-size: 14px;
  }
  .content-container {
    padding: 8px;
  }
}

.content-scrollable { flex: 1; overflow-y: auto; background: var(--bg-app); }
.content-container { padding: 24px; max-width: 1400px; width: 100%; box-sizing: border-box; margin: 0; }

.card { background: var(--bg-primary); border-radius: 24px; padding: 32px; border: 1px solid var(--border-primary); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
.stepper-box { margin-bottom: 40px; position: relative; padding: 32px 64px !important; }
.stepper-line { position: absolute; top: 52px; left: 100px; right: 100px; height: 4px; background: var(--border-primary); }
.stepper-progress { height: 100%; background: var(--color_button); transition: 0.5s; }
.steps-container { display: flex; justify-content: space-between; position: relative; z-index: 1; }
.step-num { width: 40px; height: 40px; border-radius: 10px; background: var(--bg-secondary); border: 2px solid var(--border-primary); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--text-muted); }
.step-item.active .step-num { background: var(--color_button); color: var(--color_text_button); border-color: var(--color_button); }
.step-item.completed .step-num { background: var(--bg-active); color: var(--color_button); border-color: var(--color_button); }
.step-desc { font-size: 10px; font-weight: 800; text-align: center; margin-top: 8px; color: var(--text-muted); }
.step-item.active .step-desc { color: var(--text-primary); font-weight: 800; }
.step-item.completed .step-desc { color: var(--color_button); }

.main-grid { display: grid; grid-template-columns: 300px 1fr; gap: 32px; }
.form-group label { font-size: 11px; font-weight: 900; color: var(--text-muted); display: block; margin-bottom: 10px; }
.custom-select, .search-input { width: 100%; background: var(--bg-secondary); border: 2px solid var(--border-primary); border-radius: 16px; padding: 16px 20px; outline: none; font-size: 14px; font-weight: 600; color: var(--text-primary); }
.no-icon { padding-left: 20px; }
.suggestions-list { position: absolute; background: var(--bg-elevated); border: 1px solid var(--border-primary); border-radius: 12px; z-index: 100; width: 100%; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.suggestion-item { padding: 12px 20px; cursor: pointer; font-size: 13px; border-bottom: 1px solid var(--border-primary); color: var(--text-primary); }
.suggestion-item:hover { background: var(--bg-hover); color: var(--color_button); }
.company-result-card { 
  margin-top: 16px; 
  border: 1px solid var(--color_button); 
  border-radius: 14px; 
  padding: 10px 16px; 
  background: var(--bg-active); 
  color: var(--color_button); 
  font-weight: 700; 
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}
.res-content { display: flex; align-items: center; gap: 8px; }
.res-content::before {
  content: 'check_circle';
  font-family: 'Material Symbols Outlined';
  font-size: 18px;
}
.btn-change {
  background: none;
  border: none;
  color: var(--color_button);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}
.btn-change:hover { background: var(--bg-hover); color: var(--color_button); }
.search-input.has-error { border-color: #EF4444; background-color: rgba(239, 68, 68, 0.1); }
.file-input { 
  width: 100%; 
  padding: 8px 12px; 
  border: 1px solid var(--border-primary); 
  border-radius: 12px; 
  font-size: 13px; 
  color: var(--text-secondary); 
  background: var(--bg-secondary); 
  cursor: pointer;
  transition: all 0.2s;
}
.file-selected-tag { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  color: var(--color_button); 
  font-size: 12px; 
  font-weight: 700; 
  margin-top: 8px; 
}
.file-selected-tag span { font-size: 18px; }

.form-footer { 
  margin-top: auto; 
  padding-top: 40px; 
  border-top: 2px solid var(--border-primary); 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  gap: 20px;
}
.btn-primary { 
  background: var(--color_button); 
  color: var(--color_text_button); 
  border: none; 
  padding: 18px 40px; 
  border-radius: 18px; 
  font-weight: 800; 
  font-size: 15px;
  cursor: pointer; 
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(26, 77, 46, 0.2); filter: brightness(0.9); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-text { 
  background: none; 
  border: none; 
  color: var(--text-muted); 
  font-weight: 800; 
  font-size: 15px;
  cursor: pointer; 
  padding: 10px 20px;
  transition: color 0.2s;
}
.btn-text:hover { color: var(--text-primary); }

.modern-table { width: 100%; border-collapse: collapse; }
.modern-table th { text-align: left; padding: 16px; border-bottom: 1px solid var(--border-primary); font-size: 11px; color: var(--text-muted); }
.modern-table td { padding: 16px; border-bottom: 1px solid var(--border-primary); font-size: 13px; font-weight: 600; color: var(--text-primary); }

.notification-center { position: fixed; top: 24px; right: 24px; z-index: 2000; }
.toast-card { background: var(--color_button); color: var(--color_text_button); padding: 12px 24px; border-radius: 12px; margin-bottom: 8px; font-weight: 700; box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
.toast-card.error { background: #EF4444; }
.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
.mt-32 { margin-top: 32px; }
.cert-view { display: flex; justify-content: space-between; align-items: center; }
.cert-status-box { display: flex; gap: 20px; align-items: center; }
.cert-icon { width: 60px; height: 60px; background: var(--bg-active); color: var(--color_button); border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.cert-icon span { font-size: 32px; }
.custom-textarea { width: 100%; background: var(--bg-secondary); border: 2px solid var(--border-primary); border-radius: 16px; padding: 16px; outline: none; min-height: 100px; font-family: inherit; color: var(--text-primary); }

.topbar-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.top-logo {
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--color_button);
  letter-spacing: 0.5px;
}

.top-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 10px;
  transition: all 0.2s ease;
  user-select: none;
}

.tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tab.active {
  background: var(--bg-active);
  color: var(--color_button);
  border: 1px solid rgba(46, 125, 50, 0.15);
}
</style>