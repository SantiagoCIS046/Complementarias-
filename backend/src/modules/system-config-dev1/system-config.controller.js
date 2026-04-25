// system-config.controller.js   🟢 DEV 1 | Configuracion global
// =============================================
// Controladores para configuración del sistema.
// =============================================

const service = require('./system-config.service');

/**
 * GET /api/system-config
 */
const getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/system-config
 */
const upsert = async (req, res) => {
  try {
    const data = await service.upsert(req.body);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/system-config/:clave
 */
const eliminar = async (req, res) => {
  try {
    const data = await service.eliminar(req.params.clave);
    res.json({
      success: true,
      message: 'Configuración desactivada exitosamente.',
      data,
    });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAll,
  upsert,
  eliminar,
};