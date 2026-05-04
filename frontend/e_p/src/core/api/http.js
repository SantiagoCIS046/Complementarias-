// http.js — Cliente HTTP centralizado con autenticación automática
// 🤝 ZONA COMPARTIDA — Todos los servicios deben usar este cliente

import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

const API = import.meta.env.VITE_API_URL

// Instancia Axios compartida apuntando a la API base
const http = axios.create({
  baseURL: API,
  timeout: 15000,  // 15 segundos máximo por petición
})

// ── Interceptor de REQUEST ───────────────────────────────────────────────────
// Inyecta el token JWT en el header Authorization antes de cada petición
http.interceptors.request.use(
  (config) => {
    const auth = useAuthStore()
    // Intentar token del store primero, luego localStorage como fallback
    const token = auth.token || localStorage.getItem('repfora_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Interceptor de RESPONSE ──────────────────────────────────────────────────
// Maneja errores globales: 401 cierra sesión y redirige al Login
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado en el servidor → cerrar sesión local
      try {
        const auth = useAuthStore()
        auth.logout()
        // Redirigir al Login sin usar router (evita dependencia circular)
        window.location.href = '/login?expired=1'
      } catch {
        // Si el store aún no está disponible, limpiar manualmente
        localStorage.removeItem('repfora_token')
        localStorage.removeItem('repfora_user')
        localStorage.removeItem('repfora_last_activity')
        window.location.href = '/login?expired=1'
      }
    }
    return Promise.reject(error)
  }
)

export default http
