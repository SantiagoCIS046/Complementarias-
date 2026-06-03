<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../core/store/auth.store';
import { usersService } from '../services/users.service';
import { authService } from '../services/auth.service';
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

// Sincronizar formData con cambios del usuario (del store o de peticiones)
watch(user, (newUser) => {
  if (newUser) {
    formData.value.name = newUser.name || '';
    formData.value.email = newUser.email || '';
    formData.value.documento = newUser.documento || '';
    formData.value.ficha = newUser.ficha || '';
    formData.value.programa = newUser.programa || '';
    formData.value.telefono = newUser.telefono || '';
    formData.value.areaConocimiento = newUser.areaConocimiento || '';
    formData.value.tipoInstructor = newUser.tipoInstructor || '';
  }
}, { immediate: true });

onMounted(async () => {
  if (user.value?._id) {
    try {
      const res = await usersService.getById(user.value._id);
      if (res.data && res.data.success && res.data.data) {
        authStore.updateUser(res.data.data);
      }
    } catch (err) {
      console.error('Error al obtener los datos actualizados del perfil:', err);
    }
  }
});

const isSubmitting = ref(false);
const message = ref({ text: '', type: '' });

// ── Edición inline por campo ────────────────────────────────────────────────
const editingField = ref(null);
const editValue    = ref('');
const confirmValue = ref('');  // solo para contraseña
const isSavingField = ref(false);

const startEdit = (field) => {
  editingField.value = field;
  editValue.value    = field === 'password' ? '' : (formData.value[field] || '');
  confirmValue.value = '';
};

const cancelEdit = () => {
  editingField.value = null;
  editValue.value    = '';
  confirmValue.value = '';
};

/** Guarda cualquier campo genérico en el backend */
const saveField = async (field) => {
  if (isSavingField.value) return;
  isSavingField.value = true;
  try {
    const payload  = { [field]: editValue.value };
    const response = await usersService.update(user.value._id, payload);
    if (response.data.success) {
      formData.value[field] = editValue.value;
      authStore.updateUser(response.data.data);
      cancelEdit();
      showSuccess('¡Guardado!', 'El campo se actualizó correctamente.');
    }
  } catch (error) {
    showError('Error', error.response?.data?.message || 'No se pudo guardar. Intenta de nuevo.');
  } finally {
    isSavingField.value = false;
  }
};

/** Guarda la nueva contraseña (endpoint dedicado) */
const savePassword = async () => {
  if (isSavingField.value) return;
  if (!editValue.value || editValue.value.length < 6) {
    return showError('Error', 'La contraseña debe tener mínimo 6 caracteres.');
  }
  if (editValue.value !== confirmValue.value) {
    return showError('Error', 'Las contraseñas no coinciden.');
  }
  isSavingField.value = true;
  try {
    await authService.changePassword(editValue.value, authStore.token);
    cancelEdit();
    showSuccess('¡Contraseña actualizada!', 'Tu nueva contraseña quedó guardada.');
  } catch (error) {
    showError('Error', error.response?.data?.message || 'No se pudo cambiar la contraseña.');
  } finally {
    isSavingField.value = false;
  }
};

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

/** Muestra u oculta el lightbox de la foto */
const showLightbox = ref(false);

/** Abre el lightbox si hay foto, si no abre el selector */
const handleAvatarClick = () => {
  if (user.value?.fotoPerfil) {
    showLightbox.value = true;
  } else {
    openFilePicker();
  }
};

/** Cierra el lightbox */
const closeLightbox = () => {
  showLightbox.value = false;
};

/** Referencia al overlay del lightbox para hacer foco (ESC) */
const lightboxRef = ref(null);

