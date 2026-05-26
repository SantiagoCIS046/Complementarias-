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
    const apprenticeId = req.user.role === 'APRENDIZ' ? req.user._id : req.body.apprenticeId;
    if (!apprenticeId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del aprendiz es obligatorio.'
      });
    }

    const data = await service.crear({
      ...req.body,
      semana: req.body.semana ? Number(req.body.semana) : undefined,
      horasReportadas: req.body.horasReportadas ? Number(req.body.horasReportadas) : undefined,
      apprenticeId,
      responsable: req.user._id,
      esAdicional: req.body.esAdicional === true || req.body.esAdicional === 'true',
      motivo: req.body.motivo || null,
      fechaEspecial: req.body.fechaEspecial || null,
      file: req.file,
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

/**
 * PUT /api/bitacoras/:id
 */
const actualizar = async (req, res) => {
  try {
    const data = await service.actualizar(req.params.id, {
      ...req.body,
      semana: req.body.semana ? Number(req.body.semana) : undefined,
      horasReportadas: req.body.horasReportadas ? Number(req.body.horasReportadas) : undefined,
      esAdicional: req.body.esAdicional !== undefined ? (req.body.esAdicional === true || req.body.esAdicional === 'true') : undefined,
      motivo: req.body.motivo,
      fechaEspecial: req.body.fechaEspecial,
      responsable: req.user._id,
      file: req.file,
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

/**
 * POST /api/bitacoras/validate-signatures
 */
const validarFirmasIA = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo para validación.'
      });
    }

    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    const fileName = req.file.originalname.toLowerCase();

    // Simulación de validación por IA de firmas obligatorias
    let signatures = {
      aprendiz: { detected: true, confidence: 0.98 },
      instructor: { detected: true, confidence: 0.95 },
      jefeInmediato: { detected: true, confidence: 0.97 }
    };
    let valid = true;
    let message = 'Todas las firmas requeridas fueron detectadas y validadas con éxito.';

    if (fileName.includes('sin_firma_instructor') || fileName.includes('sin-firma-instructor')) {
      signatures.instructor = { detected: false, confidence: 0.0 };
      valid = false;
      message = 'Falta la firma obligatoria del Instructor de seguimiento.';
    } else if (fileName.includes('sin_firma_jefe') || fileName.includes('sin-firma-jefe')) {
      signatures.jefeInmediato = { detected: false, confidence: 0.0 };
      valid = false;
      message = 'Falta la firma obligatoria del Jefe Inmediato de la empresa co-formadora.';
    } else if (fileName.includes('sin_firma_aprendiz') || fileName.includes('sin-firma-aprendiz')) {
      signatures.aprendiz = { detected: false, confidence: 0.0 };
      valid = false;
      message = 'Falta la firma obligatoria del Aprendiz.';
    }

    res.json({
      success: true,
      fileSize: `${fileSizeMB} MB`,
      signatures,
      valid,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  crear,
  getAll,
  getByStage,
  revisar,
  actualizar,
  validarFirmasIA,
};