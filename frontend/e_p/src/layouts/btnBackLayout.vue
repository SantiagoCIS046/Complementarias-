<template>
  <div class="q-mb-md">
    <button @click="router.push(route)" class="btn-back-repfora">
      <span class="material-symbols-outlined">arrow_back</span>
      <span>VOLVER</span>
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
defineProps({
  route: {
    type: String,
    default: '/home'
  }
})
</script>

<style scoped>
.btn-back-repfora {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #64748b;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px 12px;
  border-radius: 8px;
}
.btn-back-repfora:hover {
  background-color: #f1f5f9;
  color: var(--color_button);
}
.btn-back-repfora span {
  font-size: 1.2rem;
}
</style>
