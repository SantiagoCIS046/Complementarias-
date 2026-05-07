<script setup>
import { ref, computed } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import HeaderLayout from '@/layouts/headerViewsLayout.vue'
import BtnBack from '@/layouts/btnBackLayout.vue'

const searchCert = ref('')
const certifications = ref([
  { id: 1, name: 'Antonio Mancilla', doc: '1002345678', ficha: '2670687', status: 'POR REVISAR', date: '---' },
  { id: 2, name: 'Daniela Palacio', doc: '1005678123', ficha: '2450012', status: 'CERTIFICADO', date: '15/04/2026' }
])

const filteredCerts = computed(() => {
  return certifications.value.filter(c => 
    c.name.toLowerCase().includes(searchCert.value.toLowerCase()) || 
    c.doc.includes(searchCert.value) || 
    c.ficha.includes(searchCert.value)
  )
})
</script>

<template>
  <div class="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header />

      <main class="flex-1 overflow-y-auto p-8 lg:p-12">
        <div class="w-full space-y-2">
          <HeaderLayout title="Certificación de Etapa Productiva"></HeaderLayout>

          <div class="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div class="flex justify-between items-center mb-8">
              <div class="search-box">
                <span class="material-symbols-outlined">search</span>
                <input v-model="searchCert" type="text" placeholder="Buscar aprendiz..." class="bg-gray-50 border-none rounded-xl px-10 py-3 text-sm focus:ring-2 focus:ring-green-500 w-80" />
              </div>
            </div>

            <table class="w-full text-sm">
              <thead>
                <tr class="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th class="pb-4 text-left">APRENDIZ</th>
                  <th class="pb-4 text-left">FICHA</th>
                  <th class="pb-4 text-center">ESTADO</th>
                  <th class="pb-4 text-center">FECHA CERT.</th>
                  <th class="pb-4 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="cert in filteredCerts" :key="cert.id" class="hover:bg-gray-50/50 transition-all">
                  <td class="py-5">
                    <div class="flex flex-col">
                      <span class="font-bold text-gray-900">{{ cert.name }}</span>
                      <span class="text-[11px] text-gray-400">{{ cert.doc }}</span>
                    </div>
                  </td>
                  <td><span class="bg-green-50 text-green-700 px-3 py-1 rounded-lg font-bold text-[11px]">#{{ cert.ficha }}</span></td>
                  <td class="text-center">
                    <span :class="cert.status === 'CERTIFICADO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'" class="px-4 py-1.5 rounded-full font-bold text-[10px]">
                      {{ cert.status }}
                    </span>
                  </td>
                  <td class="text-center text-gray-500 font-medium">{{ cert.date }}</td>
                  <td class="text-right">
                    <button class="bg-green-9 text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-green-10 transition-all">
                      Gestionar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.bg-green-9 { background-color: var(--color_button); }
.bg-green-10 { background-color: #1b5e20; }
</style>
