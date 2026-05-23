// users.controller.js   🟢 DEV 1 | Instructores y Aprendices
// =============================================
// Controladores para la gestión de usuarios.
// =============================================

const service = require('./users.service');
const { registrarAuditoria } = require('../../core/utils/audit');

/**
 * GET /api/users
 */
const getAll = async (req, res) => {
  try {
    const filtros = {
      role: req.query.role,
      busqueda: req.query.search || req.query.busqueda,
      status: req.query.status,
      programa: req.query.programa,
    };

    const data = await service.getAll(filtros);
    res.json({
      success: true,
      users: data,
      pagination: {
        total: data.length,
        page: 1,
        limit: 10,
        totalPages: Math.ceil(data.length / 10) || 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/users/:id
 */
const getById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/users/:id
 */
const actualizar = async (req, res) => {
  try {
    const data = await service.actualizar(req.params.id, req.body);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    const status = error.message.includes('no encontrado') ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PATCH /api/users/:id/toggle-status
 * Activa o desactiva un usuario (soft toggle, nunca elimina).
 */
const toggleStatus = async (req, res) => {
  try {
    const data = await service.toggleStatus(req.params.id);
    res.json({
      success: true,
      message: `Usuario ${data.activo ? 'activado' : 'desactivado'} correctamente.`,
      data,
    });
  } catch (error) {
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/users/fichas/stats
 */
const getFichasSummary = async (req, res) => {
  try {
    const data = await service.getFichasSummary();
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
 * POST /api/users/:id/reassign
 */
const reassignApprentices = async (req, res) => {
  try {
    const outgoingId = req.params.id;
    const { newInstructorId } = req.body;

    if (!newInstructorId) {
      return res.status(400).json({
        success: false,
        message: 'El nuevo instructor es requerido para la migración.'
      });
    }

    const result = await service.reassignApprentices(outgoingId, newInstructorId);

    // Registrar en auditoría
    await registrarAuditoria({
      action: 'REASSIGN_INSTRUCTOR',
      userId: req.user._id,
      details: `Reasignados aprendices y fichas del instructor ${outgoingId} al nuevo instructor ${newInstructorId}. Totales: Aprendices: ${result.apprenticesReassigned}, Fichas: ${result.batchesReassigned}, Trackings: ${result.trackingsReassigned}`
    });

    res.json({
      success: true,
      message: 'Migración y reasignación de instructor completada con éxito.',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/users/import
 */
const importExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ningún archivo Excel.'
      });
    }

    const data = await service.importExcel(req.file.buffer);

    // Registrar en auditoría
    await registrarAuditoria({
      action: 'IMPORT_USERS',
      userId: req.user._id,
      details: `Importados aprendices masivamente. Creados: ${data.creados}, Errores/Ignorados: ${data.errores.length}`
    });

    res.json({
      success: true,
      message: 'Proceso de importación masiva finalizado.',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/users/me/logs
 */
const getMyLogs = async (req, res) => {
  try {
    const logs = await service.getMyLogs(req.user._id);
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  actualizar,
  toggleStatus,
  getFichasSummary,
  reassignApprentices,
  importExcel,
  getMyLogs,
};