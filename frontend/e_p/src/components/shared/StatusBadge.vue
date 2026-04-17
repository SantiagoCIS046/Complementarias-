<!-- StatusBadge.vue — Badge de estado 🤝 COMPONENTES SHARED -->
<template>
  <span :class="['badge', `badge--${status.toLowerCase()}']">
    {{ label }}
  </span>
</template>

<script setup>
// StatusBadge.vue | Muestra POR_INICIAR | EN_CURSO | TERMINADA | CANCELADA
defineProps({
  status: { type: String, required: true },
  label:  { type: String, default: '' },
})
</script>

<style scoped>
.badge {
  display: inline-block;
  padding: .2rem .7rem;
  border-radius: 999px;
  font-size: .78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.badge--por_iniciar { background: #e0f2fe; color: #0369a1; }
.badge--en_curso    { background: #dcfce7; color: #15803d; }
.badge--terminada   { background: #f0fdf4; color: #166534; }
.badge--cancelada   { background: #fee2e2; color: #b91c1c; }
.badge--pendiente   { background: #fef9c3; color: #92400e; }
.badge--aprobado    { background: #dcfce7; color: #15803d; }
.badge--rechazado   { background: #fee2e2; color: #b91c1c; }
</style>
