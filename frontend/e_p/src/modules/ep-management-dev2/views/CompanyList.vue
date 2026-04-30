<script setup>
import { ref, computed } from 'vue'

// --- Estado de Búsqueda y Filtros ---
const searchQuery = ref('')
const selectedSector = ref('Todos los Sectores')

// --- Datos de Empresas (Simulados) ---
const empresas = ref([
  {
    id: 1,
    nombre: 'Innovatech Solutions S.A.S.',
    nit: '900.452.123-5',
    contacto: 'Carlos Mario Restrepo',
    email: 'c.restrepo@innovatech.co',
    telefono: '+57 300 456 7890',
    sector: 'Software & TI',
    aprendices: 12,
    estado: 'Activa',
    icon: 'factory',
    color: 'primary'
  },
  {
    id: 2,
    nombre: 'Clínica Santa María del Valle',
    nit: '860.112.004-2',
    contacto: 'Dra. Elena Martínez',
    email: 'r.humanos@clinicasantamaria.com',
    telefono: '+57 601 223 4455',
    sector: 'Salud',
    aprendices: 8,
    estado: 'En Trámite',
    icon: 'health_and_safety',
    color: 'warning'
  },
  {
    id: 3,
    nombre: 'Constructora del Eje Cafetero',
    nit: '901.002.883-1',
    contacto: 'Ing. Alberto Gaviria',
    email: 'a.gaviria@construyeje.com',
    telefono: '+57 312 889 1122',
    sector: 'Construcción',
    aprendices: 25,
    estado: 'Activa',
    icon: 'architecture',
    color: 'primary'
  },
  {
    id: 4,
    nombre: 'Logística Express S.A.',
    nit: '811.556.321-9',
    contacto: 'Ricardo Gómez',
    email: 'r.gomez@logexpress.com',
    telefono: '+57 320 111 2233',
    sector: 'Logística',
    aprendices: 0,
    estado: 'Inactiva',
    icon: 'shopping_bag',
    color: 'stone'
  }
])

// --- Lógica de Filtrado Reactiva ---
const empresasFiltradas = computed(() => {
  return empresas.value.filter(empresa => {
    const matchesSearch = empresa.nombre.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          empresa.nit.includes(searchQuery.value)
    const matchesSector = selectedSector.value === 'Todos los Sectores' || empresa.sector === selectedSector.value
    
    return matchesSearch && matchesSector
  })
})

const sectores = ['Todos los Sectores', 'Software & TI', 'Salud', 'Construcción', 'Agropecuario', 'Logística', 'Turismo']

const vincularEmpresa = () => {
  console.log("Abriendo formulario de vinculación...")
}
</script>

