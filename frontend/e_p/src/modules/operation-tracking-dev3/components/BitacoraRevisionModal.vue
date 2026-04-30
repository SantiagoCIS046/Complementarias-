<script setup>
import { X, CheckCircle, AlertCircle, Save } from 'lucide-vue-next';

defineProps({
  isOpen: Boolean,
  apprentice: Object
});

defineEmits(['close']);
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="$emit('close')"></div>

      <!-- Modal Content -->
      <div class="relative bg-[#f1f1f1] w-full max-w-6xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <!-- Header -->
        <header class="bg-white px-8 py-6 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 class="text-xl font-bold text-gray-800 tracking-tight">Revisión de Bitácora</h2>
            <p class="text-xs text-gray-400 font-medium">Carlos Arturo Perez • Bitácora #04</p>
          </div>
          <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
            <X :size="24" />
          </button>
        </header>

        <!-- Body -->
        <div class="flex-1 flex overflow-hidden">
          <!-- Document Viewer (Left) -->
          <div class="flex-1 bg-gray-200/50 p-10 overflow-y-auto flex justify-center">
            <div class="bg-white w-[800px] min-h-[1100px] shadow-xl p-16 space-y-12 relative overflow-hidden">
              <!-- Watermark -->
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-45deg] text-9xl font-black">
                CONFIDENCIAL
              </div>

              <!-- Doc Header -->
              <div class="flex items-start justify-between border-b-2 border-sena-green pb-8">
                <div class="space-y-2">
                  <h3 class="text-xl font-black text-sena-green tracking-tighter">REPORTE DE ETAPA PRODUCTIVA</h3>
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SENA - CENTRO DE SERVICIOS Y GESTIÓN EMPRESARIAL</p>
                </div>
                <div class="bg-sena-green text-white px-4 py-2 rounded font-black text-sm">EP</div>
              </div>

              <!-- Doc Info Grid -->
              <div class="grid grid-cols-2 gap-8">
                <div class="bg-gray-50 p-6 rounded-xl space-y-1">
                  <p class="text-[10px] font-bold text-gray-300 uppercase">Aprendiz</p>
                  <p class="text-sm font-bold text-gray-800">Carlos Arturo Perez</p>
                </div>
                <div class="bg-gray-50 p-6 rounded-xl space-y-1">
                  <p class="text-[10px] font-bold text-gray-300 uppercase">Empresa</p>
                  <p class="text-sm font-bold text-gray-800">TechSolutions S.A.S</p>
                </div>
              </div>

              <!-- Doc Content -->
              <div class="space-y-6">
                <div class="flex items-center gap-3">
                  <div class="w-1 h-4 bg-sena-green"></div>
                  <h4 class="text-xs font-bold text-gray-800 uppercase tracking-wider">Actividades Desarrolladas</h4>
                </div>
                <p class="text-sm text-gray-600 leading-relaxed">
                  Durante este periodo se realizaron las siguientes tareas dentro del área de desarrollo backend:
                </p>
                <ul class="list-disc list-inside text-sm text-gray-600 space-y-3 pl-4">
                  <li>Mantenimiento y optimización de bases de datos relacionales en PostgreSQL.</li>
                  <li>Creación de endpoints para el módulo de inventarios utilizando Node.js y Express.</li>
                  <li>Documentación de procesos técnicos en Swagger.</li>
                  <li>Asistencia a daily standups para coordinación de tareas en Jira.</li>
                </ul>
              </div>

              <div class="space-y-6">
                <div class="flex items-center gap-3">
                  <div class="w-1 h-4 bg-sena-green"></div>
                  <h4 class="text-xs font-bold text-gray-800 uppercase tracking-wider">Observaciones del Aprendiz</h4>
                </div>
                <div class="bg-gray-50 p-8 rounded-2xl italic text-sm text-gray-500 leading-relaxed border-l-4 border-gray-200">
                  "Se han presentado retos interesantes en la integración de la pasarela de pagos, pero con el apoyo del tutor empresarial se han logrado resolver satisfactoriamente los bloqueos técnicos."
                </div>
              </div>

              <!-- Signatures -->
              <div class="pt-20 grid grid-cols-2 gap-20">
                <div class="border-t border-gray-300 pt-4 text-center">
                  <p class="text-[10px] font-bold text-gray-400">Firma Aprendiz</p>
                </div>
                <div class="border-t border-gray-300 pt-4 text-center">
                  <p class="text-[10px] font-bold text-gray-400">Firma Jefe Inmediato</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions Panel (Right) -->
          <div class="w-96 bg-white border-l border-gray-100 p-8 flex flex-col shadow-2xl">
            <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Acciones de Revisión</h4>
            
            <div class="space-y-4">
              <button class="w-full bg-sena-green text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-green-100 hover:bg-sena-green-dark transition-all">
                <CheckCircle :size="18" />
                APROBAR BITÁCORA
              </button>
              <button class="w-full bg-white text-red-500 border-2 border-red-100 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-red-50 hover:border-red-200 transition-all">
                <X :size="18" />
                SOLICITAR CORRECCIÓN
              </button>
            </div>

            <div class="mt-12 flex-1 flex flex-col">
              <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Comentarios de Retroalimentación</h4>
              <div class="relative flex-1">
                <textarea 
                  class="w-full h-48 bg-gray-50 border-none rounded-2xl p-6 text-sm text-gray-600 focus:ring-2 focus:ring-sena-green/20 resize-none"
                  placeholder="Explique los motivos del rechazo o sugerencias de mejora..."
                ></textarea>
                <span class="absolute bottom-4 right-4 text-[10px] font-bold text-red-400">Min. 10 caracteres</span>
              </div>
              <p class="text-[10px] text-gray-400 mt-4 leading-relaxed italic">
                * El comentario es obligatorio si se solicita una corrección. El aprendiz recibirá una notificación inmediata.
              </p>
            </div>

            <button class="w-full bg-gray-100 text-gray-500 py-4 rounded-xl font-bold text-sm mt-auto hover:bg-gray-200 transition-all flex items-center justify-center gap-3">
              <Save :size="18" />
              GUARDAR BORRADOR
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

textarea::placeholder { color: #d1d5db; }
</style>
