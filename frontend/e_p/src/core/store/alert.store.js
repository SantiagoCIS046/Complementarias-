import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAlertStore = defineStore('alert', () => {
  // State
  const isOpen = ref(false);
  const type = ref('info'); // 'success' | 'error' | 'warning' | 'info' | 'confirm'
  const title = ref('');
  const message = ref('');
  const okText = ref('Aceptar');
  const cancelText = ref('Cancelar');
  const isDanger = ref(false);
  const companyName = ref('');
  const isLoading = ref(false);
  const errorMsg = ref('');

  // Resolvers and Callbacks
  let onConfirmCallback = null;
  let resolvePromise = null;

  /**
   * Muestra una alerta simple (Éxito, Error, Warning, Info).
   */
  function showAlert({ type: alertType = 'info', title: alertTitle, message: alertMessage, okText: btnText = 'Aceptar' }) {
    isOpen.value = true;
    type.value = alertType;
    title.value = alertTitle;
    message.value = alertMessage;
    okText.value = btnText;
    cancelText.value = 'Cancelar';
    isDanger.value = false;
    companyName.value = '';
    isLoading.value = false;
    errorMsg.value = '';
    onConfirmCallback = null;

    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  }

  /**
   * Muestra un modal de confirmación con soporte asíncrono y visualización de errores.
   */
  function showConfirm({
    title: confirmTitle,
    message: confirmMessage,
    okText: confirmOk = 'Confirmar',
    cancelText: confirmCancel = 'Cancelar',
    isDanger: danger = false,
    companyName: comp = '',
    onConfirm = null
  }) {
    isOpen.value = true;
    type.value = 'confirm';
    title.value = confirmTitle;
    message.value = confirmMessage;
    okText.value = confirmOk;
    cancelText.value = confirmCancel;
    isDanger.value = danger;
    companyName.value = comp;
    isLoading.value = false;
    errorMsg.value = '';
    onConfirmCallback = onConfirm;

    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  }

  /**
   * Acción para confirmar. Ejecuta el callback asíncrono si está definido,
   * gestiona el estado de carga y muestra los errores en caso de fallo.
   */
  async function confirm() {
    if (onConfirmCallback) {
      isLoading.value = true;
      errorMsg.value = '';
      try {
        await onConfirmCallback();
        isOpen.value = false;
        if (resolvePromise) resolvePromise(true);
      } catch (err) {
        console.error('Error al ejecutar onConfirmCallback:', err);
        // Extrae el mensaje de error del servidor si está disponible
        errorMsg.value = err.response?.data?.message || err.message || 'Ocurrió un error al procesar la acción.';
      } finally {
        isLoading.value = false;
      }
    } else {
      isOpen.value = false;
      if (resolvePromise) resolvePromise(true);
    }
  }

  /**
   * Cancelar la acción.
   */
  function cancel() {
    isOpen.value = false;
    if (resolvePromise) resolvePromise(false);
  }

  /**
   * Cerrar sin responder.
   */
  function close() {
    isOpen.value = false;
    if (resolvePromise) resolvePromise(false);
  }

  return {
    isOpen,
    type,
    title,
    message,
    okText,
    cancelText,
    isDanger,
    companyName,
    isLoading,
    errorMsg,
    showAlert,
    showConfirm,
    confirm,
    cancel,
    close
  };
});
