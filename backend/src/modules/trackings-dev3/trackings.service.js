// trackings.service.js   🟡 DEV 3 | Visitas de seguimiento
// =============================================
// Lógica de negocio para gestión de visitas de
// seguimiento del instructor al aprendiz.
// =============================================

const Tracking        = require('./tracking.model');
const ProductiveStage = require('../productive-stages-dev2/productive-stage.model');
const User            = require('../users-dev1/user.model');
const Batch           = require('../batches-dev1/batch.model');

/**
 * Obtiene el cupo máximo de seguimientos y nivel de formación de un aprendiz asociado a una EP.
 */
const obtenerCupoSeguimientos = async (stageId) => {
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  const apprentice = await User.findById(stage.apprenticeId);
  if (!apprentice) {
    return { maxSeguimientos: 3, nivelFormacion: 'No definido', extraordinaryTrackingAuthorized: stage.extraordinaryTrackingAuthorized || false };
  }

  // Buscar Ficha (Batch) del aprendiz
  let batch = null;
  if (apprentice.ficha) {
    batch = await Batch.findOne({ codigo_ficha: apprentice.ficha });
  }
  if (!batch) {
    batch = await Batch.findOne({ aprendices_ids: apprentice._id });
  }

  let maxSeguimientos = 3; // default
  let nivelFormacion = 'Tecnólogo'; // default

  if (batch) {
    nivelFormacion = batch.nivel_formacion;
    if (nivelFormacion === 'Operario' || nivelFormacion === 'Auxiliar') {
      maxSeguimientos = 2;
    } else if (['Técnico', 'Tecnólogo', 'Especialización Tecnológica'].includes(nivelFormacion)) {
      maxSeguimientos = 3;
    }
  }

  return { 
    maxSeguimientos, 
    nivelFormacion, 
    extraordinaryTrackingAuthorized: stage.extraordinaryTrackingAuthorized || false 
  };
};

/**
 * Crear una nueva visita de seguimiento.
 * RF-INS-12: Validaciones de cuota, duplicados y visitas extraordinarias.
 */
const crear = async ({ stageId, instructorId, apprenticeId, numeroVisita, fechaVisita, lugarVisita, observaciones, compromisos, calificacion, evidenciaUrl, evidenciaSize, isValidatedByIA, signaturesValidated, esExtraordinario }) => {
  // Verificar que la EP existe
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  // RF-INS-26: Solo el instructor de SEGUIMIENTO puede registrar visitas de seguimiento
  if (instructorId) {
    const instructor = await User.findById(instructorId);
    if (instructor && instructor.tipoInstructor && instructor.tipoInstructor !== 'SEGUIMIENTO') {
      throw new Error(
        `Solo el instructor de Seguimiento puede registrar visitas de seguimiento. ` +
        `Tu tipo de instructor es: ${instructor.tipoInstructor}.`
      );
    }
  }

  // Validar cuotas dinámicas y nivel académico
  const cupo = await obtenerCupoSeguimientos(stageId);

  if (esExtraordinario) {
    if (!stage.extraordinaryTrackingAuthorized) {
      throw new Error('No está autorizado a registrar seguimientos extraordinarios para esta etapa productiva. Solicite autorización al administrador.');
    }
  } else {
    if (numeroVisita > cupo.maxSeguimientos) {
      throw new Error(`El aprendiz tiene un nivel de formación (${cupo.nivelFormacion}) que solo requiere ${cupo.maxSeguimientos} seguimientos.`);
    }

    // Evitar exceder el límite máximo de seguimientos estándar
    const existingStandardCount = await Tracking.countDocuments({ stageId, esExtraordinario: { $ne: true } });
    if (existingStandardCount >= cupo.maxSeguimientos) {
      throw new Error(`Se ha alcanzado el límite máximo de ${cupo.maxSeguimientos} seguimientos estándar para este aprendiz.`);
    }
  }

  // Evitar duplicados de numeroVisita
  const duplicated = await Tracking.findOne({ stageId, numeroVisita });
  if (duplicated) {
    throw new Error(`Ya existe la visita de seguimiento #${numeroVisita} registrada para esta etapa productiva.`);
  }

  // RF-INS-23: Certificar firmas digital de instructor y aprendiz
  if (isValidatedByIA === true || isValidatedByIA === 'true') {
    if (!signaturesValidated) {
      throw new Error('Debe proporcionar los resultados de la validación de firmas por IA.');
    }
    const { aprendiz, instructor } = signaturesValidated;
    if (!aprendiz || !aprendiz.detected) {
      throw new Error('El acta de seguimiento debe contar con la firma digital del aprendiz.');
    }
    if (!instructor || !instructor.detected) {
      throw new Error('El acta de seguimiento debe contar con la firma digital del instructor.');
    }
  }

  const isExtraordinary = esExtraordinario === true || esExtraordinario === 'true';

  const tracking = await Tracking.create({
    stageId,
    instructorId,
    apprenticeId: apprenticeId || stage.apprenticeId,
    numeroVisita,
    fechaVisita: fechaVisita || new Date(),
    lugarVisita: lugarVisita || '',
    observaciones,
    compromisos: compromisos || '',
    calificacion: calificacion || null,
    evidenciaUrl: evidenciaUrl || '',
    evidenciaSize: evidenciaSize || 0,
    isValidatedByIA: isValidatedByIA || false,
    signaturesValidated: signaturesValidated || null,
    esExtraordinario: isExtraordinary,
    estadoExtraordinario: isExtraordinary ? 'PENDIENTE' : 'N/A',
  });

  // RF-INS-11: Si es un seguimiento extraordinario, creamos automáticamente el registro de horas adicionales
  if (tracking.esExtraordinario) {
    const Hour = require('../hours-dev3/hour.model');
    await Hour.create({
      stageId,
      apprenticeId: tracking.apprenticeId,
      fecha: tracking.fechaVisita || new Date(),
      isAdditionalHour: true,
      trackingId: tracking._id,
      ejecutado: false,
      cobrado: false,
      pendiente: true,
    });
  }

  return tracking;
};

