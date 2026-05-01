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
    path: '/dashboard-ep',
    name: 'EPDashboard',
    component: () => import('../../modules/ep-management-dev2/views/EPDashboard.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'INSTRUCTOR', 'APRENDIZ'] },
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
    component: () => import('../../modules/operation-tracking-dev3/views/TrackingCalendar.vue'),
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
    path: '/seguimiento-ep',
    name: 'EPDashboard',
    component: () => import('../../modules/ep-management-dev2/views/EPDashboard.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'INSTRUCTOR', 'APRENDIZ'] },
  },

  // ── Redirección Inteligente ──────────────────────────
  { 
    path: '/', 
    redirect: () => {
      const token = localStorage.getItem('repfora_token');
      const userData = localStorage.getItem('repfora_user');
      
      // SI NO HAY TOKEN, SIEMPRE AL LOGIN
      if (!token || !userData || userData === 'undefined') {
        return { name: 'Login' };
      }
      
      try {
        const user = JSON.parse(userData);
        if (user.role === 'ADMIN') return { name: 'Dashboard' };
        if (user.role === 'INSTRUCTOR') return { name: 'InstructorDashboard' };
        if (user.role === 'APRENDIZ') return { name: 'EPDashboard' };
        return { name: 'Login' };
      } catch (e) {
        return { name: 'Login' };
      }
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
  
  const token = auth.token || localStorage.getItem('repfora_token')
  const isActuallyLoggedIn = !!token

  let userRole = auth.user?.role
  if (!userRole) {
    try {
      const storedUser = localStorage.getItem('repfora_user')
      if (storedUser && storedUser !== 'undefined') {
        userRole = JSON.parse(storedUser).role
      }
    } catch (e) {
      userRole = null
    }
  }

  // 1. Verificación de Autenticación
  if (to.meta.requiresAuth && !isActuallyLoggedIn) {
    return { name: 'Login' }
  }

  // 2. Verificación de ROLES
  if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    if (userRole === 'INSTRUCTOR') return { name: 'InstructorDashboard' };
    if (userRole === 'APRENDIZ') return { name: 'EPDashboard' };
    return { name: 'Login' };
  }

  // 3. Redirigir si ya está logueado e intenta ir al Login
  if (to.name === 'Login' && isActuallyLoggedIn) {
    if (userRole === 'ADMIN') return { name: 'Dashboard' }
    if (userRole === 'INSTRUCTOR') return { name: 'InstructorDashboard' }
    if (userRole === 'APRENDIZ') return { name: 'EPDashboard' }
    
    // Si tiene token pero no hay rol válido (estado corrupto), limpiar y permitir ir al Login
    localStorage.removeItem('repfora_token')
    localStorage.removeItem('repfora_user')
    if (auth.logout) auth.logout() // Si existe la acción en pinia
    return true // Continúa hacia el Login
  }

  // Navegación permitida (Sin cargador automático aquí)
})

export default router
