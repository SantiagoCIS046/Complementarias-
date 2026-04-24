// users.controller.js 🟢 DEV 1 | Control de Usuarios
const service = require('./users.service');
const { registrarAuditoria } = require('../../core/utils/audit');

/**
 * Recibe el Excel y lo procesa
 */
const importUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Por favor sube un archivo Excel (.xlsx)' });
    }

    const results = await service.importarDesdeExcel(req.file.buffer);

    await registrarAuditoria({
      usuarioId: req.user.id,
      accion: 'IMPORT_USERS_EXCEL',
      detalle: `Importación masiva: ${results.creados} creados, ${results.errores.length} errores.`,
      ip: req.ip
    });

    res.json({
      message: 'Proceso de importación finalizado',
      data: results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { importUsers };