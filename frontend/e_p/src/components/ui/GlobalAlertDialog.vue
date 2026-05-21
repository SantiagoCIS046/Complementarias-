<script setup>
import { computed, watch, ref, onUnmounted } from 'vue';
import { useAlertStore } from '../../core/store/alert.store';

const alertStore = useAlertStore();
const confirmButtonRef = ref(null);

// Mapeo de colores y estilos de iconos
const dialogStyles = computed(() => {
  switch (alertStore.type) {
    case 'success':
      return {
        icon: 'check_circle',
        iconClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 focus:ring-emerald-500'
      };
    case 'error':
      return {
        icon: 'cancel',
        iconClass: 'text-rose-600 bg-rose-50 border-rose-100',
        btnClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 focus:ring-rose-500'
      };
    case 'warning':
      return {
        icon: 'warning',
        iconClass: 'text-amber-600 bg-amber-50 border-amber-100',
        btnClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200 focus:ring-amber-500'
      };
    case 'info':
      return {
        icon: 'info',
        iconClass: 'text-sky-600 bg-sky-50 border-sky-100',
        btnClass: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200 focus:ring-sky-500'
      };
    case 'confirm':
      return {
        icon: alertStore.isDanger ? 'delete_forever' : 'help',
        iconClass: alertStore.isDanger 
          ? 'text-rose-600 bg-rose-50 border-rose-100' 
          : 'text-emerald-600 bg-emerald-50 border-emerald-100',
        btnClass: alertStore.isDanger
          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 focus:ring-rose-500'
          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 focus:ring-emerald-500'
      };
    default:
      return {
        icon: 'info',
        iconClass: 'text-slate-600 bg-slate-50 border-slate-100',
        btnClass: 'bg-slate-600 hover:bg-slate-700 text-white shadow-slate-200 focus:ring-slate-500'
      };
  }
});

// Manejo de eventos de teclado (Enter para confirmar, Escape para cancelar)
const handleKeyDown = (e) => {
  if (!alertStore.isOpen) return;
  if (e.key === 'Escape' && !alertStore.isLoading) {
    alertStore.cancel();
  } else if (e.key === 'Enter' && !alertStore.isLoading) {
    e.preventDefault();
    alertStore.confirm();
  }
};

