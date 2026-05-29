<script setup>
/**
 * PhotoUploadModal.vue — Modal de confirmación para foto de perfil
 *
 * Props:
 *   preview     {string|null}  — Base64 de la imagen ya procesada
 *   isProcessing {boolean}     — True mientras se ejecuta el canvas
 *   isUploading  {boolean}     — True mientras se sube al servidor
 *   error        {string|null} — Mensaje de error a mostrar
 *
 * Emits:
 *   confirm   — El usuario acepta subir la foto
 *   cancel    — El usuario cancela
 *   select    — El usuario quiere elegir otra imagen
 */
import { computed } from 'vue'
import AvatarDisplay from '../shared/AvatarDisplay.vue'

const props = defineProps({
  preview:      { type: String,  default: null },
  isProcessing: { type: Boolean, default: false },
  isUploading:  { type: Boolean, default: false },
  error:        { type: String,  default: null }
})

const emit = defineEmits(['confirm', 'cancel', 'select'])

/** Usuario sintético solo para mostrar la foto en el AvatarDisplay */
const previewUser = computed(() => ({ fotoPerfil: props.preview, name: '' }))

const isBusy = computed(() => props.isProcessing || props.isUploading)
</script>

<template>
  <Transition name="photo-modal">
    <div class="photo-modal-overlay" @click.self="!isBusy && emit('cancel')">
      <div class="photo-modal-card" role="dialog" aria-labelledby="photo-modal-title">

        <!-- Header -->
        <div class="photo-modal-header">
          <span class="material-symbols-outlined header-icon">add_a_photo</span>
          <h3 id="photo-modal-title">Cambiar Foto de Perfil</h3>
          <button
            class="photo-modal-close"
            @click="emit('cancel')"
            :disabled="isBusy"
            aria-label="Cerrar"
          >×</button>
        </div>

        <!-- Body -->
        <div class="photo-modal-body">

          <!-- Estado: procesando (Canvas) -->
          <div v-if="isProcessing" class="state-center">
            <div class="spinner-ring"></div>
            <p class="state-text">Optimizando imagen…</p>
          </div>

          <!-- Estado: preview listo -->
          <template v-else-if="preview">
            <p class="modal-hint">Vista previa de tu nueva foto de perfil</p>

            <!-- Preview circular grande -->
            <div class="preview-wrapper">
              <AvatarDisplay :user="previewUser" size="xl" />
              <div class="preview-badge">
                <span class="material-symbols-outlined">check_circle</span>
                Lista
              </div>
            </div>

            <!-- Info de optimización -->
            <div class="optimize-info">
              <span class="material-symbols-outlined info-icon">auto_fix_high</span>
              <span>Optimizada a 400×400 px · WEBP · Alta calidad</span>
            </div>

            <!-- Error -->
            <div v-if="error" class="modal-error">
              <span class="material-symbols-outlined">error</span>
              {{ error }}
            </div>
          </template>

          <!-- Estado: sin preview (solo error) -->
          <div v-else-if="error" class="state-center">
            <span class="material-symbols-outlined error-icon-lg">broken_image</span>
            <p class="state-text error-text">{{ error }}</p>
          </div>

        </div>

        <!-- Footer / Acciones -->
        <div class="photo-modal-footer">
          <button
            class="photo-btn secondary"
            @click="emit('select')"
            :disabled="isBusy"
          >
            <span class="material-symbols-outlined">folder_open</span>
            Elegir otra
          </button>

          <div class="footer-right">
            <button
              class="photo-btn ghost"
              @click="emit('cancel')"
              :disabled="isBusy"
            >
              Cancelar
            </button>

            <button
              class="photo-btn primary"
              @click="emit('confirm')"
              :disabled="isBusy || !preview"
              :class="{ loading: isUploading }"
            >
              <span v-if="isUploading" class="btn-spinner"></span>
              <span v-else class="material-symbols-outlined">cloud_upload</span>
              <span>{{ isUploading ? 'Guardando…' : 'Guardar foto' }}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Overlay ── */
.photo-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 10, 20, 0.72);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

