<!-- BaseInput.vue — Input reutilizable 🤝 COMPONENTES UI -->
<template>
  <div class="input-wrapper">
    <label v-if="label" :for="id" class="input-label">{{ label }}</label>
    <input
      :id="id"
      class="input-field"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <span v-if="error" class="input-error">{{ error }}</span>
  </div>
</template>

<script setup>
// BaseInput.vue | Soporta v-model, label, error y tipos HTML
defineProps({
  id:          { type: String, required: true },
  label:       { type: String, default: '' },
  type:        { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  modelValue:  { type: String, default: '' },
  error:       { type: String, default: '' },
  disabled:    { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.input-wrapper { display: flex; flex-direction: column; gap: .3rem; }
.input-label   { font-size: .875rem; font-weight: 600; color: var(--color-gray-600); }
.input-field {
  padding: .55rem .75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: .95rem;
  transition: border-color .2s;
  outline: none;
}
.input-field:focus { border-color: var(--color-sena-green); }
.input-error { font-size: .78rem; color: var(--color-error); }
</style>
