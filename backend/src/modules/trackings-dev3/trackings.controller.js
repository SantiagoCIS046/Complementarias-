// trackings.controller.js   🟡 DEV 3 | Visitas de seguimiento
// =============================================
// Controladores para visitas de seguimiento.
// =============================================

const service = require('./trackings.service');

/**
 * POST /api/trackings
 */
const crear = async (req, res) => {
  try {
    const data = await service.crear({
      ...req.body,
      instructorId: req.user._id,
    });
    res.status(201).json({
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
 * GET /api/trackings
 */
const getAll = async (req, res) => {
  try {
    const filtros = {
      stageId: req.query.stageId,
      instructorId: req.query.instructorId,
      apprenticeId: req.query.apprenticeId,
    };
    
    if (req.user.role === 'APRENDIZ') {
      filtros.apprenticeId = req.user._id;
    }

    const data = await service.getAll(filtros);
    res.json({
      success: true,
      count: data.length,
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
 * GET /api/trackings/:id
 */
const getById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/trackings/:id
 */
const actualizar = async (req, res) => {
  try {
    const data = await service.actualizar(req.params.id, req.body);
    res.json({
      success: true,
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
  crear,
  getAll,
  getById,
  actualizar,
};