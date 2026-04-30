<script setup>
import { 
  Building2, 
  Store, 
  Compass, 
  User, 
  Phone, 
  ArrowRight,
  Edit2,
  Trash2,
  Plus
} from 'lucide-vue-next';

const props = defineProps({
  company: { type: Object, required: false },
  isPlaceholder: { type: Boolean, default: false }
});

const getIcon = (type) => {
  if (type === 'factory') return Building2;
  if (type === 'retail') return Store;
  return Compass;
};
</script>

<template>
  <!-- Standard Company Card -->
  <div v-if="!isPlaceholder" class="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-50 relative group hover:shadow-xl hover:shadow-gray-100 transition-all duration-300">
    <!-- Top Actions -->
    <div class="absolute top-8 right-10 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <button class="p-2 text-gray-400 hover:text-sena-green transition-colors">
        <Edit2 :size="16" />
      </button>
      <button class="p-2 text-gray-400 hover:text-red-500 transition-colors">
        <Trash2 :size="16" />
      </button>
    </div>

    <!-- Company Icon -->
    <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-300 relative">
      <component :is="getIcon(company.type)" class="text-sena-green" :size="32" />
      <!-- Subtle Decorative Shape -->
      <div class="absolute -top-4 -right-4 w-12 h-12 bg-sena-green/5 rounded-full -z-10 blur-xl"></div>
    </div>

    <!-- Company Info -->
    <div class="space-y-2 mb-8">
      <h3 class="text-2xl font-extrabold text-gray-800 tracking-tight">{{ company.name }}</h3>
      <p class="text-xs font-bold text-gray-400 tracking-wide uppercase">NIT: {{ company.nit }}</p>
    </div>

    <!-- Contact Details -->
    <div class="space-y-4 mb-10">
      <div class="flex items-center gap-3 text-gray-600">
        <div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sena-green">
          <User :size="16" />
        </div>
        <span class="text-sm font-bold">{{ company.contact }}</span>
      </div>
      <div class="flex items-center gap-3 text-gray-600">
        <div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sena-green">
          <Phone :size="16" />
        </div>
        <span class="text-sm font-bold">{{ company.phone }}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between pt-6 border-t border-gray-50">
      <div class="flex items-center gap-2 px-4 py-2 bg-sena-green/5 text-sena-green rounded-full">
        <div class="w-2 h-2 rounded-full bg-sena-green animate-pulse"></div>
        <span class="text-xs font-extrabold">{{ company.apprentices }} Aprendices Asignados</span>
      </div>
      <button class="flex items-center gap-2 text-xs font-extrabold text-gray-800 hover:text-sena-green transition-colors group/btn">
        Detalles
        <ArrowRight :size="16" class="group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>

  <!-- Placeholder Card -->
  <div v-else class="border-4 border-dashed border-gray-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center bg-gray-50/30 hover:bg-gray-50 hover:border-sena-green/20 transition-all duration-300 group cursor-pointer">
    <div class="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
      <div class="relative">
        <Building2 class="text-gray-300" :size="40" />
        <Plus class="absolute -top-2 -right-2 text-sena-green" :size="20" stroke-width="3" />
      </div>
    </div>
    <div class="space-y-2 mb-10">
      <h3 class="text-xl font-extrabold text-gray-800">Registrar Nueva Empresa</h3>
      <p class="text-sm text-gray-400 font-medium">Amplíe la red de aliados institucionales.</p>
    </div>
    <button class="bg-gray-200 text-gray-600 px-10 py-4 rounded-2xl font-bold text-sm hover:bg-sena-green hover:text-white transition-all shadow-lg shadow-gray-100 active:scale-95">
      Empezar Registro
    </button>
  </div>
</template>
