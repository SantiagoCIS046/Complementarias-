  <script setup>
  import { ref, reactive, watch, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import Sidebar from '@/components/layout/Sidebar.vue'
  import Header from '@/components/layout/Header.vue'
  import BtnBack from '@/layouts/btnBackLayout.vue'
  import HeaderLayout from '@/layouts/headerViewsLayout.vue'
  import { epService } from '../services/ep.service'

  const router = useRouter()

  // --- Lógica de Estado ---
  const currentStep = ref(1)
  const totalSteps = 3
  const isSubmitting = ref(false)
  const submitError = ref('')
  
  // Buscar empresas
  const companies = ref([])
  const isLoadingCompanies = ref(false)

  const loadCompanies = async () => {
    try {
      isLoadingCompanies.value = true
      const res = await epService.getCompanies()
      companies.value = res.data?.data || []
    } catch (e) {
      console.error('Error cargando empresas:', e)
    } finally {
      isLoadingCompanies.value = false
    }
  }

  const formData = reactive({
    tipoFormacion: 'PRACTICA',
    modalidad: 'Contrato de Aprendizaje',
    nit: '',
    empresaSeleccionada: null,
    observaciones: ''
  })

  // Detectar empresa automáticamente por NIT
  watch(() => formData.nit, (newNit) => {
    if (!newNit || newNit.length < 5) {
      formData.empresaSeleccionada = null
      return
    }
    const found = companies.value.find(c => c.nit.includes(newNit) || c.nit === newNit)
    if (found) {
      formData.empresaSeleccionada = {
        _id: found._id,
        nombre: found.razonSocial,
        ubicacion: found.direccion || 'Colombia',
        registrada: true
      }
    } else {
      formData.empresaSeleccionada = null
    }
  })

  const nextStep = () => { if (currentStep.value < totalSteps) currentStep.value++ }
  const prevStep = () => { if (currentStep.value > 1) currentStep.value-- }
  
  const handleFinish = async () => {
    if (!formData.empresaSeleccionada) {
      submitError.value = 'Debe seleccionar una empresa válida.'
      return
    }
    isSubmitting.value = true
    submitError.value = ''
    try {
      const payload = {
        companyId: formData.empresaSeleccionada._id,
        tipoFormacion: formData.tipoFormacion,
        modalidad: formData.modalidad,
        documentos: [], // Empty docs for now
        observaciones: 'Registrado desde portal Aprendiz'
      }
      await epService.create(payload)
      alert('¡Registro de Etapa Productiva completado exitosamente!')
      router.push('/dashboard')
    } catch (error) {
      submitError.value = error.response?.data?.message || 'Error al registrar la etapa productiva.'
    } finally {
      isSubmitting.value = false
    }
  }

  // Load initially
  loadCompanies()
  </script>

  <template>
    <div class="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <Sidebar />

      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main class="flex-1 overflow-y-auto p-6 lg:p-8">
          <div class="w-full space-y-4">
            <!-- 1. Botón volver -->
            <BtnBack route="/mi-ep" />

            <!-- 2. Título de sección con separador verde -->
            <HeaderLayout title="Registro de Etapa Productiva" />

            <p class="text-gray-500 font-medium q-mb-lg">Completa los pasos para formalizar tu proceso institucional.</p>

          <!-- Stepper -->
          <div class="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-gray-100">
            <div class="relative w-full">
              <div class="absolute top-6 left-16 right-16 h-0.5 bg-gray-100 -z-0"></div>
              <div class="absolute top-6 left-16 h-0.5 bg-green-700 z-0 transition-all duration-700" :style="{ width: ((currentStep - 1) / (totalSteps - 1)) * 100 + '%' }"></div>
              <div class="relative z-10 flex justify-between items-center px-4">
                <div v-for="step in totalSteps" :key="step" class="flex flex-col items-center gap-3 w-32">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all" :class="currentStep >= step ? 'bg-green-700 text-white shadow-lg' : 'bg-gray-100 text-gray-400 border border-gray-200'">
                    <span v-if="currentStep > step" class="material-symbols-outlined">check</span>
                    <span v-else>{{ step }}</span>
                  </div>
                  <span class="text-[10px] uppercase tracking-widest font-bold" :class="currentStep >= step ? 'text-green-800' : 'text-gray-400'">
                    {{ step === 1 ? 'Modalidad' : step === 2 ? 'Supervisor' : 'Finalizar' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Form -->
          <div class="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 min-h-[400px]">
            <Transition name="fade" mode="out-in">
              <div v-if="currentStep === 1">
                <div class="flex items-center gap-4 mb-8">
                  <div class="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-700 border border-green-100">
                    <span class="material-symbols-outlined text-2xl">corporate_fare</span>
                  </div>
                  <h3 class="text-xl font-bold text-gray-900">Selección de Empresa</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-4">
                    <div class="space-y-2">
                      <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Modalidad</label>
                      <select v-model="formData.modalidad" class="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-green-500 transition-all">
                        <option>Contrato de Aprendizaje</option>
                        <option>Vínculo Laboral</option>
                        <option>Pasantía</option>
                      </select>
                    </div>
                    <div class="space-y-2">
                      <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">NIT Empresa</label>
                      <input v-model="formData.nit" type="text" class="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-green-500 transition-all" placeholder="Ej: 900.452.123-5" />
                    </div>
                  </div>
                  <div class="bg-green-50/30 rounded-3xl p-6 border border-green-100 flex items-center justify-center">
                    <div v-if="formData.empresaSeleccionada" class="text-center">
                      <p class="text-[9px] font-bold text-green-700 uppercase tracking-widest mb-1">Empresa Encontrada</p>
                      <h4 class="font-bold text-gray-900">{{ formData.empresaSeleccionada.nombre }}</h4>
                      <p class="text-xs text-gray-500 mt-2">{{ formData.empresaSeleccionada.ubicacion }}</p>
                    </div>
                    <div v-else-if="formData.nit && formData.nit.length > 3" class="text-center text-red-500">
                      <span class="material-symbols-outlined text-3xl mb-2">error</span>
                      <p class="text-sm font-bold">Empresa no encontrada</p>
                      <p class="text-xs mt-1">Verifica el NIT ingresado.</p>
                    </div>
                    <p v-else class="text-sm text-gray-400 italic text-center">Ingresa el NIT para buscar en la base de datos...</p>
                  </div>
                </div>
              </div>

              <div v-else-if="currentStep === 2">
                <div class="flex items-center gap-4 mb-8">
                  <div class="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-700 border border-green-100">
                    <span class="material-symbols-outlined text-2xl">person_pin</span>
                  </div>
                  <h3 class="text-xl font-bold text-gray-900">Datos del Supervisor</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
                    <input v-model="formData.supervisor.nombre" type="text" class="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-green-500 transition-all" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                    <input v-model="formData.supervisor.email" type="email" class="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-green-500 transition-all" />
                  </div>
                </div>
              </div>

              <div v-else-if="currentStep === 3" class="text-center py-6">
                <div class="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span class="material-symbols-outlined text-3xl">task_alt</span>
                </div>
                <h3 class="text-2xl font-extrabold text-gray-900 mb-2">¡Todo listo!</h3>
                <p class="text-gray-500 text-sm mb-4">Verifica tus datos antes de formalizar la Etapa Productiva.</p>
                <div v-if="submitError" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold max-w-md mx-auto mb-4">
                  {{ submitError }}
                </div>
              </div>
            </Transition>

            <!-- Buttons -->
            <div class="mt-12 flex justify-between items-center border-t border-gray-100 pt-8">
              <button @click="prevStep" :disabled="currentStep === 1 || isSubmitting" class="px-6 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-gray-900 transition-all disabled:opacity-0">Atrás</button>
              <button @click="currentStep === totalSteps ? handleFinish() : nextStep()" :disabled="isSubmitting" class="px-8 py-3.5 rounded-2xl bg-green-9 text-white font-bold shadow-lg hover:bg-green-10 transition-all flex items-center gap-3">
                {{ currentStep === totalSteps ? (isSubmitting ? 'Enviando...' : 'Enviar Registro') : 'Siguiente Paso' }}
                <span class="material-symbols-outlined text-[20px]">{{ currentStep === totalSteps ? 'send' : 'arrow_forward' }}</span>
              </button>
            </div>
            </div>
          </div>
        </main>
      </div>
    </div>
</template>

  <style scoped>
  .font-sans { font-family: 'Inter', system-ui, sans-serif; }
  .material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
  .fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
  .fade-enter-from { opacity: 0; transform: translateX(15px); }
  .fade-leave-to { opacity: 0; transform: translateX(-15px); }
  </style>