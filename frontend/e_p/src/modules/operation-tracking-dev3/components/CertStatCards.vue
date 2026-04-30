<script setup>
import { 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-vue-next';

const stats = [
  { 
    label: 'Total Certificates', 
    value: '1,284', 
    change: '+12%', 
    trend: 'up',
    icon: FileCheck,
    iconColor: 'text-green-500',
    iconBg: 'bg-green-50'
  },
  { 
    label: 'Pending Review', 
    value: '42', 
    tag: 'High Priority',
    icon: Clock,
    iconColor: 'text-pink-500',
    iconBg: 'bg-pink-50'
  },
  { 
    label: 'Approved Today', 
    value: '18', 
    tag: 'Real-time',
    icon: CheckCircle2,
    iconColor: 'text-sena-green',
    iconBg: 'bg-sena-green/10'
  },
  { 
    label: 'Rejected Docs', 
    value: '07', 
    change: '-5%', 
    trend: 'down',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50'
  }
];
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div 
      v-for="stat in stats" 
      :key="stat.label"
      class="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex flex-col gap-4"
    >
      <div class="flex items-start justify-between">
        <div :class="['p-3 rounded-xl', stat.iconBg]">
          <component :is="stat.icon" :class="stat.iconColor" :size="24" />
        </div>
        <div v-if="stat.change" :class="['flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full', stat.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600']">
          <TrendingUp v-if="stat.trend === 'up'" :size="12" />
          <TrendingDown v-else :size="12" />
          {{ stat.change }}
        </div>
        <div v-else-if="stat.tag" class="text-[10px] font-bold px-3 py-1 bg-gray-50 text-gray-400 rounded-full uppercase tracking-wider">
          {{ stat.tag }}
        </div>
      </div>
      
      <div>
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1">{{ stat.label }}</p>
        <p class="text-3xl font-extrabold text-gray-800">{{ stat.value }}</p>
      </div>
    </div>
  </div>
</template>
