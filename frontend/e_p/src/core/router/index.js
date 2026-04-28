// router/index.js — Configuración de Vue Router
// 🤝 ZONA COMPARTIDA
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth.store'

const routes = [
  // ── 🟢 DEV 1: Auth ──────────────────────────────────
  {
    path: '/login',
    name: 'Login',
    component: () => import('../../modules/admin-auth-dev1/views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: () => import('../../modules/admin-auth-dev1/views/ResetPassword.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'DashboardAdmin',
    component: () => import('../../modules/admin-auth-dev1/views/DashboardAdmin.vue'),
    meta: { requiresAuth: false, roles: ['ADMIN'] },
  },
  {
    path: '/usuarios',
    name: 'UserManagement',
    component: () => import('../../modules/admin-auth-dev1/views/DashboardAdmin.vue'),
    meta: { requiresAuth: false, roles: ['ADMIN'] },
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

// Guard de navegación global
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'Login' }
  }
})

export default router
