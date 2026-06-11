<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
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
  camaraFile: null,
  terceroFile: null
})

// Etiqueta del 3er documento según modalidad
const terceroFileLabel = computed(() => {
  if (formData.modalidad === 'Vínculo Laboral') return 'CERTIFICACIÓN LABORAL CON FUNCIONES Y VIGENCIA (PDF - MÁX 5MB)'
  if (formData.modalidad === 'Pasantía') return 'ACUERDO/CONVENIO DE PASANTÍA FIRMADO (PDF - MÁX 5MB)'
  return 'COPIA DEL CONTRATO DE APRENDIZAJE FIRMADO (PDF - MÁX 5MB)'
})

// Resetear formulario completamente
const resetForm = () => {
  formData.modalidad = 'Contrato de Aprendizaje'
  formData.nit = ''
  formData.empresaSeleccionada = null
  formData.supervisor.nombre = ''
  formData.supervisor.email = ''
  formData.supervisor.telefono = ''
  formData.observaciones = ''
  formData.rutFile = null
  formData.camaraFile = null
  formData.terceroFile = null
  currentStep.value = 1
  Object.keys(errors).forEach(k => errors[k] = '')
}

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
const currentPage = ref(1)
const itemsPerPage = 5

const paginatedCompanies = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredCompaniesList.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredCompaniesList.value.length / itemsPerPage)
})

watch(searchCompany, () => {
  currentPage.value = 1
})

const certData = ref(null)
const isLoadingCert = ref(false)
const eligibilityInfo = ref(null)
const isCheckingEligibility = ref(false)
const activeEP = ref(null)
const isLoadingActiveEP = ref(false)

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
  // Ejecutar carga de empresas y certificación en paralelo (errores no bloquean elegibilidad)
  isLoadingCompanies.value = true
  isLoadingCert.value = true
  isCheckingEligibility.value = true
  isLoadingActiveEP.value = true

  // Carga de empresas (no crítica)
  epService.getCompanies()
    .then(resComp => {
      const dataComp = resComp.data?.data || resComp.data || []
      companies.value = Array.isArray(dataComp) ? dataComp : []
    })
    .catch(() => { companies.value = [] })
    .finally(() => { isLoadingCompanies.value = false })

  // Carga de certificación (no crítica)
  epService.getEstadoCertificacion('current')
    .then(resCert => {
      certData.value = resCert.data?.data || { estado: 'Pendiente', mensaje: 'Debes formalizar para continuar.', habilitado: false }
    })
    .catch(() => {
      certData.value = { estado: 'Pendiente', mensaje: 'Debes formalizar para continuar.', habilitado: false }
    })
    .finally(() => { isLoadingCert.value = false })

  // Carga de EP activa
  epService.getAll()
    .then(res => {
      const stages = res.data?.data || res.data || []
      const active = stages.find(s => s.estado !== 'RECHAZADO')
      if (active) {
        activeEP.value = active
      }
    })
    .catch(err => {
      console.error('Error fetching active EP:', err)
    })
    .finally(() => {
      isLoadingActiveEP.value = false
    })

  // Verificación de elegibilidad (CRÍTICA — siempre debe ejecutarse)
  try {
    const resEleg = await epService.checkElegibility()
    // El backend devuelve { success: true, data: { elegible, mensaje, ... } }
    eligibilityInfo.value = resEleg.data?.data || resEleg.data
  } catch (err) {
    // Si el backend devuelve error HTTP, usar el body del error
    eligibilityInfo.value = err.response?.data?.data || err.response?.data || { elegible: false, mensaje: 'No se pudo verificar la elegibilidad. Contacta al coordinador.' }
  } finally {
    isCheckingEligibility.value = false
    // Fail-safe: si eligibilityInfo sigue null, bloquear por seguridad
    if (!eligibilityInfo.value) {
      eligibilityInfo.value = { elegible: false, mensaje: 'No se pudo verificar la elegibilidad. Contacta al coordinador académico.' }
    }
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
  return companies.value.filter(c => {
    const razonSocial = (c.razon_social || c.razonSocial || '').toLowerCase()
    const nit = (c.nit || '')
    const sector = (c.sector_economico || c.sector || 'General').toLowerCase()
    return razonSocial.includes(q) || nit.includes(q) || sector.includes(q)
  })
})

