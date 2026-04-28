// router/index.js — Configuración de Vue Router
// 🤝 ZONA COMPARTIDA
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth.store'

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
    meta: { requiresAuth: true, roles: ['INSTRUCTOR', 'APRENDIZ'] },
  },
  {
    path: '/seguimiento',
    name: 'TrackingCalendar',
    component: () => import('../../modules/operation-tracking-dev3/views/TrackingCalendar.vue'),
    meta: { requiresAuth: true, roles: ['INSTRUCTOR'] },
  },

  // ── Redirección por defecto ──────────────────────────
  { path: '/', redirect: '/login' },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard de navegación global inteligente y robusto
router.beforeEach((to) => {
  const auth = useAuthStore()
  
  // Verificación ultra-rápida (Store o LocalStorage)
  const isActuallyLoggedIn = auth.isLoggedIn || !!localStorage.getItem('repfora_token')

  // 1. Si el usuario ya está logueado e intenta ir al Login, mandarlo al Dashboard
  if (to.name === 'Login' && isActuallyLoggedIn) {
    return { name: 'Dashboard' }
  }

  // 2. Si la ruta requiere auth y no está logueado, mandarlo al Login
  if (to.meta.requiresAuth && !isActuallyLoggedIn) {
    return { name: 'Login' }
  }

  // 3. Si va a la raíz (/) y está logueado, mandarlo al Dashboard
  if (to.path === '/' && isActuallyLoggedIn) {
    return { name: 'Dashboard' }
  }
})

export default router
