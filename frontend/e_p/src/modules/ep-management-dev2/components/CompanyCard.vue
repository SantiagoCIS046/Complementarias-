<script setup>
import { 
  Building2, 
  Store, 
  Compass, 
  User, 
  Phone, 
  ArrowRight,
  Edit2,
  Trash2,
  Plus
} from 'lucide-vue-next';

const props = defineProps({
  company: { type: Object, required: false },
  isPlaceholder: { type: Boolean, default: false }
});

const getIcon = (type) => {
  if (type === 'factory') return Building2;
  if (type === 'retail') return Store;
  return Compass;
};
</script>

<template>
  <!-- Standard Company Card -->
  <div v-if="!isPlaceholder" class="company-card group">
    <!-- Top Actions -->
    <div class="actions-overlay opacity-0 group-hover:opacity-100 transition-opacity">
      <button class="action-btn-card hover:text-sena-green transition-colors">
        <Edit2 :size="16" />
      </button>
      <button class="action-btn-card hover:text-red-500 transition-colors">
        <Trash2 :size="16" />
      </button>
    </div>

    <!-- Company Icon -->
    <div class="company-icon-wrapper group-hover:scale-110 transition-transform duration-300">
      <component :is="getIcon(company.type)" class="company-icon" :size="32" />
      <!-- Subtle Decorative Shape -->
      <div class="deco-shape"></div>
    </div>

    <!-- Company Info -->
    <div class="space-y-2 mb-8">
      <h3 class="company-name tracking-tight">{{ company.name }}</h3>
      <p class="company-nit tracking-wide uppercase">NIT: {{ company.nit }}</p>
    </div>

    <!-- Contact Details -->
    <div class="space-y-4 mb-10">
      <div class="flex items-center gap-3 text-secondary">
        <div class="icon-avatar">
          <User :size="16" />
        </div>
        <span class="text-sm font-bold">{{ company.contact }}</span>
      </div>
      <div class="flex items-center gap-3 text-secondary">
        <div class="icon-avatar">
          <Phone :size="16" />
        </div>
        <span class="text-sm font-bold">{{ company.phone }}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="card-footer pt-6 border-t border-gray-50">
      <div class="badge-assigned">
        <div class="pulse-dot"></div>
        <span class="text-xs font-extrabold">{{ company.apprentices }} Aprendices Asignados</span>
      </div>
      <button class="btn-details group/btn">
        Detalles
        <ArrowRight :size="16" class="group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>

  <!-- Placeholder Card -->
  <div v-else class="placeholder-card group">
    <div class="placeholder-icon-wrapper group-hover:scale-110 transition-transform">
      <div class="relative">
        <Building2 class="text-muted" :size="40" />
        <Plus class="plus-icon" :size="20" stroke-width="3" />
      </div>
    </div>
    <div class="space-y-2 mb-10">
      <h3 class="placeholder-title">Registrar Nueva Empresa</h3>
      <p class="placeholder-desc">Amplíe la red de aliados institucionales.</p>
    </div>
    <button class="btn-placeholder active:scale-95">
      Empezar Registro
    </button>
  </div>
</template>

<style scoped>
.company-card {
  background: var(--bg-primary);
  border-radius: 2.5rem;
  padding: 2.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-primary);
  position: relative;
  transition: all 0.3s ease;
}
.company-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
.actions-overlay {
  position: absolute;
  top: 2rem;
  right: 2.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.action-btn-card {
  padding: 0.5rem;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
}
.company-icon-wrapper {
  width: 4rem;
  height: 4rem;
  background: var(--bg-secondary);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2.5rem;
  position: relative;
}
.company-icon {
  color: var(--color_button);
}
.deco-shape {
  position: absolute;
  top: -1rem;
  right: -1rem;
  width: 3rem;
  height: 3rem;
  background: rgba(46, 125, 50, 0.05);
  border-radius: 50%;
  z-index: -1;
  filter: blur(16px);
}
.company-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
}
.company-nit {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
}
.text-secondary {
  color: var(--text-secondary);
}
.icon-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color_button);
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1.5rem;
  border-t: 1px solid var(--border-primary);
}
.badge-assigned {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-active);
  color: var(--color_button);
  border-radius: 9999px;
}
.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color_button);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(46, 125, 50, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
}
.btn-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}
.btn-details:hover {
  color: var(--color_button);
}

/* Placeholder Card */
.placeholder-card {
  border: 4px dashed var(--border-primary);
  border-radius: 2.5rem;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: transparent;
  transition: all 0.3s ease;
  cursor: pointer;
}
.placeholder-card:hover {
  background: var(--bg-hover);
  border-color: var(--color_button);
}
.placeholder-icon-wrapper {
  width: 5rem;
  height: 5rem;
  background: var(--bg-primary);
  border-radius: 1.5rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}
.text-muted {
  color: var(--text-muted);
}
.plus-icon {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  color: var(--color_button);
}
.placeholder-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
}
.placeholder-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}
.btn-placeholder {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  padding: 1rem 2.5rem;
  border-radius: 1rem;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}
.placeholder-card:hover .btn-placeholder {
  background: var(--color_button);
  color: var(--color_text_button);
  border-color: var(--color_button);
  box-shadow: 0 8px 16px rgba(26, 77, 46, 0.15);
}
</style>
