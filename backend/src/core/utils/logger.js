const AuditLog = require('../../modules/bitacoras-dev3/models/audit-log.model');

/**
 * Registra una acción en la bitácora de auditoría
 * @param {Object} data - Datos del log
 * @param {String} data.user - ID del usuario (opcional)
 * @param {String} data.action - Tipo de acción
 * @param {String} data.module - Módulo afectado
 * @param {Object} data.details - Información adicional
 * @param {String} data.ipAddress - Dirección IP
 * @param {String} data.userAgent - Navegador/Dispositivo
 */
const logAction = async ({ user, action, module, details, ipAddress, userAgent }) => {
  try {
    const log = new AuditLog({
      user,
      action,
      module,
      details,
      ipAddress,
      userAgent
    });
    await log.save();
  } catch (error) {
    console.error('❌ Error al guardar log de auditoría:', error.message);
  }
};

module.exports = { logAction };