<template>
  <div class="min-h-screen bg-background font-body text-on-surface antialiased">
    
    <!-- Top Navigation -->
    <nav class="fixed top-0 right-0 left-0 lg:left-64 h-16 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-8 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <span class="text-primary font-headline font-bold tracking-tight text-lg">REPFORA</span>
        <div class="hidden md:flex gap-6">
          <a href="#" class="text-sm font-label font-bold text-on-surface-variant hover:text-on-surface transition-colors">Etapa Productiva</a>
          <a href="#" class="text-sm font-label font-bold text-primary border-b-2 border-primary pb-1">Empresas</a>
          <a href="#" class="text-sm font-label font-bold text-on-surface-variant hover:text-on-surface transition-colors">Certificación</a>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <button class="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors text-on-surface-variant relative">
          <span class="material-symbols-outlined text-[22px]">notifications</span>
        </button>
        <div class="flex items-center gap-3 pl-2 border-l border-stone-200">
          <div class="text-right hidden sm:block">
            <p class="text-xs font-bold leading-none">Admin User</p>
            <p class="text-[10px] text-on-surface-variant font-medium">SENA Administrator</p>
          </div>
          <div class="h-9 w-9 rounded-full bg-surface-container-high overflow-hidden border border-stone-200 shadow-sm">
            <img src="https://lh3.googleusercontent.com/a/ACg8ocL8v2MvGZ2v9ZzP5Y7Z4v2Y7v2Y7v2Y7v2Y7v2Y7v2Y=s96-c" alt="Avatar" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </nav>

    <!-- Sidebar -->
    <aside class="hidden lg:flex h-screen w-64 fixed left-0 top-0 flex-col bg-surface-container-low border-r border-stone-200/60 z-50">
      <div class="p-8 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span class="material-symbols-outlined fill-icon text-[26px]">architecture</span>
          </div>
          <div>
            <h2 class="font-headline font-extrabold text-on-surface leading-none tracking-tight">Gestión EP</h2>
            <p class="text-[9px] text-on-surface-variant font-black uppercase tracking-[0.15em] mt-1 opacity-70">Institutional Architect</p>
          </div>
        </div>
      </div>
      
      <nav class="flex-1 px-4 space-y-1.5">
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold text-on-surface-variant hover:bg-stone-200/50 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined text-[20px]">dashboard</span> DASHBOARD
        </a>
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold text-on-surface-variant hover:bg-stone-200/50 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined text-[20px]">analytics</span> ETAPA PRODUCTIVA
        </a>
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold bg-white text-primary shadow-sm border border-stone-200/40 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined fill-icon text-[20px]">business</span> DIRECTORIO
        </a>
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold text-on-surface-variant hover:bg-stone-200/50 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined text-[20px]">description</span> DOCUMENTACIÓN
        </a>
        <a href="#" class="flex items-center gap-3.5 px-4 py-3.5 font-label text-[11px] uppercase tracking-widest font-extrabold text-on-surface-variant hover:bg-stone-200/50 rounded-xl transition-all duration-300">
          <span class="material-symbols-outlined text-[20px]">settings</span> CONFIGURACIÓN
        </a>
      </nav>

      <div class="p-4 mt-auto">
        <button class="w-full flex items-center gap-3 px-4 py-3 font-label text-[11px] uppercase tracking-widest font-black text-on-surface-variant hover:bg-error-container hover:text-error rounded-xl transition-all">
          <span class="material-symbols-outlined text-[20px]">logout</span> CERRAR SESIÓN
        </button>
      </div>
    </aside>

    <main class="lg:ml-64 pt-24 px-8 lg:px-12 pb-12">
      <div class="max-w-7xl mx-auto">
        <div class="mb-12">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <p class="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-2">Directorio Institucional</p>
              <h2 class="text-5xl font-headline font-extrabold tracking-tight text-on-surface">Directorio de Empresas</h2>
              <p class="text-on-surface-variant mt-3 text-lg max-w-2xl leading-relaxed">
                Gestiona las alianzas corporativas para el seguimiento de la Etapa Productiva. Monitorea cupos, convenios y contactos directos.
              </p>
            </div>
            <div class="flex gap-4">
              <button class="bg-surface-container-high text-on-surface px-6 py-4 rounded-2xl font-black font-label text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-surface-container-highest transition-all shadow-sm">
                <span class="material-symbols-outlined text-[20px]">tune</span> Filtros Avanzados
              </button>
              <button @click="vincularEmpresa" class="bg-primary text-white px-8 py-4 rounded-2xl font-black font-label text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all">
                <span class="material-symbols-outlined fill-icon text-[20px]">add_business</span>
                Vincular Empresa
              </button>
            </div>
          </div>
        </div>

        <!-- Global Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-premium">
              <p class="text-[10px] font-black text-on-surface-variant opacity-40 uppercase tracking-widest mb-1">Total Empresas</p>
              <div class="flex items-end gap-2">
                 <p class="text-3xl font-headline font-black text-on-surface">1,248</p>
                 <span class="text-xs font-black text-primary mb-1.5">+12%</span>
              </div>
           </div>
           <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-premium">
              <p class="text-[10px] font-black text-on-surface-variant opacity-40 uppercase tracking-widest mb-1">Sector Líder</p>
              <p class="text-base font-bold text-on-surface">Tecnología & I+D</p>
           </div>
           <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-premium">
              <p class="text-[10px] font-black text-on-surface-variant opacity-40 uppercase tracking-widest mb-1">Aprendices Activos</p>
              <p class="text-3xl font-headline font-black text-on-surface">4,592</p>
           </div>
           <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-premium flex items-center justify-between">
              <div>
                <p class="text-[10px] font-black text-on-surface-variant opacity-40 uppercase tracking-widest mb-1">Alertas</p>
                <p class="text-lg font-black text-error">24 Alertas</p>
              </div>
              <div class="flex -space-x-3">
                 <img src="https://lh3.googleusercontent.com/a/ACg8ocL8v2MvGZ2v9ZzP5Y7Z4v2Y7v2Y7v2Y7v2Y7v2Y7v2Y=s96-c" class="w-8 h-8 rounded-full border-2 border-white" />
                 <img src="https://lh3.googleusercontent.com/a/ACg8ocL8v2MvGZ2v9ZzP5Y7Z4v2Y7v2Y7v2Y7v2Y7v2Y7v2Y=s96-c" class="w-8 h-8 rounded-full border-2 border-white" />
                 <div class="w-8 h-8 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center text-[10px] font-bold">+42</div>
              </div>
           </div>
        </div>

        <div class="bg-white rounded-[2rem] p-4 mb-10 flex flex-col md:flex-row gap-4 shadow-premium border border-stone-100/60">
          <div class="flex-1 relative">
            <span class="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40">search</span>
            <input 
              v-model="searchQuery"
              class="w-full bg-surface-container-low border border-stone-200/50 rounded-2xl py-4 pl-14 pr-5 font-medium placeholder:text-stone-400 focus:ring-4 focus:ring-primary/10 transition-all" 
              placeholder="Filtrar por Nombre, NIT o Sector..." 
            />
          </div>
          <div class="flex gap-4">
            <select v-model="selectedSector" class="bg-white border border-stone-200/60 rounded-2xl px-6 py-4 font-bold text-on-surface-variant text-xs uppercase tracking-widest cursor-pointer focus:ring-4 focus:ring-primary/10 transition-all">
              <option v-for="sector in sectores" :key="sector" :value="sector">{{ sector }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <TransitionGroup name="list">
            <div 
              v-for="empresa in empresasFiltradas" 
              :key="empresa.id"
              class="group bg-white rounded-[2.5rem] p-8 shadow-premium border-l-8 border-t border-r border-b border-stone-100/60 transition-all duration-500 hover:shadow-2xl hover:shadow-stone-200/40 hover:-translate-y-2"
              :class="empresa.estado === 'Activa' ? 'border-primary' : empresa.estado === 'En Trámite' ? 'border-warning' : 'border-stone-300'"
            >
              <div class="flex justify-between items-start mb-8">
                <div class="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center border border-stone-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                  <span class="material-symbols-outlined text-4xl fill-icon" :class="`text-${empresa.color}`">{{ empresa.icon }}</span>
                </div>
                <span 
                  class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border"
                  :class="{
                    'bg-primary-light text-primary border-primary/20': empresa.estado === 'Activa',
                    'bg-warning-container text-warning border-warning/20': empresa.estado === 'En Trámite',
                    'bg-stone-100 text-stone-500 border-stone-200': empresa.estado === 'Inactiva'
                  }"
                >
                  {{ empresa.estado }}
                </span>
              </div>

              <div class="mb-8">
                <h3 class="text-2xl font-headline font-extrabold text-on-surface leading-tight transition-colors group-hover:text-primary">
                  {{ empresa.nombre }}
                </h3>
                <p class="text-xs text-on-surface-variant font-bold mt-2 opacity-50">NIT: {{ empresa.nit }}</p>
              </div>

              <div class="space-y-4 mb-10">
                <div class="flex items-center gap-4 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                  <span class="material-symbols-outlined text-[20px] fill-icon opacity-30">person</span>
                  <span>{{ empresa.contacto }}</span>
                </div>
                <div class="flex items-center gap-4 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                  <span class="material-symbols-outlined text-[20px] fill-icon opacity-30">alternate_email</span>
                  <span class="truncate">{{ empresa.email }}</span>
                </div>
                <div class="flex items-center gap-4 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                  <span class="material-symbols-outlined text-[20px] fill-icon opacity-30">call</span>
                  <span>{{ empresa.telefono }}</span>
                </div>
              </div>

              <div class="pt-8 border-t border-stone-50 flex items-center justify-between">
                <div>
                  <span class="block text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.15em] mb-1">Sector Institucional</span>
                  <span class="text-xs font-black text-on-surface uppercase">{{ empresa.sector }}</span>
                </div>
                <div class="text-right">
                  <span class="block text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.15em] mb-1">Aprendices</span>
                  <div class="flex items-center gap-2 justify-end">
                    <div class="flex -space-x-1">
                       <div class="w-5 h-5 rounded-full bg-primary/20 border border-white"></div>
                       <div class="w-5 h-5 rounded-full bg-primary/40 border border-white"></div>
                    </div>
                    <span class="text-sm font-black text-primary">{{ empresa.aprendices }}</span>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <div v-if="empresasFiltradas.length === 0" class="mt-24 text-center animate-in fade-in zoom-in duration-700">
          <div class="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-100">
            <span class="material-symbols-outlined text-5xl text-stone-300">search_off</span>
          </div>
          <h4 class="text-xl font-headline font-extrabold text-on-surface mb-2">Sin resultados</h4>
          <p class="text-on-surface-variant font-medium">No se encontraron empresas con esos criterios de búsqueda.</p>
          <button @click="searchQuery = ''; selectedSector = 'Todos los Sectores'" class="mt-8 text-primary font-bold text-sm hover:underline">Limpiar todos los filtros</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.font-headline { font-family: 'Outfit', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
.font-label { font-family: 'Manrope', sans-serif; }

.shadow-premium {
  box-shadow: 0 4px 30px -4px rgba(0, 0, 0, 0.04), 0 2px 15px -2px rgba(0, 0, 0, 0.02);
}

/* Animación para el filtrado de la lista */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}
.list-leave-active {
  position: absolute;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.fill-icon {
  font-variation-settings: 'FILL' 1;
}
</style>