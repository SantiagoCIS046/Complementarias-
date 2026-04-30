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
      busqueda: req.query.busqueda,
      status: req.query.status,
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
 * DELETE /api/users/:id
 */
const eliminar = async (req, res) => {
  try {
    const data = await service.desactivar(req.params.id);
    res.json({
      success: true,
      message: 'Usuario eliminado permanentemente del sistema.',
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

module.exports = {
  getAll,
  getById,
  actualizar,
  eliminar,
};