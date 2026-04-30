<script setup>
import { ref } from 'vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import BitacorasTable from '../components/BitacorasTable.vue';
import BitacoraRevisionModal from '../components/BitacoraRevisionModal.vue';
import { Download } from 'lucide-vue-next';

const isModalOpen = ref(false);
const selectedApprentice = ref(null);

const openRevision = (apprentice) => {
  selectedApprentice.value = apprentice;
  isModalOpen.value = true;
};
</script>

<template>
  <div class="flex h-screen bg-[#f8fafc] overflow-hidden">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header />

      <main class="flex-1 overflow-y-auto p-12 lg:p-16">
        <div class="max-w-7xl mx-auto space-y-12">
          <!-- Header Section -->
          <div class="flex items-start justify-between">
            <div class="space-y-2">
              <h1 class="text-4xl font-black text-gray-800 tracking-tight">Bandeja de Gestión de Bitácoras</h1>
              <p class="text-sm text-gray-400 font-medium">Supervise y valide el progreso quincenal de sus aprendices.</p>
            </div>
            <button class="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-sm">
              <Download :size="18" />
              Exportar
            </button>
          </div>

          <!-- Table & Controls -->
          <BitacorasTable @open-revision="openRevision" />
        </div>
      </main>
    </div>

    <!-- Revision Modal Overlay -->
    <BitacoraRevisionModal 
      :is-open="isModalOpen" 
      :apprentice="selectedApprentice"
      @close="isModalOpen = false" 
    />
  </div>
</template>

<style scoped>
main {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}
</style>
