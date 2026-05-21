import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'repfora-theme'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  /**
   * Inicializa el tema leyendo de localStorage o detectando prefers-color-scheme.
   * Debe invocarse lo antes posible (App.vue onMounted).
   */
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    applyTheme(false) // Sin transición en la carga inicial

    // Escuchar cambios del sistema operativo (solo si no hay preferencia guardada)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        isDark.value = e.matches
        applyTheme(true)
      }
    })
  }

  /**
   * Alterna entre light y dark mode con transición suave.
   */
  function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
    applyTheme(true)
  }

  /**
   * Aplica el tema al elemento <html>.
   * @param {boolean} animate - Si true, agrega clase de transición temporal.
   */
  function applyTheme(animate = true) {
    const root = document.documentElement

    if (animate) {
      root.classList.add('theme-transitioning')
    }

    if (isDark.value) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }

    if (animate) {
      // Remover la clase de transición después de que termine la animación
      setTimeout(() => {
        root.classList.remove('theme-transitioning')
      }, 500)
    }
  }

  return { isDark, initTheme, toggleTheme }
})
