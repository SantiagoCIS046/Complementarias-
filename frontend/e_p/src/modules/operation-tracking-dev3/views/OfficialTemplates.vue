<script setup>
import { ref } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import http from '../../../core/api/http'
import { useAlert } from '../../../core/composables/useAlert'

const { showSuccess, showError } = useAlert()

// Estados de carga para descargas individuales
const loadingState = ref({
  bitacora_pdf: false,
  bitacora_docx: false,
  seguimiento_pdf: false,
  seguimiento_docx: false
})

const descargarPlantilla = async (type, format) => {
  const stateKey = `${type}_${format}`
  if (loadingState.value[stateKey]) return

  loadingState.value[stateKey] = true
  try {
    const response = await http.get(`/documents/templates/download/${type}/${format}`, {
      responseType: 'blob'
    })

    const mimetype = format === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    const blob = new Blob([response.data], { type: mimetype })
    const filename = type === 'bitacora'
      ? `F-GFPI-023_Plantilla_Bitacora.${format}`
      : `F-GFPI-024_Plantilla_Seguimiento_Evaluacion.${format}`

    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(link.href)

    showSuccess(
      'Descarga Completada',
      `La plantilla oficial ${type === 'bitacora' ? 'F-GFPI-023 (Bitácora)' : 'F-GFPI-024 (Seguimiento)'} en formato ${format.toUpperCase()} se descargó exitosamente.`
    )
  } catch (err) {
    console.error('Error al descargar plantilla:', err)
    showError(
      'Error de Descarga',
      'No se pudo generar y descargar la plantilla oficial. Por favor intente más tarde.'
    )
  } finally {
    loadingState.value[stateKey] = false
  }
}
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header title="Plantillas Oficiales" />

      <main class="content">
        <!-- Fondo Decorativo Abstracto Premium -->
        <div class="abstract-glowing-circle circle-violet"></div>
        <div class="abstract-glowing-circle circle-emerald"></div>

        <div class="page-body">
          <!-- Page Header -->
          <header class="page-header">
            <div class="header-info">
              <h1 class="page-title">Descarga de Plantillas Oficiales</h1>
              <p class="page-description">Accede directamente a los formatos institucionales vigentes para tu Etapa Productiva.</p>
            </div>
          </header>

          <!-- Banner Informativo -->
          <div class="sena-alert-banner">
            <span class="material-symbols-outlined alert-banner-icon">info</span>
            <div class="alert-banner-text">
              <h4>Formatos Oficiales SENA</h4>
              <p>Las bitácoras deben ser entregadas quincenalmente y los seguimientos deben concertarse en tres momentos clave de tu alternativa de etapa productiva. Los archivos <strong>Word (.docx)</strong> son completamente editables para tu facilidad de diligenciamiento, y los <strong>PDF (.pdf)</strong> son ideales para imprimir o visualizar.</p>
            </div>
          </div>

          <!-- Cards Grid (Glassmorphism & Rich Aesthetics) -->
          <div class="templates-grid">
            
            <!-- CARD 1: Bitácora F-GFPI-023 -->
            <div class="template-card glass-card">
              <div class="card-glow"></div>
              <div class="card-icon-wrapper icon-violet">
                <span class="material-symbols-outlined">assignment</span>
              </div>
              
              <div class="card-body">
                <div class="form-code-badge">F-GFPI-023 | Versión 03</div>
                <h3 class="card-title">Bitácora Quincenal de Etapa Productiva</h3>
                <p class="card-text">Formato oficial para la planeación y el reporte quincenal detallado de actividades y evidencias de aprendizaje desarrolladas en la empresa u organización.</p>
                
                <div class="card-features">
                  <div class="feature-item">
                    <span class="material-symbols-outlined f-icon">check_circle</span>
                    <span>Reporte de 12 bitácoras en total</span>
                  </div>
                  <div class="feature-item">
                    <span class="material-symbols-outlined f-icon">check_circle</span>
                    <span>Firma requerida de aprendiz, jefe e instructor</span>
                  </div>
                </div>
              </div>

              <div class="card-actions">
                <button 
                  :id="'btn-download-bitacora-docx'"
                  class="btn-action btn-word"
                  @click="descargarPlantilla('bitacora', 'docx')"
                  :disabled="loadingState.bitacora_docx || loadingState.bitacora_pdf"
                >
                  <span class="material-symbols-outlined" :class="{ 'spin': loadingState.bitacora_docx }">
                    {{ loadingState.bitacora_docx ? 'sync' : 'description' }}
                  </span>
                  <span>{{ loadingState.bitacora_docx ? 'Generando...' : 'Formato Word' }}</span>
                </button>

                <button 
                  :id="'btn-download-bitacora-pdf'"
                  class="btn-action btn-pdf"
                  @click="descargarPlantilla('bitacora', 'pdf')"
                  :disabled="loadingState.bitacora_docx || loadingState.bitacora_pdf"
                >
                  <span class="material-symbols-outlined" :class="{ 'spin': loadingState.bitacora_pdf }">
                    {{ loadingState.bitacora_pdf ? 'sync' : 'picture_as_pdf' }}
                  </span>
                  <span>{{ loadingState.bitacora_pdf ? 'Generando...' : 'Formato PDF' }}</span>
                </button>
              </div>
            </div>

            <!-- CARD 2: Seguimiento F-GFPI-024 -->
            <div class="template-card glass-card">
              <div class="card-glow"></div>
              <div class="card-icon-wrapper icon-emerald">
                <span class="material-symbols-outlined">rate_review</span>
              </div>
              
              <div class="card-body">
                <div class="form-code-badge">F-GFPI-024 | Versión 04</div>
                <h3 class="card-title">Seguimiento y Evaluación de Etapa Productiva</h3>
                <p class="card-text">Formato oficial para la concertación de compromisos, evaluaciones parciales y el juicio final del desempeño académico y actitudinal del aprendiz.</p>
                
                <div class="card-features">
                  <div class="feature-item">
                    <span class="material-symbols-outlined f-icon">check_circle</span>
                    <span>Concierta actividades iniciales</span>
                  </div>
                  <div class="feature-item">
                    <span class="material-symbols-outlined f-icon">check_circle</span>
                    <span>Evaluación Parcial 1, Parcial 2 y Juicio Final</span>
                  </div>
                </div>
              </div>

              <div class="card-actions">
                <button 
                  :id="'btn-download-seguimiento-docx'"
                  class="btn-action btn-word"
                  @click="descargarPlantilla('seguimiento', 'docx')"
                  :disabled="loadingState.seguimiento_docx || loadingState.seguimiento_pdf"
                >
                  <span class="material-symbols-outlined" :class="{ 'spin': loadingState.seguimiento_docx }">
                    {{ loadingState.seguimiento_docx ? 'sync' : 'description' }}
                  </span>
                  <span>{{ loadingState.seguimiento_docx ? 'Generando...' : 'Formato Word' }}</span>
                </button>

                <button 
                  :id="'btn-download-seguimiento-pdf'"
                  class="btn-action btn-pdf"
                  @click="descargarPlantilla('seguimiento', 'pdf')"
                  :disabled="loadingState.seguimiento_docx || loadingState.seguimiento_pdf"
                >
                  <span class="material-symbols-outlined" :class="{ 'spin': loadingState.seguimiento_pdf }">
                    {{ loadingState.seguimiento_pdf ? 'sync' : 'picture_as_pdf' }}
                  </span>
                  <span>{{ loadingState.seguimiento_pdf ? 'Generando...' : 'Formato PDF' }}</span>
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
/* ── Layout General & Variables HSL ── */
.page-body { 
  padding: 1.5rem; 
  display: flex; 
  flex-direction: column; 
  gap: 1.5rem; 
  position: relative;
  z-index: 2;
}

