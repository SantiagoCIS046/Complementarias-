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
              autocomplete="email"
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
              autocomplete="current-password"
            />
            <button type="button" class="eye-btn" @click="showPass = !showPass" :aria-label="showPass ? 'Ocultar' : 'Mostrar'">
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
          <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
        </div>

        <!-- Intentos -->
        <transition name="fade">
          <div v-if="attempts > 0 && !locked" class="attempts-bar">
            <div class="attempts-dots">
              <span v-for="i in 5" :key="i" class="dot" :class="{ filled: i <= attempts }"></span>
            </div>
            <span class="attempts-text"><strong>{{ attempts }}/5</strong> intentos utilizados</span>
          </div>
        </transition>

        <!-- Error Message -->
        <transition name="fade">
          <div v-if="errorMsg" class="error-alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ errorMsg }}
          </div>
        </transition>

        <!-- Bloqueado -->
        <transition name="fade">
          <div v-if="locked" class="locked-alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Cuenta bloqueada. Contacta a tu instructor.
          </div>
        </transition>

        <!-- Botón -->
        <button
          id="login-submit"
          class="submit-btn"
          :disabled="locked || loading"
          @click="handleLogin"
        >
          <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          <span v-if="loading" class="spin-ring"></span>
          <span>{{ loading ? 'Verificando...' : 'Ingresar al Sistema' }}</span>
        </button>

        <p class="contact-line">
          ¿Sin acceso? <a href="#" class="contact-link">Contacta a tu instructor</a>
        </p>

      </div><!-- /glass-card -->

    </div><!-- /left-panel -->

    <!-- ═══ PANEL DERECHO — IMAGEN SENA ═══ -->
    <div class="right-panel">
      <img src="/sena_institution.png" alt="Centro SENA" class="sena-bg" />
      <div class="right-overlay">
        <div class="right-badge">SENA Colombia</div>
        <h2 class="right-title">Centro de Formación<br/>Profesional</h2>
        <p class="right-sub">Formando el talento humano<br/>que Colombia necesita</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../core/store/auth.store'
import { authService } from '../services/auth.service'
import AuthLayout from '../../../core/layouts/AuthLayout.vue'

const router    = useRouter()
const authStore = useAuthStore()

const form      = ref({ email: '', password: '' })
const showPass  = ref(false)
const loading   = ref(false)
const attempts  = ref(0)
const locked    = ref(false)
const errorMsg  = ref('')

async function handleLogin() {
  if (locked.value || loading.value) return
  
  errorMsg.value = ''
  loading.value = true

  try {
    const response = await authService.login(form.value)
    
    // Guardar en el store
    authStore.login(response.data)
    
    // Redirigir al dashboard
    router.push('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    attempts.value = Math.min(attempts.value + 1, 5)
    if (attempts.value >= 5) {
      locked.value = true
    } else {
      errorMsg.value = error.response?.data?.message || 'Error al iniciar sesión'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* ══════════════════════════════════════════
   PÁGINA
══════════════════════════════════════════ */
.login-page {
  font-family: 'Inter', sans-serif;
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* ══════════════════════════════════════════
   PANEL IZQUIERDO
══════════════════════════════════════════ */
.left-panel {
  width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  background: #f3f4f6; /* Gris muy claro y profesional */
  position: relative;
  z-index: 2;
  box-shadow: 4px 0 32px rgba(0,0,0,0.08);
  overflow: hidden;
}

/* ══════════════════════════════════════════
   BRAND
══════════════════════════════════════════ */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  align-self: flex-start;
}
.brand-logo {
  width: 65px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.08));
}
.brand-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #14532d;
  margin: 0;
  letter-spacing: -0.5px;
  line-height: 1;
}
.brand-tagline {
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 2px;
  color: #9ca3af;
  margin: 3px 0 0;
}

/* ══════════════════════════════════════════
   GLASS CARD
══════════════════════════════════════════ */
.glass-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 32px 28px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.card-head { margin-bottom: 24px; }

.card-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 4px;
}
.card-sub {
  font-size: 0.78rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* ══════════════════════════════════════════
   CAMPOS
══════════════════════════════════════════ */
.field { margin-bottom: 16px; }

.field-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
  letter-spacing: 0.2px;
}

