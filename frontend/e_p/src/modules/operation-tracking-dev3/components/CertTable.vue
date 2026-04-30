<script setup>
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  ClipboardList,
  Mail
} from 'lucide-vue-next';

const submissions = [
  {
    id: 'CERT-9921-X',
    name: 'EP_CERTIFICATE',
    apprentice: 'Carlos Mendoza Ruiz',
    initials: 'CM',
    date: 'Oct 12, 2023',
    status: 'APPROVED',
    statusClass: 'bg-green-100 text-green-700'
  },
  {
    id: 'EVAL-0042-B',
    name: 'PERFORMANCE_EVALUATION',
    apprentice: 'Andrea Rodriguez',
    initials: 'AR',
    date: 'Oct 14, 2023',
    status: 'PENDING_REVIEW',
    statusClass: 'bg-gray-100 text-gray-600',
    action: true
  },
  {
    id: 'LETR-8812-Y',
    name: 'COMMITMENT_LETTER',
    apprentice: 'Julian Peña',
    initials: 'JP',
    date: 'Oct 11, 2023',
    status: 'REJECTED',
    statusClass: 'bg-red-100 text-red-700'
  },
  {
    id: 'CERT-1122-Z',
    name: 'EP_CERTIFICATE',
    apprentice: 'Lucia Morales',
    initials: 'LM',
    date: 'Oct 10, 2023',
    status: 'APPROVED',
    statusClass: 'bg-green-100 text-green-700'
  }
];

const getIcon = (name) => {
  if (name.includes('CERTIFICATE')) return FileText;
  if (name.includes('EVALUATION')) return ClipboardList;
  return Mail;
};

const getIconBg = (name) => {
  if (name.includes('CERTIFICATE')) return 'bg-green-50 text-green-500';
  if (name.includes('EVALUATION')) return 'bg-pink-50 text-pink-500';
  return 'bg-red-50 text-red-500';
};
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
    <div class="p-8 flex items-center justify-between border-b border-gray-50">
      <h3 class="text-lg font-bold text-gray-800">Recent Document Submissions</h3>
      <div class="flex items-center gap-6">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Showing 10 of 1,284 entries</span>
        <div class="flex items-center gap-2">
          <button class="p-2 border border-gray-100 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
            <ChevronLeft :size="16" />
          </button>
          <button class="p-2 border border-gray-100 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="bg-gray-50/50">
            <th class="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Document Name</th>
            <th class="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Apprentice Name</th>
            <th class="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Upload Date</th>
            <th class="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
            <th class="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="doc in submissions" :key="doc.id" class="group hover:bg-gray-50/30 transition-colors">
            <td class="px-8 py-6">
              <div class="flex items-center gap-4">
                <div :class="['p-3 rounded-xl', getIconBg(doc.name)]">
                  <component :is="getIcon(doc.name)" :size="20" />
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-800 tracking-tight">{{ doc.name }}</p>
                  <p class="text-[10px] font-bold text-gray-400">ID: {{ doc.id }}</p>
                </div>
              </div>
            </td>
            <td class="px-8 py-6">
              <div class="flex items-center justify-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-white shadow-sm">
                  {{ doc.initials }}
                </div>
                <div class="text-left">
                  <p class="text-xs font-bold text-gray-700 leading-tight">{{ doc.apprentice.split(' ').slice(0,2).join(' ') }}</p>
                  <p class="text-xs font-bold text-gray-700 leading-tight">{{ doc.apprentice.split(' ').slice(2).join(' ') }}</p>
                </div>
              </div>
            </td>
            <td class="px-8 py-6 text-center">
              <p class="text-xs font-bold text-gray-600">{{ doc.date.split(',')[0] }}</p>
              <p class="text-[10px] font-bold text-gray-400">{{ doc.date.split(',')[1] }}</p>
            </td>
            <td class="px-8 py-6 text-center">
              <span :class="['px-4 py-1.5 rounded-full text-[10px] font-extrabold tracking-widest', doc.statusClass]">
                {{ doc.status }}
              </span>
            </td>
            <td class="px-8 py-6 text-right">
              <button v-if="doc.action" class="bg-sena-green text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-sena-green-dark transition-all shadow-lg shadow-green-100 active:scale-95">
                Review Now
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Custom Scrollbar Handle (Visual only as in image) -->
    <div class="px-8 pb-4">
      <div class="h-1.5 bg-gray-100 rounded-full w-full relative">
        <div class="absolute left-0 top-0 h-full w-1/3 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  </div>
</template>
