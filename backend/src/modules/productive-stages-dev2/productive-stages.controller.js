// productive-stages.controller.js   🔵 DEV 2 | Etapas Productivas
// =============================================
// Controladores HTTP para el módulo de EP.
// Reciben la petición, llaman al service y devuelven JSON.
// =============================================

const service = require('./productive-stages.service');

/**
 * POST /api/productive-stages
 * Registrar una nueva Etapa Productiva.
 * Body: { companyId, tipoFormacion, modalidad, documentos[], observaciones }
 */
const registrar = async (req, res) => {
  try {
    const aprendiz = req.user; // Viene del middleware verifyToken
    const { companyId, tipoFormacion, modalidad, documentos, observaciones } = req.body;

    const resultado = await service.registrar({
      aprendiz,
      companyId,
      tipoFormacion,
      modalidad,
      documentos,
      observaciones,
    });

    res.status(201).json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/productive-stages
 * Listar EPs (filtros opcionales via query params).
 */
const getAll = async (req, res) => {
  try {
    const filtros = {};
    if (req.query.apprenticeId) filtros.apprenticeId = req.query.apprenticeId;
    if (req.query.estado) filtros.estado = req.query.estado;
    if (req.query.companyId) filtros.companyId = req.query.companyId;

    // Filtros por Rol
    if (req.user.role === 'APRENDIZ') {
      filtros.apprenticeId = req.user._id;
    } else if (req.user.role === 'INSTRUCTOR') {
      // El instructor solo ve las EPs de sus aprendices asignados
      // Para esto, el service necesitará buscar los IDs de sus aprendices
      filtros.instructorId = req.user._id;
    }

    const stages = await service.getAll(filtros);

    res.json({
      success: true,
      count: stages.length,
      data: stages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/productive-stages/:id
 * Detalle de una EP con sus documentos.
 */
const getById = async (req, res) => {
  try {
    const resultado = await service.getById(req.params.id);

    res.json({
      success: true,
      data: resultado,
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
 * PATCH /api/productive-stages/:id/transition
 * Cambiar estado de una EP (máquina de estados).
 * Body: { nuevoEstado, motivo? }
 */
const transicionar = async (req, res) => {
  try {
    const { nuevoEstado, motivo } = req.body;

    if (!nuevoEstado) {
      return res.status(400).json({
        success: false,
        message: 'El campo "nuevoEstado" es obligatorio.',
      });
    }

    const resultado = await service.transicionar(
      req.params.id,
      nuevoEstado,
      req.user._id,
      motivo || ''
    );

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    const status = error.message.includes('inválida') ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/productive-stages/elegibility
 * Verificar si el aprendiz autenticado es elegible para registrar EP.
 */
const checkElegibility = async (req, res) => {
  try {
    const resultado = await service.checkElegibility(req.user);

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PATCH /api/productive-stages/:id/schedule
 * Configurar el cronograma de una EP.
 * Body: { jornada: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO', fechaInicio?: 'YYYY-MM-DD' }
 */
const configurarCronograma = async (req, res) => {
  try {
    const { jornada, fechaInicio } = req.body;

    if (!jornada) {
      return res.status(400).json({
        success: false,
        message: 'El campo "jornada" es obligatorio. Use: TIEMPO_COMPLETO o MEDIO_TIEMPO.',
      });
    }

    const resultado = await service.configurarCronograma(
      req.params.id,
      { jornada, fechaInicio }
    );

    res.json({
      success: true,
      data: resultado,
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
 * GET /api/productive-stages/:id/schedule
 * Obtener resumen del cronograma de una EP.
 */
const getCronograma = async (req, res) => {
  try {
    const cronograma = await service.getCronograma(req.params.id);

    res.json({
      success: true,
      data: cronograma,
    });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================================
// MODULO 4: Aprobaciones y Notificaciones
// =============================================

/**
 * PATCH /api/productive-stages/:id/enviar-revision
 * El aprendiz envia su EP a revision del instructor.
 */
const enviarARevision = async (req, res) => {
  try {
    const resultado = await service.enviarARevision(req.params.id, req.user._id);

    res.json({
      success: true,
      data: resultado,
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
 * PUT /api/productive-stages/evaluar/:id
 * El instructor evalua una EP y decide aprobar o rechazar.
 * Body: {
 *   decision: 'APROBADA' | 'RECHAZADA',
 *   comentario: 'string' (obligatorio si RECHAZADA),
 *   documentosRevisados?: [{ docId, estado, observacion }]
 * }
 */
const evaluarEP = async (req, res) => {
  try {
    const { decision, comentario, documentosRevisados } = req.body;

    if (!decision) {
      return res.status(400).json({
        success: false,
        message: 'El campo "decision" es obligatorio. Use: APROBADA o RECHAZADA.',
      });
    }

    const resultado = await service.evaluarEP(
      req.params.id,
      { decision, comentario, documentosRevisados },
      req.user._id
    );

    res.json({
      success: true,
      data: resultado,
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
 * GET /api/productive-stages/:id/semaforo
 * Obtener el estado visual (semaforo) de una EP.
 * Muestra cuantos documentos estan aprobados, rechazados o pendientes.
 */
const getSemaforo = async (req, res) => {
  try {
    const resultado = await service.getSemaforo(req.params.id);

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================================
// PUNTO 4: Documentos de Certificacion
// =============================================

/**
 * POST /api/productive-stages/:id/certificar
 * Certificar una EP (valida los 3 documentos finales obligatorios).
 */
const certificarEP = async (req, res) => {
  try {
    const resultado = await service.certificarEP(req.params.id, req.user._id);

    res.json({
      success: true,
      data: resultado,
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
 * GET /api/productive-stages/:id/certificacion
 * Estado de los documentos de certificacion.
 * Muestra cuales de los 3 archivos finales estan subidos y su estado.
 */
const getEstadoCertificacion = async (req, res) => {
  try {
    const resultado = await service.getEstadoCertificacion(req.params.id);

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registrar,
  getAll,
  getById,
  transicionar,
  checkElegibility,
  configurarCronograma,
  getCronograma,
  enviarARevision,
  evaluarEP,
  getSemaforo,
  certificarEP,
  getEstadoCertificacion,
};