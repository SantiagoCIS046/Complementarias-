// bitacoras.controller.js   🟡 DEV 3 | Bitacoras / Evidencias
// =============================================
// Controladores para bitácoras semanales.
// =============================================

const service = require('./bitacoras.service');

/**
 * POST /api/bitacoras
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
 * GET /api/bitacoras
 */
const getAll = async (req, res) => {
  try {
    const filtros = {
      stageId: req.query.stageId,
      apprenticeId: req.query.apprenticeId,
      estado: req.query.estado,
    };
    
    // Si es APRENDIZ, filtrar por su ID
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
 * GET /api/bitacoras/stage/:stageId
 */
const getByStage = async (req, res) => {
  try {
    const data = await service.getByStage(req.params.stageId);
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
 * PATCH /api/bitacoras/:id/review
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
  getByStage,
  revisar,
};