// --- Acciones ---
const selectCompany = (c) => {
  formData.nit = c.nit
  formData.empresaSeleccionada = { 
    _id: c._id, 
    nombre: c.razon_social || c.razonSocial, 
    nit: c.nit, 
    ubicacion: c.direccion || 'Colombia' 
  }
  errors.empresa = ''
  errors.nit = ''
  showSuggestions.value = false 
}

const postularseAEmpresa = (c) => {
  selectCompany(c)
  activeTab.value = 'EP'
  currentStep.value = 2 // Ir directo al paso 2 (datos del jefe)
  notify(`Has seleccionado a ${c.razon_social || c.razonSocial} para tu registro. Completa los datos de contacto del supervisor.`, 'success')
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
  if (type === 'tercero') formData.terceroFile = file
  errors.files = ''
  notify(`Archivo cargado correctamente.`, 'info')
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
    const missing = []
    if (!formData.rutFile) missing.push('RUT de la empresa')
    if (!formData.camaraFile) missing.push('Cámara de Comercio')
    if (!formData.terceroFile) {
      if (formData.modalidad === 'Vínculo Laboral') missing.push('Certificación Laboral')
      else if (formData.modalidad === 'Pasantía') missing.push('Acuerdo/Convenio de Pasantía')
      else missing.push('Contrato de Aprendizaje firmado')
    }
    if (missing.length > 0) {
      errors.files = `Falta(n) adjuntar: ${missing.join(', ')}.`
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
    if (formData.terceroFile) fData.append('terceroFile', formData.terceroFile)

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
          <div class="topbar-left">
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
            <div v-if="isCheckingEligibility || isLoadingActiveEP" class="card mt-16" style="padding: 24px; text-align: center;">
              <p style="font-weight: 600; color: #64748B; margin: 0;">Validando elegibilidad temporal en el sistema institucional...</p>
            </div>

            <!-- VINCULADO A UNA EMPRESA (EP ACTIVA) -->
            <div v-else-if="activeEP" class="card mt-16 active-ep-card" style="border: 2px solid #10B981; background: #ECFDF5; color: #065F46; margin-bottom: 24px; border-radius: 20px; padding: 32px;">
              <div style="display: flex; align-items: flex-start; gap: 24px;">
                <span class="material-symbols-outlined" style="font-size: 48px; color: #10B981; margin-top: 2px; flex-shrink: 0; font-variation-settings: 'FILL' 1;">
                  domain_verification
                </span>
                <div style="flex: 1;">
                  <h2 style="font-weight: 800; font-size: 20px; margin: 0 0 8px 0; color: #064E3B; display: flex; align-items: center; gap: 8px;">
                    Vinculado a una Empresa
                    <span style="font-size: 11px; font-weight: 700; background: #D1FAE5; color: #065F46; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #A7F3D0;">
                      {{ activeEP.estado.replace('_', ' ') }}
                    </span>
                  </h2>
                  <p style="margin: 0 0 20px 0; font-size: 14px; font-weight: 600; line-height: 1.6; color: #047857;">
                    Ya cuentas con un registro de Etapa Productiva y estás vinculado a una empresa en el sistema. A continuación se presentan los detalles del vínculo actual:
                  </p>
                  
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; background: rgba(255, 255, 255, 0.7); padding: 20px; border-radius: 14px; border: 1px solid #A7F3D0;">
                    <div>
                      <span style="font-size: 10px; font-weight: 800; color: #065F46; text-transform: uppercase; display: block; margin-bottom: 4px;">Empresa</span>
                      <strong style="font-size: 14px; color: #064E3B;">{{ activeEP.companyId?.razon_social || activeEP.companySnapshot?.razonSocial || 'N/A' }}</strong>
                    </div>
                    <div>
                      <span style="font-size: 10px; font-weight: 800; color: #065F46; text-transform: uppercase; display: block; margin-bottom: 4px;">NIT</span>
                      <strong style="font-size: 14px; color: #064E3B;">{{ activeEP.companyId?.nit || activeEP.companySnapshot?.nit || 'N/A' }}</strong>
                    </div>
                    <div>
                      <span style="font-size: 10px; font-weight: 800; color: #065F46; text-transform: uppercase; display: block; margin-bottom: 4px;">Modalidad</span>
                      <strong style="font-size: 14px; color: #064E3B;">{{ activeEP.modalidad?.replace('_', ' ') || 'N/A' }}</strong>
                    </div>
                    <div>
                      <span style="font-size: 10px; font-weight: 800; color: #065F46; text-transform: uppercase; display: block; margin-bottom: 4px;">Radicado / Ficha</span>
                      <strong style="font-size: 14px; color: #064E3B;">{{ activeEP.radicado || activeEP.ficha || 'N/A' }}</strong>
                    </div>
                  </div>

                  <div style="display: flex; gap: 16px; align-items: center;">
                    <button class="btn-primary" @click="router.push('/mi-ep')" style="min-width: 200px; background: #059669; color: #fff;">
                      <span class="material-symbols-outlined" style="margin-right: 8px;">dashboard</span>
                      Ir a Mi Panel de EP
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- BANNER DE ELEGIBILIDAD (No Elegible) -->
            <div v-else-if="eligibilityInfo && !eligibilityInfo.elegible" class="card mt-16" style="border: 2px solid #EF4444; background: #FEF2F2; color: #991B1B; margin-bottom: 24px; border-radius: 16px; padding: 28px; display: flex; align-items: flex-start; gap: 20px;">
              <span class="material-symbols-outlined" style="font-size: 40px; color: #EF4444; margin-top: 2px; flex-shrink: 0;">
                {{ eligibilityInfo.mensaje?.includes('Ficha') ? 'badge' : eligibilityInfo.mensaje?.includes('activa') ? 'lock' : 'gpp_maybe' }}
              </span>
              <div style="flex:1;">
                <h3 style="font-weight: 800; font-size: 17px; margin: 0 0 8px 0; color: #991B1B;">
                  {{ eligibilityInfo.mensaje?.includes('Ficha') ? 'Sin Ficha de Formación Asignada' :
                     eligibilityInfo.mensaje?.includes('activa') ? 'Registro Bloqueado — EP Activa' :
                     'Registro Bloqueado por Elegibilidad' }}
                </h3>
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; line-height: 1.6; color: #7F1D1D;">{{ eligibilityInfo.mensaje }}</p>
                <div style="background: rgba(239,68,68,0.1); border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 500; color: #991B1B; display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" style="font-size: 16px;">support_agent</span>
                  Comunícate con la coordinación académica o tu instructor asignado para resolver esta situación.
                </div>
              </div>
            </div>

            <template v-else-if="eligibilityInfo && eligibilityInfo.elegible">
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
                          <strong>{{ c.razon_social || c.razonSocial }}</strong> (NIT: {{ c.nit }})
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
                      <div class="form-group mt-16">
                        <label>{{ terceroFileLabel }}</label>
                        <div class="file-input-wrapper">
                          <input type="file" @change="handleFileChange($event, 'tercero')" accept=".pdf" class="file-input">
                          <div v-if="formData.terceroFile" class="file-selected-tag">
                            <span class="material-symbols-outlined">check_circle</span> {{ formData.terceroFile.name }}
                          </div>
                        </div>
                      </div>
                      <span v-if="errors.files" class="error-text">{{ errors.files }}</span>
                    </div>

                    <textarea v-model="formData.observaciones" class="custom-textarea mt-32" placeholder="Observaciones adicionales..."></textarea>
                  </div>
                  <div class="form-footer">
                    <button v-if="currentStep > 1" class="btn-text-danger" @click="currentStep--">VOLVER</button>
                    <button v-else class="btn-text-danger" @click="resetForm()">REINICIAR</button>
                    <button class="btn-primary" @click="currentStep === 3 ? handleFinish() : handleNext()" :disabled="isSubmitting">{{ currentStep === 3 ? 'FINALIZAR' : 'SIGUIENTE' }}</button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

          <!-- SECCIÓN: EMPRESAS -->
          <div v-if="activeTab === 'Empresas'" class="fade-in">
            <div class="page-header-text">
              <h1>Directorio de Empresas Autorizadas</h1>
              <p>Explore las organizaciones con convenio vigente e inicie su postulación formal para el desarrollo de la Etapa Productiva.</p>
            </div>
            
            <div class="card table-card">
              <div class="search-bar">
                <span class="material-symbols-outlined">search</span>
                <input v-model="searchCompany" placeholder="Buscar por razón social, NIT o sector económico...">
              </div>
              
              <!-- Vista de Escritorio: Tabla -->
              <div class="desktop-only-table">
                <div style="overflow-x: auto;">
                  <table class="modern-table">
                    <thead>
                      <tr>
                        <th>Empresa</th>
                        <th>NIT</th>
                        <th>Sector</th>
                        <th>Ubicación</th>
                        <th style="text-align: center;">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="isLoadingCompanies">
                        <td colspan="5" style="padding: 0; border: none;">
                          <SkeletonLoader variant="table" :rows="5" :columns="5" />
                        </td>
                      </tr>
                      <tr v-else-if="filteredCompaniesList.length === 0">
                        <td colspan="5" style="text-align: center; padding: 32px; color: var(--text-muted); font-weight: 600;">
                          No se encontraron empresas que coincidan con la búsqueda.
                        </td>
                      </tr>
                      <tr v-for="c in paginatedCompanies" :key="c._id">
                        <td>
                          <div class="company-name-cell">
                            <div class="company-logo-badge">
                              <span class="material-symbols-outlined">domain</span>
                            </div>
                            <div>
                              <strong style="font-size: 14px; font-weight: 800; color: var(--text-primary); display: block;">
                                {{ c.razon_social || c.razonSocial }}
                              </strong>
                              <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">
                                Código: {{ c._id.substring(c._id.length - 6).toUpperCase() }}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="nit-badge">{{ c.nit }}</span>
                        </td>
                        <td>
                          <span class="sector-pill">{{ c.sector_economico || c.sector || 'General' }}</span>
                        </td>
                        <td>
                          <div class="location-cell">
                            <span class="material-symbols-outlined">location_on</span>
                            <span>{{ c.direccion || 'Colombia' }}{{ c.municipio ? `, ${c.municipio}` : '' }}</span>
                          </div>
                        </td>
                        <td style="text-align: center;">
                          <button 
                            class="btn-apply-company" 
                            @click="postularseAEmpresa(c)"
                            :disabled="activeEP || (eligibilityInfo && !eligibilityInfo.elegible)"
                            :title="activeEP ? 'Ya tienes una Etapa Productiva registrada' : (eligibilityInfo && !eligibilityInfo.elegible ? 'No cumples con los requisitos de elegibilidad' : 'Postularse a esta empresa')"
                          >
                            <span class="material-symbols-outlined" style="font-size: 18px;">assignment_turned_in</span>
                            Postularse
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Vista de Móvil: Tarjetas (Cards) -->
              <div class="mobile-only-cards">
                <div v-if="isLoadingCompanies" class="loading-cards">
                  Cargando directorio de empresas...
                </div>
                <div v-else-if="filteredCompaniesList.length === 0" class="no-companies-card">
                  No se encontraron empresas que coincidan con la búsqueda.
                </div>
                <div v-else class="company-cards-grid">
                  <div v-for="c in paginatedCompanies" :key="c._id" class="company-mobile-card">
                    <!-- Cabecera de la Tarjeta: Logo y Título -->
                    <div class="company-card-header">
                      <div class="company-logo-badge">
                        <span class="material-symbols-outlined">domain</span>
                      </div>
                      <div class="company-card-title">
                        <strong class="company-name-text">{{ c.razon_social || c.razonSocial }}</strong>
                        <span class="company-code-text">Código: {{ c._id.substring(c._id.length - 6).toUpperCase() }}</span>
                      </div>
                    </div>

                    <!-- Datos y Detalles -->
                    <div class="company-card-body">
                      <div class="card-detail">
                        <span class="detail-label">NIT</span>
                        <span class="nit-badge">{{ c.nit }}</span>
                      </div>
                      <div class="card-detail">
                        <span class="detail-label">Sector</span>
                        <span class="sector-pill">{{ c.sector_economico || c.sector || 'General' }}</span>
                      </div>
                      <div class="card-detail">
                        <span class="detail-label">Ubicación</span>
                        <div class="location-cell">
                          <span class="material-symbols-outlined">location_on</span>
                          <span>{{ c.direccion || 'Colombia' }}{{ c.municipio ? `, ${c.municipio}` : '' }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Botón de Postulación -->
                    <div class="company-card-footer">
                      <button 
                        class="btn-apply-company-mobile" 
                        @click="postularseAEmpresa(c)"
                        :disabled="activeEP || (eligibilityInfo && !eligibilityInfo.elegible)"
                        :title="activeEP ? 'Ya tienes una Etapa Productiva registrada' : (eligibilityInfo && !eligibilityInfo.elegible ? 'No cumples con los requisitos de elegibilidad' : 'Postularse a esta empresa')"
                      >
                        <span class="material-symbols-outlined">assignment_turned_in</span>
                        Postularse
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Controles de Paginación -->
              <div v-if="totalPages > 1" class="pagination-controls">
                <button 
                  v-if="currentPage > 1" 
                  class="btn-pagination prev" 
                  @click="currentPage--"
                >
                  <span class="material-symbols-outlined">chevron_left</span>
                  Anterior
                </button>
                <span class="pagination-info">Página {{ currentPage }} de {{ totalPages }}</span>
                <button 
                  v-if="currentPage < totalPages" 
                  class="btn-pagination next" 
                  @click="currentPage++"
                >
                  Siguiente
                  <span class="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
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

.content-scrollable { flex: 1; overflow-y: auto; background: var(--bg-app); }
.content-container { padding: 24px; max-width: 1400px; width: 100%; box-sizing: border-box; margin: 0; }

.card { background: var(--bg-primary); border-radius: 24px; padding: 32px; border: 1px solid var(--border-primary); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
.stepper-box {
  margin-bottom: 32px;
  background: var(--bg-secondary) !important;
  border: 1px solid var(--border-primary) !important;
  border-radius: 24px;
  padding: 24px 48px !important;
  box-shadow: none !important;
  position: relative;
}
.stepper-line { position: absolute; top: 42px; left: 80px; right: 80px; height: 3px; background: var(--border-primary); }
.stepper-progress { height: 100%; background: var(--color_button); transition: 0.5s; }
.steps-container { display: flex; justify-content: space-between; position: relative; z-index: 1; }
.step-num { 
  width: 36px; 
  height: 36px; 
  border-radius: 12px; 
  background: var(--bg-secondary); 
  border: 1px solid var(--border-primary); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-weight: 800; 
  color: var(--text-muted); 
  font-size: 14px;
}
.step-item.active .step-num { background: var(--color_button); color: var(--color_text_button); border-color: var(--color_button); }
.step-item.completed .step-num { background: var(--bg-active); color: var(--color_button); border-color: var(--color_button); }
.step-desc { font-size: 11px; font-weight: 800; text-align: center; margin-top: 8px; color: var(--text-muted); }
.step-item.active .step-desc { color: var(--text-primary); font-weight: 800; }
.step-item.completed .step-desc { color: var(--color_button); }

.main-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
  align-items: start;
}
.side-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.instruction-card {
  position: relative;
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
  border: 1px solid var(--border-primary);
  border-left: 4px solid var(--color_button) !important;
  border-radius: 20px;
  padding: 24px !important;
  box-shadow: 0 10px 25px -15px rgba(0,0,0,0.05);
}
.instruction-card h3 {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.instruction-card h3::before {
  content: 'info';
  font-family: 'Material Symbols Outlined';
  font-size: 20px;
  color: var(--color_button);
}
.instruction-card p {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}
.smart-validation-card {
  background: rgba(16, 185, 129, 0.04) !important;
  border: 1px dashed rgba(16, 185, 129, 0.3) !important;
  border-radius: 20px;
  padding: 24px !important;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  box-shadow: none !important;
}
.smart-validation-card span {
  font-size: 24px;
  color: #10B981;
  font-variation-settings: 'FILL' 1;
  animation: pulse-green 2s infinite ease-in-out;
  flex-shrink: 0;
}
.smart-validation-card p {
  font-size: 13px;
  line-height: 1.5;
  color: #065F46;
  margin: 0;
  font-weight: 600;
}
@keyframes pulse-green {
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 3px rgba(16, 185, 129, 0.3)); }
  100% { transform: scale(1); opacity: 0.9; }
}

.form-card {
  padding: 40px !important;
  border-radius: 24px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  box-shadow: 0 15px 35px -20px rgba(0,0,0,0.08);
  min-height: 380px;
  display: flex;
  flex-direction: column;
}
.form-group {
  margin-bottom: 24px;
  position: relative;
  text-align: left;
}
.form-group label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
  display: block;
  margin-bottom: 12px;
}
.custom-select, .search-input {
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary) !important;
  border-radius: 16px;
  padding: 16px 20px;
  outline: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  box-sizing: border-box;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.01);
}
.custom-select:focus, .search-input:focus {
  border-color: var(--color_button) !important;
  background: var(--bg-primary);
  box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.08), inset 0 1px 2px rgba(0,0,0,0.01);
}
.custom-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 20px center;
  background-size: 16px;
  padding-right: 48px;
}
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

