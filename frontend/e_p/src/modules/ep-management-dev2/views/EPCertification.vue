<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../core/store/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.user || { name: 'Juan Mancilla', role: 'Aprendiz' })
const activeTab = ref('Certificados')

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="repfora-dashboard">
    <!-- SIDEBAR EXACTO AL MOCKUP -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-icon"><span class="material-symbols-outlined">architecture</span></div>
        <div class="logo-text">
          <span class="title">Gestión EP</span>
          <span class="subtitle">INSTITUTIONAL<br>ARCHITECT</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-item">
          <span class="material-symbols-outlined">grid_view</span> DASHBOARD
        </div>
        <div class="nav-item active">
          <span class="material-symbols-outlined">leaderboard</span> ETAPA PRODUCTIVA
        </div>
        <div class="nav-item">
          <span class="material-symbols-outlined">domain</span> DIRECTORIO
        </div>
        <div class="nav-item">
          <span class="material-symbols-outlined">description</span> DOCUMENTACIÓN
        </div>
        <div class="nav-item">
          <span class="material-symbols-outlined">settings</span> CONFIGURACIÓN
        </div>
      </nav>
      <div class="sidebar-footer">
        <button @click="logout" class="nav-item logout-btn">
          <span class="material-symbols-outlined">logout</span> CERRAR SESIÓN
        </button>
      </div>
    </aside>

    <!-- CONTENIDO PRINCIPAL -->
    <div class="main-wrapper">
      <header class="topbar-white">
        <div class="topbar-left">
          <div class="top-logo">REPFORA</div>
          <nav class="top-tabs">
            <span class="tab active">Etapa Productiva</span>
            <span class="tab">Empresas</span>
            <span class="tab">Certificación</span>
          </nav>
        </div>
        <div class="topbar-right">
          <div class="notification-icon">
            <span class="material-symbols-outlined">notifications</span>
            <div class="notif-dot"></div>
          </div>
          <div class="user-profile">
            <div class="user-info-text">
              <span class="user-name">ADMIN USER</span>
              <span class="user-role">SENA Administrator</span>
            </div>
            <div class="user-avatar-small"><img src="https://ui-avatars.com/api/?name=Admin+User&background=1E293B&color=fff" alt="U"></div>
          </div>
        </div>
      </header>

      <main class="content-scrollable">
        <div class="content-container">
          
          <div class="cert-grid">
            <!-- COLUMNA IZQUIERDA (Documentos) -->
            <div class="cert-left">
              <div class="page-header">
                <div class="subtitle-badge"><span class="material-symbols-outlined">verified_user</span> PROCESO DE CIERRE</div>
                <h1 class="page-title">Certificación Final</h1>
                <p class="page-desc">Gestiona y verifica la documentación obligatoria para la<br>culminación oficial de tu etapa productiva institucional.</p>
              </div>

              <div class="docs-list">
                
                <!-- Documento 1: Pendiente -->
                <div class="doc-card pending">
                  <div class="doc-header">
                    <div class="doc-icon"><span class="material-symbols-outlined">verified</span></div>
                    <div class="doc-info">
                      <h3>EP_CERTIFICATE <span class="badge-req">REQUIRED</span></h3>
                      <p>Certificado oficial de finalización emitido por la empresa co-formadora.</p>
                    </div>
                    <div class="doc-status status-pending">PENDIENTE</div>
                  </div>
                  <div class="upload-zone">
                    <div class="upload-icon"><span class="material-symbols-outlined">cloud_upload</span></div>
                    <h4>Subir Certificado</h4>
                    <p>Selecciona un archivo PDF o<br>arrástralo aquí (Máx. 5MB)</p>
                  </div>
                </div>

                <!-- Documento 2: Rechazado -->
                <div class="doc-card rejected">
                  <div class="doc-header">
                    <div class="doc-icon"><span class="material-symbols-outlined">assignment_turned_in</span></div>
                    <div class="doc-info">
                      <h3>PERFORMANCE_EVALUATION</h3>
                      <p>Evaluación cualitativa y cuantitativa del desempeño laboral.</p>
                    </div>
                    <div class="doc-status status-rejected">RECHAZADO</div>
                  </div>
                  <div class="file-box">
                    <div class="file-format"><span class="material-symbols-outlined">picture_as_pdf</span> PDF</div>
                    <div class="file-details">
                      <h4>evaluacion_v1_corregida.pdf</h4>
                      <div class="file-meta">
                        <span class="material-symbols-outlined">calendar_today</span> Hace 2 días 
                        <span class="material-symbols-outlined" style="margin-left: 8px;">hard_drive</span> 1.2 MB
                      </div>
                    </div>
                    <div class="file-actions">
                      <button class="btn-icon"><span class="material-symbols-outlined">visibility</span></button>
                      <button class="btn-icon danger"><span class="material-symbols-outlined">delete</span></button>
                    </div>
                  </div>
                  <div class="alert-banner">
                    <span class="material-symbols-outlined">error</span> Requiere atención inmediata según observaciones.
                  </div>
                </div>

                <!-- Documento 3: Aprobado -->
                <div class="doc-card approved">
                  <div class="doc-header">
                    <div class="doc-icon"><span class="material-symbols-outlined">handshake</span></div>
                    <div class="doc-info">
                      <h3>COMMITMENT_LETTER</h3>
                      <p>Compromiso formal de vinculación o permanencia.</p>
                    </div>
                    <div class="doc-status status-approved">APROBADO</div>
                  </div>
                  <div class="file-box approved-box">
                    <div class="file-format-green"><span class="material-symbols-outlined">draft</span></div>
                    <div class="file-details">
                      <h4 class="text-green">carta_compromiso_final.pdf</h4>
                      <div class="file-meta-green">VERIFICADO POR ADMIN • HOY 10:45 AM</div>
                    </div>
                    <div class="file-actions">
                      <button class="btn-outline-green">VER DOCUMENTO</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- COLUMNA DERECHA (Panel) -->
            <div class="cert-right">
              
              <button class="btn-submit-review">
                <span class="material-symbols-outlined">publish</span> ENVIAR A REVISIÓN FINAL
              </button>

              <!-- Estado del Trámite -->
              <div class="dark-card">
                <div class="dark-card-header">
                  <div>
                    <h3>Estado del</h3>
                    <h3>Trámite</h3>
                  </div>
                  <div class="progress-percent">66%</div>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: 66%"></div>
                </div>
                <div class="stats-row">
                  <div class="stat-box">
                    <label>CARGADOS</label>
                    <div class="val">02</div>
                  </div>
                  <div class="stat-box">
                    <label>LISTOS</label>
                    <div class="val green">01</div>
                  </div>
                  <div class="stat-box">
                    <label>ALERTAS</label>
                    <div class="val red">01</div>
                  </div>
                </div>
              </div>

              <!-- Observaciones -->
              <div class="obs-card">
                <div class="obs-header">
                  <h3>Observaciones</h3>
                  <span class="obs-badge">02</span>
                </div>
                <div class="timeline">
                  <div class="tl-item">
                    <div class="tl-dot green"></div>
                    <div class="tl-content">
                      <div class="tl-meta">
                        <strong>COORDINADOR SENA</strong>
                        <span>• Hace 2 horas</span>
                      </div>
                      <div class="tl-bubble">
                        <p>El documento de <strong class="text-red">Evaluación de Desempeño</strong> no tiene la firma del representante legal. Favor corregir.</p>
                      </div>
                    </div>
                  </div>
                  <div class="tl-item">
                    <div class="tl-dot border-gray"></div>
                    <div class="tl-content">
                      <div class="tl-meta">
                        <strong>COORDINADOR SENA</strong>
                        <span>• Ayer 09:12 AM</span>
                      </div>
                      <div class="tl-bubble gray">
                        <p>Carta de compromiso verificada correctamente.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button class="btn-history">
                  <span class="material-symbols-outlined">history</span> HISTORIAL COMPLETO
                </button>
              </div>

              <!-- Banner -->
              <div class="banner-card">
                <span class="material-symbols-outlined icon-bg">architecture</span>
                <div class="banner-content">
                  <span class="material-symbols-outlined" style="margin-bottom: 8px;">architecture</span>
                  <div class="banner-tags">
                    <span>SAFE & WORK</span>
                  </div>
                  <h3>ARQUITECTO INSTITUCIONAL</h3>
                  <p>Tu futuro profesional comienza aquí.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
