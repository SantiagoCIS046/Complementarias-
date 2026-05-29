// useProfilePhoto.js — Composable para subida y optimización de foto de perfil
// Procesamiento 100% en cliente: Canvas crop cuadrado → 400×400 → WebP 0.85 → Base64
import { ref } from 'vue'
import http from '../api/http'
import { useAuthStore } from '../store/auth.store'

/** Formatos de imagen aceptados */
export const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/** Tamaño del avatar optimizado en píxeles */
const AVATAR_SIZE = 400

/** Calidad WebP (0.85 = excelente balance calidad/tamaño) */
const WEBP_QUALITY = 0.85

/**
 * Carga un File/Blob como HTMLImageElement de forma asíncrona.
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo cargar la imagen seleccionada.'))
    }
    img.src = url
  })
}

/**
 * Recorta la imagen a un cuadrado centrado y la redimensiona a AVATAR_SIZE×AVATAR_SIZE.
 * Convierte el resultado a WebP con calidad WEBP_QUALITY y retorna un data URI Base64.
 * @param {HTMLImageElement} img
 * @returns {string} data URI base64 (data:image/webp;base64,...)
 */
function processImageToBase64(img) {
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE

  const ctx = canvas.getContext('2d')

  // Crop cuadrado centrado
  const { naturalWidth: sw, naturalHeight: sh } = img
  const side = Math.min(sw, sh)
  const sx = (sw - side) / 2
  const sy = (sh - side) / 2

  // Fondo negro para transparencias (PNG con transparencia)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)

  // Dibujar recortado y escalado
  ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)

  // Exportar como WebP
  return canvas.toDataURL('image/webp', WEBP_QUALITY)
}

/**
 * Composable principal de foto de perfil.
 */
export function useProfilePhoto() {
  const authStore = useAuthStore()

  /** Base64 del preview de la imagen procesada (antes de confirmar) */
  const preview = ref(null)
  /** Estado de procesamiento local (Canvas) */
  const isProcessing = ref(false)
  /** Estado de subida al servidor */
  const isUploading = ref(false)
  /** Mensaje de error */
  const error = ref(null)

  /**
   * Procesa el archivo seleccionado por el usuario y genera un preview.
   * No sube nada al servidor todavía.
   * @param {File} file
   */
  async function processFile(file) {
    error.value = null
    preview.value = null

    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      error.value = 'Formato no soportado. Usa JPG, PNG o WEBP.'
      return
    }

    try {
      isProcessing.value = true
      const img = await loadImage(file)
      const base64 = processImageToBase64(img)
      preview.value = base64
    } catch (err) {
      error.value = err.message || 'Error al procesar la imagen.'
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Sube la imagen procesada (preview) al servidor y actualiza el store global.
   * @returns {Promise<boolean>} true si fue exitoso
   */
  async function uploadPhoto() {
    if (!preview.value) {
      error.value = 'No hay imagen para subir.'
      return false
    }

    try {
      isUploading.value = true
      error.value = null

      const userId = authStore.user?._id
      if (!userId) throw new Error('No se encontró el usuario en sesión.')

      const response = await http.put(`/users/${userId}/foto-perfil`, {
        base64: preview.value
      })

      if (response.data.success) {
        // Actualizar el store global → Header, Sidebar y ProfileView se actualizan reactivamente
        authStore.updateUser({ fotoPerfil: preview.value })
        return true
      }

      throw new Error(response.data.message || 'Error desconocido del servidor.')
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error al guardar la foto.'
      return false
    } finally {
      isUploading.value = false
    }
  }

  /**
   * Limpia el preview actual (cancelar operación).
   */
  function clearPreview() {
    preview.value = null
    error.value = null
  }

  return {
    preview,
    isProcessing,
    isUploading,
    error,
    processFile,
    uploadPhoto,
    clearPreview,
  }
}