// Enfocar automáticamente el botón de confirmación cuando se abre el modal
watch(() => alertStore.isOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeyDown);
    setTimeout(() => {
      if (confirmButtonRef.value) {
        confirmButtonRef.value.focus();
      }
    }, 50);
  } else {
    document.removeEventListener('keydown', handleKeyDown);
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <Transition name="dialog-fade">
    <div v-if="alertStore.isOpen" class="modal-overlay" @click.self="!alertStore.isLoading && alertStore.cancel()">
      <div class="modal-card modal-md dialog-card">
        
        <!-- Botón de Cerrar Premium (x) -->
        <button 
          class="modal-close-premium dialog-close-btn" 
          @click="alertStore.cancel()"
          :disabled="alertStore.isLoading"
          title="Cerrar"
        >
          &times;
        </button>
        
        <!-- Cuerpo del Diálogo -->
        <div class="dialog-body">
          
          <!-- Fila Superior: Icono de Alerta Grande -->
          <div class="dialog-icon-wrapper">
            <div class="dialog-icon-circle" :class="dialogStyles.iconClass">
              <span class="material-symbols-outlined" style="font-size: 2.5rem;">{{ dialogStyles.icon }}</span>
            </div>
          </div>
          
          <!-- Título y Mensaje -->
          <div class="dialog-text-content">
            <h2 class="dialog-title">{{ alertStore.title }}</h2>
            <p class="dialog-message">{{ alertStore.message }}</p>
          </div>

          <!-- Bloque Especial: Detalle de Empresa a Eliminar (Premium Card) -->
          <div v-if="alertStore.companyName" class="company-card-premium">
            <div class="company-card-icon">
              <span class="material-symbols-outlined" style="font-size: 1.8rem;">domain</span>
            </div>
            <div class="company-card-info">
              <span class="company-card-label">Empresa seleccionada</span>
              <strong class="company-card-name">{{ alertStore.companyName }}</strong>
            </div>
          </div>

          <!-- Banner de Errores del Backend Visual -->
          <Transition name="error-slide">
            <div v-if="alertStore.errorMsg" class="dialog-error-banner">
              <span class="material-symbols-outlined error-banner-icon">error</span>
              <div class="error-banner-text">
                <strong>Error en la solicitud:</strong>
                <p>{{ alertStore.errorMsg }}</p>
              </div>
            </div>
          </Transition>

        </div>

        <!-- Footer con Botones Adaptativos -->
        <div class="modal-footer dialog-footer">
          <!-- Botón de Cancelar (Solo en tipo confirm) -->
          <button 
            v-if="alertStore.type === 'confirm'"
            class="btn-cancel-premium dialog-btn-cancel" 
            :disabled="alertStore.isLoading"
            @click="alertStore.cancel()"
          >
            {{ alertStore.cancelText }}
          </button>
          
          <!-- Botón de Confirmación / Aceptar -->
          <button 
            ref="confirmButtonRef"
            class="btn-confirm-premium dialog-btn-ok"
            :class="dialogStyles.btnClass"
            :disabled="alertStore.isLoading"
            @click="alertStore.confirm()"
          >
            <span v-if="!alertStore.isLoading" class="btn-text-content">
              {{ alertStore.okText }}
            </span>
            <div v-else class="spin-mini"></div>
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dialog-card {
  position: relative;
  border-radius: 20px;
  max-width: 520px;
  width: 90%;
  box-shadow: var(--shadow-lg);
  background: var(--bg-elevated);
  overflow: hidden;
  border: 1px solid var(--border-primary);
}

.dialog-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.dialog-body {
  padding: 32px 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: var(--bg-elevated);
}

.dialog-icon-wrapper {
  margin-bottom: 20px;
}

.dialog-icon-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  transition: all 0.3s ease;
}

.dialog-text-content {
  margin-bottom: 24px;
  width: 100%;
}

.dialog-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 10px 0;
  line-height: 1.3;
}

.dialog-message {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Tarjeta especial premium para borrado de empresas */
.company-card-premium {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-left: 5px solid var(--color_button);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  text-align: left;
  animation: slideInUp 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.company-card-icon {
  background: var(--bg-active);
  color: var(--color_button);
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.company-card-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.company-card-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.company-card-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Banner de errores del backend visual */
.dialog-error-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  background: rgba(239, 68, 68, 0.12);
  border: 1.5px solid rgba(239, 68, 68, 0.4);
  border-radius: 12px;
  padding: 14px 16px;
  text-align: left;
  margin-top: 10px;
}

.error-banner-icon {
  color: #ef4444;
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.error-banner-text {
  font-size: 0.85rem;
  color: #ef4444;
  line-height: 1.5;
}

.error-banner-text strong {
  display: block;
  font-weight: 700;
  margin-bottom: 2px;
}

.error-banner-text p {
  margin: 0;
}

/* Footer de los botones */
.dialog-footer {
  padding: 20px 32px 28px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-btn-cancel {
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 700;
  min-width: 110px;
}

.dialog-btn-ok {
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 0.9rem;
  font-weight: 700;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Transiciones */
.dialog-fade-enter-active, .dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}

.dialog-fade-enter-from, .dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .dialog-card {
  animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dialog-fade-leave-active .dialog-card {
  animation: modalOut 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.9) translateY(24px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes modalOut {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to { opacity: 0; transform: scale(0.9) translateY(24px); }
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.error-slide-enter-active {
  animation: slideInUp 0.3s ease-out;
}

.error-slide-leave-active {
  animation: slideInUp 0.2s ease-in reverse;
}

/* Responsive */
@media (max-width: 480px) {
  .dialog-body {
    padding: 24px 20px 16px;
  }
  .dialog-footer {
    padding: 16px 20px 20px;
    flex-direction: column-reverse;
    gap: 8px;
  }
  .dialog-footer button {
    width: 100%;
  }
  .dialog-title {
    font-size: 1.2rem;
  }
  .dialog-message {
    font-size: 0.85rem;
  }
}
</style>
