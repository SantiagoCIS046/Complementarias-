<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../core/store/auth.store';
import { usersService } from '../services/users.service';
import { useProfilePhoto } from '../../../core/composables/useProfilePhoto';
import { useAlert } from '../../../core/composables/useAlert';
import AvatarDisplay from '../../../components/shared/AvatarDisplay.vue';
import PhotoUploadModal from '../../../components/shared/PhotoUploadModal.vue';
import Sidebar from '../../../components/layout/Sidebar.vue';
import Header from '../../../components/layout/Header.vue';

const router = useRouter();
const authStore = useAuthStore();
const { showSuccess, showError } = useAlert();

// El usuario se lee del store de forma reactiva
const user = computed(() => authStore.user);

const formData = ref({
  name: user.value?.name || '',
  email: user.value?.email || '',
  documento: user.value?.documento || '',
  ficha: user.value?.ficha || '',
  programa: user.value?.programa || '',
  telefono: user.value?.telefono || '',
  areaConocimiento: user.value?.areaConocimiento || '',
  tipoInstructor: user.value?.tipoInstructor || ''
});

const isSubmitting = ref(false);
const message = ref({ text: '', type: '' });

const showModal = ref(false);
const tempEmail = ref('');
const tempTelefono = ref('');
const confirmCheck = ref(false);

// ── Foto de perfil ──────────────────────────────────────────────────────────
const {
  preview,
  isProcessing,
  isUploading,
  error: photoError,
  processFile,
  uploadPhoto,
  clearPreview,
} = useProfilePhoto();

/** Referencia al input file oculto */
const fileInputRef = ref(null);

/** Muestra u oculta el modal de foto */
const showPhotoModal = ref(false);

/** Abre el selector de archivos del sistema */
const openFilePicker = () => {
  fileInputRef.value?.click();
};

/** Maneja el archivo seleccionado */
const handleFileSelected = async (event) => {
  const file = event.target.files?.[0];
  // Limpiar el input para que el mismo archivo pueda seleccionarse de nuevo
  event.target.value = '';
  if (!file) return;

  showPhotoModal.value = true;
  await processFile(file);
};

/** Confirma la subida de la foto */
const handleConfirmPhoto = async () => {
  const ok = await uploadPhoto();
  if (ok) {
    showPhotoModal.value = false;
    clearPreview();
    showSuccess('¡Foto actualizada!', 'Tu foto de perfil se guardó correctamente.');
  } else {
    showError('Error', photoError.value || 'No se pudo guardar la foto. Intenta de nuevo.');
  }
};

/** Cancela el modal de foto */
const handleCancelPhoto = () => {
  if (!isProcessing.value && !isUploading.value) {
    showPhotoModal.value = false;
    clearPreview();
  }
};

/** Permite elegir otra imagen sin cerrar el modal */
const handleSelectAnother = () => {
  clearPreview();
  openFilePicker();
};

// ── Contacto ────────────────────────────────────────────────────────────────
const openModal = () => {
  tempEmail.value = formData.value.email;
  tempTelefono.value = formData.value.telefono;
  confirmCheck.value = false;
  showModal.value = true;
};

const closeModal = () => {
  if (!isSubmitting.value) {
    showModal.value = false;
    message.value = { text: '', type: '' };
  }
};

