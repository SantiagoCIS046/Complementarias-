<script setup>
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import HourMonitor from '../components/HourMonitor.vue';
import ActivitySummary from '../components/ActivitySummary.vue';
import NoveltyForm from '../components/NoveltyForm.vue';
import ResolutionHistory from '../components/ResolutionHistory.vue';
</script>

<template>
  <div class="flex h-screen bg-[#f8fafc] overflow-hidden">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header />

      <main class="flex-1 overflow-y-auto p-8 lg:p-12">
        <div class="max-w-7xl mx-auto space-y-8">
          <!-- Breadcrumb & Title -->
          <div class="space-y-1">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Panel Central</p>
            <h2 class="text-3xl font-extrabold text-gray-800">Dashboard del Instructor</h2>
          </div>

          <!-- Top Grid: Monitor and Form -->
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <!-- Left Column: Monitor & Activity -->
            <div class="xl:col-span-4 space-y-8">
              <HourMonitor :hours="168" :limit="160" />
              <ActivitySummary />
            </div>

            <!-- Right Column: Form -->
            <div class="xl:col-span-8">
              <NoveltyForm />
            </div>
          </div>

          <!-- Bottom: History -->
          <ResolutionHistory />
          
          <!-- Footer -->
          <footer class="pt-8 pb-4 flex flex-col md:flex-row items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-100 mt-12 gap-4">
            <p>© 2023 SENA - REPFORA Institutional Architect</p>
            <div class="flex items-center gap-8">
              <a href="#" class="hover:text-gray-600">Soporte Técnico</a>
              <a href="#" class="hover:text-gray-600">Políticas de Privacidad</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  </div>
</template>
