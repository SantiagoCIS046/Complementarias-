<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../../core/store/auth.store';
import { usersService } from '../services/users.service';

const authStore = useAuthStore();
const user = authStore.user;

const formData = ref({
  name: user?.name || '',
  email: user?.email || '',
  documento: user?.documento || '',
  ficha: user?.ficha || '',
  programa: user?.programa || '',
  telefono: user?.telefono || ''
});

const isSubmitting = ref(false);
const message = ref({ text: '', type: '' });

const showModal = ref(false);
const tempEmail = ref('');
const tempTelefono = ref('');
const confirmCheck = ref(false);

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
    const response = await usersService.update(user._id, {
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

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};
</script>

<template>
  <div class="profile-container">
    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar-large">
          {{ getInitials(formData.name) }}
        </div>
        <div class="header-info">
          <h1>Mi Perfil</h1>
          <p class="role-badge">{{ user?.role }}</p>
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
          </div>

          <div class="form-actions">
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
</template>

<style scoped>
.profile-container {
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 80px);
  background: #f8fafc;
}

.profile-card {
  background: white;
  width: 100%;
  max-width: 800px;
  border-radius: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  overflow: hidden;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.profile-header {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  padding: 3rem 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  color: white;
}

.avatar-large {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
}

.header-info h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
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
}

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
  color: #475569;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper .material-symbols-outlined {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  font-size: 1.25rem;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 12px 12px 42px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 600;
  transition: all 0.3s;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #2e7d32;
  box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.1);
}

.form-group.readonly input {
  background: #f1f5f9;
  border-color: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.form-group.readonly small {
  font-size: 0.75rem;
  color: #94a3b8;
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
  background: #dcfce7;
  color: #1b5e20;
}

.message.error {
  background: #fee2e2;
  color: #991b1b;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.submit-btn {
  background: #2e7d32;
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
  .profile-container {
    padding: 1rem;
  }
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1rem;
  }
  .avatar-large {
    width: 80px;
    height: 80px;
    font-size: 2rem;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .submit-btn {
    width: 100%;
  }
}

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
  background: white;
  width: 90%;
  max-width: 480px;
  border-radius: 20px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  border: 1px solid #e2e8f0;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  background: #2e7d32;
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
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.75rem;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 2rem 1.5rem;
}

.confirmation-checkbox {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  accent-color: #2e7d32;
  cursor: pointer;
}

.modal-actions {
  padding: 1.5rem;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #e2e8f0;
}

.cancel-btn {
  background: #e2e8f0;
  color: #475569;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: #cbd5e1;
}

.save-btn {
  background: #2e7d32;
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

.save-btn:hover:not(:disabled) {
  background: #1b5e20;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