.btn-text-danger { 
  background: none; 
  border: none; 
  color: #EF4444; 
  font-weight: 800; 
  font-size: 15px;
  cursor: pointer; 
  padding: 10px 20px;
  transition: all 0.2s ease;
}
.btn-text-danger:hover { 
  color: #DC2626; 
  text-shadow: 0 0 8px rgba(239, 68, 68, 0.15);
}

/* --- Directorio de Empresas Moderno --- */
.table-card {
  padding: 24px !important;
  background: var(--bg-primary);
  border-radius: 24px;
  border: 1px solid var(--border-primary);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 16px;
  padding: 12px 20px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.search-bar:focus-within {
  border-color: var(--color_button);
  box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.1);
}

.search-bar input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  width: 100%;
}

.search-bar span {
  color: var(--text-muted);
}

.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  margin-top: -8px;
}

.modern-table th {
  padding: 16px 24px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-muted);
  border: none;
  text-align: left;
}

.modern-table tbody tr {
  background: var(--bg-primary);
  border-radius: 16px;
  transition: all 0.2s ease;
}

.modern-table tbody tr:hover {
  background: var(--bg-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.modern-table td {
  padding: 16px 24px;
  border-top: 1px solid var(--border-primary);
  border-bottom: 1px solid var(--border-primary);
  font-size: 13px;
  color: var(--text-primary);
  vertical-align: middle;
}

.modern-table td:first-child {
  border-left: 1px solid var(--border-primary);
  border-radius: 16px 0 0 16px;
}

.modern-table td:last-child {
  border-right: 1px solid var(--border-primary);
  border-radius: 0 16px 16px 0;
}

/* Badges y Textos */
.company-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.company-logo-badge {
  width: 36px;
  height: 36px;
  background: var(--bg-secondary);
  color: var(--color_button);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-primary);
}

.company-logo-badge span {
  font-size: 20px;
}

.nit-badge {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 700;
  background: var(--bg-secondary);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  font-size: 12px;
}

.sector-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(46, 125, 50, 0.15);
  background: var(--bg-hover);
  color: var(--color_button);
}

