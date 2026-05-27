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
 * POST /api/users/reassign-instructor
 */
const reassignInstructor = async (req, res) => {
  try {
    const { oldInstructorId, newInstructorId, motivo } = req.body;
    if (!oldInstructorId || !newInstructorId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de los instructores saliente y entrante son obligatorios.'
      });
    }

    const result = await service.reassignInstructor(oldInstructorId, newInstructorId, motivo);
    
    try {
      await registrarAuditoria({
        usuarioId: req.user._id,
        accion: 'REASSIGN_INSTRUCTOR',
        detalles: `Reasignados ${result.count} aprendices del instructor ${oldInstructorId} al instructor ${newInstructorId}.`
      });
    } catch (auditError) {
      console.error('Error registrando auditoría de reasignación:', auditError.message);
    }

    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getMyLogs = async (req, res) => {
  try {
    const data = await service.getMyLogs(req.user._id);
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

module.exports = {
  getAll,
  getById,
  actualizar,
  toggleStatus,
  getFichasSummary,
  reassignInstructor,
  getMyLogs,
};