/* ── Card ── */
.photo-modal-card {
  background: var(--bg-elevated, #1a1f2e);
  border: 1px solid var(--border-primary, rgba(255,255,255,0.08));
  border-radius: 24px;
  width: 100%;
  max-width: 420px;
  box-shadow:
    0 32px 64px rgba(0,0,0,0.5),
    0 0 0 1px rgba(255,255,255,0.04) inset;
  overflow: hidden;
}

/* ── Header ── */
.photo-modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, var(--color_button, #2e7d32) 0%, #1b5e20 100%);
  position: relative;
}

.header-icon {
  font-size: 1.4rem;
  color: rgba(255,255,255,0.85);
}

.photo-modal-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
  flex: 1;
}

.photo-modal-close {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.12);
  border: none;
  color: #fff;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  line-height: 1;
}
.photo-modal-close:hover:not(:disabled) { background: rgba(255,255,255,0.25); }
.photo-modal-close:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Body ── */
.photo-modal-body {
  padding: 2rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  min-height: 180px;
}

.modal-hint {
  font-size: 0.8rem;
  color: var(--text-secondary, #94a3b8);
  margin: 0;
  font-weight: 600;
  text-align: center;
}

.preview-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.preview-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #4ade80;
  padding: 3px 10px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.25);
  border-radius: 100px;
}
.preview-badge .material-symbols-outlined { font-size: 0.95rem; }

.optimize-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--text-muted, #64748b);
  font-weight: 600;
  background: var(--bg-secondary, rgba(255,255,255,0.04));
  padding: 6px 14px;
  border-radius: 100px;
  border: 1px solid var(--border-primary, rgba(255,255,255,0.06));
}
.info-icon { font-size: 0.9rem; color: var(--color_button, #2e7d32); }

/* ── Error ── */
.modal-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  width: 100%;
}
.modal-error .material-symbols-outlined { font-size: 1rem; }

/* ── States ── */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}
.state-text {
  font-size: 0.85rem;
  color: var(--text-secondary, #94a3b8);
  font-weight: 600;
  margin: 0;
  text-align: center;
}
.error-text { color: #f87171; }
.error-icon-lg { font-size: 3rem; color: #f87171; opacity: 0.7; }

/* ── Spinner ring ── */
.spinner-ring {
  width: 44px;
  height: 44px;
  border: 4px solid rgba(255,255,255,0.1);
  border-top-color: var(--color_button, #2e7d32);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Footer ── */
.photo-modal-footer {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid var(--border-primary, rgba(255,255,255,0.06));
  background: var(--bg-secondary, rgba(255,255,255,0.02));
}

.footer-right {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* ── Buttons ── */
.photo-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  white-space: nowrap;
}
.photo-btn .material-symbols-outlined { font-size: 1rem; }
.photo-btn:disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }

.photo-btn.primary {
  background: var(--color_button, #2e7d32);
  color: #fff;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.25);
}
.photo-btn.primary:hover:not(:disabled) {
  background: #1b5e20;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(46, 125, 50, 0.35);
}
.photo-btn.primary.loading { gap: 10px; }

.photo-btn.secondary {
  background: var(--bg-hover, rgba(255,255,255,0.07));
  color: var(--text-secondary, #94a3b8);
  border: 1px solid var(--border-primary, rgba(255,255,255,0.1));
}
.photo-btn.secondary:hover:not(:disabled) {
  background: var(--bg-active, rgba(255,255,255,0.12));
  color: var(--text-primary, #fff);
}

.photo-btn.ghost {
  background: transparent;
  color: var(--text-muted, #64748b);
  border: 1px solid transparent;
}
.photo-btn.ghost:hover:not(:disabled) {
  color: var(--text-secondary, #94a3b8);
  background: var(--bg-hover, rgba(255,255,255,0.05));
}

/* Button spinner */
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2.5px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

/* ── Modal Transition ── */
.photo-modal-enter-active {
  animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.photo-modal-leave-active {
  animation: modalOut 0.2s ease-in;
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.88) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes modalOut {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.93); }
}
</style>
