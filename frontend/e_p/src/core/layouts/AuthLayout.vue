<template>
  <!-- AuthLayout.vue 🤝 ZONA COMPARTIDA -->
  <!-- Plantilla centrada para Login y pantallas de autenticación -->
  <div class="auth-layout">
    <slot />
  </div>
</template>

<script setup>
// AuthLayout.vue — Plantilla para Login y pantallas de acceso
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-sena-green-light), var(--color-gray-100));
}
</style>
