// router/index.js — Configuración de Vue Router
// 🤝 ZONA COMPARTIDA
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth.store'
import { useUiStore } from '../store/ui.store'

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
    meta: { requiresAuth: true, roles: ['ADMIN', 'INSTRUCTOR', 'APRENDIZ'] },
  },
  {
    path: '/seguimiento',
    name: 'TrackingCalendar',
    component: () => import('../../modules/operation-tracking-dev3/views/TrackingCalendar.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'INSTRUCTOR', 'APRENDIZ'] },
  },

  // ── Redirección Inteligente ──────────────────────────
  { 
    path: '/', 
    redirect: () => {
      const token = localStorage.getItem('repfora_token');
      const user = JSON.parse(localStorage.getItem('repfora_user') || '{}');
      if (!token) return '/login';
      
      // Redirección inicial según el rol
      if (user.role === 'ADMIN') return '/dashboard';
      if (user.role === 'INSTRUCTOR') return '/etapas';
      return '/bitacoras'; // Default para Aprendices
    }
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard de navegación con validación de ROLES
router.beforeEach((to) => {
  const auth = useAuthStore()
  const ui = useUiStore()
  
  const isActuallyLoggedIn = !!auth.token || !!localStorage.getItem('repfora_token')
  const userRole = auth.user?.role || JSON.parse(localStorage.getItem('repfora_user') || '{}').role

  // 1. Verificación de Autenticación
  if (to.meta.requiresAuth && !isActuallyLoggedIn) {
    return { name: 'Login' }
  }

  // 2. Verificación de ROLES (Solo Admins entran a todo)
  if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    console.warn(`Acceso denegado para el rol: ${userRole}`);
    // Redirigir a su área permitida si intenta entrar donde no debe
    if (userRole === 'INSTRUCTOR') return { name: 'EPRegister' };
    if (userRole === 'APRENDIZ') return { name: 'BitacorasReview' };
    return { name: 'Login' };
  }

  // 3. Ya logueado no entra al Login
  if (to.name === 'Login' && isActuallyLoggedIn) {
    return { name: 'Dashboard' }
  }

  ui.startLoading(800)
})

export default router
