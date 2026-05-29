<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../core/store/auth.store';
import { authService } from '../services/auth.service';
import Sidebar from '../../../components/layout/Sidebar.vue';
import Header from '../../../components/layout/Header.vue';

const router = useRouter();
const authStore = useAuthStore();

const newPassword = ref('');
const confirmPassword = ref('');
const showNewPass = ref(false);
const showConfirmPass = ref(false);
const passwordSubmitting = ref(false);
const passwordMessage = ref({ text: '', type: '' });

// Validaciones reactivas de la contraseña (alineado con regex del backend)
const hasMinLength = computed(() => newPassword.value.length >= 8);
const hasUppercase = computed(() => /[A-Z]/.test(newPassword.value));
const hasLowercase = computed(() => /[a-z]/.test(newPassword.value));
const hasNumber = computed(() => /\d/.test(newPassword.value));
const hasSpecialChar = computed(() => /[!@#$%^&*()_+\-=\[\]\{\};':",.\/<>?]/.test(newPassword.value));

const isPolicyMet = computed(() => {
  return hasMinLength.value &&
         hasUppercase.value &&
         hasLowercase.value &&
         hasNumber.value &&
         hasSpecialChar.value;
});

const savePassword = async () => {
  if (!isPolicyMet.value) {
    passwordMessage.value = { text: 'La contraseña no cumple con la política de seguridad.', type: 'error' };
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordMessage.value = { text: 'Las contraseñas no coinciden.', type: 'error' };
    return;
  }

  passwordSubmitting.value = true;
  passwordMessage.value = { text: '', type: '' };

  const token = authStore.token || localStorage.getItem('repfora_token');

  try {
    const res = await authService.changePassword(newPassword.value, token);
    passwordMessage.value = { text: res.data?.message || '¡Contraseña actualizada con éxito!', type: 'success' };
    
    if (authStore.user && authStore.user.isFirstLogin) {
      authStore.updateUser({ isFirstLogin: false });
    }
    
    setTimeout(() => {
      router.push('/');
    }, 1500);
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    passwordMessage.value = { 
      text: error.response?.data?.message || 'Error al cambiar contraseña.', 
      type: 'error' 
    };
  } finally {
    passwordSubmitting.value = false;
  }
};

const goBackHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="repfora-dashboard">
    <Sidebar />
    <div class="main-wrapper">
      <Header title="Cambiar Contraseña" />
      <main class="content">
        <div class="password-container">
          <div class="password-card">
            <div class="password-header">
              <div class="icon-wrapper-large">
                <span class="material-symbols-outlined">key</span>
              </div>
              <div class="header-info">
                <h1>Cambiar Contraseña</h1>
                <p class="subtitle">Actualiza tus credenciales de acceso para mantener tu cuenta segura.</p>
              </div>
            </div>

            <div class="password-body">
              <div class="password-form">
                <!-- Nueva Contraseña -->
                <div class="form-group">
                  <label for="new-password">Nueva Contraseña</label>
                  <div class="input-wrapper">
                    <span class="material-symbols-outlined">lock</span>
                    <input
                      id="new-password"
                      v-model="newPassword"
                      :type="showNewPass ? 'text' : 'password'"
                      placeholder="Ingresa tu nueva contraseña"
                      required
                    />
                    <button type="button" class="eye-btn" @click="showNewPass = !showNewPass">
                      <span class="material-symbols-outlined">{{ showNewPass ? 'visibility' : 'visibility_off' }}</span>
                    </button>
                  </div>
                </div>

                <!-- Confirmar Contraseña -->
                <div class="form-group">
                  <label for="confirm-password">Confirmar Contraseña</label>
                  <div class="input-wrapper">
                    <span class="material-symbols-outlined">lock</span>
                    <input
                      id="confirm-password"
                      v-model="confirmPassword"
                      :type="showConfirmPass ? 'text' : 'password'"
                      placeholder="Repite tu nueva contraseña"
                      required
                    />
                    <button type="button" class="eye-btn" @click="showConfirmPass = !showConfirmPass">
                      <span class="material-symbols-outlined">{{ showConfirmPass ? 'visibility' : 'visibility_off' }}</span>
                    </button>
                  </div>
                </div>

                <!-- Checklist de Requisitos -->
                <div class="requirements">
                  <h4>Requisitos de Seguridad:</h4>
                  <p :class="{ met: hasMinLength }">
                    <span class="indicator">{{ hasMinLength ? '✔' : '○' }}</span> Al menos 8 caracteres
                  </p>
                  <p :class="{ met: hasUppercase }">
                    <span class="indicator">{{ hasUppercase ? '✔' : '○' }}</span> Al menos una letra mayúscula
                  </p>
                  <p :class="{ met: hasLowercase }">
                    <span class="indicator">{{ hasLowercase ? '✔' : '○' }}</span> Al menos una letra minúscula
                  </p>
                  <p :class="{ met: hasNumber }">
                    <span class="indicator">{{ hasNumber ? '✔' : '○' }}</span> Al menos un número
                  </p>
                  <p :class="{ met: hasSpecialChar }">
                    <span class="indicator">{{ hasSpecialChar ? '✔' : '○' }}</span> Al menos un carácter especial (!@#$%^&*...)
                  </p>
                </div>

                <!-- Mensajes -->
                <div v-if="passwordMessage.text" :class="['message', passwordMessage.type]">
                  {{ passwordMessage.text }}
                </div>

                <!-- Acciones -->
                <div class="form-actions">
                  <button type="button" class="cancel-btn" @click="goBackHome" :disabled="passwordSubmitting">
                    <span>Volver al Inicio</span>
                  </button>
                  <button type="button" class="save-btn" :disabled="passwordSubmitting || !isPolicyMet" @click="savePassword">
                    <span v-if="!passwordSubmitting">Actualizar Contraseña</span>
                    <span v-else class="loader"></span>
                  </button>
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
.password-container {
  padding: 1rem 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px);
  background: transparent;
  width: 100%;
}

.password-card {
  background: var(--bg-primary);
  width: 100%;
  max-width: 600px;
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

.password-header {
  background: linear-gradient(135deg, var(--color_button, #2e7d32) 0%, #1b5e20 100%);
  padding: 2.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  color: white;
}

.icon-wrapper-large {
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.icon-wrapper-large span {
  font-size: 2.2rem;
}

.header-info h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: white;
}

.header-info .subtitle {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  line-height: 1.4;
}

.password-body {
  padding: 2.5rem 2rem;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  padding: 12px 42px 12px 42px;
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

.eye-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
}

.eye-btn span {
  font-size: 1.25rem;
}

.requirements {
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: 12px;
  font-size: 0.8rem;
  text-align: left;
  border: 1px solid var(--border-primary);
}

.requirements h4 {
  margin: 0 0 10px 0;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-primary);
}

.requirements p {
  margin: 6px 0;
  color: var(--text-muted);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s;
}

.requirements p.met {
  color: #16a34a;
}

.indicator {
  font-weight: 800;
}

.message {
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  text-align: center;
  animation: fadeIn 0.3s;
  font-size: 0.85rem;
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
  justify-content: space-between;
  margin-top: 1rem;
  gap: 1rem;
}

.cancel-btn {
  background: var(--bg-hover);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.cancel-btn:hover:not(:disabled) {
  background: var(--bg-active);
}

.save-btn {
  background: var(--color_button, #2e7d32);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  font-size: 0.9rem;
}

.save-btn:hover:not(:disabled) {
  background: #1b5e20;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loader {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .form-actions {
    flex-direction: column-reverse;
  }
  .cancel-btn, .save-btn {
    width: 100%;
  }
}
</style>
