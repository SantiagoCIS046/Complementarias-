<script setup>
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import CompanyCard from '../components/CompanyCard.vue';
import BtnBack from '@/layouts/btnBackLayout.vue';
import HeaderLayout from '@/layouts/headerViewsLayout.vue';

const companies = [
  {
    id: 1,
    name: 'TechSolutions S.A.S',
    nit: '900.234.567-1',
    contact: 'Carlos Mario Restrepo',
    phone: '+57 300 456 7890',
    apprentices: 12,
    type: 'factory'
  },
  {
    id: 2,
    name: 'Global Retail Ltda.',
    nit: '830.112.445-3',
    contact: 'Elena Maria Zuluaga',
    phone: '+57 601 223 4455',
    apprentices: 8,
    type: 'retail'
  },
  {
    id: 3,
    name: 'Constructora ProEjes',
    nit: '901.002.339-9',
    contact: 'Ing. Roberto Blanco',
    phone: '+57 312 889 0011',
    apprentices: 5,
    type: 'compass'
  }
];

const filters = [
  { label: 'Todas (24)', active: true },
  { label: 'Activas', active: false },
  { label: 'En Revisión', active: false },
  { label: 'Sin Aprendices', active: false }
];
</script>

<template>
  <div class="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header />

      <main class="flex-1 overflow-y-auto p-12 lg:p-16">
        <div class="max-w-7xl mx-auto space-y-8">
          <!-- 1. Botón volver -->
          <BtnBack route="/dashboard" />

          <!-- 2. Título de sección con separador verde -->
          <HeaderLayout title="Directorio de Empresas" />

          <!-- 3. Barra superior: botón Crear + filtro/buscador -->
          <div class="row items-center justify-between flex gap-6">
            <button class="bg-green-9 text-white px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-green-10 transition-all shadow-md">
              <span class="material-symbols-outlined" style="font-size: 20px">add_circle</span>
              Crear Nueva Empresa
            </button>
            
            <div class="flex-1 max-w-md">
              <div class="input-box-repfora">
                <span class="material-symbols-outlined icon-prepend">search</span>
                <input type="text" placeholder="Buscar empresa..." class="field-input-native" />
              </div>
            </div>
          </div>

          <!-- Filters -->
          <div class="flex items-center gap-3 q-mt-md">
            <button 
              v-for="filter in filters" 
              :key="filter.label"
              :class="[
                'px-6 py-2 rounded-full text-xs font-bold transition-all border',
                filter.active 
                  ? 'bg-green-10 text-white border-green-10 shadow-sm' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              ]"
            >
              {{ filter.label }}
            </button>
          </div>

          <!-- Grid -->
          <div class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-10">
            <CompanyCard 
              v-for="company in companies" 
              :key="company.id" 
              :company="company" 
            />
            <CompanyCard :is-placeholder="true" />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

/* Estilos adicionales para compatibilidad con la guía */
.bg-green-9 { background-color: var(--color_button); }
.bg-green-10 { background-color: #1b5e20; }
.text-white { color: white; }

.input-box-repfora {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  transition: all 0.2s;
}
.icon-prepend { color: var(--color_input); font-size: 20px; }
.field-input-native { flex: 1; border: none; background: transparent; padding: 10px 0; outline: none; font-size: 0.9rem; }
</style>
