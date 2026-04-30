import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isLoading = ref(false)

  function startLoading(duration = 2000) {
    isLoading.value = true
    setTimeout(() => {
      isLoading.value = false
    }, duration)
  }

  function showLoader() { isLoading.value = true }
  function hideLoader() { isLoading.value = false }

  return { isLoading, startLoading, showLoader, hideLoader }
})