/** Al abrir el lightbox, hacer foco automático para capturar ESC */
watch(showLightbox, async (val) => {
  if (val) {
    await nextTick();
    lightboxRef.value?.focus();
  }
});

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
                  @click="handleAvatarClick"
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

                  <!-- Correo Electrónico (editable inline) -->
                  <div class="form-group" :class="{ editing: editingField === 'email' }">
                    <label for="email">
                      Correo Electrónico
                      <button
                        v-if="editingField !== 'email'"
                        class="edit-field-btn"
                        @click="startEdit('email')"
                        title="Editar correo"
                      >
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                    </label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">mail</span>
                      <input
                        id="email"
                        v-if="editingField === 'email'"
                        v-model="editValue"
                        type="email"
                        class="field-active"
                        placeholder="tu@correo.com"
                        @keydown.enter="saveField('email')"
                        @keydown.esc="cancelEdit"
                        autofocus
                      />
                      <input v-else :value="formData.email" type="email" readonly />
                      <div v-if="editingField === 'email'" class="field-actions">
                        <button class="field-save-btn" @click="saveField('email')" :disabled="isSavingField" title="Guardar">
                          <span v-if="isSavingField" class="field-spinner"></span>
                          <span v-else class="material-symbols-outlined">thumb_up</span>
                        </button>
                        <button class="field-cancel-btn" @click="cancelEdit" :disabled="isSavingField" title="Cancelar">
                          <span class="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Teléfono / Celular (editable inline) -->
                  <div class="form-group" :class="{ editing: editingField === 'telefono' }">
                    <label for="telefono">
                      Teléfono / Celular
                      <button
                        v-if="editingField !== 'telefono'"
                        class="edit-field-btn"
                        @click="startEdit('telefono')"
                        title="Editar teléfono"
                      >
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                    </label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">phone</span>
                      <input
                        id="telefono"
                        v-if="editingField === 'telefono'"
                        v-model="editValue"
                        type="text"
                        class="field-active"
                        placeholder="Número de contacto"
                        @keydown.enter="saveField('telefono')"
                        @keydown.esc="cancelEdit"
                        autofocus
                      />
                      <input v-else :value="formData.telefono" type="text" readonly />
                      <div v-if="editingField === 'telefono'" class="field-actions">
                        <button class="field-save-btn" @click="saveField('telefono')" :disabled="isSavingField" title="Guardar">
                          <span v-if="isSavingField" class="field-spinner"></span>
                          <span v-else class="material-symbols-outlined">thumb_up</span>
                        </button>
                        <button class="field-cancel-btn" @click="cancelEdit" :disabled="isSavingField" title="Cancelar">
                          <span class="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Documento de Identidad (editable) -->
                  <div class="form-group" :class="{ editing: editingField === 'documento' }">
                    <label>
                      Documento de Identidad
                      <button v-if="editingField !== 'documento'" class="edit-field-btn" @click="startEdit('documento')" title="Editar documento">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                    </label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">badge</span>
                      <input v-if="editingField === 'documento'" v-model="editValue" type="text" class="field-active" placeholder="Número de documento" @keydown.enter="saveField('documento')" @keydown.esc="cancelEdit" autofocus />
                      <input v-else :value="formData.documento" type="text" readonly />
                      <div v-if="editingField === 'documento'" class="field-actions">
                        <button class="field-save-btn" @click="saveField('documento')" :disabled="isSavingField">
                          <span v-if="isSavingField" class="field-spinner"></span>
                          <span v-else class="material-symbols-outlined">thumb_up</span>
                        </button>
                        <button class="field-cancel-btn" @click="cancelEdit" :disabled="isSavingField">
                          <span class="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Contraseña (editable con confirmación) -->
                  <div class="form-group" :class="{ editing: editingField === 'password' }">
                    <label>
                      Contraseña
                      <button v-if="editingField !== 'password'" class="edit-field-btn" @click="startEdit('password')" title="Cambiar contraseña">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                    </label>
                    <div v-if="editingField === 'password'" class="password-edit-group">
                      <div class="input-wrapper">
                        <span class="material-symbols-outlined">lock</span>
                        <input v-model="editValue" type="password" class="field-active" placeholder="Nueva contraseña" @keydown.esc="cancelEdit" autofocus />
                      </div>
                      <div class="input-wrapper" style="margin-top:0.5rem">
                        <span class="material-symbols-outlined">lock_reset</span>
                        <input v-model="confirmValue" type="password" class="field-active" placeholder="Confirmar contraseña" @keydown.enter="savePassword" @keydown.esc="cancelEdit" />
                      </div>
                      <div class="field-actions" style="margin-top:0.5rem; justify-content:flex-end">
                        <button class="field-save-btn" @click="savePassword" :disabled="isSavingField">
                          <span v-if="isSavingField" class="field-spinner"></span>
                          <span v-else class="material-symbols-outlined">thumb_up</span>
                        </button>
                        <button class="field-cancel-btn" @click="cancelEdit" :disabled="isSavingField">
                          <span class="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                    <div v-else class="input-wrapper">
                      <span class="material-symbols-outlined">lock</span>
                      <input value="••••••••" type="password" readonly />
                    </div>
                  </div>

                  <!-- Ficha (editable, solo APRENDIZ) -->
                  <div v-if="user?.role === 'APRENDIZ'" class="form-group" :class="{ editing: editingField === 'ficha' }">
                    <label>
                      Ficha
                      <button v-if="editingField !== 'ficha'" class="edit-field-btn" @click="startEdit('ficha')" title="Editar ficha">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                    </label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">tag</span>
                      <input v-if="editingField === 'ficha'" v-model="editValue" type="text" class="field-active" placeholder="Código de ficha" @keydown.enter="saveField('ficha')" @keydown.esc="cancelEdit" autofocus />
                      <input v-else :value="formData.ficha" type="text" readonly />
                      <div v-if="editingField === 'ficha'" class="field-actions">
                        <button class="field-save-btn" @click="saveField('ficha')" :disabled="isSavingField">
                          <span v-if="isSavingField" class="field-spinner"></span>
                          <span v-else class="material-symbols-outlined">thumb_up</span>
                        </button>
                        <button class="field-cancel-btn" @click="cancelEdit" :disabled="isSavingField">
                          <span class="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Programa (editable, solo APRENDIZ) -->
                  <div v-if="user?.role === 'APRENDIZ'" class="form-group" :class="{ editing: editingField === 'programa' }">
                    <label>
                      Programa
                      <button v-if="editingField !== 'programa'" class="edit-field-btn" @click="startEdit('programa')" title="Editar programa">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                    </label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">school</span>
                      <input v-if="editingField === 'programa'" v-model="editValue" type="text" class="field-active" placeholder="Nombre del programa" @keydown.enter="saveField('programa')" @keydown.esc="cancelEdit" autofocus />
                      <input v-else :value="formData.programa" type="text" readonly />
                      <div v-if="editingField === 'programa'" class="field-actions">
                        <button class="field-save-btn" @click="saveField('programa')" :disabled="isSavingField">
                          <span v-if="isSavingField" class="field-spinner"></span>
                          <span v-else class="material-symbols-outlined">thumb_up</span>
                        </button>
                        <button class="field-cancel-btn" @click="cancelEdit" :disabled="isSavingField">
                          <span class="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Área de Conocimiento (editable, solo INSTRUCTOR) -->
                  <div v-if="user?.role === 'INSTRUCTOR'" class="form-group" :class="{ editing: editingField === 'areaConocimiento' }">
                    <label>
                      Área de Conocimiento
                      <button v-if="editingField !== 'areaConocimiento'" class="edit-field-btn" @click="startEdit('areaConocimiento')" title="Editar área">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                    </label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">menu_book</span>
                      <input v-if="editingField === 'areaConocimiento'" v-model="editValue" type="text" class="field-active" placeholder="Área de conocimiento" @keydown.enter="saveField('areaConocimiento')" @keydown.esc="cancelEdit" autofocus />
                      <input v-else :value="formData.areaConocimiento" type="text" readonly />
                      <div v-if="editingField === 'areaConocimiento'" class="field-actions">
                        <button class="field-save-btn" @click="saveField('areaConocimiento')" :disabled="isSavingField">
                          <span v-if="isSavingField" class="field-spinner"></span>
                          <span v-else class="material-symbols-outlined">thumb_up</span>
                        </button>
                        <button class="field-cancel-btn" @click="cancelEdit" :disabled="isSavingField">
                          <span class="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Tipo de Instructor (editable, solo INSTRUCTOR) -->
                  <div v-if="user?.role === 'INSTRUCTOR'" class="form-group" :class="{ editing: editingField === 'tipoInstructor' }">
                    <label>
                      Tipo de Instructor
                      <button v-if="editingField !== 'tipoInstructor'" class="edit-field-btn" @click="startEdit('tipoInstructor')" title="Editar tipo">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                    </label>
                    <div class="input-wrapper">
                      <span class="material-symbols-outlined">support_agent</span>
                      <input v-if="editingField === 'tipoInstructor'" v-model="editValue" type="text" class="field-active" placeholder="Tipo de instructor" @keydown.enter="saveField('tipoInstructor')" @keydown.esc="cancelEdit" autofocus />
                      <input v-else :value="formData.tipoInstructor" type="text" readonly />
                      <div v-if="editingField === 'tipoInstructor'" class="field-actions">
                        <button class="field-save-btn" @click="saveField('tipoInstructor')" :disabled="isSavingField">
                          <span v-if="isSavingField" class="field-spinner"></span>
                          <span v-else class="material-symbols-outlined">thumb_up</span>
                        </button>
                        <button class="field-cancel-btn" @click="cancelEdit" :disabled="isSavingField">
                          <span class="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="button" class="back-btn" @click="router.push('/')">
                    <span class="material-symbols-outlined">arrow_back</span>
                    Volver al Inicio
                  </button>
                </div>
              </div>
            </div>
          </div>

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

  <!-- Lightbox: ver foto en pantalla completa -->
  <Transition name="lightbox-fade">
    <div
      v-if="showLightbox && user?.fotoPerfil"
      class="lightbox-overlay"
      @click.self="closeLightbox"
      @keydown.esc="closeLightbox"
      tabindex="0"
      ref="lightboxRef"
    >
      <button class="lightbox-close" @click="closeLightbox" aria-label="Cerrar">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="lightbox-img-wrapper">
        <img
          :src="user.fotoPerfil"
          :alt="user?.name"
          class="lightbox-img"
          draggable="false"
        />
        <p class="lightbox-caption">{{ user?.name }}</p>
      </div>
    </div>
  </Transition>
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
  display: flex;
  align-items: center;
  gap: 6px;
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
  justify-content: flex-start;
  margin-top: 1rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--color_button, #2e7d32);
  color: #fff;
  border: none;
  padding: 11px 22px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 0.2px;
}
.back-btn .material-symbols-outlined { font-size: 1.1rem; }
.back-btn:hover {
  background: #1b5e20;
  transform: translateX(-3px);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.25);
}

