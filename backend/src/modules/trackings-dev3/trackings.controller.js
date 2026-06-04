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

    let cupo = null;
    if (req.query.stageId) {
      cupo = await service.obtenerCupoSeguimientos(req.query.stageId);
    }

    res.json({
      success: true,
      count: data.length,
      data,
      cupo,
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

/**
 * PATCH /api/trackings/:id/approve-extraordinary
 */
const approveExtraordinary = async (req, res) => {
  try {
    const { estado, observacionesEvaluacion } = req.body;
    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido (APROBADO o RECHAZADO).'
      });
    }

    const data = await service.approveExtraordinary(req.params.id, estado, observacionesEvaluacion);
    res.json({
      success: true,
      message: `Seguimiento extraordinario ${estado.toLowerCase()} correctamente.`,
      data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/trackings/validate-pdf
 * RF-INS-14: Validación de firmas en el acta de seguimiento mediante IA.
 */
const validarPdfIA = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo para validación.'
      });
    }

    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    const fileName = req.file.originalname.toLowerCase();

    // Simulación de validación por IA de firmas obligatorias en reporte de seguimiento (Aprendiz, Instructor, Jefe)
    let signatures = {
      aprendiz: { detected: true, confidence: 0.97 },
      instructor: { detected: true, confidence: 0.96 },
      jefeInmediato: { detected: true, confidence: 0.96 }
    };
    let valid = true;
    let message = 'Todas las firmas requeridas en el acta de seguimiento fueron detectadas y validadas con éxito.';

    if (fileName.includes('sin_firma_instructor') || fileName.includes('sin-firma-instructor')) {
      signatures.instructor = { detected: false, confidence: 0.0 };
      valid = false;
      message = 'Falta la firma obligatoria del Instructor de seguimiento en el acta.';
    } else if (fileName.includes('sin_firma_jefe') || fileName.includes('sin-firma-jefe')) {
      signatures.jefeInmediato = { detected: false, confidence: 0.0 };
      valid = false;
      message = 'Falta la firma obligatoria del Jefe Inmediato de la empresa co-formadora.';
    } else if (fileName.includes('sin_firma_aprendiz') || fileName.includes('sin-firma-aprendiz')) {
      signatures.aprendiz = { detected: false, confidence: 0.0 };
      valid = false;
      message = 'Falta la firma obligatoria del Aprendiz en el acta.';
    }

    // RF-INS-23: Certificar explícitamente que cuenta con firmas de instructor y aprendiz
    if (!signatures.aprendiz.detected || !signatures.instructor.detected) {
      valid = false;
      if (!message || message.includes('Todas las firmas')) {
        message = 'Falta una o más firmas obligatorias. El acta de seguimiento debe estar firmada por el Aprendiz y el Instructor.';
      }
    }

    // Guardar el archivo localmente en modo desarrollo
    const fakeId = 'dev_file_tracking_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const path = require('path');
    const fs = require('fs');
    try {
      const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadsDir, `${fakeId}_${req.file.originalname}`), req.file.buffer);
      console.log(`[TRACKINGS-DEV] Acta de visita guardada localmente: ${fakeId}_${req.file.originalname}`);
    } catch (err) {
      console.error('[TRACKINGS-DEV] Error guardando acta de visita localmente:', err);
    }

    res.json({
      success: true,
      fileSize: `${fileSizeMB} MB`,
      signatures,
      valid,
      message,
      evidenciaUrl: `/api/documents/view/${fakeId}_${req.file.originalname}`
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
  getById,
  actualizar,
  approveExtraordinary,
  validarPdfIA,
};