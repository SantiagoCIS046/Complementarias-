<template>
  <div class="header-view-container">
    <div class="flex items-center gap-2">
      <span v-if="icon" class="material-symbols-outlined text-green-700 text-lg">{{ icon }}</span>
      <h1 class="header-view-title">{{ title }}</h1>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  icon: String
})
</script>

<style scoped>
.header-view-container {
  margin-bottom: 0.75rem;
}
.header-view-title {
  font-size: 1.1rem;
  font-weight: 900;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.02em;
}
</style>