.location-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  text-align: left;
}

.location-cell span {
  font-size: 16px;
  color: var(--text-muted);
}

.btn-apply-company {
  background: var(--bg-hover);
  color: var(--color_button);
  border: 1px solid var(--color_button);
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-apply-company:hover:not(:disabled) {
  background: var(--color_button);
  color: var(--color_text_button);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(46, 125, 50, 0.15);
}

.btn-apply-company:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--border-primary);
  color: var(--text-muted);
  background: var(--bg-secondary);
}

.notification-center {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
}

.toast-card {
  pointer-events: auto;
  background: rgba(46, 125, 50, 0.95);
  backdrop-filter: blur(8px);
  color: white;
  padding: 10px 16px;
  border-radius: 12px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  max-width: 320px;
  width: auto;
  border: 1px solid rgba(255, 255, 255, 0.15);
  word-wrap: break-word;
}

.toast-card.error {
  background: rgba(239, 68, 68, 0.95);
}

.toast-card.info {
  background: rgba(37, 99, 235, 0.95);
}

/* Toast Transition Animation */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  transform: translateY(-20px) scale(0.95);
  opacity: 0;
}
.toast-leave-to {
  transform: translateY(-20px) scale(0.95);
  opacity: 0;
}
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

.page-header-text {
  margin-bottom: 20px;
}

