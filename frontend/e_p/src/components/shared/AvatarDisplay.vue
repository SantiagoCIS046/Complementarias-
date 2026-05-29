<script setup>
/**
 * AvatarDisplay.vue — Avatar circular reutilizable para REPFORA
 *
 * Props:
 *   user    {object}  — objeto usuario con { name, fotoPerfil }
 *   size    {string}  — 'xs' | 'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 *   editable {boolean} — muestra overlay de cámara al hover (default: false)
 *
 * Emits:
 *   click   — cuando el usuario hace clic sobre el avatar (solo si editable=true)
 */
import { computed } from 'vue'

const props = defineProps({
  user: {
    type: Object,
    default: () => ({})
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v)
  },
  editable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const hasFoto = computed(() => !!props.user?.fotoPerfil)

/** Devuelve las 2 iniciales del nombre del usuario */
const initials = computed(() => {
  const name = props.user?.name || ''
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
})

const sizeMap = {
  xs: { wh: '28px', font: '0.65rem', iconFont: '0.8rem' },
  sm: { wh: '36px', font: '0.75rem', iconFont: '1rem' },
  md: { wh: '42px', font: '0.9rem',  iconFont: '1.1rem' },
  lg: { wh: '80px', font: '1.6rem',  iconFont: '1.6rem' },
  xl: { wh: '110px', font: '2.2rem', iconFont: '2rem'   }
}

const sizeStyle = computed(() => {
  const s = sizeMap[props.size] || sizeMap.md
  return {
    width: s.wh,
    height: s.wh,
    fontSize: s.font,
    '--icon-font': s.iconFont
  }
})
</script>

<template>
  <div
    class="avatar-display"
    :class="[`avatar-${size}`, { 'avatar-editable': editable }]"
    :style="sizeStyle"
    @click="editable ? emit('click') : null"
    :title="editable ? 'Cambiar foto de perfil' : user?.name"
  >
    <!-- Foto de perfil -->
    <img
      v-if="hasFoto"
      :src="user.fotoPerfil"
      :alt="user?.name"
      class="avatar-img"
      draggable="false"
    />

    <!-- Iniciales (fallback) -->
    <span v-else class="avatar-initials">{{ initials }}</span>

    <!-- Overlay cámara (solo editable) -->
    <div v-if="editable" class="avatar-camera-overlay">
      <span class="material-symbols-outlined camera-icon">photo_camera</span>
    </div>
  </div>
</template>

<style scoped>
.avatar-display {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--color_button, #2e7d32) 0%, #1b5e20 100%);
  border: 2.5px solid rgba(255, 255, 255, 0.15);
  user-select: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-initials {
  color: #fff;
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1;
}

/* ── Camera overlay ── */
.avatar-camera-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: 50%;
}

.camera-icon {
  color: #fff;
  font-size: var(--icon-font, 1.4rem);
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
}

/* Show overlay on hover */
.avatar-editable {
  cursor: pointer;
}

.avatar-editable:hover {
  transform: scale(1.05);
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.45);
}

.avatar-editable:hover .avatar-camera-overlay {
  opacity: 1;
}

.avatar-editable:active {
  transform: scale(0.97);
}
</style>
