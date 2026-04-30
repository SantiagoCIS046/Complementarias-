<script setup>
import { ref, reactive } from 'vue'

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

// --- Acciones ---
const nextStep = () => {
  if (currentStep.value < totalSteps) currentStep.value++
}

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--
}

const handleCancel = () => {
  console.log('Registro cancelado')
}

const handleFinish = () => {
  alert('¡Registro de Etapa Productiva completado con éxito!')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-body text-slate-800 antialiased selection:bg-emerald-200">
    
    <nav class="fixed top-0 right-0 left-0 lg:left-64 h-16 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-6">
        <span class="text-emerald-700 font-headline font-black tracking-tight text-xl">REPFORA</span>
        <div class="hidden md:flex gap-6">
          <a href="#" class="text-sm font-bold text-emerald-700 border-b-2 border-emerald-600 pb-1">Etapa Productiva</a>
          <a href="#" class="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">Empresas</a>
          <a href="#" class="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">Certificación</a>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <button class="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-600 relative">
          <span class="material-symbols-outlined text-[22px]">notifications</span>
          <span class="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div class="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-bold leading-none text-slate-800">Admin User</p>
            <p class="text-xs text-slate-500 font-medium">SENA Administrator</p>
          </div>
          <div class="h-10 w-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-md">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </nav>

    <aside class="hidden lg:flex h-screen w-64 fixed left-0 top-0 flex-col bg-slate-900 border-r border-slate-800 z-50 text-slate-300">
      <div class="p-8 mb-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <span class="material-symbols-outlined text-[26px]">architecture</span>
          </div>
          <div>
            <h2 class="font-headline font-extrabold text-white text-lg leading-none tracking-tight">Gestión EP</h2>
            <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">SENA Core</p>
          </div>
        </div>
      </div>
      
      <nav class="flex-1 px-4 space-y-2">
        <a href="#" class="flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 hover:text-white rounded-xl transition-all">
          <span class="material-symbols-outlined text-[20px]">dashboard</span> Dashboard
        </a>
        <a href="#" class="flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all">
          <span class="material-symbols-outlined text-[20px]">analytics</span> Etapa Productiva
        </a>
        <a href="#" class="flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 hover:text-white rounded-xl transition-all">
          <span class="material-symbols-outlined text-[20px]">business</span> Directorio
        </a>
      </nav>

      <div class="p-4 mt-auto">
        <button class="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20">
          <span class="material-symbols-outlined text-[20px]">logout</span> Cerrar Sesión
        </button>
      </div>
    </aside>

    <main class="lg:ml-64 pt-24 px-6 lg:px-12 pb-12">
      <header class="max-w-4xl mx-auto mb-10 text-center md:text-left">
        <h1 class="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">Registro de Etapa Productiva</h1>
        <p class="text-slate-600 text-base md:text-lg max-w-2xl leading-relaxed">
          Formaliza tu proceso institucional. Sigue los pasos para registrar tu modalidad y datos de contacto de la empresa.
        </p>
      </header>

      <div class="max-w-4xl mx-auto mb-10 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div class="relative flex justify-between items-center px-4 md:px-16">
          <div class="absolute top-1/2 left-10 right-10 md:left-24 md:right-24 h-1.5 bg-slate-100 rounded-full -translate-y-1/2"></div>
          <div 
            class="absolute top-1/2 left-10 md:left-24 h-1.5 bg-emerald-500 rounded-full transition-all duration-700 ease-in-out -translate-y-1/2"
            :style="{ width: ((currentStep - 1) / (totalSteps - 1)) * (100 - (200 / (totalSteps))) + '%' }"
          ></div>

          <div v-for="step in totalSteps" :key="step" class="relative z-10 flex flex-col items-center gap-3 bg-white px-2">
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500"
              :class="currentStep >= step ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-50' : 'bg-slate-100 text-slate-400 border-2 border-slate-200'"
            >
              <span v-if="currentStep > step" class="material-symbols-outlined text-white">check</span>
              <span v-else>{{ step }}</span>
            </div>
            <span 
              class="text-[11px] uppercase tracking-wider font-bold transition-colors duration-300 absolute -bottom-7 w-24 text-center"
              :class="currentStep >= step ? 'text-emerald-700' : 'text-slate-400'"
            >
              {{ step === 1 ? 'Modalidad' : step === 2 ? 'Supervisor' : 'Finalizar' }}
            </span>
          </div>
        </div>
      </div>

      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200 min-h-[450px]">
          
          <Transition name="fade" mode="out-in">
            <div v-if="currentStep === 1" class="grid grid-cols-1 md:grid-cols-12 gap-10">
              <div class="md:col-span-5 flex flex-col justify-center">
                <div class="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 border border-emerald-100">
                  <span class="material-symbols-outlined text-4xl">corporate_fare</span>
                </div>
                <h3 class="font-headline text-2xl font-bold text-slate-900 mb-3">Selección de Empresa</h3>
                <p class="text-slate-600 leading-relaxed text-sm">
                  Identifica la empresa donde realizarás tu práctica. El NIT debe coincidir con el registro institucional del SENA.
                </p>
                <div class="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
                  <span class="material-symbols-outlined text-blue-500 text-xl">info</span>
                  <p class="text-xs text-blue-800 leading-tight">Tu información será validada por el centro de formación en las próximas 48 horas.</p>
                </div>
              </div>

              <div class="md:col-span-7 space-y-6">
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-700 ml-1">Modalidad Institucional</label>
                  <div class="relative">
                    <select v-model="formData.modalidad" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-3.5 text-slate-800 appearance-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium">
                      <option>Contrato de Aprendizaje</option>
                      <option>Vínculo Laboral</option>
                      <option>Pasantía</option>
                      <option>Proyecto Productivo</option>
                    </select>
                    <span class="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-700 ml-1">Identificación Tributaria (NIT)</label>
                  <div class="relative group">
                    <span class="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 transition-colors group-focus-within:text-emerald-500">search</span>
                    <input v-model="formData.nit" type="text" class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium" placeholder="Ej: 900.452.123-5" />
                  </div>
                </div>

                <Transition name="fade">
                  <div v-if="formData.nit" class="mt-4 bg-emerald-50 p-6 rounded-2xl border border-emerald-200 flex items-center gap-5">
                    <div class="w-12 h-12 bg-white flex items-center justify-center rounded-xl border border-emerald-100 shadow-sm">
                      <span class="material-symbols-outlined text-emerald-600 text-2xl">domain</span>
                    </div>
                    <div class="flex-1">
                      <p class="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-0.5">Empresa Verificada</p>
                      <h4 class="font-bold text-slate-900 text-lg leading-tight">{{ formData.empresaSeleccionada.nombre }}</h4>
                      <p class="text-xs text-slate-600 mt-1">{{ formData.empresaSeleccionada.ubicacion }}</p>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>

            <div v-else-if="currentStep === 2" class="max-w-3xl mx-auto">
              <div class="text-center mb-10">
                 <h3 class="font-headline text-3xl font-extrabold text-slate-900 mb-2">Datos del Supervisor</h3>
                 <p class="text-slate-600">Información de contacto del jefe inmediato en la empresa.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div class="space-y-2">
                   <label class="text-xs font-bold text-slate-700 ml-1">Nombre Completo</label>
                   <input v-model="formData.supervisor.nombre" type="text" placeholder="Ej: Ing. Martha Rodriguez" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                 </div>
                 <div class="space-y-2">
                   <label class="text-xs font-bold text-slate-700 ml-1">Cargo Directivo</label>
                   <input v-model="formData.supervisor.cargo" type="text" placeholder="Ej: Gerente de Proyectos" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                 </div>
                 <div class="space-y-2">
                   <label class="text-xs font-bold text-slate-700 ml-1">Correo Corporativo</label>
                   <input v-model="formData.supervisor.email" type="email" placeholder="martha.r@empresa.com" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                 </div>
                 <div class="space-y-2">
                   <label class="text-xs font-bold text-slate-700 ml-1">Teléfono de Contacto</label>
                   <input v-model="formData.supervisor.telefono" type="text" placeholder="+57 300 456 7890" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
                 </div>
              </div>
            </div>

            <div v-else-if="currentStep === 3" class="max-w-3xl mx-auto">
               <div class="text-center mb-10">
                  <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <span class="material-symbols-outlined text-3xl">verified</span>
                  </div>
                  <h3 class="font-headline text-3xl font-extrabold text-slate-900 mb-2">Verificación de Datos</h3>
                  <p class="text-slate-600">Revisa que toda la información sea correcta antes de formalizar.</p>
               </div>

               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                     <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                       <span class="material-symbols-outlined text-lg">business</span> Detalles Empresa
                     </h4>
                     <div class="space-y-4">
                        <div>
                          <p class="text-[10px] font-bold text-slate-400 uppercase">Empresa</p>
                          <p class="font-semibold text-slate-800">{{ formData.empresaSeleccionada.nombre }}</p>
                        </div>
                        <div>
                          <p class="text-[10px] font-bold text-slate-400 uppercase">Modalidad</p>
                          <p class="font-semibold text-slate-800">{{ formData.modalidad }}</p>
                        </div>
                        <div>
                          <p class="text-[10px] font-bold text-slate-400 uppercase">NIT</p>
                          <p class="font-semibold text-slate-800">{{ formData.nit || 'No ingresado' }}</p>
                        </div>
                     </div>
                  </div>

                  <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                     <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                       <span class="material-symbols-outlined text-lg">person</span> Supervisor Asignado
                     </h4>
                     <div class="space-y-4">
                        <div>
                          <p class="text-[10px] font-bold text-slate-400 uppercase">Nombre</p>
                          <p class="font-semibold text-slate-800">{{ formData.supervisor.nombre || 'No especificado' }}</p>
                        </div>
                        <div>
                          <p class="text-[10px] font-bold text-slate-400 uppercase">Cargo</p>
                          <p class="font-semibold text-slate-800">{{ formData.supervisor.cargo || 'No especificado' }}</p>
                        </div>
                        <div>
                          <p class="text-[10px] font-bold text-slate-400 uppercase">Contacto</p>
                          <p class="font-semibold text-slate-800">{{ formData.supervisor.email || 'No especificado' }}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                  <span class="material-symbols-outlined text-amber-500 text-xl">warning</span>
                  <p class="text-xs text-amber-800 leading-relaxed font-medium">
                    Al finalizar, los datos serán enviados para validación. No podrás modificar esta información hasta que el instructor apruebe o rechace tu registro.
                  </p>
               </div>
            </div>
          </Transition>

          <div class="mt-12 pt-8 border-t border-slate-100 flex justify-end items-center gap-4">
            <button @click="prevStep" v-if="currentStep > 1" class="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
              Atrás
            </button>
            <button @click="handleCancel" v-else class="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
              Cancelar
            </button>
            
            <button @click="currentStep === totalSteps ? handleFinish() : nextStep()" class="px-8 py-3 rounded-xl text-sm font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2">
              {{ currentStep === totalSteps ? 'Formalizar Registro' : 'Siguiente Paso' }}
              <span class="material-symbols-outlined text-[20px]">{{ currentStep === totalSteps ? 'send' : 'arrow_forward' }}</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Transiciones de Vue */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.font-headline { font-family: 'Outfit', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }

.material-symbols-outlined {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>