.page-header-text h1 {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.page-header-text p {
  font-size: 0.88rem;
  color: var(--text-secondary);
  font-weight: 500;
  line-height: 1.5;
}

@media (max-width: 780px) {
  .page-header-text {
    margin-bottom: 16px;
  }
  .page-header-text h1 {
    font-size: 1.15rem !important;
  }
  .page-header-text p {
    font-size: 0.78rem !important;
    line-height: 1.4 !important;
  }
  .topbar-left {
    gap: 8px !important;
  }
  .top-tabs {
    gap: 4px !important;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .top-tabs::-webkit-scrollbar {
    display: none;
  }
  .tab {
    font-size: 0.72rem !important;
    padding: 6px 10px !important;
    border-radius: 8px !important;
    flex-shrink: 0;
  }
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
  .form-card {
    padding: 24px !important;
  }
}

@media (max-width: 480px) {
  .card {
    padding: 16px;
    border-radius: 16px;
  }
  .form-footer {
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
    gap: 16px !important;
    padding-top: 20px;
  }
  .btn-primary {
    width: auto !important;
    padding: 12px 24px !important;
    border-radius: 14px !important;
    font-size: 14px !important;
    min-width: 120px !important;
  }
  .btn-text, .btn-text-danger {
    width: auto !important;
    padding: 10px !important;
    font-size: 14px !important;
    text-align: left !important;
  }
  .content-container {
    padding: 8px;
  }
  .form-card {
    padding: 16px !important;
  }
}

.desktop-only-table {
  display: block;
}

.mobile-only-cards {
  display: none;
}

@media (max-width: 780px) {
  .desktop-only-table {
    display: none !important;
  }
  .mobile-only-cards {
    display: block !important;
  }
  .company-cards-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 16px;
  }
  .company-mobile-card {
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  }
  .company-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .company-card-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;
  }
  .company-name-text {
    font-size: 14px;
    font-weight: 800;
    color: var(--text-primary);
  }
  .company-code-text {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 500;
  }
  .company-card-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid var(--border-secondary);
    border-bottom: 1px solid var(--border-secondary);
    padding: 10px 0;
  }
  .card-detail {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
  }
  .detail-label {
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    font-size: 10px;
  }
  .btn-apply-company-mobile {
    background: var(--color_button);
    color: var(--color_text_button);
    border: none;
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
  }
  .btn-apply-company-mobile:hover:not(:disabled) {
    filter: brightness(0.9);
  }
  .btn-apply-company-mobile:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: var(--bg-secondary);
    color: var(--text-muted);
    border: 1px solid var(--border-primary);
  }
  .loading-cards, .no-companies-card {
    text-align: center;
    padding: 24px;
    color: var(--text-muted);
    font-weight: 600;
    font-size: 13px;
  }
  :deep(.header-logo-mobile) {
    display: none !important;
  }
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-secondary);
}

.btn-pagination {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  user-select: none;
}

.btn-pagination:hover {
  background: var(--bg-hover);
  border-color: var(--color_button);
}

.pagination-info {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
}

@media (max-width: 480px) {
  .pagination-controls {
    gap: 12px;
  }
  .btn-pagination {
    padding: 6px 12px;
    font-size: 12px;
  }
  .pagination-info {
    font-size: 12px;
  }
  .notification-center {
    top: 16px !important;
    right: 16px !important;
    left: 16px !important;
    align-items: center !important;
  }
  .toast-card {
    width: 100% !important;
    max-width: 100% !important;
    font-size: 12px !important;
    padding: 8px 12px !important;
    text-align: center !important;
  }
}
</style>