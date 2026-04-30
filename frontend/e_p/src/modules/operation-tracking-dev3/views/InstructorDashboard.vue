<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../../core/store/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.user || { name: 'Instructor', role: 'INSTRUCTOR' })

// --- Datos del Monitor de Horas ---
const hoursStats = ref({
  reportadas: 168,
  limite: 160,
  porcentaje: 0
})

// --- Datos de Novedades (Ejemplo) ---
const novedades = ref([
  { id: 1, tipo: 'Visita Técnica', fecha: '28 Oct, 2023', estado: 'RESUELTO', color: '#39A900' },
  { id: 2, tipo: 'Incapacidad Aprendiz', fecha: '29 Oct, 2023', estado: 'PENDIENTE', color: '#F59E0B' },
  { id: 3, tipo: 'Cambio de Empresa', fecha: '30 Oct, 2023', estado: 'EN REVISIÓN', color: '#3B82F6' }
])

onMounted(() => {
  hoursStats.value.porcentaje = Math.min((hoursStats.value.reportadas / hoursStats.value.limite) * 100, 100)
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="operation-dashboard">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-icon"><span class="material-symbols-outlined">analytics</span></div>
        <div class="logo-text">
          <span class="title">Academic Admin</span>
          <span class="subtitle">REGIONAL DIVISION</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <a href="#" class="nav-item active"><span class="material-symbols-outlined">dashboard_customize</span> Dashboard</a>
        <a href="#" class="nav-item"><span class="material-symbols-outlined">assignment_ind</span> Seguimiento</a>
        <a href="#" class="nav-item"><span class="material-symbols-outlined">pending_actions</span> Novedades</a>
        <a href="#" class="nav-item"><span class="material-symbols-outlined">folder_shared</span> Certificaciones</a>
      </nav>

      <div class="sidebar-footer">
        <button @click="handleLogout" class="nav-item logout-btn"><span class="material-symbols-outlined">logout</span> Logout</button>
      </div>
    </aside>

    <!-- MAIN WRAPPER -->
    <div class="main-wrapper">
      <header class="topbar">
        <div class="header-info">
          <p class="breadcrumb">PANEL CENTRAL / INSTRUCTOR</p>
          <h2 class="page-title">Dashboard del Instructor</h2>
        </div>
        <div class="topbar-actions">
          <button class="btn-primary"><span class="material-symbols-outlined">add</span> Reportar Novedad</button>
          <div class="divider"></div>
          <div class="user-profile">
            <span class="user-name">{{ currentUser.name }}</span>
            <div class="user-avatar">
              <img src="https://ui-avatars.com/api/?name=Instructor&background=1A4D2E&color=fff" alt="Avatar">
            </div>
          </div>
        </div>
      </header>

      <main class="content">
        <!-- GRID SUPERIOR -->
        <div class="dashboard-grid">
          
          <!-- MONITOR DE HORAS -->
          <div class="card monitor-card">
            <div class="card-header">
              <h3 class="card-title">Monitor de Carga Horaria</h3>
              <span class="material-symbols-outlined icon-faded">schedule</span>
            </div>
            
            <div class="progress-circle-container">
              <svg class="progress-svg" viewBox="0 0 100 100">
                <circle class="circle-bg" cx="50" cy="50" r="45"></circle>
                <circle class="circle-progress" cx="50" cy="50" r="45" :style="{ strokeDashoffset: 283 - (283 * hoursStats.porcentaje) / 100 }"></circle>
              </svg>
              <div class="circle-text">
                <span class="hours-val">{{ hoursStats.reportadas }}</span>
                <span class="hours-label">HORAS</span>
              </div>
            </div>

            <div class="stats-info">
              <div class="stat-box">
                <span class="slabel">LÍMITE MENSUAL</span>
                <span class="sval">{{ hoursStats.limite }} Horas</span>
              </div>
              <div v-if="hoursStats.reportadas > hoursStats.limite" class="stat-box warning">
                <span class="slabel">EXCESO DETECTADO</span>
                <span class="sval text-red">+{{ hoursStats.reportadas - hoursStats.limite }} Horas Extra</span>
              </div>
            </div>
          </div>

          <!-- FORMULARIO RÁPIDO DE NOVEDADES -->
          <div class="card form-card">
            <h3 class="card-title mb-6">Registro Rápido de Novedad</h3>
            <form class="quick-form">
              <div class="form-group">
                <label>Seleccionar Aprendiz</label>
                <select class="custom-select">
                  <option>Aprendiz Martin</option>
                  <option>Carlos Alberto Ruíz</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Tipo de Novedad</label>
                  <select class="custom-select">
                    <option>Visita Técnica</option>
                    <option>Problema Administrativo</option>
                    <option>Cambio de Estado</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Fecha de Ocurrencia</label>
                  <input type="date" class="custom-input">
                </div>
              </div>
              <div class="form-group">
                <label>Descripción Breve</label>
                <textarea class="custom-textarea" placeholder="Escribe los detalles aquí..."></textarea>
              </div>
              <button type="button" class="btn-submit">Enviar Reporte</button>
            </form>
          </div>
        </div>

        <!-- TABLA DE HISTORIAL -->
        <div class="card table-card mt-8">
          <div class="card-header flex-row">
            <h3 class="card-title">Historial de Resoluciones y Novedades</h3>
            <div class="header-actions">
              <span class="material-symbols-outlined">filter_list</span>
              <span class="material-symbols-outlined">download</span>
            </div>
          </div>
          
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>TIPO DE NOVEDAD</th>
                <th>FECHA REPORTE</th>
                <th>ESTADO</th>
                <th class="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="nov in novedades" :key="nov.id">
                <td class="faded">#00{{ nov.id }}</td>
                <td class="bold">{{ nov.tipo }}</td>
                <td>{{ nov.fecha }}</td>
                <td>
                  <span class="badge" :style="{ background: nov.color + '10', color: nov.color, borderColor: nov.color + '30' }">
                    <span class="dot" :style="{ background: nov.color }"></span> {{ nov.estado }}
                  </span>
                </td>
                <td class="text-right">
                  <span class="material-symbols-outlined action-icon">visibility</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.operation-dashboard {
  display: flex;
  min-height: 100vh;
  background: #F4F7F6;
  font-family: 'Inter', sans-serif;
  color: #334155;
}

/* SIDEBAR */
.sidebar {
  width: 260px;
  background: #FFFFFF;
  border-right: 1px solid #F1F5F9;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
}

.sidebar-header { padding: 32px; display: flex; align-items: center; gap: 12px; }
.logo-icon { width: 40px; height: 40px; background: #1A4D2E; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #FFF; }
.logo-text .title { display: block; font-size: 14px; font-weight: 800; color: #0F172A; line-height: 1; }
.logo-text .subtitle { font-size: 9px; font-weight: 700; color: #94A3B8; letter-spacing: 1px; }

.sidebar-nav { padding: 0 16px; flex: 1; }
.nav-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px; font-size: 13px; font-weight: 600; 
  color: #94A3B8; text-decoration: none; border-radius: 12px; transition: 0.2s; border: none; background: none; width: 100%; cursor: pointer;
}
.nav-item:hover { color: #334155; background: #F8FAFC; }
.nav-item.active { color: #39A900; background: #F0FDF4; border-left: 4px solid #39A900; }
.sidebar-footer { padding: 24px 16px; border-top: 1px solid #F1F5F9; }

/* MAIN WRAPPER */
.main-wrapper { flex: 1; margin-left: 260px; display: flex; flex-direction: column; height: 100vh; overflow-y: auto; }

.topbar {
  height: 90px; background: #FFF; border-bottom: 1px solid #F1F5F9; display: flex; align-items: center; justify-content: space-between;
  padding: 0 40px; position: sticky; top: 0; z-index: 90;
}
.breadcrumb { font-size: 9px; font-weight: 800; color: #94A3B8; letter-spacing: 2px; margin-bottom: 4px; }
.page-title { font-size: 22px; font-weight: 900; color: #0F172A; tracking-tight; }

.topbar-actions { display: flex; align-items: center; gap: 24px; }
.btn-primary {
  background: #39A900; color: #FFF; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 12px;
  display: flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(57, 169, 0, 0.15);
}
.divider { width: 1px; height: 32px; background: #F1F5F9; }
.user-profile { display: flex; align-items: center; gap: 12px; }
.user-name { font-size: 12px; font-weight: 800; color: #1E293B; }
.user-avatar { width: 42px; height: 42px; border-radius: 50%; overflow: hidden; border: 2px solid #F1F5F9; }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* CONTENT & GRID */
.content { padding: 40px; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.dashboard-grid { display: grid; grid-template-columns: 350px 1fr; gap: 32px; }

.card { background: #FFF; border-radius: 28px; padding: 32px; border: 1px solid #F1F5F9; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
.card-title { font-size: 15px; font-weight: 800; color: #0F172A; margin-bottom: 24px; }

/* MONITOR CARD */
.monitor-card { display: flex; flex-direction: column; align-items: center; }
.progress-circle-container { position: relative; width: 200px; height: 200px; margin: 20px 0; }
.progress-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.circle-bg { fill: none; stroke: #F1F5F9; stroke-width: 8; }
.circle-progress { fill: none; stroke: #39A900; stroke-width: 8; stroke-linecap: round; stroke-dasharray: 283; transition: stroke-dashoffset 1s ease-out; }
.circle-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.hours-val { font-size: 48px; font-weight: 900; color: #0F172A; line-height: 1; }
.hours-label { font-size: 10px; font-weight: 900; color: #94A3B8; letter-spacing: 2px; }

.stats-info { width: 100%; margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
.stat-box { background: #F8FAFC; padding: 16px; border-radius: 16px; display: flex; flex-direction: column; gap: 4px; border: 1px solid #F1F5F9; }
.stat-box.warning { border-color: #FECACA; background: #FEF2F2; }
.slabel { font-size: 9px; font-weight: 900; color: #94A3B8; letter-spacing: 0.5px; }
.sval { font-size: 14px; font-weight: 800; color: #334155; }
.text-red { color: #DC2626; }

/* QUICK FORM */
.quick-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 11px; font-weight: 800; color: #64748B; }
.custom-select, .custom-input, .custom-textarea {
  background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px 16px; border-radius: 12px;
  font-size: 13px; font-weight: 600; color: #1E293B; outline: none; transition: 0.2s;
}
.custom-select:focus, .custom-input:focus, .custom-textarea:focus { border-color: #39A900; background: #FFF; box-shadow: 0 0 0 4px rgba(57, 169, 0, 0.05); }
.custom-textarea { height: 100px; resize: none; }
.btn-submit {
  background: #0F172A; color: #FFF; border: none; padding: 14px; border-radius: 12px;
  font-weight: 700; font-size: 13px; margin-top: 10px; cursor: pointer; transition: 0.2s;
}
.btn-submit:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

/* TABLE */
.custom-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.custom-table th { text-align: left; padding: 16px; font-size: 10px; font-weight: 900; color: #94A3B8; border-bottom: 2px solid #F1F5F9; }
.custom-table td { padding: 20px 16px; font-size: 13px; border-bottom: 1px solid #F8FAFC; }
.bold { font-weight: 700; color: #1E293B; }
.faded { color: #94A3B8; font-family: monospace; font-size: 11px; }

.badge {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px;
  font-size: 9px; font-weight: 900; border: 1px solid transparent;
}
.badge .dot { width: 5px; height: 5px; border-radius: 50%; }

.action-icon { color: #CBD5E1; cursor: pointer; transition: 0.2s; }
.action-icon:hover { color: #39A900; }

.material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
</style>
