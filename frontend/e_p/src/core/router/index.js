// router/index.js — Configuración de Vue Router
// 🤝 ZONA COMPARTIDA
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth.store'
import { useUiStore } from '../store/ui.store'

// ── Helpers ──────────────────────────────────────────────────────
/**
 * Obtiene el rol del usuario leyendo primero el store de Pinia y,
 * si no está inicializado todavía, directamente desde localStorage.
 */
function resolveRole(auth) {
  if (auth.user?.role) return auth.user.role
  try {
    const raw = localStorage.getItem('repfora_user')
    if (raw && raw !== 'undefined') return JSON.parse(raw).role
  } catch { /* ignorar */ }
  return null
}

/**
 * Devuelve la ruta de inicio según el rol.
 */
function homeForRole(role) {
  if (role === 'ADMIN')      return { name: 'Dashboard' }
  if (role === 'INSTRUCTOR') return { name: 'InstructorDashboard' }
  if (role === 'APRENDIZ')   return { name: 'EPDashboard' }
  return { name: 'Login' }
}

const routes = [
  // ── 🟢 DEV 1: Auth & Dashboard ───────────────────────
  {
    path: '/login',
    name: 'Login',
    component: () => import('../../modules/admin-auth-dev1/views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../../modules/admin-auth-dev1/views/DashboardAdmin.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/usuarios',
    name: 'UserManagement',
    component: () => import('../../modules/admin-auth-dev1/views/DashboardAdmin.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../../modules/admin-auth-dev1/views/ResetPassword.vue'),
    meta: { requiresAuth: false },
  },

  // ── 🔵 DEV 2: EP Management ─────────────────────────
  {
    // Vista exclusiva del aprendiz — su tablero personal de seguimiento
    path: '/dashboard-ep',
    name: 'EPDashboard',
    component: () => import('../../modules/ep-management-dev2/views/EPDashboard.vue'),
    meta: { requiresAuth: true, roles: ['APRENDIZ'] },
  },
  {
    path: '/etapas',
    name: 'EPRegister',
    component: () => import('../../modules/ep-management-dev2/views/EPRegister.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'INSTRUCTOR'] },
  },
  {
    path: '/empresas',
    name: 'CompanyList',
    component: () => import('../../modules/ep-management-dev2/views/CompanyList.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'INSTRUCTOR'] },
  },

  // ── 🟡 DEV 3: Operation Tracking ────────────────────
  {
    path: '/bitacoras',
    name: 'BitacorasReview',
    component: () => import('../../modules/operation-tracking-dev3/views/BitacorasReview.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'INSTRUCTOR'] },
  },
  {
    path: '/seguimiento',
    name: 'TrackingCalendar',
    component: () => import('../../modules/ep-management-dev2/views/EPSeguimiento.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'INSTRUCTOR'] },
  },
  {
    path: '/instructor-dashboard',
    name: 'InstructorDashboard',
    component: () => import('../../modules/operation-tracking-dev3/views/InstructorDashboard.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'INSTRUCTOR'] },
  },
  {
    path: '/certificacion',
    name: 'Certifications',
    component: () => import('../../modules/operation-tracking-dev3/views/Certifications.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'INSTRUCTOR'] },
  },

  {
    // Vista de seguimiento EP — exclusiva del aprendiz
    path: '/seguimiento-ep',
    name: 'EPDashboardSeg',
    component: () => import('../../modules/ep-management-dev2/views/EPDashboard.vue'),
    meta: { requiresAuth: true, roles: ['APRENDIZ'] },
  },

  // ── Redirección Inteligente (raíz) ─────────────────────────────
  {
    path: '/',
    redirect: () => {
      const token    = localStorage.getItem('repfora_token')
      const userData = localStorage.getItem('repfora_user')
      if (!token || !userData || userData === 'undefined') {
        return { name: 'Login' }
      }
      try {
        return homeForRole(JSON.parse(userData).role)
      } catch {
        return { name: 'Login' }
      }
    },
  },

  // ── Catch-all: cualquier ruta desconocida → Login ────────────────
  { path: '/:pathMatch(.*)*', name: 'NotFound', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION GUARD — Se ejecuta antes de CADA cambio de ruta
// ─────────────────────────────────────────────────────────────────────────────
router.beforeEach((to, from) => {
  const auth = useAuthStore()
  const ui   = useUiStore()

  // Iniciar el loader visual en cada navegación
  ui.startLoading(3000)

  // ── 1. Resolver sesión ────────────────────────────────────────────
  const token      = auth.token || localStorage.getItem('repfora_token')
  const isLoggedIn = !!token
  const userRole   = resolveRole(auth)

  // ── 2. Verificar expiración de sesión (24 horas de inactividad) ───
  //    Solo aplica si el usuario tiene token pero ya caducó su sesión
  if (isLoggedIn && auth.isSessionExpired()) {
    auth.logout()          // Limpiar store + localStorage
    ui.stopLoading()
    return {
      name: 'Login',
      query: { expired: '1' }, // Flag para mostrar mensaje en Login
    }
  }

  // ── 3. Ruta pública — si ya está logueado redirigir a su home ─────
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth === false && isLoggedIn && to.name === 'Login') {
    return homeForRole(userRole)
  }

  // ── 4. Ruta protegida sin sesión → Login ──────────────────────────
  if (requiresAuth && !isLoggedIn) {
    return {
      name: 'Login',
      query: { redirect: to.fullPath },
    }
  }

  // ── 5. Ruta protegida con rol no autorizado → home del rol ────────
  if (requiresAuth && isLoggedIn && to.meta.roles && !to.meta.roles.includes(userRole)) {
    return homeForRole(userRole)
  }

  // ── 6. Renovar actividad y permitir la navegación ─────────────────
  auth.refreshActivity()
  return true
})

// Detener el loader cuando la navegación termina
router.afterEach(() => {
  const ui = useUiStore()
  ui.stopLoading()
})

export default router