/**
 * Listar todas las visitas de seguimiento.
 */
const getAll = async (filtros = {}) => {
  const query = {};
  if (filtros.stageId)      query.stageId = filtros.stageId;
  if (filtros.instructorId) query.instructorId = filtros.instructorId;
  if (filtros.apprenticeId) query.apprenticeId = filtros.apprenticeId;

  const trackings = await Tracking.find(query)
    .populate('instructorId', 'name email')
    .populate('apprenticeId', 'name email documento')
    .populate('stageId', 'radicado estado')
    .sort({ fechaVisita: -1 });

  return trackings;
};

/**
 * Obtener visitas de seguimiento de una EP.
 */
const getByStage = async (stageId) => {
  const trackings = await Tracking.find({ stageId })
    .populate('instructorId', 'name email')
    .populate('apprenticeId', 'name email')
    .sort({ numeroVisita: 1 });

  return trackings;
};

/**
 * Obtener una visita por su ID.
 */
const getById = async (id) => {
  const tracking = await Tracking.findById(id)
    .populate('instructorId', 'name email')
    .populate('apprenticeId', 'name email documento');

  if (!tracking) {
    throw new Error('Visita de seguimiento no encontrada.');
  }
  return tracking;
};

/**
 * Actualizar una visita de seguimiento (RF-INS-12 + RF-INS-14).
 * Aplica validaciones de negocio antes de persistir los cambios.
 */
const actualizar = async (id, data) => {
  const existing = await Tracking.findById(id);
  if (!existing) {
    throw new Error('Visita de seguimiento no encontrada.');
  }

  const nuevoEstado = data.estadoVisita || existing.estadoVisita;

  // RF-INS-12: Lugar y Observaciones obligatorios al transicionar a REALIZADO
  if (nuevoEstado === 'REALIZADO') {
    const lugar = data.lugarVisita ?? existing.lugarVisita;
    const obs   = data.observaciones ?? existing.observaciones;
    if (!lugar || !obs) {
      throw new Error('Para marcar como REALIZADO, el Lugar y las Observaciones son obligatorios.');
    }
    // RF-INS-14: Validación IA obligatoria para estado REALIZADO
    const iaValid = data.isValidatedByIA ?? existing.isValidatedByIA;
    if (!iaValid) {
      throw new Error('El acta de seguimiento debe ser validada por IA antes de marcar la visita como REALIZADO.');
    }
    // RF-INS-23: Certificar firmas digital de instructor y aprendiz para estado REALIZADO
    const sigs = data.signaturesValidated ?? existing.signaturesValidated;
    if (!sigs) {
      throw new Error('No se han encontrado resultados de validación de firmas por IA.');
    }
    const { aprendiz, instructor } = sigs;
    if (!aprendiz || !aprendiz.detected) {
      throw new Error('El acta de seguimiento debe contar con la firma digital del aprendiz para marcarse como REALIZADO.');
    }
    if (!instructor || !instructor.detected) {
      throw new Error('El acta de seguimiento debe contar con la firma digital del instructor para marcarse como REALIZADO.');
    }
  }

  const tracking = await Tracking.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  return tracking;
};

/**
 * Aprobar o rechazar un seguimiento extraordinario.
 */
const approveExtraordinary = async (id, estado, observacionesEvaluacion) => {
  if (!['APROBADO', 'RECHAZADO'].includes(estado)) {
    throw new Error('Estado inválido. Debe ser APROBADO o RECHAZADO.');
  }

  const tracking = await Tracking.findById(id);
  if (!tracking) {
    throw new Error('Visita de seguimiento no encontrada.');
  }
  if (!tracking.esExtraordinario) {
    throw new Error('Esta visita de seguimiento no es extraordinaria.');
  }

  if (estado === 'RECHAZADO' && (!observacionesEvaluacion || !observacionesEvaluacion.trim())) {
    throw new Error('Las observaciones son obligatorias para rechazar un seguimiento extraordinario.');
  }

  tracking.estadoExtraordinario = estado;
  tracking.observacionesEvaluacion = observacionesEvaluacion || '';
  await tracking.save();
  return tracking;
};

module.exports = {
  crear,
  getAll,
  getByStage,
  getById,
  actualizar,
  approveExtraordinary,
  obtenerCupoSeguimientos,
};
