<template>
  <div class="login-page">

    <!-- ═══ PANEL IZQUIERDO — FORMULARIO ═══ -->
    <div class="left-panel">

      <!-- LOGO -->
      <div class="brand">
        <img src="/logoSena.png" alt="SENA" class="brand-logo" />
        <div>
          <h2 class="brand-name">RepFora</h2>
          <p class="brand-tagline">VANGUARDIA ACADÉMICA</p>
        </div>
      </div>

      <!-- CARD GLASS -->
      <div class="glass-card">

        <!-- 🟦 VISTA 1: LOGIN -->
        <div v-if="!showRecovery">
          <div class="card-head">
            <h1 class="card-title">Iniciar Sesión</h1>
            <p class="card-sub">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <!-- Email -->
          <div class="field">
            <label class="field-label" for="login-email">Correo electrónico</label>
            <div class="input-box">
              <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/>
              </svg>
              <input
                id="login-email"
                v-model="form.email"
                type="email"
                placeholder="nombre@sena.edu.co"
                class="field-input"
              />
            </div>
          </div>

          <!-- Contraseña -->
          <div class="field">
            <label class="field-label" for="login-password">Contraseña</label>
            <div class="input-box">
              <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
              <input
                id="login-password"
                v-model="form.password"
                :type="showPass ? 'text' : 'password'"
                placeholder="••••••••"
                class="field-input"
              />
              <button type="button" class="eye-btn" @click="showPass = !showPass">
                <svg v-if="!showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <button class="forgot-link-btn" @click="showRecovery = true">¿Olvidaste tu contraseña?</button>
          </div>

          <!-- Botón Ingresar -->
          <button class="submit-btn" :disabled="loading" @click="handleLogin">
            <span v-if="loading" class="spin-ring"></span>
            <span>{{ loading ? 'Verificando...' : 'Ingresar al Sistema' }}</span>
          </button>
        </div>

        <!-- 🟩 VISTA 2: RECUPERACIÓN -->
        <div v-else>
          <div class="card-head">
            <h1 class="card-title">Recuperar Acceso</h1>
            <p class="card-sub">Enviaremos un enlace a tu correo para restablecer tu contraseña.</p>
          </div>

          <div class="field">
            <label class="field-label">Tu correo registrado</label>
            <div class="input-box">
              <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/>
              </svg>
              <input
                v-model="recoveryEmail"
                type="email"
                placeholder="ejemplo@sena.edu.co"
                class="field-input"
              />
            </div>
          </div>

          <button class="submit-btn recovery" :disabled="loading" @click="handleRecovery">
            <span v-if="loading" class="spin-ring"></span>
            <span>{{ loading ? 'Enviando...' : 'Enviar Enlace' }}</span>
          </button>

          <button class="back-link-btn" @click="showRecovery = false">Volver al inicio de sesión</button>
        </div>

        <!-- Mensajes Globales -->
        <transition name="fade">
          <div v-if="errorMsg" class="error-alert">{{ errorMsg }}</div>
        </transition>
        <transition name="fade">
          <div v-if="successMsg" class="success-alert">{{ successMsg }}</div>
        </transition>

      </div><!-- /glass-card -->

    </div><!-- /left-panel -->

    <!-- PANEL DERECHO -->
    <div class="right-panel">
      <img src="/sena_institution.png" alt="SENA" class="sena-bg" />
      <div class="right-overlay">
        <div class="right-badge">SENA Colombia</div>
        <h2 class="right-title">Gestión de Etapa<br/>Productiva</h2>
        <p class="right-sub">Sistema oficial para el seguimiento de bitácoras<br/>y procesos de formación profesional.</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../core/store/auth.store'
import { authService } from '../services/auth.service'

const router    = useRouter()
const authStore = useAuthStore()

const form          = ref({ email: '', password: '' })
const recoveryEmail = ref('')
const showPass      = ref(false)
const showRecovery  = ref(false)
const loading       = ref(false)
const errorMsg      = ref('')
const successMsg    = ref('')

async function handleLogin() {
  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true
  try {
    const res = await authService.login(form.value)
    authStore.login(res.data)
    router.push('/dashboard')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Credenciales incorrectas'
  } finally {
    loading.value = false
  }
}

async function handleRecovery() {
  if (!recoveryEmail.value) {
    errorMsg.value = 'Ingresa tu correo electrónico'
    return
  }
  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true
  try {
    await authService.forgotPassword(recoveryEmail.value)
    successMsg.value = '¡Enviado! Revisa tu correo electrónico.'
    setTimeout(() => { showRecovery.value = false }, 3000)
  } catch (err) {
    errorMsg.value = 'No pudimos enviar el correo. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.login-page {
  font-family: 'Inter', sans-serif;
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.left-panel {
  width: 450px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
  box-shadow: 10px 0 30px rgba(0,0,0,0.05);
  z-index: 2;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}
.brand-logo { width: 60px; }
.brand-name { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
.brand-tagline { font-size: 0.65rem; color: #64748b; letter-spacing: 2px; margin: 0; }

.glass-card {
  background: white;
  padding: 35px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card-head { margin-bottom: 30px; }
.card-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.card-sub { font-size: 0.85rem; color: #64748b; line-height: 1.5; }

.field { margin-bottom: 20px; }
.field-label { display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 8px; }

.input-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 15px;
  background: #f1f5f9;
  border: 2px solid transparent;
  border-radius: 10px;
  transition: all 0.3s;
}
.input-box:focus-within { border-color: #39a900; background: white; box-shadow: 0 0 0 4px rgba(57, 169, 0, 0.1); }

.field-icon { width: 18px; color: #94a3b8; }
.field-input { flex: 1; border: none; background: transparent; padding: 12px 0; outline: none; font-size: 0.9rem; }

.eye-btn { background: none; border: none; color: #94a3b8; cursor: pointer; }
.eye-btn svg { width: 18px; }

.forgot-link-btn {
  background: none;
  border: none;
  color: #39a900;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  float: right;
}
.forgot-link-btn:hover { text-decoration: underline; }

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #39a900;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 25px;
  transition: all 0.3s;
}
.submit-btn:hover:not(:disabled) { background: #2e8b00; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(57, 169, 0, 0.3); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.back-link-btn {
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 20px;
  cursor: pointer;
}
.back-link-btn:hover { color: #334155; text-decoration: underline; }

.error-alert { background: #fef2f2; color: #dc2626; padding: 12px; border-radius: 8px; font-size: 0.8rem; margin-top: 15px; border: 1px solid #fecaca; }
.success-alert { background: #f0fdf4; color: #166534; padding: 12px; border-radius: 8px; font-size: 0.8rem; margin-top: 15px; border: 1px solid #bbf7d0; }

.spin-ring { width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.right-panel { flex: 1; position: relative; }
.sena-bg { width: 100%; height: 100%; object-fit: cover; }
.right-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.2)); display: flex; flex-direction: column; justify-content: flex-end; padding: 60px; }
.right-badge { background: rgba(57, 169, 0, 0.2); border: 1px solid #39a900; color: #86efac; padding: 5px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; width: fit-content; margin-bottom: 15px; }
.right-title { color: white; font-size: 2.2rem; font-weight: 800; margin-bottom: 10px; }
.right-sub { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; }

@media (max-width: 900px) {
  .right-panel { display: none; }
  .left-panel { width: 100%; }
}
</style>
