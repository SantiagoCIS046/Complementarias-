<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import HeaderLayout from '@/layouts/headerViewsLayout.vue'
import { trackingService } from '../services/tracking.service'
import { epService } from '@/modules/ep-management-dev2/services/ep.service'

const searchCert = ref('')
const currentFilter = ref('Todos')
const certifications = ref([])
const isLoading = ref(true)

const setFilter = (filter) => {
  if (!document.startViewTransition) {
    currentFilter.value = filter
    return
  }
  document.startViewTransition(() => {
    currentFilter.value = filter
  })
}

const fetchCerts = async () => {
  isLoading.value = true
  try {
    const res = await trackingService.getMyApprentices()
    const allStages = res.data.data || []
    
    certifications.value = allStages.map(s => ({
      id: s._id,
      name: s.apprenticeId?.name || 'Desconocido',
      doc: s.apprenticeId?.documento || 'S/D',
      ficha: s.radicado || s.ficha || 'S/N',
      status: s.estado,
      date: s.estado === 'CERTIFICADO' ? new Date(s.updatedAt).toLocaleDateString() : '---'
    }))
  } catch (error) {
    console.error('Error fetching certs:', error)
  } finally {
    isLoading.value = false
  }
}

const filteredCerts = computed(() => {
  return certifications.value.filter(c => {
    const q = searchCert.value.toLowerCase()
    const matchesSearch = c.name.toLowerCase().includes(q) || 
                          c.doc.includes(q) || 
                          c.ficha.toLowerCase().includes(q)
    
    if (currentFilter.value === 'Todos') return matchesSearch
    if (currentFilter.value === 'Por Revisar') return matchesSearch && (c.status === 'POR REVISAR' || c.status === 'PENDIENTE')
    if (currentFilter.value === 'Certificados') return matchesSearch && c.status === 'CERTIFICADO'
    
    return matchesSearch
  })
})

// Modal states & methods for RF-ADM-20
const showCertifyModal = ref(false)
const selectedCert = ref(null)
const certDetails = ref(null)
const loadingDetails = ref(false)
const certifying = ref(false)

const openCertifyModal = async (cert) => {
  selectedCert.value = cert
  showCertifyModal.value = true
  loadingDetails.value = true
  certDetails.value = null
  try {
    const res = await epService.getEstadoCertificacion(cert.id)
    certDetails.value = res.data?.data || res.data
  } catch (err) {
    console.error('Error fetching certification details:', err)
    alert('Error al cargar los detalles de certificación.')
  } finally {
    loadingDetails.value = false
  }
}

const handleCertify = async () => {
  if (!selectedCert.value || !certDetails.value || !certDetails.value.listoCertificar) return
  
  const confirmAction = confirm(
    `¿Estás seguro de que deseas marcar la Etapa Productiva de ${selectedCert.value.name} como COMPLETADA?\n\n` +
    `Esto transicionará el estado a CERTIFICADO y se archivará físicamente la documentación en la nube.`
  )
  if (!confirmAction) return

  certifying.value = true
  try {
    await epService.certificarEP(selectedCert.value.id)
    alert('¡Etapa Productiva certificada y archivada exitosamente!')
    showCertifyModal.value = false
    await fetchCerts() // Refrescar la tabla
  } catch (err) {
    console.error('Error certifying EP:', err)
    alert('Error al certificar la Etapa Productiva: ' + (err.response?.data?.message || err.message))
  } finally {
    certifying.value = false
  }
}

