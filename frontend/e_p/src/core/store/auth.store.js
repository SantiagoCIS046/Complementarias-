// auth.store.js — Estado global del usuario autenticado (Pinia)
// 🤝 ZONA COMPARTIDA
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ── Constante de expiración ──────────────────────────────────────────────────
/** Tiempo máximo de inactividad: 24 horas en milisegundos */
const SESSION_TTL = 24 * 60 * 60 * 1000   // 24 h
const LAST_ACTIVITY_KEY = 'repfora_last_activity'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────
  const storedUser = localStorage.getItem('repfora_user')
  const user  = ref((storedUser && storedUser !== 'undefined') ? JSON.parse(storedUser) : null)
  const token = ref(localStorage.getItem('repfora_token') || null)

  // ── Getters ────────────────────────────────────────
  const isLoggedIn = computed(() => !!token.value)
  const userRole   = computed(() => user.value?.role || null)
  const userName   = computed(() => user.value?.nombre || '')

  // ── Actions ────────────────────────────────────────

  /**
   * Guarda el usuario y token luego del login exitoso.
   * También registra el momento de inicio de sesión.
   * @param {{ user: object, token: string }} payload
   */
  function login(payload) {
    const userData = payload.user || payload.usuario
    user.value  = userData
    token.value = payload.token
    localStorage.setItem('repfora_user',  JSON.stringify(userData))
    localStorage.setItem('repfora_token', payload.token)
    // Registrar el momento de la última actividad al hacer login
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
  }

  /**
   * Renueva el timestamp de última actividad.
   * Se llama en cada navegación exitosa del usuario.
   */
  function refreshActivity() {
    if (token.value) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
    }
  }

  /**
   * Verifica si la sesión expiró por inactividad (> 24 horas).
   * @returns {boolean} true si la sesión ya no es válida
   */
  function isSessionExpired() {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)
    if (!lastActivity) return true   // Si no hay registro, considerar expirado
    return (Date.now() - parseInt(lastActivity, 10)) > SESSION_TTL
  }

  /**
   * Limpia la sesión del usuario por completo.
   */
  function logout() {
    user.value  = null
    token.value = null
    localStorage.removeItem('repfora_user')
    localStorage.removeItem('repfora_token')
    localStorage.removeItem(LAST_ACTIVITY_KEY)
  }

  return {
    user, token, isLoggedIn, userRole, userName,
    login, logout, refreshActivity, isSessionExpired,
  }
})