.page-header {
  margin-bottom: 0.5rem;
}

.page-title { 
  font-size: 1.75rem; 
  font-weight: 800; 
  color: var(--text-primary, #0f172a); 
  margin: 0; 
}

.page-description { 
  font-size: 0.9rem; 
  color: var(--text-secondary, #64748b); 
  margin: 0.35rem 0 0; 
}

/* ── Banner Informativo Estilo Premium ── */
.sena-alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  background: rgba(240, 253, 244, 0.7);
  backdrop-filter: blur(10px);
  border: 1.5px dashed #10b981;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}

.alert-banner-icon {
  font-size: 1.8rem;
  color: #059669;
}

.alert-banner-text h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #047857;
}

.alert-banner-text p {
  margin: 0;
  font-size: 0.85rem;
  color: #065f46;
  line-height: 1.5;
}

/* ── Fondo decorativo abstracto ── */
.abstract-glowing-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.08;
  z-index: 1;
  pointer-events: none;
}

.circle-violet {
  width: 320px;
  height: 320px;
  background: #7c3aed;
  top: 15%;
  right: 10%;
}

.circle-emerald {
  width: 280px;
  height: 280px;
  background: #10b981;
  bottom: 20%;
  left: 5%;
}

/* ── Tarjetas Grid Glassmorphism ── */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 0.5rem;
}

