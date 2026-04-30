<script setup>
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import CompanyCard from '../components/CompanyCard.vue';
import { Plus } from 'lucide-vue-next';

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
        <div class="max-w-7xl mx-auto space-y-12">
          <!-- Header Section -->
          <div class="flex items-start justify-between">
            <div class="space-y-2">
              <h1 class="text-5xl font-black text-gray-800 tracking-tighter">Directorio de Empresas</h1>
              <p class="text-lg text-gray-400 font-medium">Gestión integral de aliados corporativos y convenios.</p>
            </div>
            <button class="flex items-center gap-3 bg-sena-green text-white px-8 py-5 rounded-[1.25rem] font-bold text-sm shadow-xl shadow-green-100 hover:bg-sena-green-dark hover:-translate-y-1 transition-all active:translate-y-0">
              <Plus :size="20" stroke-width="3" />
              Nueva Empresa
            </button>
          </div>

          <!-- Filters -->
          <div class="flex items-center gap-4">
            <button 
              v-for="filter in filters" 
              :key="filter.label"
              :class="[
                'px-8 py-3 rounded-full text-xs font-extrabold transition-all',
                filter.active 
                  ? 'bg-sena-green text-white shadow-lg shadow-green-100' 
                  : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
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

<style scoped>
/* Ensure clean typography */
h1 {
  letter-spacing: -0.05em;
}
</style>
