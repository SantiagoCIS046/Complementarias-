<template>
  <div class="reset-page">
    <div class="glass-card">
      <div class="brand">
        <img src="/logoSena.png" alt="SENA" class="brand-logo" />
        <h2 class="brand-name">RepFora</h2>
      </div>

      <div class="card-head">
        <h1 class="card-title">Primer Ingreso</h1>
        <p class="card-sub">Para continuar en el sistema, debes cambiar tu contraseña inicial por una nueva segura.</p>
      </div>

      <!-- Nueva Contraseña -->
      <div class="field">
        <label class="field-label">Nueva contraseña</label>
        <div class="input-box">
          <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <input
            v-model="password"
            :type="showPass ? 'text' : 'password'"
            placeholder="Min. 8 caracteres, Mayús, Min, Núm, Espec."
            class="field-input"
          />
          <button type="button" class="eye-btn" @click="showPass = !showPass">
            <svg v-if="!showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>
        <div class="requirements">
          <p :class="{ met: hasMinLength }">✔ Al menos 8 caracteres</p>
          <p :class="{ met: hasUppercase }">✔ Al menos una letra mayúscula</p>
          <p :class="{ met: hasLowercase }">✔ Al menos una letra minúscula</p>
          <p :class="{ met: hasNumber }">✔ Al menos un número</p>
          <p :class="{ met: hasSpecialChar }">✔ Al menos un carácter especial (!@#$%^&*...)</p>
        </div>
      </div>

      <!-- Confirmar Contraseña -->
      <div class="field">
        <label class="field-label">Confirmar contraseña</label>
        <div class="input-box">
          <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <input
            v-model="confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            placeholder="Repite tu contraseña"
            class="field-input"
          />
          <button type="button" class="eye-btn" @click="showConfirm = !showConfirm">
            <svg v-if="!showConfirm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>
      </div>

      <button class="submit-btn" :disabled="loading || !isPolicyMet" @click="handleChange">
        <span v-if="loading" class="spin-ring"></span>
        <span>{{ loading ? 'Actualizando...' : 'Cambiar y Entrar' }}</span>
      </button>

      <transition name="fade">
        <div v-if="errorMsg" class="error-alert">{{ errorMsg }}</div>
      </transition>
      <transition name="fade">
        <div v-if="successMsg" class="success-alert">{{ successMsg }}</div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../core/store/auth.store'
import { authService } from '../services/auth.service'

const router = useRouter()
const authStore = useAuthStore()

const password = ref('')
const confirmPassword = ref('')
const showPass = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// Validaciones reactivas
const hasMinLength = computed(() => password.value.length >= 8)
const hasUppercase = computed(() => /[A-Z]/.test(password.value))
const hasLowercase = computed(() => /[a-z]/.test(password.value))
const hasNumber = computed(() => /\d/.test(password.value))
const hasSpecialChar = computed(() => /[!@#$%^&*()_+\-=\[\]\{\};':",.\/<>?]/.test(password.value))

const isPolicyMet = computed(() => {
  return hasMinLength.value &&
         hasUppercase.value &&
         hasLowercase.value &&
         hasNumber.value &&
         hasSpecialChar.value
})

async function handleChange() {
  if (!isPolicyMet.value) {
    errorMsg.value = 'La contraseña no cumple con la política de seguridad.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Las contraseñas no coinciden.'
    return
  }

  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true

  const token = authStore.token || localStorage.getItem('repfora_token')

  try {
    const res = await authService.changePassword(password.value, token)
    successMsg.value = res.data?.message || '¡Contraseña actualizada con éxito!'
    
    // Actualizar el estado del usuario local
    if (authStore.user) {
      authStore.updateUser({ isFirstLogin: false })
    }
    
    setTimeout(() => {
      // Redirigir al home correspondiente
      const role = authStore.userRole
      if (role === 'ADMIN') router.push('/dashboard')
      else if (role === 'INSTRUCTOR') router.push('/instructor-dashboard')
      else router.push('/mi-ep')
    }, 2000)
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Error al actualizar la contraseña.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background: #f1f5f9;
  font-family: 'Inter', sans-serif;
}
.glass-card {
  width: 420px;
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
}
.brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
.brand-logo { width: 50px; }
.brand-name { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin: 0; }
.card-title { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.card-sub { font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-bottom: 20px; }
.field { margin-bottom: 18px; }
.field-label { display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 6px; }
.input-box { display: flex; align-items: center; gap: 12px; padding: 0 15px; background: #f8fafc; border: 2px solid transparent; border-radius: 10px; transition: 0.3s; }
.input-box:focus-within { border-color: var(--color_button); background: white; box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.1); }
.field-icon { width: 18px; color: #94a3b8; }
.field-input { flex: 1; border: none; background: transparent; padding: 12px 0; outline: none; font-size: 0.9rem; }

.requirements {
  margin-top: 10px;
  background: #f8fafc;
  padding: 10px;
  border-radius: 8px;
  font-size: 0.75rem;
}
.requirements p {
  margin: 4px 0;
  color: #94a3b8;
  font-weight: 500;
  transition: color 0.2s;
}
.requirements p.met {
  color: #16a34a;
  font-weight: 700;
}

.eye-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  color: #94a3b8;
  transition: color 0.2s;
}
.eye-btn svg { width: 18px; height: 18px; }
.eye-btn:hover { color: #475569; }

.submit-btn { width: 100%; padding: 14px; background: var(--color_button); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; margin-top: 10px; transition: 0.3s; }
.submit-btn:hover:not(:disabled) { background: #2e8b00; transform: translateY(-2px); box-shadow: 0 10px 15px rgba(57, 169, 0, 0.2); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.error-alert { background: #fef2f2; color: #dc2626; padding: 12px; border-radius: 8px; font-size: 0.8rem; margin-top: 15px; text-align: center; }
.success-alert { background: #f0fdf4; color: #166534; padding: 12px; border-radius: 8px; font-size: 0.8rem; margin-top: 15px; text-align: center; }
.spin-ring { width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
