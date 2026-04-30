  <script setup>
  import { ref, reactive } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  // --- Lógica de Estado ---
  const currentStep = ref(1)
  const totalSteps = 3

  const formData = reactive({
    modalidad: 'Contrato de Aprendizaje',
    nit: '',
    empresaSeleccionada: {
      nombre: 'TECNOLOGÍAS GLOBALES S.A.S',
      ubicacion: 'Bogotá D.C. | Sector Servicios',
      registrada: true
    },
    supervisor: {
      nombre: '',
      cargo: '',
      email: '',
      telefono: ''
    }
  })

  const nextStep = () => { if (currentStep.value < totalSteps) currentStep.value++ }
  const prevStep = () => { if (currentStep.value > 1) currentStep.value-- }
  const handleLogout = () => {
    localStorage.removeItem('repfora_token')
    localStorage.removeItem('repfora_user')
    window.location.href = '/login'
  }
  const handleFinish = () => alert('¡Registro completado!')
  </script>

  <template>
    <div class="min-h-screen bg-[#f8f9fa] font-sans text-gray-800 antialiased">
      
      <!-- Sidebar -->
      <aside class="hidden lg:flex w-64 fixed left-0 top-0 h-full flex-col bg-[#f4f5f6] border-r border-gray-200 z-50">
        <div class="p-6 mb-2 flex items-center gap-3">
          <div class="w-10 h-10 bg-green-700 rounded-lg flex items-center justify-center text-white shadow-sm">
            <span class="material-symbols-outlined text-[24px]">architecture</span>
          </div>
          <div>
            <h2 class="font-bold text-gray-900 text-sm leading-tight">Gestión EP</h2>
            <p class="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">SENA CORE</p>
          </div>
        </div>
        
        <nav class="flex-1 px-3 space-y-1">
          <a href="/dashboard" class="flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <span class="material-symbols-outlined text-[20px]">grid_view</span> DASHBOARD
          </a>
          <a href="#" class="flex items-center gap-3 px-4 py-3 text-xs font-bold text-green-700 bg-white rounded-xl shadow-sm border-l-4 border-green-700 transition-colors">
            <span class="material-symbols-outlined text-[20px]">bar_chart</span> ETAPA PRODUCTIVA
          </a>
          <a href="#" class="flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <span class="material-symbols-outlined text-[20px]">domain</span> DIRECTORIO
          </a>
        </nav>

        <div class="p-4 mt-auto border-t border-gray-200">
          <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <span class="material-symbols-outlined text-[20px]">logout</span> CERRAR SESIÓN
          </button>
        </div>
      </aside>

      <!-- Main Wrapper -->
      <div class="lg:pl-64 flex flex-col min-h-screen">
        
        <!-- Top Nav -->
        <nav class="h-16 bg-[#f8f9fa] px-8 flex items-center justify-between sticky top-0 z-40">
          <div class="flex items-center gap-8">
            <span class="text-green-700 font-extrabold tracking-tight text-lg">REPFORA</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div class="text-right hidden sm:block">
                <p class="text-xs font-bold text-gray-900 leading-none">Admin User</p>
                <p class="text-[10px] text-gray-500 font-medium">Coordinador EP</p>
              </div>
              <div class="h-8 w-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=16a34a&color=fff" alt="Avatar" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </nav>

        <!-- Main Content -->
        <main class="flex-1 px-8 py-8 max-w-[1200px] w-full mx-auto">
          
          <div class="mb-8">
            <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Registro de Etapa Productiva</h1>
            <p class="text-gray-500 text-sm mt-1">Completa los pasos para formalizar tu proceso institucional.</p>
          </div>

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
                    <div v-if="formData.nit" class="text-center">
                      <p class="text-[9px] font-bold text-green-700 uppercase tracking-widest mb-1">Empresa Detectada</p>
                      <h4 class="font-bold text-gray-900">{{ formData.empresaSeleccionada.nombre }}</h4>
                    </div>
                    <p v-else class="text-sm text-gray-400 italic text-center">Ingresa el NIT...</p>
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
                <p class="text-gray-500 text-sm mb-8">Verifica tus datos antes de formalizar.</p>
              </div>
            </Transition>

            <!-- Buttons -->
            <div class="mt-12 flex justify-between items-center border-t border-gray-100 pt-8">
              <button @click="prevStep" :disabled="currentStep === 1" class="px-6 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-gray-900 transition-all disabled:opacity-0">Atrás</button>
              <button @click="currentStep === totalSteps ? handleFinish() : nextStep()" class="px-8 py-3.5 rounded-2xl bg-green-700 text-white font-bold shadow-lg hover:bg-green-800 transition-all flex items-center gap-3">
                {{ currentStep === totalSteps ? 'Enviar Registro' : 'Siguiente Paso' }}
                <span class="material-symbols-outlined text-[20px]">{{ currentStep === totalSteps ? 'send' : 'arrow_forward' }}</span>
              </button>
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