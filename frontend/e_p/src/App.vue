<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from './core/store/ui.store'
import { useAuthStore } from './core/store/auth.store'
import { useThemeStore } from './core/store/theme.store'
import GlobalAlertDialog from './components/ui/GlobalAlertDialog.vue'

const uiStore    = useUiStore()
const authStore  = useAuthStore()
const themeStore = useThemeStore()
const router     = useRouter()

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

let lastRefreshTime = 0
function handleUserActivity() {
  const now = Date.now()
  // Throttle to at most once every 10 seconds to reduce localStorage writes
  if (now - lastRefreshTime > 10000) {
    authStore.refreshActivity()
    lastRefreshTime = now
  }
}

onMounted(() => {
  themeStore.initTheme()
  sessionWatcher = setInterval(checkSessionExpiry, SESSION_CHECK_INTERVAL)

  // Listeners for user activity (RF-APR-20)
  window.addEventListener('keydown', handleUserActivity)
  window.addEventListener('click', handleUserActivity)
  window.addEventListener('mousemove', handleUserActivity)
  window.addEventListener('scroll', handleUserActivity)
})

onUnmounted(() => {
  clearInterval(sessionWatcher)
  window.removeEventListener('keydown', handleUserActivity)
  window.removeEventListener('click', handleUserActivity)
  window.removeEventListener('mousemove', handleUserActivity)
  window.removeEventListener('scroll', handleUserActivity)
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

  <!-- 🚨 Modal de Alertas y Confirmaciones Globales Custom -->
  <GlobalAlertDialog />
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
  border-top: 4px solid var(--color_header);
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
