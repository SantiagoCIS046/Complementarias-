// auth.store.js — Estado global del usuario autenticado (Pinia)
// 🤝 ZONA COMPARTIDA
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────
  const user  = ref(JSON.parse(localStorage.getItem('repfora_user'))  || null)
  const token = ref(localStorage.getItem('repfora_token') || null)

  // ── Getters ────────────────────────────────────────
  const isLoggedIn = computed(() => !!token.value)
  const userRole   = computed(() => user.value?.role || null)
  const userName   = computed(() => user.value?.nombre || '')

  // ── Actions ────────────────────────────────────────
  /**
   * Guarda el usuario y token luego del login exitoso.
   * @param {{ user: object, token: string }} payload
   */
  function login(payload) {
    user.value  = payload.user
    token.value = payload.token
    localStorage.setItem('repfora_user',  JSON.stringify(payload.user))
    localStorage.setItem('repfora_token', payload.token)
  }

  /**
   * Limpia la sesión del usuario.
   */
  function logout() {
    user.value  = null
    token.value = null
    localStorage.removeItem('repfora_user')
    localStorage.removeItem('repfora_token')
  }

  return { user, token, isLoggedIn, userRole, userName, login, logout }
})
