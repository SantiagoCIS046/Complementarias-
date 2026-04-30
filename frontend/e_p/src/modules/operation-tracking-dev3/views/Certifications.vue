<script setup>
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import CertStatCards from '../components/CertStatCards.vue';
import CertTable from '../components/CertTable.vue';
import CertAlerts from '../components/CertAlerts.vue';
import { Filter, Download, Plus } from 'lucide-vue-next';
</script>

<template>
  <div class="flex h-screen bg-[#f8fafc] overflow-hidden">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header />

      <main class="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div class="max-w-7xl mx-auto space-y-12 pb-20">
          <!-- Header Section -->
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div class="space-y-2">
              <p class="text-[10px] font-bold text-sena-green uppercase tracking-[0.2em]">Institutional Management</p>
              <h2 class="text-4xl font-black text-gray-800 leading-tight">Certificaciones y<br/>Documentación</h2>
              <p class="text-sm text-gray-400 font-medium max-w-xl">
                Review, validate, and manage the administrative documentation lifecycle for active apprentices within the REPFORA ecosystem.
              </p>
            </div>
            
            <div class="flex items-center gap-4">
              <button class="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-2xl text-xs font-bold transition-all">
                <Filter :size="18" />
                Advanced Filters
              </button>
              <button class="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-2xl text-xs font-bold transition-all">
                <Download :size="18" />
                Export CSV
              </button>
            </div>
          </div>

          <!-- Stats Grid -->
          <CertStatCards />

          <!-- Table Section -->
          <CertTable />

          <!-- Alerts Section -->
          <CertAlerts />
        </div>

        <!-- Floating Action Button -->
        <button class="absolute bottom-10 right-10 w-16 h-16 bg-sena-green text-white rounded-2xl shadow-2xl shadow-green-200 flex items-center justify-center hover:bg-sena-green-dark hover:scale-110 transition-all active:scale-95 group z-20">
          <Plus :size="32" class="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Custom transitions and refinements */
main {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}
</style>