.field-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.forgot-link {
  display: block;
  font-size: 0.72rem;
  color: #16a34a;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  margin-top: 6px;
  text-align: right;
}
.forgot-link:hover { color: #15803d; text-decoration: underline; }

/* Input Box */
.input-box {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 12px;
  transition: all 0.2s ease;
  gap: 10px;
}

.input-box:focus-within {
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.field-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  flex-shrink: 0;
  transition: color 0.2s;
}
.input-box:focus-within .field-icon { color: #16a34a; }

.field-input {
  flex: 1;
  background: transparent !important;
  border: none;
  outline: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: #1f2937;
  padding: 11px 0;
}

/* 🎯 Fix para el color azul de autofill del navegador */
.field-input:-webkit-autofill,
.field-input:-webkit-autofill:hover, 
.field-input:-webkit-autofill:focus {
  -webkit-text-fill-color: #1f2937;
  -webkit-box-shadow: 0 0 0px 1000px #ffffff inset;
  transition: background-color 5000s ease-in-out 0s;
}

.field-input::placeholder { color: #9ca3af; font-size: 0.82rem; }

.eye-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  color: #9ca3af;
  transition: color 0.2s;
  flex-shrink: 0;
}
.eye-btn svg { width: 16px; height: 16px; }
.eye-btn:hover { color: #374151; }

/* ══════════════════════════════════════════
   INTENTOS
══════════════════════════════════════════ */
.attempts-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef9f0;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 14px;
}
.attempts-dots {
  display: flex;
  gap: 4px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e5e7eb;
  transition: background 0.3s;
}
.dot.filled { background: #f59e0b; }
.attempts-text {
  font-size: 0.76rem;
  color: #92400e;
}

.locked-alert, .error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.78rem;
  color: #dc2626;
  margin-bottom: 14px;
  font-weight: 500;
}
.locked-alert svg, .error-alert svg { width: 16px; height: 16px; flex-shrink: 0; }

/* ══════════════════════════════════════════
   BOTÓN
══════════════════════════════════════════ */
.submit-btn {
  width: 100%;
  padding: 12px 20px;
  background: #39a900; /* Verde SENA */
  border: none;
  border-radius: 8px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 12px 0 18px;
  transition: all 0.2s ease;
  letter-spacing: 0.2px;
}
.submit-btn svg { width: 17px; height: 17px; }
.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(22,163,74,0.38);
}
.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.spin-ring {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════
   CONTACTO / FOOTER
══════════════════════════════════════════ */
.contact-line {
  text-align: center;
  font-size: 0.78rem;
  color: #9ca3af;
  margin: 0;
}
.contact-link {
  color: #16a34a;
  font-weight: 600;
  text-decoration: none;
}
.contact-link:hover { text-decoration: underline; }

/* ══════════════════════════════════════════
   PANEL DERECHO
══════════════════════════════════════════ */
.right-panel {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.sena-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.right-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(5, 46, 22, 0.82) 0%,
    rgba(5, 46, 22, 0.3) 45%,
    transparent 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 48px 44px;
}

.right-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(22,163,74,0.2);
  border: 1px solid rgba(22,163,74,0.5);
  color: #86efac;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: 20px;
  width: fit-content;
  margin-bottom: 14px;
}

.right-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  margin: 0 0 10px;
  text-shadow: 0 2px 16px rgba(0,0,0,0.3);
}

.right-sub {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.6);
  margin: 0;
  line-height: 1.6;
}

/* ══════════════════════════════════════════
   TRANSICIONES
══════════════════════════════════════════ */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* ══════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════ */
@media (max-width: 768px) {
  .right-panel { display: none; }
  .left-panel { width: 100%; box-shadow: none; }
}
</style>
