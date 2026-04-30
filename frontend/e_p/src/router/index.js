import { createRouter, createWebHistory } from 'vue-router'

const routes = [
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
    component: () => import('@/modules/operation-tracking-dev3/views/TrackingCalendar.vue')
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
    path: '/certificacion',
    name: 'certificacion',
    component: () => import('@/modules/operation-tracking-dev3/views/Certifications.vue')
  },
  {
    path: '/novedades',
    name: 'novedades',
    component: () => import('@/modules/operation-tracking-dev3/views/InstructorDashboard.vue') // In this design, novelties are on the dashboard
  },
  {
    path: '/configuracion',
    name: 'configuracion',
    component: () => import('@/modules/operation-tracking-dev3/views/InstructorDashboard.vue') // Placeholder
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
