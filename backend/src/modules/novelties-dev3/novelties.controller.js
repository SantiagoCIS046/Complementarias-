// novelties.controller.js   🟡 DEV 3 | Novedades / Incidentes
// =============================================
// Controladores para gestión de novedades.
// =============================================

const service = require('./novelties.service');

/**
 * POST /api/novelties
 */
const crear = async (req, res) => {
  try {
    const data = await service.crear({
      ...req.body,
      apprenticeId: req.user._id,
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
 * GET /api/novelties
 */
const getAll = async (req, res) => {
  try {
    const filtros = {
      stageId: req.query.stageId,
      apprenticeId: req.query.apprenticeId,
      tipo: req.query.tipo,
      estado: req.query.estado,
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
 * PATCH /api/novelties/:id/review
 */
const revisar = async (req, res) => {
  try {
    const data = await service.revisar(req.params.id, {
      ...req.body,
      revisadoPor: req.user._id,
    });
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
  revisar,
};