onMounted(fetchCerts)
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header title="Certificación de Etapa Productiva" />

      <main class="content">
        <div class="page-body">
          <header class="page-header">
            <div class="header-left-group">
              <div class="header-info">
                <h1 class="page-title">Certificación de Etapa Productiva</h1>
                <p class="page-description">Gestione los procesos de certificación final de sus aprendices.</p>
              </div>
            </div>
          </header>

          <div class="dashboard-grid">
            <div class="right-col" style="width: 100%">
              <div class="card main-table-card">
                <div class="table-header">
                  <div class="filter-tabs">
                    <button class="filter-btn" :class="{active: currentFilter === 'Todos'}" @click="setFilter('Todos')">Todos</button>
                    <button class="filter-btn" :class="{active: currentFilter === 'Por Revisar'}" @click="setFilter('Por Revisar')">Por Revisar</button>
                    <button class="filter-btn" :class="{active: currentFilter === 'Certificados'}" @click="setFilter('Certificados')">Certificados</button>
                  </div>
                  <div class="search-box table-search">
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input type="text" v-model="searchCert" placeholder="Buscar por aprendiz, documento o ficha..." />
                  </div>
                </div>

                <div class="table-responsive">
                  <div v-if="isLoading" class="p-12 text-center text-gray-500">
                    <div class="spin-ring-lg mx-auto mb-4"></div>
                    Cargando aprendices...
                  </div>
                  <table v-else class="user-table">
                    <thead>
                      <tr>
                        <th>APRENDIZ</th>
                        <th>FICHA</th>
                        <th>ESTADO</th>
                        <th>FECHA CERT.</th>
                        <th>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="cert in filteredCerts" :key="cert.id">
                        <td>
                          <div class="user-cell">
                            <div class="avatar bg-green">{{ cert.name.substring(0, 2).toUpperCase() }}</div>
                            <div class="user-info">
                              <p class="u-name">{{ cert.name }}</p>
                              <p class="u-email">{{ cert.doc }}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="role-badge">#{{ cert.ficha }}</span>
                        </td>
                        <td>
                          <span class="status-pill" :class="cert.status === 'CERTIFICADO' ? 'activo' : 'contract_ended'">
                            {{ cert.status }}
                          </span>
                        </td>
                        <td>
                          <span class="u-email">{{ cert.date }}</span>
                        </td>
                        <td>
                          <button class="btn-primary-sena" @click="openCertifyModal(cert)" style="padding: 6px 12px; font-size: 0.7rem;">
                            Gestionar
                          </button>
                        </td>
                      </tr>
                      <tr v-if="filteredCerts.length === 0">
                        <td colspan="5" class="text-center py-12 text-gray-400 italic">No se encontraron resultados</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- MODAL: Gestión de Certificación y Requisitos de Cierre (RF-ADM-20) -->
    <div class="modal-overlay" v-if="showCertifyModal" @click.self="showCertifyModal = false">
      <div class="modal-card modal-md" style="max-width: 500px;">
        <div class="modal-head" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-primary);">
          <h2 style="font-size: 1.1rem; font-weight: 800; margin: 0; color: var(--text-primary);">Verificación de Cierre</h2>
          <button class="modal-close" @click="showCertifyModal = false" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
        </div>
        <div class="modal-body" style="padding: 24px; color: var(--text-primary); max-height: 60vh; overflow-y: auto;">
          <p style="font-size: 14px; margin-bottom: 16px; font-weight: 600;">
            Aprendiz: <span style="color: var(--color_button);">{{ selectedCert?.name }}</span> (#{{ selectedCert?.ficha }})
          </p>

          <div v-if="loadingDetails" style="text-align: center; padding: 24px;">
            <p style="color: var(--text-secondary); font-size: 14px;">Verificando requisitos en la base de datos...</p>
          </div>
          <div v-else-if="certDetails">
            <h3 style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); margin-bottom: 12px; letter-spacing: 0.5px;">Requisitos de Etapa Productiva:</h3>
            
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
              <!-- 1. Estado de la EP -->
              <li style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" :style="{ color: certDetails.estadoEP === 'FINALIZADO' ? '#22c55e' : '#ea580c', fontSize: '18px' }">
                    {{ certDetails.estadoEP === 'FINALIZADO' ? 'check_circle' : 'error' }}
                  </span>
                  <span style="font-size: 13px; font-weight: 600;">Estado de la EP</span>
                </div>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px;"
                      :style="{ background: certDetails.estadoEP === 'FINALIZADO' ? '#dcfce7' : '#ffedd5', color: certDetails.estadoEP === 'FINALIZADO' ? '#166534' : '#9a3412' }">
                  {{ certDetails.estadoEP }}
                </span>
              </li>

              <!-- 2. Visitas de Seguimiento -->
              <li style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" :style="{ color: certDetails.checklist.visitas.cumple ? '#22c55e' : '#ef4444', fontSize: '18px' }">
                    {{ certDetails.checklist.visitas.cumple ? 'check_circle' : 'cancel' }}
                  </span>
                  <span style="font-size: 13px; font-weight: 600;">Visitas de Seguimiento Realizadas</span>
                </div>
                <span style="font-size: 12px; font-weight: 700;">
                  {{ certDetails.checklist.visitas.completadas }} / {{ certDetails.checklist.visitas.requeridas }}
                </span>
              </li>

              <!-- 3. Bitácoras Aprobadas -->
              <li style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" :style="{ color: certDetails.checklist.bitacoras.cumple ? '#22c55e' : '#ef4444', fontSize: '18px' }">
                    {{ certDetails.checklist.bitacoras.cumple ? 'check_circle' : 'cancel' }}
                  </span>
                  <span style="font-size: 13px; font-weight: 600;">Bitácoras Aprobadas</span>
                </div>
                <span style="font-size: 12px; font-weight: 700;">
                  {{ certDetails.checklist.bitacoras.aprobadas }} / {{ certDetails.checklist.bitacoras.requeridas }}
                </span>
              </li>

              <!-- 4. Horas Registradas -->
              <li style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" :style="{ color: certDetails.checklist.horas.cumple ? '#22c55e' : '#ef4444', fontSize: '18px' }">
                    {{ certDetails.checklist.horas.cumple ? 'check_circle' : 'cancel' }}
                  </span>
                  <span style="font-size: 13px; font-weight: 600;">Horas de Formación Completadas</span>
                </div>
                <span style="font-size: 12px; font-weight: 700;">
                  {{ certDetails.checklist.horas.completadas }}h / {{ certDetails.checklist.horas.requeridas }}h
                </span>
              </li>

              <!-- 5. Visitas Extraordinarias Pendientes -->
              <li style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" :style="{ color: certDetails.checklist.extraordinarias.cumple ? '#22c55e' : '#ef4444', fontSize: '18px' }">
                    {{ certDetails.checklist.extraordinarias.cumple ? 'check_circle' : 'cancel' }}
                  </span>
                  <span style="font-size: 13px; font-weight: 600;">Visitas Extraordinarias Pendientes</span>
                </div>
                <span style="font-size: 12px; font-weight: 700; color: certDetails.checklist.extraordinarias.cumple ? 'inherit' : '#ef4444';">
                  {{ certDetails.checklist.extraordinarias.pendientes }}
                </span>
              </li>

              <!-- 6. Documentos de Certificación -->
              <li style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="material-symbols-outlined" :style="{ color: certDetails.checklist.documentosFinales.cumple ? '#22c55e' : '#ef4444', fontSize: '18px' }">
                    {{ certDetails.checklist.documentosFinales.cumple ? 'check_circle' : 'cancel' }}
                  </span>
                  <span style="font-size: 13px; font-weight: 600;">Documentos Finales Aprobados</span>
                </div>
                <span style="font-size: 12px; font-weight: 700;">
                  {{ certDetails.checklist.documentosFinales.aprobados }} / {{ certDetails.checklist.documentosFinales.total }}
                </span>
              </li>
            </ul>

            <div v-if="certDetails.listoCertificar" style="margin-top: 20px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
              <span class="material-symbols-outlined">verified</span>
              Todos los requisitos de cierre se cumplen con éxito. Listo para archivar.
            </div>
            <div v-else style="margin-top: 20px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
              <span class="material-symbols-outlined">error</span>
              La etapa productiva no cumple con todos los requisitos para ser COMPLETADA.
            </div>
          </div>
        </div>
        <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--border-primary); display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn-cancel" @click="showCertifyModal = false" style="background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-primary); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancelar</button>
          <button class="btn-primary-sena" 
                  :disabled="!certDetails?.listoCertificar || certifying" 
                  @click="handleCertify"
                  style="padding: 8px 20px; font-weight: 700; font-size: 0.85rem; border-radius: 8px;">
            {{ certifying ? 'Completando y Archivando...' : 'Marcar como COMPLETADA' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Header */
.page-body { flex: 1; overflow-y: auto; padding: 12px 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 1.1rem; font-weight: 800; margin: 0; color: var(--text-primary); }
.page-description { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }
.header-left-group { display: flex; align-items: center; gap: 32px; flex: 1; }
.header-info { min-width: 200px; }

/* Dashboard Grid */
.dashboard-grid { display: flex; flex-direction: column; gap: 24px; margin-bottom: 24px; }
.card { background: var(--bg-elevated); border: 1px solid var(--border-primary); border-radius: 12px; padding: 16px; }

/* Table Elements */
.main-table-card { padding: 0; }
.table-header { padding: 12px 16px; border-bottom: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: center; background: var(--bg-elevated); border-radius: 12px 12px 0 0; }
.table-search { width: 40%; position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; color: var(--text-muted); }
.table-search input { width: 100%; background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 8px; padding: 6px 10px 6px 32px; font-size: 0.75rem; outline: none; color: var(--text-primary); }
.table-search input:focus { border-color: var(--color_button); background: var(--bg-elevated); box-shadow: 0 0 0 3px rgba(46,125,50,0.15); }
.filter-tabs { display: flex; gap: 8px; }
.filter-btn { background: transparent; border: 1px solid transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: 0.2s; }
.filter-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.filter-btn.active { 
  background: var(--bg-active); 
  color: var(--color_button); 
  border-color: #bbf7d0; 
  view-transition-name: active-filter-tab; 
}

.user-table { width: 100%; border-collapse: collapse; }
.user-table th { background: #1b5e20; text-align: left; padding: 12px 16px; font-size: 0.75rem; color: white; text-transform: uppercase; font-weight: 700; white-space: nowrap; }
.user-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-primary); vertical-align: middle; white-space: nowrap; background: var(--bg-elevated); color: var(--text-primary); }
.user-table tbody tr:nth-child(even) td { background: var(--bg-secondary); }
.user-table tbody tr:hover td { background: var(--bg-hover); }

.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 0.75rem; }
.bg-green { background: #1b5e20; }

.status-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; white-space: nowrap; }
.status-pill.activo { background: #1b5e20; color: white; }
.status-pill.contract_ended { background: #ea580c; color: white; }

.u-name { font-weight: 700; margin: 0; color: var(--text-primary); font-size: 0.85rem; }
.u-email { font-size: 0.75rem; color: var(--text-muted); margin: 0; font-weight: 600; }

.role-badge { font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; background: #e0f2fe; color: #0369a1; display: inline-block; }

.btn-primary-sena { background: var(--color_button); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(46, 125, 50, 0.2); white-space: nowrap; }
.btn-primary-sena:hover { background: #1b5e20; transform: translateY(-1px); }

.spin-ring-lg { width: 40px; height: 40px; border: 3px solid var(--bg-hover); border-top-color: var(--color_header); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* --- Responsive fixes --- */
@media (max-width: 768px) {
  .table-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .table-search { width: 100%; }
  .filter-tabs { flex-wrap: wrap; }
  
  .table-responsive {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .user-table {
    min-width: 800px;
  }
}
</style>
