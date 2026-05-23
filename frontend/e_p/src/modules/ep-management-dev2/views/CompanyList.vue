<script setup>
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import CompanyCard from '../components/CompanyCard.vue';
import BtnBack from '@/layouts/btnBackLayout.vue';

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
  <div class="repfora-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header title="Directorio de Empresas" />

      <main class="content">
        <div class="w-full space-y-6">
          <!-- 1. Botón volver -->
          <BtnBack route="/dashboard" />

          <!-- 3. Barra superior: botón Crear + filtro/buscador -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <button class="btn-create-company">
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
          <div class="flex flex-wrap items-center gap-3">
            <button 
              v-for="filter in filters" 
              :key="filter.label"
              :class="['filter-btn', { active: filter.active }]"
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
.btn-create-company {
  background-color: var(--color_button);
  color: var(--color_text_button);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.btn-create-company:hover {
  filter: brightness(0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--bg-active);
}

.input-box-repfora {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  transition: all 0.2s;
}

.icon-prepend { 
  color: var(--color_button); 
  font-size: 20px; 
}

.field-input-native { 
  flex: 1; 
  border: none; 
  background: transparent; 
  padding: 10px 0; 
  outline: none; 
  font-size: 0.9rem; 
  color: var(--text-primary); 
}

.filter-btn {
  padding: 0.5rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid var(--border-primary);
  background-color: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.filter-btn.active {
  background-color: var(--color_button);
  color: var(--color_text_button);
  border-color: var(--color_button);
  box-shadow: var(--shadow-sm);
}
</style>
