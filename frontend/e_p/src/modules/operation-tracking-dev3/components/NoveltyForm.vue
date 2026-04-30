<script setup>
import { Info, Upload, ChevronDown } from 'lucide-vue-next';
</script>

<template>
  <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-50">
    <div class="flex items-center gap-4 mb-8">
      <div class="p-3 bg-sena-green/10 rounded-xl">
        <Info class="text-sena-green" :size="24" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-gray-800">Gestión de Novedades</h3>
        <p class="text-xs text-gray-400 font-medium">Reporte de incidentes y seguimiento administrativo</p>
      </div>
    </div>

    <form @submit.prevent class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Tipo de Novedad -->
        <div class="space-y-2">
          <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo de Novedad</label>
          <div class="relative">
            <select class="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm text-gray-600 appearance-none focus:ring-2 focus:ring-sena-green/20">
              <option value="" disabled selected>Seleccione un tipo...</option>
              <option value="indisciplina">Indisciplina</option>
              <option value="desercion">Deserción</option>
              <option value="medico">Médico</option>
            </select>
            <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
          </div>
        </div>

        <!-- Aprendiz -->
        <div class="space-y-2">
          <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aprendiz</label>
          <input 
            type="text" 
            placeholder="Buscar nombre o ID..." 
            class="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm text-gray-600 focus:ring-2 focus:ring-sena-green/20"
          />
        </div>
      </div>

      <!-- Descripción -->
      <div class="space-y-2">
        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Descripción del Incidente</label>
        <textarea 
          rows="4" 
          placeholder="Detalle los hechos ocurridos..." 
          class="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm text-gray-600 focus:ring-2 focus:ring-sena-green/20 resize-none"
        ></textarea>
      </div>

      <!-- Upload -->
      <div class="space-y-2">
        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cargar Evidencias</label>
        <div class="border-2 border-dashed border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
          <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload class="text-gray-400" :size="24" />
          </div>
          <p class="text-sm text-gray-500 font-medium">
            Arrastre archivos aquí o <span class="text-sena-green font-bold">explore sus documentos</span>
          </p>
          <p class="text-[10px] text-gray-400 mt-2">Soporta PDF, JPG, PNG (Max. 10MB)</p>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex justify-end pt-4">
        <button class="bg-sena-green text-white px-10 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-sena-green-dark transition-all transform hover:-translate-y-0.5 active:translate-y-0">
          Reportar Novedad
        </button>
      </div>
    </form>
  </div>
</template>
