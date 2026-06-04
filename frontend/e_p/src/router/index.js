import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/core/store/auth.store'

// Rutas públicas que NO requieren autenticación
const PUBLIC_ROUTES = ['Login', 'ResetPassword', 'PrimerIngreso']

const routes = [
  // ── Públicas ──────────────────────────────────────────────────────────
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/modules/admin-auth-dev1/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/modules/admin-auth-dev1/views/ResetPassword.vue'),
    meta: { public: true }
  },
  {
    path: '/primer-ingreso',
    name: 'PrimerIngreso',
    component: () => import('@/modules/admin-auth-dev1/views/ResetMandatory.vue'),
    meta: { public: true }
  },

  // ── Protegidas ────────────────────────────────────────────────────────
  {
    path: '/',
    name: 'home',
    component: () => import('@/modules/operation-tracking-dev3/views/InstructorDashboard.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/modules/operation-tracking-dev3/views/InstructorDashboard.vue')
  },
  {
    path: '/seguimiento',
    name: 'seguimiento',
    component: () => import('@/modules/ep-management-dev2/views/EPSeguimiento.vue')
  },
  {
    path: '/bitacoras',
    name: 'bitacoras',
    component: () => import('@/modules/operation-tracking-dev3/views/BitacorasReview.vue')
  },
  {
    path: '/empresas',
    name: 'empresas',
    component: () => import('@/modules/ep-management-dev2/views/CompanyList.vue')
  },
  {
    path: '/gestion-empresas',
    name: 'gestion-empresas',
    component: () => import('@/modules/admin-auth-dev1/views/CompanyManagement.vue')
  },
  {
    path: '/certificacion',
    name: 'certificacion',
    component: () => import('@/modules/operation-tracking-dev3/views/Certifications.vue')
  },
  {
    path: '/novedades',
    name: 'novedades',
    component: () => import('@/modules/operation-tracking-dev3/views/InstructorDashboard.vue')
  },
  {
    path: '/configuracion',
    name: 'configuracion',
    component: () => import('@/modules/operation-tracking-dev3/views/InstructorDashboard.vue')
  },
  {
    path: '/registro-ep',
    name: 'registro-ep',
    component: () => import('@/modules/ep-management-dev2/views/EPRegister.vue')
  },
  {
    path: '/mi-ep',
    name: 'mi-ep',
    component: () => import('@/modules/ep-management-dev2/views/EPDashboard.vue')
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: () => import('@/modules/admin-auth-dev1/views/ProfileView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ── Guard global de navegación ─────────────────────────────────────────
router.beforeEach((to) => {
  const authStore = useAuthStore()
  const isPublic = to.meta?.public === true

  // 1. Si no está autenticado y la ruta no es pública → ir al login
  if (!authStore.isLoggedIn && !isPublic) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  // 2. Si está autenticado con primer ingreso pendiente y va a una ruta protegida
  //    → forzar cambio de contraseña
  if (
    authStore.isLoggedIn &&
    authStore.user?.isFirstLogin === true &&
    to.name !== 'PrimerIngreso'
  ) {
    return { name: 'PrimerIngreso' }
  }

  // 3. Si ya está autenticado y va al login → redirigir a home
  if (authStore.isLoggedIn && to.name === 'Login') {
    return { path: '/' }
  }
})

export default router
