<template>
  <!-- AdminLayout.vue 🤝 ZONA COMPARTIDA -->
  <!-- Plantilla para vistas de Administrador / Instructor -->
  <div class="admin-layout">
    <aside class="sidebar">
      <slot name="sidebar" />
    </aside>
    <div class="main-area">
      <header class="topbar">
        <slot name="topbar" />
      </header>
      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
// AdminLayout.vue — Plantilla principal para roles ADMIN e INSTRUCTOR
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  background: var(--color-gray-50);
}
.sidebar {
  width: var(--sidebar-width);
  background: var(--color-white);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.topbar {
  height: var(--topbar-height);
  background: var(--color-white);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
}
.content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}
</style>