const saveContactDetails = async () => {
  if (!confirmCheck.value) return;
  isSubmitting.value = true;
  message.value = { text: '', type: '' };

  try {
    const response = await usersService.update(user.value._id, {
      email: tempEmail.value,
      telefono: tempTelefono.value
    });

    if (response.data.success) {
      formData.value.email = tempEmail.value;
      formData.value.telefono = tempTelefono.value;
      authStore.updateUser(response.data.data);
      message.value = { text: '¡Datos de contacto actualizados correctamente!', type: 'success' };
      setTimeout(() => {
        closeModal();
      }, 1500);
    }
  } catch (error) {
    console.error('Error al actualizar datos de contacto:', error);
    message.value = { 
      text: error.response?.data?.message || 'Error al actualizar. Intenta de nuevo.', 
      type: 'error' 
    };
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />
    <div class="main-wrapper">
      <Header title="Mi Perfil" />
      <main class="content">
        <div class="profile-container">
          <div class="profile-card">
            <div class="profile-header">

              <!-- Avatar editable con foto de perfil -->
              <div class="avatar-wrapper">
                <AvatarDisplay
                  :user="user"
                  size="xl"
                  :editable="true"
                  @click="openFilePicker"
                />
                <button
                  class="change-photo-btn"
                  @click="openFilePicker"
                  title="Cambiar foto de perfil"
                >
                  <span class="material-symbols-outlined">photo_camera</span>
                  Cambiar Foto
                </button>
              </div>

              <div class="header-info">
                <h1>Mi Perfil</h1>
                <p class="role-badge">{{ user?.role }}</p>
                <p v-if="user?.fotoPerfil" class="photo-status">
                  <span class="material-symbols-outlined status-icon">verified</span>
                  Foto de perfil configurada
                </p>
              </div>
            </div>

            <div class="profile-body">
              <div class="profile-form">
                <div class="form-grid">
                  <div class="form-group readonly">
                    <label for="name">Nombre Completo</label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">person</span>
                      <input id="name" :value="formData.name" type="text" readonly />
                    </div>
                    <small>No se puede cambiar el nombre por seguridad.</small>
                  </div>

                  <div class="form-group readonly">
                    <label for="email">Correo Electrónico</label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">mail</span>
                      <input id="email" :value="formData.email" type="email" readonly />
                    </div>
                  </div>

                  <div class="form-group readonly">
                    <label for="telefono">Teléfono / Celular</label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">phone</span>
                      <input id="telefono" :value="formData.telefono" type="text" readonly />
                    </div>
                  </div>

                  <div class="form-group readonly">
                    <label>Documento de Identidad</label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">badge</span>
                      <input :value="formData.documento" type="text" readonly />
                    </div>
                    <small>No se puede cambiar el documento por seguridad.</small>
                  </div>

                  <div class="form-group readonly">
                    <label>Contraseña</label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">lock</span>
                      <input value="••••••••" type="password" readonly />
                    </div>
                    <small>Por seguridad, la contraseña está encriptada.</small>
                  </div>

                  <div v-if="user?.role === 'APRENDIZ'" class="form-group readonly">
                    <label>Ficha</label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">tag</span>
                      <input :value="formData.ficha" type="text" readonly />
                    </div>
                  </div>

                  <div v-if="user?.role === 'APRENDIZ'" class="form-group readonly">
                    <label>Programa</label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">school</span>
                      <input :value="formData.programa" type="text" readonly />
                    </div>
                  </div>

                  <div v-if="user?.role === 'INSTRUCTOR'" class="form-group readonly">
                    <label>Área de Conocimiento</label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">menu_book</span>
                      <input :value="formData.areaConocimiento" type="text" readonly />
                    </div>
                  </div>

                  <div v-if="user?.role === 'INSTRUCTOR'" class="form-group readonly">
                    <label>Tipo de Instructor</label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">support_agent</span>
                      <input :value="formData.tipoInstructor" type="text" readonly />
                    </div>
                  </div>
                </div>

                <div class="form-actions" style="display: flex; gap: 1rem; justify-content: space-between; flex-wrap: wrap; width: 100%;">
                  <button type="button" class="cancel-btn" @click="router.push('/')">
                    <span>Volver al Inicio</span>
                  </button>
                  <button type="button" class="submit-btn" @click="openModal">
                    <span>Modificar Datos de Contacto</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal de Edición de Contacto (RF-APR-14) -->
          <Transition name="fade">
            <div v-if="showModal" class="modal-overlay">
              <div class="modal-card">
                <div class="modal-header">
                  <h3>Actualizar Datos de Contacto</h3>
                  <button class="close-btn" @click="closeModal">×</button>
                </div>
                <div class="modal-body">
                  <div class="form-group">
                    <label for="modal-email">Nuevo Correo Electrónico</label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">mail</span>
                      <input id="modal-email" v-model="tempEmail" type="email" placeholder="tu@correo.com" required />
                    </div>
                  </div>
                  
                  <div class="form-group" style="margin-top: 1.5rem;">
                    <label for="modal-telefono">Nuevo Teléfono / Celular</label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">phone</span>
                      <input id="modal-telefono" v-model="tempTelefono" type="text" placeholder="Número de contacto" />
                    </div>
                  </div>

                  <div class="confirmation-checkbox" style="margin-top: 1.5rem;">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="confirmCheck" />
                      <span>Confirmo que deseo actualizar mis datos de contacto.</span>
                    </label>
                  </div>

                  <div v-if="message.text" :class="['message', message.type]" style="margin-top: 1.5rem;">
                    {{ message.text }}
                  </div>
                </div>
                <div class="modal-actions">
                  <button type="button" class="cancel-btn" @click="closeModal" :disabled="isSubmitting">Cancelar</button>
                  <button type="button" class="save-btn" :disabled="isSubmitting || !confirmCheck" @click="saveContactDetails">
                    <span v-if="!isSubmitting">Guardar</span>
                    <span v-else class="loader"></span>
                  </button>
                </div>
              </div>
            </div>
          </Transition>

        </div>
      </main>
    </div>
  </div>

  <!-- Input de archivo oculto -->
  <input
    ref="fileInputRef"
    type="file"
    accept="image/jpeg,image/jpg,image/png,image/webp"
    style="display: none;"
    @change="handleFileSelected"
  />

  <!-- Modal de foto de perfil -->
  <PhotoUploadModal
    v-if="showPhotoModal"
    :preview="preview"
    :is-processing="isProcessing"
    :is-uploading="isUploading"
    :error="photoError"
    @confirm="handleConfirmPhoto"
    @cancel="handleCancelPhoto"
    @select="handleSelectAnother"
  />
</template>

<style scoped>
.profile-container {
  padding: 1rem 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px);
  background: transparent;
  width: 100%;
}

.profile-card {
  background: var(--bg-primary);
  width: 100%;
  max-width: 800px;
  border-radius: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.02);
  border: 1px solid var(--border-primary);
  overflow: hidden;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Profile Header ── */
.profile-header {
  background: linear-gradient(135deg, var(--color_button, #2e7d32) 0%, #1b5e20 100%);
  padding: 3rem 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  color: white;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* Botón "Cambiar Foto" bajo el avatar */
.change-photo-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
.change-photo-btn .material-symbols-outlined { font-size: 0.9rem; }
.change-photo-btn:hover {
  background: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
}

.header-info h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: white;
}

.role-badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
}

.photo-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}
.status-icon { font-size: 0.9rem; color: #86efac; }

/* ── Profile Body ── */
.profile-body {
  padding: 3rem 2rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper .material-symbols-outlined {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  font-size: 1.25rem;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 12px 12px 42px;
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  border-radius: 12px;
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 600;
  transition: all 0.3s;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--color_button, #2e7d32);
  box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.1);
}

.form-group.readonly input {
  background: var(--bg-hover);
  border-color: var(--border-primary);
  color: var(--text-secondary);
  opacity: 0.8;
  cursor: not-allowed;
}

.form-group.readonly small {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
}

.message {
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  text-align: center;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.message.success {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.message.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.submit-btn {
  background: var(--color_button, #2e7d32);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
}

.submit-btn:hover:not(:disabled) {
  background: #1b5e20;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .profile-container { padding: 1rem; }
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1rem;
  }
  .form-grid { grid-template-columns: 1fr; }
  .submit-btn { width: 100%; }
}

/* ── Contact Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: var(--bg-elevated);
  width: 90%;
  max-width: 480px;
  border-radius: 20px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--border-primary);
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  background: var(--color_button, #2e7d32);
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: white;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.75rem;
  cursor: pointer;
  line-height: 1;
}

.modal-body { padding: 2rem 1.5rem; }

.confirmation-checkbox { display: flex; align-items: center; }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  accent-color: var(--color_button, #2e7d32);
  cursor: pointer;
}

.modal-actions {
  padding: 1.5rem;
  background: var(--bg-secondary);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid var(--border-primary);
}

.cancel-btn {
  background: var(--bg-hover);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.cancel-btn:hover:not(:disabled) { background: var(--bg-active); }

.save-btn {
  background: var(--color_button, #2e7d32);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
}
.save-btn:hover:not(:disabled) { background: #1b5e20; }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Fade transition */
.fade-enter-active { animation: fadeIn 0.25s ease; }
.fade-leave-active { animation: fadeIn 0.15s ease reverse; }
</style>
