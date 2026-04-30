<script setup>
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import TrackingCalendarCard from '../components/TrackingCalendarCard.vue';
import NextVisitCard from '../components/NextVisitCard.vue';
import TrackingTable from '../components/TrackingTable.vue';
import TrackingStats from '../components/TrackingStats.vue';
import { Plus } from 'lucide-vue-next';
</script>

<template>
  <div class="flex h-screen bg-[#f8fafc] overflow-hidden">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header />

      <main class="flex-1 overflow-y-auto p-12 lg:p-16">
        <div class="max-w-screen-2xl mx-auto space-y-10">
          <!-- Header Section -->
          <div class="flex items-end justify-between">
            <div class="space-y-2">
              <p class="text-[10px] font-bold text-sena-green uppercase tracking-[0.2em]">Instructor Administrativo</p>
              <h2 class="text-4xl font-black text-gray-800 tracking-tight">Seguimiento de Visitas</h2>
              <p class="text-sm text-gray-400 font-medium max-w-xl">
                Gestione la programación de las visitas técnicas obligatorias y supervise el estado administrativo de sus aprendices.
              </p>
            </div>
            <button class="flex items-center gap-3 bg-sena-green text-white px-8 py-4 rounded-xl font-bold text-sm shadow-xl shadow-green-100 hover:bg-sena-green-dark hover:-translate-y-1 transition-all active:translate-y-0">
              <Plus :size="20" stroke-width="3" />
              Programar Nuevo Seguimiento
            </button>
          </div>

          <!-- Main Layout Grid -->
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-10">
            <!-- Left Column: Calendar & Next Visit -->
            <div class="xl:col-span-4 space-y-8">
              <TrackingCalendarCard />
              <NextVisitCard />
            </div>

            <!-- Right Column: Listado -->
            <div class="xl:col-span-8">
              <TrackingTable />
            </div>
          </div>

          <!-- Bottom Section: Stats -->
          <TrackingStats />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Refined aesthetics */
main {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}
</style>
