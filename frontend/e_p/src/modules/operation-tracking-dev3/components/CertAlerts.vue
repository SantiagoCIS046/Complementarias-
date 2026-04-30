<script setup>
import { Sparkles, AlertTriangle, ArrowRight } from 'lucide-vue-next';
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Automatic Validation Alert -->
    <div class="bg-green-50/50 border border-green-100 rounded-3xl p-8 flex items-start gap-6 relative overflow-hidden group">
      <div class="p-4 bg-green-100 rounded-2xl text-green-500 group-hover:scale-110 transition-transform">
        <Sparkles :size="32" />
      </div>
      <div class="space-y-2">
        <h4 class="text-lg font-bold text-gray-800">Automatic Validation Ready</h4>
        <p class="text-xs text-gray-500 font-medium leading-relaxed max-w-sm">
          The system has pre-analyzed 12 new EP_CERTIFICATES. Click to approve all matching records instantly.
        </p>
        <button class="flex items-center gap-2 text-xs font-bold text-sena-green hover:underline pt-2 group">
          Batch Process Now
          <ArrowRight :size="14" class="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>

    <!-- Expired Signatures Alert -->
    <div class="bg-red-50/50 border border-red-100 rounded-3xl p-8 flex items-start gap-6 relative overflow-hidden group">
      <div class="p-4 bg-red-100 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
        <AlertTriangle :size="32" />
      </div>
      <div class="space-y-2">
        <h4 class="text-lg font-bold text-gray-800">Expired Signatures Detected</h4>
        <p class="text-xs text-gray-500 font-medium leading-relaxed max-w-sm">
          3 documents from the Performance Evaluation category have expired digital signatures. Manual outreach required.
        </p>
        <button class="flex items-center gap-2 text-xs font-bold text-red-500 hover:underline pt-2 group">
          Notify Apprentices
          <ArrowRight :size="14" class="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  </div>
</template>
