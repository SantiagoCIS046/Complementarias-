<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../../core/store/auth.store'
import { epService } from '../services/ep.service'

const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.user || { name: 'Usuario', role: 'Invitado' })
const aprendiz = ref({
  nombre: 'Cargando...',
  estadoActual: 'EN REVISIÓN',
  horasCompletadas: 0,
  horasTotales: 864,
  progresoPorcentaje: 0,
  razonSocial: '---',
  nit: '---',
  jefe: '---',
  telefono: '---'
})

const bitacoras = ref([
  { numero: '08', rango: '01 Oct - 15 Oct, 2023', horas: '80h', estado: 'APROBADO' },
  { numero: '09', rango: '16 Oct - 30 Oct, 2023', horas: '80h', estado: 'PENDIENTE' },
  { numero: '10', rango: '01 Nov - 15 Nov, 2023', horas: '40h', estado: 'PENDIENTE' }
])

onMounted(async () => {
  try {
    const res = await epService.getAll()
    if (res.data?.data?.length > 0) {
      const s = res.data.data[0]
      aprendiz.value = {
        nombre: s.apprenticeId?.name || 'Aprendiz',
        estadoActual: s.estado || 'EN REVISIÓN',
        horasCompletadas: s.horasCompletadas || 0,
        horasTotales: s.horasRequeridas || 864,
        progresoPorcentaje: s.horasRequeridas > 0 ? Math.round((s.horasCompletadas / s.horasRequeridas) * 100) : 0,
        razonSocial: s.companyId?.razonSocial || '---',
        nit: s.companyId?.nit || '---',
        jefe: s.companySnapshot?.jefeInmediato || '---',
        telefono: s.companySnapshot?.telefonoContacto || '---'
      }
    }
  } catch (e) { console.error(e) }
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="repfora-dashboard">
    <!-- BARRA LATERAL -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-icon"><span class="material-symbols-outlined">school</span></div>
        <div class="logo-text">
          <span class="title">Administración Académica</span>
          <span class="subtitle">DIVISIÓN REGIONAL</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <a href="#" class="nav-item active"><span class="material-symbols-outlined">grid_view</span> Tablero</a>
        <a href="#" class="nav-item"><span class="material-symbols-outlined">group</span> Aprendices</a>
        <a href="#" class="nav-item"><span class="material-symbols-outlined">menu_book</span> Currículo</a>
        <a href="#" class="nav-item"><span class="material-symbols-outlined">task_alt</span> Evaluaciones</a>
        <a href="#" class="nav-item"><span class="material-symbols-outlined">bar_chart</span> Reportes</a>
      </nav>

      <div class="sidebar-footer">
        <a href="#" class="nav-item"><span class="material-symbols-outlined">help</span> Soporte</a>
        <button @click="handleLogout" class="nav-item logout-btn"><span class="material-symbols-outlined">logout</span> Cerrar Sesión</button>
      </div>
    </aside>

    <!-- CONTENIDO -->
    <div class="main-wrapper">
      <header class="topbar">
        <h2 class="page-title">Seguimiento de Aprendiz</h2>
        <div class="topbar-actions">
          <button class="btn-new"><span class="material-symbols-outlined">add</span> Nueva Bitácora</button>
          <div class="divider"></div>
          <span class="material-symbols-outlined notification">notifications</span>
          <div class="user-profile">
            <span class="user-name">{{ currentUser.name }}</span>
            <div class="user-avatar">
              <img src="https://ui-avatars.com/api/?name=Usuario&background=39a900&color=fff" alt="Avatar del Usuario">
            </div>
          </div>
        </div>
      </header>

      <main class="content">
        <!-- SECCIÓN INFO + PROGRESO -->
        <div class="info-grid">
          <div class="company-card">
            <div class="card-header">
              <div class="header-text">
                <span class="label">INFORMACIÓN DE LA EMPRESA</span>
                <span class="desc">Detalles del convenio de etapa productiva</span>
              </div>
              <span class="status-badge">ESTADO: {{ aprendiz.estadoActual }}</span>
            </div>
            
            <div class="company-details">
              <div class="detail-item">
                <div class="icon"><span class="material-symbols-outlined">corporate_fare</span></div>
                <div class="txt">
                  <span class="key">EMPRESA</span>
                  <span class="val">{{ aprendiz.razonSocial }}</span>
                </div>
              </div>
              <div class="detail-item">
                <div class="icon"><span class="material-symbols-outlined">fingerprint</span></div>
                <div class="txt">
                  <span class="key">NIT</span>
                  <span class="val">{{ aprendiz.nit }}</span>
                </div>
              </div>
              <div class="detail-item">
                <div class="icon"><span class="material-symbols-outlined">contact_page</span></div>
                <div class="txt">
                  <span class="key">JEFE INMEDIATO</span>
                  <span class="val">{{ aprendiz.jefe }}</span>
                </div>
              </div>
              <div class="detail-item">
                <div class="icon"><span class="material-symbols-outlined">call</span></div>
                <div class="txt">
                  <span class="key">TELÉFONO</span>
                  <span class="val">{{ aprendiz.telefono }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="progress-card">
            <span class="label">PROGRESO DE ETAPA</span>
            <h1 class="percent">{{ aprendiz.progresoPorcentaje }}%</h1>
            <p class="stats">Has completado {{ aprendiz.horasCompletadas }} de {{ aprendiz.horasTotales }} horas totales requeridas.</p>
            <div class="progress-bar-container">
              <div class="progress-bar" :style="{ width: aprendiz.progresoPorcentaje + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- TABLA BITACORAS -->
        <div class="table-container">
          <div class="table-header">
            <h3>Mis Bitácoras Quincenales</h3>
            <div class="table-icons">
              <span class="material-symbols-outlined">filter_list</span>
              <span class="material-symbols-outlined">search</span>
            </div>
          </div>
          <table class="bitacora-table">
            <thead>
              <tr>
                <th>NÚMERO</th>
                <th>RANGO DE FECHAS</th>
                <th class="center">HORAS REPORTADAS</th>
                <th class="center">ESTADO</th>
                <th class="right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in bitacoras" :key="item.numero">
                <td class="bold">Bitácora #{{ item.numero }}</td>
                <td class="faded">
                  <span class="material-symbols-outlined mini">calendar_today</span> {{ item.rango }}
                </td>
                <td class="center"><span class="hours-badge">{{ item.horas }}</span></td>
                <td class="center">
                  <span class="badge" :class="item.estado === 'APROBADO' ? 'success' : 'pending'">
                    <span class="dot"></span> {{ item.estado }}
                  </span>
                </td>
                <td class="right">
                  <span class="material-symbols-outlined action-btn">
                    {{ item.estado === 'APROBADO' ? 'visibility' : 'edit_square' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="table-footer">
            <span class="footer-stats">MOSTRANDO 3 DE 10 REGISTROS</span>
            <div class="pagination">
              <button class="pag-btn">Anterior</button>
              <button class="pag-btn">Siguiente</button>
            </div>
          </div>
        </div>

        <!-- BANNER INFO -->
        <div class="reminder-banner">
          <div class="reminder-content">
            <div class="lamp-icon"><span class="material-symbols-outlined">lightbulb</span></div>
            <div class="reminder-text">
              <span class="rtitle">Recordatorio de Cierre</span>
              <p class="rdesc">Recuerda que las bitácoras deben ser firmadas digitalmente por tu jefe inmediato antes de la fecha de corte quincenal.</p>
            </div>
          </div>
          <button class="btn-cal">Ver Calendario de Fechas</button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

/* --- Reset & Base --- */
.repfora-dashboard {
  display: flex;
  min-height: 100vh;
  background: #F4F7F6;
  font-family: 'Inter', sans-serif;
  color: #334155;
  overflow: hidden;
  width: 100%;
}

/* --- Sidebar --- */
.sidebar {
  width: 230px;
  background: #FFFFFF;
  border-right: 1px solid #F1F5F9;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: #1A4D2E;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFF;
  flex-shrink: 0;
}

.logo-text .title {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: #0F172A;
  line-height: 1;
}

.logo-text .subtitle {
  font-size: 9px;
  font-weight: 700;
  color: #94A3B8;
  letter-spacing: 1px;
}

.sidebar-nav {
  padding: 0 16px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #94A3B8;
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.2s;
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
  text-align: left;
}

.nav-item:hover { color: #334155; background: #F8FAFC; }
.nav-item.active {
  color: #39A900;
  background: #F0FDF4;
  border-left: 4px solid #39A900;
  border-radius: 4px 12px 12px 4px;
}

.sidebar-footer { padding: 24px 16px; border-top: 1px solid #F1F5F9; }
.logout-btn:hover { color: #EF4444; }

/* --- Main Layout --- */
.main-wrapper {
  flex: 1;
  margin-left: 230px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  min-width: 0;
}

.topbar {
  height: 64px;
  background: #FFF;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 90;
  flex-shrink: 0;
}

.page-title { font-size: 20px; font-weight: 800; color: #1E293B; }

.topbar-actions { display: flex; align-items: center; gap: 24px; }
.btn-new {
  background: #39A900;
  color: #FFF;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(57, 169, 0, 0.2);
}

.divider { width: 1px; height: 32px; background: #F1F5F9; }
.notification { color: #94A3B8; cursor: pointer; }

.user-profile { display: flex; align-items: center; gap: 12px; }
.user-name { font-size: 12px; font-weight: 800; color: #1E293B; }
.user-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid #F1F5F9; flex-shrink: 0; }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* --- Content --- */
.content { padding: 24px; max-width: 1400px; width: 100%; box-sizing: border-box; }

.info-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 24px; }

.company-card { background: #FFF; border-radius: 20px; padding: 24px; border: 1px solid #F1F5F9; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.header-text .label { display: block; font-size: 11px; font-weight: 900; color: #94A3B8; letter-spacing: 1px; }
.header-text .desc { font-size: 11px; color: #94A3B8; }
.status-badge { background: #FFF1F2; color: #E11D48; padding: 6px 12px; border-radius: 8px; font-size: 9px; font-weight: 900; }

.company-details { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.detail-item { display: flex; align-items: center; gap: 12px; background: #F8FAFC; padding: 12px; border-radius: 12px; border: 1px solid #F1F5F9; }
.detail-item .icon { width: 36px; height: 36px; background: #FFF; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #39A900; box-shadow: 0 2px 8px rgba(0,0,0,0.02); flex-shrink: 0; }
.detail-item .key { display: block; font-size: 9px; font-weight: 900; color: #94A3B8; margin-bottom: 2px; }
.detail-item .val { font-size: 13px; font-weight: 700; color: #1E293B; }

.progress-card { background: #1A4D2E; border-radius: 20px; padding: 24px; color: #FFF; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
.progress-card::after { content: ''; position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.05); border-radius: 50%; blur: 40px; }
.progress-card .label { font-size: 10px; font-weight: 900; color: rgba(255,255,255,0.6); letter-spacing: 2px; }
.progress-card .percent { font-size: 48px; font-weight: 900; margin: 8px 0; line-height: 1; letter-spacing: -1px; }
.progress-card .stats { font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.6; }
.progress-bar-container { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 20px; overflow: hidden; }
.progress-bar { height: 100%; background: #FFF; border-radius: 10px; transition: width 1s; }

/* --- Table --- */
.table-container { background: #FFF; border-radius: 20px; border: 1px solid #F1F5F9; overflow: hidden; }
.table-header { padding: 24px; display: flex; justify-content: space-between; align-items: center; }
.table-header h3 { font-size: 15px; font-weight: 700; color: #1E293B; }
.table-icons { display: flex; gap: 16px; color: #CBD5E1; }

.bitacora-table { width: 100%; border-collapse: collapse; }
.bitacora-table th { background: #F8FAFC; padding: 12px 24px; text-align: left; font-size: 10px; font-weight: 900; color: #94A3B8; letter-spacing: 1px; }
.bitacora-table td { padding: 16px 24px; border-top: 1px solid #F1F5F9; font-size: 13px; }
.bitacora-table .bold { font-weight: 700; color: #1E293B; }
.bitacora-table .faded { color: #64748B; font-weight: 500; display: flex; align-items: center; gap: 8px; }
.bitacora-table .mini { font-size: 18px; color: #CBD5E1; }
.bitacora-table .center { text-align: center; }
.bitacora-table .right { text-align: right; }

.hours-badge { background: #F1F5F9; color: #64748B; padding: 6px 12px; border-radius: 8px; font-size: 10px; font-weight: 900; }
.badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 9px; font-weight: 900; letter-spacing: 0.5px; border: 1px solid transparent; }
.badge.success { background: #F0FDF4; color: #16A34A; border-color: #DCFCE7; }
.badge.pending { background: #FFF1F2; color: #E11D48; border-color: #FFE4E6; }
.badge .dot { width: 6px; height: 6px; border-radius: 50%; }
.badge.success .dot { background: #16A34A; }
.badge.pending .dot { background: #E11D48; }

.action-btn { color: #CBD5E1; cursor: pointer; transition: color 0.2s; }
.action-btn:hover { color: #39A900; }

.table-footer { padding: 24px 32px; background: #F8FAFC; border-top: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }
.footer-stats { font-size: 10px; font-weight: 900; color: #94A3B8; letter-spacing: 0.5px; }
.pagination { display: flex; gap: 8px; }
.pag-btn { background: #FFF; border: 1px solid #E2E8F0; padding: 8px 16px; border-radius: 8px; font-size: 10px; font-weight: 700; color: #475569; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

/* --- Banner --- */
.reminder-banner { background: #F1F5F9; border-radius: 24px; padding: 32px; display: flex; justify-content: space-between; align-items: center; margin-top: 32px; border: 1px solid #E2E8F0; }
.reminder-content { display: flex; align-items: center; gap: 24px; }
.lamp-icon { width: 56px; height: 56px; background: #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #39A900; border: 1px solid #E2E8F0; flex-shrink: 0; }
.rtitle { display: block; font-size: 14px; font-weight: 700; color: #1E293B; margin-bottom: 4px; }
.rdesc { font-size: 12px; color: #94A3B8; font-weight: 500; max-width: 500px; margin: 0; }
.btn-cal { background: #E2E8F0; border: none; padding: 12px 24px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #475569; cursor: pointer; white-space: nowrap; }

/* --- Material Symbols --- */
.material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }

/* --- Responsiveness fixes --- */
@media (max-width: 1200px) {
  .info-grid { grid-template-columns: 1fr; }
}
</style>
