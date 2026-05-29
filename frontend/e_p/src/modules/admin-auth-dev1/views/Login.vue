<template>
  <div class="login-page">

    <!-- ═══ PANEL IZQUIERDO — FORMULARIO ═══ -->
    <div class="left-panel">

      <!-- LOGO -->
      <div class="brand">
        <img src="/logoSena.png" alt="SENA" class="brand-logo" />
        <div>
          <h2 class="brand-name">RepFora</h2>
          <p class="brand-tagline">ETAPAS PRODUCTIVAS</p>
        </div>
      </div>

      <!-- CARD GLASS -->
      <div class="glass-card">

        <!-- 🟦 VISTA 1: LOGIN -->
        <div v-if="!showRecovery" class="card-container">
          <!-- CABECERA VERDE ESTILO REPFORA -->
          <div class="card-header-green">
            <h5 class="header-title">INICIAR SESIÓN</h5>
          </div>
          
          <div class="card-body">
            <p class="card-sub text-center q-mb-lg">Ingresa tus credenciales para acceder al sistema</p>

            <!-- Email -->
            <div class="field">
              <label class="field-label" for="login-email">Correo electrónico institucional</label>
              <div class="input-box-repfora">
                <span class="material-symbols-outlined icon-prepend">mail</span>
                <input
                  id="login-email"
                  v-model="form.email"
                  type="email"
                  name="email"
                  autocomplete="username"
                  placeholder="usuario@sena.edu.co"
                  class="field-input-native"
                />
              </div>
            </div>

            <!-- Contraseña -->
            <div class="field">
              <label class="field-label" for="login-password">Contraseña</label>
              <div class="input-box-repfora">
                <span class="material-symbols-outlined icon-prepend">lock</span>
                <input
                  id="login-password"
                  v-model="form.password"
                  :type="showPass ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="field-input-native"
                  @keydown.enter="handleLogin"
                />
                <button type="button" class="eye-btn" @click="showPass = !showPass">
                  <span class="material-symbols-outlined">{{ showPass ? 'visibility' : 'visibility_off' }}</span>
                </button>
              </div>
              <button class="forgot-link-btn" @click="showRecovery = true">¿Olvidaste tu contraseña?</button>
            </div>

            <!-- Botón Ingresar -->
            <button class="submit-btn-repfora" :disabled="loading" @click="handleLogin">
              <span v-if="loading" class="spin-ring"></span>
              <span>{{ loading ? 'VERIFICANDO...' : 'INGRESAR AL SISTEMA' }}</span>
            </button>
          </div>
        </div>

        <!-- 🟩 VISTA 2: RECUPERACIÓN -->
        <div v-else class="card-container">
          <div class="card-header-green">
            <h5 class="header-title">RECUPERAR ACCESO</h5>
          </div>

          <div class="card-body">
            <p class="card-sub text-center q-mb-lg">Enviaremos un enlace a tu correo para restablecer tu contraseña.</p>

            <div class="field">
              <label class="field-label">Tu correo registrado</label>
              <div class="input-box-repfora">
                <span class="material-symbols-outlined icon-prepend">mail</span>
                <input
                  v-model="recoveryEmail"
                  type="email"
                  placeholder="ejemplo@sena.edu.co"
                  class="field-input-native"
                />
              </div>
            </div>

            <button class="submit-btn-repfora recovery" :disabled="loading" @click="handleRecovery">
              <span v-if="loading" class="spin-ring"></span>
              <span>{{ loading ? 'ENVIANDO...' : 'ENVIAR ENLACE' }}</span>
            </button>

            <button class="back-link-btn" @click="showRecovery = false">Volver al inicio de sesión</button>
          </div>
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
      <img src="@/assets/loginbg.png" alt="SENA" class="sena-bg" />
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
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../../core/store/auth.store'
import { useUiStore } from '../../../core/store/ui.store'
import { authService } from '../services/auth.service'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const uiStore   = useUiStore()

const form          = ref({ email: '', password: '' })
const recoveryEmail = ref('')
const showPass      = ref(false)
const showRecovery  = ref(false)
const loading       = ref(false)
const errorMsg      = ref('')
const successMsg    = ref('')


