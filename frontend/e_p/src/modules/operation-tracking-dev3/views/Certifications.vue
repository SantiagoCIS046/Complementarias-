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
        <div class="ins-page-body">
          <header class="ins-page-header">
            <div class="header-left-group">
              <div class="header-info">
                <h1 class="ins-page-title">Certificación de Etapa Productiva</h1>
                <p class="ins-page-description">Gestione los procesos de certificación final de sus aprendices.</p>
              </div>
            </div>
          </header>

          <div class="ins-filters-bar">
            <div class="filter-tabs">
              <button class="filter-btn" :class="{active: currentFilter === 'Todos'}" @click="setFilter('Todos')">Todos</button>
              <button class="filter-btn" :class="{active: currentFilter === 'Por Revisar'}" @click="setFilter('Por Revisar')">Por Revisar</button>
              <button class="filter-btn" :class="{active: currentFilter === 'Certificados'}" @click="setFilter('Certificados')">Certificados</button>
            </div>
            <div class="search-box table-search" style="flex: 1; display: flex; justify-content: flex-end;">
              <div style="position: relative; width: 100%; max-width: 360px;">
                <span class="material-symbols-outlined search-icon" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1.1rem; pointer-events: none;">search</span>
                <input type="text" v-model="searchCert" class="ins-search-input" placeholder="Buscar por aprendiz, documento o ficha..." style="padding-left: 2.4rem;" />
              </div>
            </div>
          </div>

          <div class="ins-table-card">
            <div class="table-responsive">
              <div v-if="isLoading" class="p-12 text-center text-gray-500" style="padding: 3rem 0;">
                <div class="spin-ring-lg mx-auto mb-4"></div>
                Cargando aprendices...
              </div>
              <table v-else class="ins-table">
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
                      <div class="ins-apprentice-cell">
                        <div class="ins-apprentice-avatar">{{ cert.name.substring(0, 2).toUpperCase() }}</div>
                        <div>
                          <div class="ins-apprentice-name">{{ cert.name }}</div>
                          <div class="ins-apprentice-doc">Doc: {{ cert.doc }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="ins-ficha-chip">#{{ cert.ficha }}</span>
                    </td>
                    <td>
                      <span :class="['ins-status-badge', cert.status === 'CERTIFICADO' ? 'status-certificado' : 'status-revision']">
                        {{ cert.status }}
                      </span>
                    </td>
                    <td>
                      <span style="font-size: 0.82rem; color: var(--text-secondary);">{{ cert.date }}</span>
                    </td>
                    <td>
                      <button class="ins-btn-primary" @click="openCertifyModal(cert)" style="height: 30px; font-size: 0.75rem; padding: 0 0.85rem;">
                        Gestionar
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredCerts.length === 0">
                    <td colspan="5" class="text-center py-12 text-gray-400 italic" style="padding: 2rem 0; text-align: center; font-style: italic; color: var(--text-muted);">No se encontraron resultados</td>
                  </tr>
                </tbody>
              </table>
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
        <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--border-primary); display: flex; justify-content: flex-end; gap: 10px; background: var(--bg-elevated);">
          <button class="btn-cancel" @click="showCertifyModal = false" style="background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-primary); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancelar</button>
          <button class="ins-btn-primary" 
                  :disabled="!certDetails?.listoCertificar || certifying" 
                  @click="handleCertify"
                  style="height: 38px; font-size: 0.85rem; border-radius: 8px; font-weight: 700; padding: 0 1.25rem;">
            {{ certifying ? 'Completando y Archivando...' : 'Marcar como COMPLETADA' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Filter Tabs --- */
.filter-tabs { display: flex; gap: 8px; }
.filter-btn { background: transparent; border: 1px solid transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: 0.2s; }
.filter-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.filter-btn.active { 
  background: var(--bg-active); 
  color: var(--color_button); 
  border-color: #bbf7d0; 
  view-transition-name: active-filter-tab; 
}

/* --- Status Badges --- */
.status-certificado { background: #dcfce7; color: #166534; }
.status-revision { background: #ffedd5; color: #9a3412; }

/* --- Spinner --- */
.spin-ring-lg { width: 40px; height: 40px; border: 3px solid var(--bg-hover); border-top-color: var(--color_header); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
@keyframes spin { to { transform: rotate(360deg); } }

/* --- Modal (Verificación de Cierre) ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.modal-card {
  background: var(--bg-elevated);
  border-radius: 18px; box-shadow: 0 25px 80px rgba(0,0,0,0.25);
  width: 100%; border: 1px solid var(--border-primary);
  animation: slideUp 0.25s cubic-bezier(.16,1,.3,1);
}
@keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: none; } }

/* --- Responsive fixes --- */
@media (max-width: 768px) {
  .ins-filters-bar { flex-direction: column; align-items: flex-start; gap: 16px; }
  .table-search { width: 100% !important; justify-content: flex-start !important; }
  .table-search > div { max-width: 100% !important; }
  .filter-tabs { flex-wrap: wrap; }
  
  .table-responsive {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .ins-table {
    min-width: 700px;
  }
}

/* ── Dark Mode Overrides ── */
[data-theme="dark"] .status-certificado { background: #143d21; color: #4ade80; }
[data-theme="dark"] .status-revision { background: #3b2010; color: #fb923c; }
[data-theme="dark"] .filter-btn.active { border-color: #1b5e20; }
</style>