@media (max-width: 900px) {
  .templates-grid {
    grid-template-columns: 1fr;
  }
}

.template-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 20px;
  padding: 2rem;
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  min-height: 380px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
}

.template-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
  border-color: rgba(124, 58, 237, 0.3);
}

/* Glow decorativo interno de la tarjeta */
.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #7c3aed, #10b981);
  opacity: 0.8;
}

.card-icon-wrapper {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
}

.icon-violet {
  background: #f5f3ff;
  color: #7c3aed;
}

.icon-emerald {
  background: #f0fdf4;
  color: #10b981;
}

.card-icon-wrapper .material-symbols-outlined {
  font-size: 2rem;
}

.form-code-badge {
  display: inline-block;
  font-size: 0.74rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  background: #f1f5f9;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  margin-bottom: 0.65rem;
  letter-spacing: 0.05em;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.75rem 0;
  line-height: 1.35;
}

.card-text {
  font-size: 0.86rem;
  color: #475569;
  line-height: 1.55;
  margin: 0 0 1.5rem 0;
}

/* Características oficiales */
.card-features {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 2rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
}

.feature-item .f-icon {
  font-size: 1.15rem;
  color: #059669;
}

/* Botones de acción */
.card-actions {
  display: flex;
  gap: 0.85rem;
  margin-top: auto;
}

@media (max-width: 480px) {
  .card-actions {
    flex-direction: column;
  }
}

.btn-action {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.82rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid transparent;
}

.btn-word {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

.btn-word:hover:not(:disabled) {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

.btn-pdf {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.btn-pdf:hover:not(:disabled) {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.25);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Dark Mode Overrides (cards only) ── */
[data-theme="dark"] .glass-card {
  background: rgba(26, 31, 46, 0.92);
  border-color: #2d3748;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

[data-theme="dark"] .template-card:hover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border-color: rgba(124, 58, 237, 0.4);
}

[data-theme="dark"] .card-title  { color: #f1f5f9; }
[data-theme="dark"] .card-text   { color: #94a3b8; }

[data-theme="dark"] .form-code-badge {
  background: #1e2535;
  color: #9ca3af;
  border: 1px solid #374151;
}

[data-theme="dark"] .icon-violet {
  background: #2e235a;
  color: #a78bfa;
}
[data-theme="dark"] .icon-emerald {
  background: #0f3222;
  color: #34d399;
}

[data-theme="dark"] .feature-item       { color: #d1d5db; }
[data-theme="dark"] .feature-item .f-icon { color: #34d399; }

[data-theme="dark"] .btn-word {
  background: #0f1f3a;
  border-color: #1e3a6e;
  color: #60a5fa;
}
[data-theme="dark"] .btn-word:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}

[data-theme="dark"] .btn-pdf {
  background: #2d1010;
  border-color: #5b1a1a;
  color: #f87171;
}
[data-theme="dark"] .btn-pdf:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
}

[data-theme="dark"] .sena-alert-banner {
  background: rgba(5, 40, 25, 0.6);
  border-color: #059669;
}
[data-theme="dark"] .alert-banner-text h4 { color: #34d399; }
[data-theme="dark"] .alert-banner-text p  { color: #6ee7b7; }
[data-theme="dark"] .alert-banner-icon    { color: #34d399; }
</style>
