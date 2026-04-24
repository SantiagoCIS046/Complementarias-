// audit.js 🟢 DEV 1 | Seguimiento Detallado de Usuarios
const AuditLog = require('../../modules/system-config-dev1/AuditLog.model');

/**
 * Registra una acción en el log de auditoría y en la consola
 */
const registrarAuditoria = async (data) => {
  try {
    const log = new AuditLog({
      usuario:   data.usuarioId,
      accion:    data.accion,
      entidad:   data.entidad,
      entidadId: data.entidadId,
      detalle:   data.detalle,
      ip:        data.ip
    });
    
    await log.save();

    // 🚀 LOG EN CONSOLA (DISEÑO PROFESIONAL)
    console.log('\n' + '='.repeat(50));
    console.log(`📡 SEGUIMIENTO DE SISTEMA - [${new Date().toLocaleString()}]`);
    console.log(`🔹 ACCIÓN:  ${data.accion}`);
    console.log(`👤 USUARIO ID: ${data.usuarioId || 'N/A'}`);
    console.log(`📝 DETALLE: ${data.detalle}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error registrando auditoría:', error);
  }
};

module.exports = { registrarAuditoria };
