<!-- BaseButton.vue — Botón reutilizable 🤝 COMPONENTES UI -->
<template>
  <button
    :class="['btn', `btn--${variant}`, { 'btn--loading': loading }]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="btn__spinner" />
    <slot />
  </button>
</template>

<script setup>
// BaseButton.vue | Props: variant, loading, disabled
defineProps({
  variant:  { type: String, default: 'primary' }, // primary | secondary | danger | ghost
  loading:  { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .5rem 1.25rem;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: opacity .2s, transform .1s;
}
.btn:active  { transform: scale(.97); }
.btn:disabled { opacity: .5; cursor: not-allowed; }

.btn--primary   { background: var(--color-sena-green); color: #fff; }
.btn--secondary { background: var(--color-gray-200);  color: var(--color-gray-800); }
.btn--danger    { background: var(--color-error);      color: #fff; }
.btn--ghost     { background: transparent; border: 1px solid var(--color-gray-200); }

.btn__spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
