<script setup>
import { useUiStore } from './core/store/ui.store'
const uiStore = useUiStore()
</script>

<template>
  <!-- 🌀 Cargador Global Premium -->
  <Transition name="fade">
    <div v-if="uiStore.isLoading" class="global-loader">
      <div class="loader-content">
        <div class="spinner"></div>
        <p class="loader-text">Procesando información...</p>
      </div>
    </div>
  </Transition>

  <router-view />
</template>

<style>
.global-loader {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.loader-content {
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #39a900;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

.loader-text {
  color: #1e293b;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.5px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