* { font-family: 'Inter', sans-serif; box-sizing: border-box; }

/* LAYOUT BASE */
.repfora-dashboard { display: flex; height: 100vh; background: #FAFAFA; overflow: hidden; }
.sidebar { width: 250px; background: #F8F9FA; border-right: 1px solid #E5E7EB; display: flex; flex-direction: column; flex-shrink: 0; position: fixed; height: 100vh; z-index: 100; }
.sidebar-header { padding: 32px 24px; display: flex; align-items: center; gap: 12px; }
.logo-icon { width: 40px; height: 40px; background: #1A4D2E; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #FFF; box-shadow: 0 4px 12px rgba(26, 77, 46, 0.2); }
.logo-icon span { font-size: 24px; font-variation-settings: 'FILL' 1; }
.logo-text .title { display: block; font-size: 14px; font-weight: 900; color: #111827; line-height: 1.2; letter-spacing: -0.2px; }
.logo-text .subtitle { font-size: 9px; font-weight: 800; color: #6B7280; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px; display: block; }

.sidebar-nav { padding: 8px 16px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
.nav-item { display: flex; align-items: center; gap: 16px; padding: 14px 16px; font-size: 12px; font-weight: 800; color: #6B7280; border-radius: 10px; text-decoration: none; cursor: pointer; border:none; background:none; width:100%; text-align:left; transition: all 0.2s; position: relative; }
.nav-item span.material-symbols-outlined { font-size: 20px; font-variation-settings: 'FILL' 0; transition: all 0.2s; }
.nav-item:hover { color: #111827; }
.nav-item.active { background: #FFF; color: #16A34A; border-radius: 4px 10px 10px 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.nav-item.active::before { content: ""; position: absolute; left: -16px; top: 0; bottom: 0; width: 4px; background: #16A34A; border-radius: 0 4px 4px 0; }
.nav-item.active span.material-symbols-outlined { color: #16A34A; }

.sidebar-footer { padding: 24px 16px; margin-top: auto; }
.logout-btn { color: #6B7280; display: flex; align-items: center; gap: 16px; padding: 14px 16px; font-size: 12px; font-weight: 800; width: 100%; transition: all 0.2s; border: none; background: none; cursor: pointer; }
.logout-btn:hover { color: #111827; }

.main-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; margin-left: 250px; background: #FFF; }
.topbar-white { height: 72px; background: #FFF; border-bottom: 1px solid #F1F5F9; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; flex-shrink: 0; position: sticky; top: 0; z-index: 90; }
.topbar-left { display: flex; align-items: center; gap: 48px; height: 100%; }
.top-logo { font-size: 20px; font-weight: 900; color: #16A34A; }
.top-tabs { display: flex; gap: 32px; height: 100%; } 
.tab { font-size: 13px; font-weight: 800; color: #94A3B8; cursor: pointer; display: flex; align-items: center; border-bottom: 3px solid transparent; transition: color 0.2s; }
.tab:hover { color: #1E293B; }
.tab.active { color: #16A34A; border-bottom-color: #16A34A; }

.topbar-right { display: flex; align-items: center; gap: 32px; }
.notification-icon { position: relative; color: #4B5563; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.notification-icon span { font-size: 24px; font-variation-settings: 'FILL' 0; }
.notif-dot { position: absolute; top: 0px; right: 2px; width: 8px; height: 8px; background: #16A34A; border-radius: 50%; border: 2px solid #FFF; }

.user-profile { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.user-info-text { display: flex; flex-direction: column; align-items: flex-end; }
.user-name { font-size: 12px; font-weight: 900; color: #111827; line-height: 1.2; }
.user-role { font-size: 10px; font-weight: 600; color: #6B7280; }
.user-avatar-small { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; border: 2px solid #F1F5F9; }
.user-avatar-small img { width: 100%; height: 100%; object-fit: cover; }

.content-scrollable { flex: 1; overflow-y: auto; background: #FAFAFA; }
.content-container { padding: 40px; max-width: 1400px; width: 100%; box-sizing: border-box; margin: 0 auto; }


/* GRID DE CERTIFICACIÓN */
.cert-grid { display: grid; grid-template-columns: 1fr 340px; gap: 40px; }

/* Header */
.page-header { margin-bottom: 40px; }
.subtitle-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; color: #16A34A; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
.subtitle-badge span { font-size: 16px; }
.page-title { font-size: 36px; font-weight: 900; color: #1E293B; margin: 0 0 16px 0; letter-spacing: -1px; }
.page-desc { font-size: 15px; color: #64748B; line-height: 1.6; font-weight: 500; margin: 0; max-width: 600px; }

/* Document Cards */
.docs-list { display: flex; flex-direction: column; gap: 24px; }
.doc-card { background: #FFF; border-radius: 20px; padding: 24px 32px; border: 1px solid #F1F5F9; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
.doc-card::before { content: ''; position: absolute; left: -1px; top: 32px; bottom: 32px; width: 4px; border-radius: 0 4px 4px 0; }

.doc-card.rejected { border-color: #FFE4E6; }
.doc-card.rejected::before { background: #E11D48; }

.doc-card.approved { border-color: #DCFCE7; }
.doc-card.approved::before { background: #16A34A; }

.doc-card.pending { border: 2px dashed #E2E8F0; }

.doc-header { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
.doc-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.doc-card.pending .doc-icon { background: #F8FAFC; color: #94A3B8; }
.doc-card.rejected .doc-icon { background: #FFF1F2; color: #E11D48; }
.doc-card.approved .doc-icon { background: #F0FDF4; color: #16A34A; }
.doc-icon span { font-size: 24px; }

.doc-info { flex: 1; }
.doc-info h3 { font-size: 16px; font-weight: 800; color: #1E293B; margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px; }
.badge-req { font-size: 9px; background: #F1F5F9; color: #64748B; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px; font-weight: 700; }
.doc-info p { font-size: 13px; color: #64748B; margin: 0; font-weight: 500; }

.doc-status { font-size: 10px; font-weight: 800; padding: 6px 12px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; height: fit-content; }
.status-pending { background: #F8FAFC; color: #64748B; border: 1px solid #E2E8F0; }
.status-rejected { background: #E11D48; color: #FFF; }
.status-approved { background: #F0FDF4; color: #16A34A; }

/* Zona de Subida */
.upload-zone { border: 2px dashed #E2E8F0; border-radius: 16px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; background: #FFF; margin: 0 20px; }
.upload-zone:hover { border-color: #CBD5E1; background: #F8FAFC; }
.upload-icon { width: 56px; height: 56px; background: #FFF; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.upload-icon span { font-size: 28px; color: #94A3B8; }
.upload-zone h4 { font-size: 14px; font-weight: 800; color: #1E293B; margin: 0 0 4px 0; }
.upload-zone p { font-size: 12px; color: #94A3B8; margin: 0; font-weight: 500; line-height: 1.5; }

/* Archivo Adjunto */
.file-box { background: #F8FAFC; border: 1px solid #F1F5F9; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.file-format { width: 44px; height: 44px; background: #FFF; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; color: #94A3B8; border: 1px solid #F1F5F9; }
.file-format span { font-size: 20px; margin-bottom: 2px; }

.file-box.approved-box { border-color: #DCFCE7; background: #F0FDF4; margin-bottom: 0; }
.file-format-green { width: 44px; height: 44px; background: #FFF; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #16A34A; box-shadow: 0 4px 12px rgba(22,163,74,0.1); }
.file-format-green span { font-size: 24px; }

.file-details { flex: 1; }
.file-details h4 { font-size: 14px; font-weight: 700; color: #1E293B; margin: 0 0 6px 0; }
.file-details h4.text-green { color: #14532D; }
.file-meta { font-size: 12px; color: #94A3B8; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.file-meta span { font-size: 14px; }
.file-meta-green { font-size: 10px; font-weight: 800; color: #16A34A; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px; }

.file-actions { display: flex; gap: 8px; }
.btn-icon { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #E2E8F0; background: #FFF; color: #64748B; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.btn-icon:hover { background: #F1F5F9; color: #1E293B; }
.btn-icon.danger { color: #E11D48; border-color: #FECDD3; }
.btn-icon.danger:hover { background: #FFF1F2; }
.btn-icon span { font-size: 20px; font-variation-settings: 'FILL' 0; }

.btn-outline-green { border: 1px solid #16A34A; background: #FFF; color: #16A34A; font-size: 11px; font-weight: 800; padding: 0 16px; height: 36px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.btn-outline-green:hover { background: #F0FDF4; }

/* Alertas */
.alert-banner { background: #FFF1F2; color: #BE123C; padding: 12px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.alert-banner span { font-size: 18px; }

/* COLUMNA DERECHA */
.btn-submit-review { width: 100%; background: #1A4D2E; color: #FFF; border: none; padding: 16px; border-radius: 12px; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; margin-bottom: 24px; transition: all 0.2s; box-shadow: 0 8px 16px rgba(26, 77, 46, 0.2); }
.btn-submit-review:hover { background: #143B23; transform: translateY(-2px); box-shadow: 0 12px 20px rgba(26, 77, 46, 0.3); }

/* Tarjeta Oscura */
.dark-card { background: #1A1A1A; border-radius: 20px; padding: 32px 24px; color: #FFF; margin-bottom: 24px; box-shadow: 0 12px 24px rgba(0,0,0,0.15); }
.dark-card-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.dark-card-header h3 { font-size: 18px; font-weight: 800; margin: 0; line-height: 1.3; }
.progress-percent { font-size: 32px; font-weight: 900; color: #16A34A; line-height: 1; }
.progress-track { height: 8px; background: #333; border-radius: 4px; margin-bottom: 32px; overflow: hidden; }
.progress-fill { height: 100%; background: #16A34A; border-radius: 4px; }
.stats-row { display: flex; gap: 12px; }
.stat-box { flex: 1; background: #242424; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #333; }
.stat-box label { display: block; font-size: 9px; font-weight: 800; color: #888; margin-bottom: 6px; letter-spacing: 0.5px; }
.stat-box .val { font-size: 22px; font-weight: 900; }
.stat-box .val.green { color: #16A34A; }
.stat-box .val.red { color: #EF4444; }

/* Observaciones */
.obs-card { background: #FFF; border-radius: 20px; padding: 24px; border: 1px solid #F1F5F9; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
.obs-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.obs-header h3 { font-size: 15px; font-weight: 800; color: #1E293B; margin: 0; }
.obs-badge { background: #F0FDF4; color: #16A34A; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 20px; }

.timeline { display: flex; flex-direction: column; gap: 24px; position: relative; margin-bottom: 24px; padding-left: 8px; }
.timeline::before { content: ''; position: absolute; left: 13px; top: 12px; bottom: 0; width: 2px; background: #F1F5F9; z-index: 0; }
.tl-item { display: flex; gap: 16px; position: relative; z-index: 1; }
.tl-dot { width: 14px; height: 14px; border-radius: 50%; background: #FFF; border: 2px solid; margin-top: 4px; flex-shrink: 0; }
.tl-dot.green { border-color: #16A34A; }
.tl-dot.border-gray { border-color: #CBD5E1; }

.tl-content { flex: 1; }
.tl-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.tl-meta strong { font-size: 11px; font-weight: 800; color: #1E293B; }
.tl-meta span { font-size: 11px; color: #94A3B8; font-weight: 500; }

.tl-bubble { background: #FAFAFA; border: 1px solid #F1F5F9; padding: 12px 16px; border-radius: 12px; font-size: 12px; color: #475569; line-height: 1.6; font-weight: 500; }
.tl-bubble .text-red { color: #E11D48; }
.tl-bubble.gray { background: #F8FAFC; border: none; }

.btn-history { width: 100%; background: none; border: none; padding: 12px; font-size: 11px; font-weight: 800; color: #1A4D2E; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: all 0.2s; }
.btn-history:hover { color: #14532D; }
.btn-history span { font-size: 18px; }

/* Banner Azul */
.banner-card { background: linear-gradient(135deg, #1E3A8A, #0F172A); border-radius: 20px; padding: 32px 24px; color: #FFF; text-align: center; position: relative; overflow: hidden; box-shadow: 0 12px 24px rgba(0,0,0,0.15); }
.icon-bg { position: absolute; font-size: 140px; opacity: 0.05; left: 50%; top: 50%; transform: translate(-50%, -50%); pointer-events: none; }
.banner-content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; }
.banner-content > span { font-size: 32px; color: #E2E8F0; margin-bottom: 12px; opacity: 0.8; }
.banner-tags { margin-bottom: 16px; }
.banner-tags span { border: 1px solid rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 1px; }
.banner-content h3 { font-size: 13px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: 0.5px; }
.banner-content p { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.7); margin: 0; }
</style>
