import { useAlertStore } from '../store/alert.store';

export function useAlert() {
  const alertStore = useAlertStore();

  /**
   * Dispara una alerta genérica con el tipo especificado.
   */
  function showAlert(type, title, message, options = {}) {
    return alertStore.showAlert({
      type,
      title,
      message,
      ...options
    });
  }

  /**
   * Dispara un diálogo de confirmación con soporte para callback de confirmación y opciones adicionales.
   */
  function showConfirm(title, message, onConfirm = null, options = {}) {
    return alertStore.showConfirm({
      title,
      message,
      onConfirm,
      ...options
    });
  }

  /**
   * Alerta de Éxito.
   */
  function showSuccess(title, message, options = {}) {
    return showAlert('success', title, message, options);
  }

  /**
   * Alerta de Error.
   */
  function showError(title, message, options = {}) {
    return showAlert('error', title, message, options);
  }

  /**
   * Alerta de Advertencia.
   */
  function showWarning(title, message, options = {}) {
    return showAlert('warning', title, message, options);
  }

  /**
   * Alerta de Información.
   */
  function showInfo(title, message, options = {}) {
    return showAlert('info', title, message, options);
  }

  return {
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
