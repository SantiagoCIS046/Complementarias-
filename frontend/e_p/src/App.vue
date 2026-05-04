<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from './core/store/ui.store'
import { useAuthStore } from './core/store/auth.store'

const uiStore   = useUiStore()
const authStore = useAuthStore()
const router    = useRouter()

// ── Vigilante de sesión ──────────────────────────────────────────────────────
// Comprueba cada 5 minutos si la sesión expiró (24 h de inactividad).
// Esto cubre el caso en que el usuario deja la pestaña abierta sin navegar.
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000  // 5 minutos
let sessionWatcher = null

function checkSessionExpiry() {
  if (authStore.isLoggedIn && authStore.isSessionExpired()) {
    authStore.logout()
    router.push({ name: 'Login', query: { expired: '1' } })
  }
}

onMounted(() => {
  sessionWatcher = setInterval(checkSessionExpiry, SESSION_CHECK_INTERVAL)
})

onUnmounted(() => {
  clearInterval(sessionWatcher)
})
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