/* ── Inline field editing ── */

/** Botón lápiz junto al label */
.edit-field-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;
  line-height: 1;
  margin-left: 2px;
}
.edit-field-btn .material-symbols-outlined { font-size: 0.95rem; }
.edit-field-btn:hover {
  color: var(--color_button, #2e7d32);
  background: rgba(46, 125, 50, 0.08);
}

/** Campo activo en edición */
.field-active {
  border-color: var(--color_button, #2e7d32) !important;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15) !important;
  background: var(--bg-primary) !important;
  color: var(--text-primary) !important;
  cursor: text !important;
  opacity: 1 !important;
}

/** Contenedor de botones guardar/cancelar dentro del input-wrapper */
.field-actions {
  display: flex;
  gap: 4px;
  margin-left: 6px;
  flex-shrink: 0;
}

.field-save-btn,
.field-cancel-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.field-save-btn .material-symbols-outlined,
.field-cancel-btn .material-symbols-outlined { font-size: 1rem; }

.field-save-btn {
  background: var(--color_button, #2e7d32);
  color: #fff;
}
.field-save-btn:hover:not(:disabled) { background: #1b5e20; }
.field-save-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.field-cancel-btn {
  background: var(--bg-hover);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
}
.field-cancel-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.25);
}

/** Spinner dentro del botón guardar */
.field-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}

/** Borde sutil cuando el grupo está en modo edición */
.form-group.editing {
  background: rgba(46, 125, 50, 0.03);
  border-radius: 12px;
  padding: 8px;
  margin: -8px;
}

/** Grupo especial para el doble input de contraseña */
.password-edit-group {
  display: flex;
  flex-direction: column;
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

/* ── Lightbox ── */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 1.5rem;
  outline: none;
}

.lightbox-close {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: 1.5px solid rgba(255, 255, 255, 0.22);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 3001;
  backdrop-filter: blur(8px);
}
.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1) rotate(90deg);
}
.lightbox-close .material-symbols-outlined {
  font-size: 1.4rem;
}

.lightbox-img-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: lightboxIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.lightbox-img {
  max-width: min(480px, 90vw);
  max-height: min(480px, 80vh);
  width: auto;
  height: auto;
  border-radius: 20px;
  object-fit: cover;
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.08),
    0 32px 80px rgba(0, 0, 0, 0.7);
  user-select: none;
}

.lightbox-caption {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  margin: 0;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
}

@keyframes lightboxIn {
  from { opacity: 0; transform: scale(0.82); }
  to   { opacity: 1; transform: scale(1); }
}

/* Lightbox transition */
.lightbox-fade-enter-active { animation: fadeIn 0.2s ease; }
.lightbox-fade-leave-active { animation: fadeIn 0.15s ease reverse; }
</style>
