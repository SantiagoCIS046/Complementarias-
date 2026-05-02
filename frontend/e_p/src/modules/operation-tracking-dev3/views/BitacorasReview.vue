<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'

const route = useRoute()
const router = useRouter()

const apprenticeName = ref(route.query.name || 'Aprendiz')
const apprenticeFicha = ref(route.query.ficha || 'S/N')
const isLoading = ref(true)

// Datos Mock de Bitácoras (Lo que el Dev 2 hará dinámico luego)
const bitacoras = ref([
  { id: 1, numero: 1, fecha: '2024-03-15', estado: 'APROBADA', comentario: 'Excelente avance en el desarrollo del backend.', instructor: 'Instructor Martin' },
  { id: 2, numero: 2, fecha: '2024-03-30', estado: 'APROBADA', comentario: 'Documentación técnica completa.', instructor: 'Instructor Martin' },
  { id: 3, numero: 3, fecha: '2024-04-15', estado: 'PENDIENTE', comentario: '', instructor: '' },
  { id: 4, numero: 4, fecha: '2024-04-30', estado: 'POR ENTREGAR', comentario: '', instructor: '' },
])

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 800)
})

const getStatusClass = (estado) => {
  if (estado === 'APROBADA') return 'status-approved'
  if (estado === 'PENDIENTE') return 'status-pending'
  return 'status-upcoming'
}

const goBack = () => router.push('/dashboard')
</script>

<template>
  <div class="bitacoras-review">
    <Sidebar />
    <div class="main-wrapper">
      <Header />
      <main class="content-view">
        
        <!-- Header de Navegación -->
        <div class="detail-header q-mb-lg">
          <button class="btn-back" @click="goBack">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div class="header-info">
            <h1>Seguimiento de Bitácoras</h1>
            <p>{{ apprenticeName }} <span class="ficha-tag">Ficha: {{ apprenticeFicha }}</span></p>
          </div>
        </div>

        <div class="review-container">
          <!-- Resumen de Progreso -->
          <div class="progress-summary-card q-mb-md">
            <div class="stat-item">
              <span class="label">Total Requeridas</span>
              <span class="value">12</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="label">Entregadas</span>
              <span class="value">3</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="label">Aprobadas</span>
              <span class="value text-green">2</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="label">Pendientes</span>
              <span class="value text-orange">1</span>
            </div>
          </div>

          <!-- Listado de Bitácoras -->
          <div class="bitacoras-grid">
            <div v-for="b in bitacoras" :key="b.id" class="bitacora-card" :class="getStatusClass(b.estado)">
              <div class="card-head">
                <span class="b-number">Bitácora #{{ b.numero }}</span>
                <span class="b-status">{{ b.estado }}</span>
              </div>
              <div class="card-body">
                <div class="b-info">
                  <span class="material-symbols-outlined">calendar_today</span>
                  <span>Fecha: {{ b.fecha }}</span>
                </div>
                <p class="b-comment" v-if="b.comentario">
                  <strong>Observación:</strong> "{{ b.comentario }}"
                </p>
                <p class="b-comment empty" v-else>Sin observaciones aún.</p>
              </div>
              <div class="card-footer">
                <button class="btn-action secondary" v-if="b.estado !== 'POR ENTREGAR'">
                  <span class="material-symbols-outlined">visibility</span> Ver PDF
                </button>
                <button class="btn-action primary" v-if="b.estado === 'PENDIENTE'">
                  <span class="material-symbols-outlined">check_circle</span> Calificar
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<style scoped>
.bitacoras-review { display: flex; height: 100vh; background-color: #F8FAF9; overflow: hidden; font-family: 'Inter', sans-serif; }
.main-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.content-view { flex: 1; overflow-y: auto; padding: 2rem; }

/* HEADER */
.detail-header { display: flex; align-items: center; gap: 1.5rem; }
.btn-back { width: 44px; height: 44px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; color: #1e293b; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
.btn-back:hover { background: #f1f5f9; color: #39A900; border-color: #39A900; }
.header-info h1 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
.header-info p { font-size: 1rem; color: #64748b; margin: 5px 0 0; display: flex; align-items: center; gap: 10px; }
.ficha-tag { background: #e0f2fe; color: #0369a1; font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; }

/* PROGRESS SUMMARY */
.progress-summary-card { background: white; padding: 1.5rem; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; justify-content: space-around; align-items: center; border: 1px solid #f1f5f9; }
.stat-item { text-align: center; }
.stat-item .label { display: block; font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px; }
.stat-item .value { font-size: 1.5rem; font-weight: 900; color: #1e293b; }
.stat-divider { width: 1px; height: 40px; background: #e2e8f0; }
.text-green { color: #39A900; }
.text-orange { color: #f59e0b; }

/* BITACORAS GRID */
.bitacoras-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.bitacora-card { background: white; border-radius: 18px; border: 1px solid #f1f5f9; box-shadow: 0 4px 12px rgba(0,0,0,0.02); display: flex; flex-direction: column; transition: 0.3s; }
.bitacora-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.06); }

.card-head { padding: 1rem 1.5rem; border-bottom: 1px solid #f8fafc; display: flex; justify-content: space-between; align-items: center; }
.b-number { font-weight: 800; color: #1e293b; }
.b-status { font-size: 0.65rem; font-weight: 900; padding: 4px 10px; border-radius: 20px; }

.card-body { padding: 1.5rem; flex: 1; }
.b-info { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 0.85rem; margin-bottom: 1rem; }
.b-info span { font-size: 1.1rem; }
.b-comment { font-size: 0.8rem; color: #475569; line-height: 1.5; background: #f8fafc; padding: 10px; border-radius: 10px; border-left: 3px solid #e2e8f0; }
.b-comment.empty { font-style: italic; color: #94a3b8; border-left: none; }

.card-footer { padding: 1rem 1.5rem; display: flex; gap: 10px; }
.btn-action { flex: 1; height: 36px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: 0.2s; }
.btn-action.secondary { background: #f1f5f9; color: #475569; }
.btn-action.secondary:hover { background: #e2e8f0; }
.btn-action.primary { background: #39A900; color: white; }
.btn-action.primary:hover { background: #2d8500; box-shadow: 0 4px 12px rgba(57, 169, 0, 0.2); }

/* STATUS CLASSES */
.status-approved .b-status { background: #dcfce7; color: #15803d; }
.status-approved { border-top: 4px solid #39A900; }
.status-pending .b-status { background: #fffbeb; color: #ca8a04; }
.status-pending { border-top: 4px solid #f59e0b; }
.status-upcoming .b-status { background: #f1f5f9; color: #94a3b8; }
.status-upcoming { opacity: 0.7; }
</style>