async function handleLogin() {
  errorMsg.value   = ''
  successMsg.value = ''
  loading.value    = true
  uiStore.startLoading(3000)

  try {
    const res = await authService.login(form.value)

    // 1. Persistir sesión en el store (Pinia + localStorage)
    authStore.login(res.data.data)

    successMsg.value = '¡Acceso concedido! Entrando...'

    // 2. Redirigir: si es primer ingreso, mandar a /primer-ingreso mandatorio;
    //    de lo contrario a la ruta protegida o dashboard.
    const isFirst = res.data.data?.usuario?.isFirstLogin || res.data.data?.user?.isFirstLogin
    const redirectTo = isFirst ? '/primer-ingreso' : (route.query.redirect || '/')
    setTimeout(() => router.push(redirectTo), 150)

  } catch (err) {
    uiStore.stopLoading()
    errorMsg.value = err.response?.data?.message || 'Credenciales incorrectas. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}

async function handleRecovery() {
  if (!recoveryEmail.value) {
    errorMsg.value = 'Ingresa tu correo electrónico'
    return
  }
  errorMsg.value   = ''
  successMsg.value = ''
  loading.value    = true
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
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

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
.brand-name { 
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
  font-size: 1.8rem; 
  font-weight: 800; 
  color: #1e293b; 
  margin: 0; 
}
.brand-tagline { font-size: 0.65rem; color: #64748b; letter-spacing: 2px; margin: 0; }

.glass-card {
  background: white;
  padding: 0;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header-green {
  background-color: var(--color_card);
  padding: 15px 20px;
  text-align: center;
}
.header-title {
  color: white;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.card-body {
  padding: 30px;
}

.card-head { margin-bottom: 30px; }
.card-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.card-sub { font-size: 0.85rem; color: #64748b; line-height: 1.5; }

.field { margin-bottom: 20px; }
.field-label { display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 4px; }

.input-box-repfora {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  transition: all 0.2s;
}
.input-box-repfora:focus-within { 
  border-color: var(--color_input); 
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1); 
}

.icon-prepend { 
  font-size: 20px; 
  color: var(--color_input); 
}
.field-input-native { 
  flex: 1; 
  border: none; 
  background: transparent; 
  padding: 10px 0; 
  outline: none; 
  font-size: 0.9rem; 
  color: #374151;
}

.eye-btn { background: none; border: none; color: #94a3b8; cursor: pointer; display: flex; align-items: center; }
.eye-btn span { font-size: 20px; }

.forgot-link-btn {
  background: none;
  border: none;
  color: var(--color_button);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  float: right;
}
.forgot-link-btn:hover { text-decoration: underline; }

.submit-btn-repfora {
  width: 100%;
  padding: 12px;
  background-color: var(--color_button);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  transition: all 0.2s;
  text-transform: uppercase;
}
.submit-btn-repfora:hover:not(:disabled) { 
  background-color: #1b5e20; 
}
.submit-btn-repfora:disabled { opacity: 0.6; cursor: not-allowed; }

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

.spin-ring { width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.right-panel { flex: 1; position: relative; }

.error-alert { background: #fef2f2; color: #dc2626; padding: 12px; border-radius: 8px; font-size: 0.8rem; margin-top: 15px; border: 1px solid #fecaca; }
.success-alert { background: #f0fdf4; color: #166534; padding: 12px; border-radius: 8px; font-size: 0.8rem; margin-top: 15px; border: 1px solid #bbf7d0; }
.sena-bg { width: 100%; height: 100%; object-fit: cover; }
.right-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.2)); display: flex; flex-direction: column; justify-content: flex-end; padding: 60px; }
.right-badge { background: rgba(46, 125, 50, 0.2); border: 1px solid var(--color_button); color: #86efac; padding: 5px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; width: fit-content; margin-bottom: 15px; }
.right-title { color: white; font-size: 2.2rem; font-weight: 800; margin-bottom: 10px; }
.right-sub { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; }

@media (max-width: 900px) {
  .right-panel { display: none; }
  .left-panel { width: 100%; }
}


</style>
