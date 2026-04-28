// bitacoras.service.js   ?? DEV 3 | Bitacoras / Evidencias
// =============================================
// Logica de negocio para gestion de bitacoras
// semanales del aprendiz.
// =============================================

const Bitacora       = require('./bitacora.model');
const ProductiveStage = require('../productive-stages-dev2/productive-stage.model');

/**
 * Crear una nueva bitacora semanal.
 */
const crear = async ({ stageId, apprenticeId, semana, descripcion, horasReportadas, evidencias }) => {
  // Verificar que la EP existe y esta EN_CURSO
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }
  if (stage.estado !== 'EN_CURSO') {
    throw new Error('Solo se pueden registrar bitacoras cuando la EP esta EN_CURSO. Estado actual: ' + stage.estado);
  }

  const bitacora = await Bitacora.create({
    stageId,
    apprenticeId,
    semana,
    descripcion,
    horasReportadas,
    evidencias: evidencias || [],
  });

  // Actualizar horas completadas en la EP
  stage.horasCompletadas = (stage.horasCompletadas || 0) + horasReportadas;
  await stage.save();

  return bitacora;
};

/**
 * Listar todas las bitacoras (admin/instructor).
 */
const getAll = async (filtros = {}) => {
  const query = {};
  if (filtros.stageId)      query.stageId = filtros.stageId;
  if (filtros.apprenticeId) query.apprenticeId = filtros.apprenticeId;
  if (filtros.estado)       query.estado = filtros.estado;

  const bitacoras = await Bitacora.find(query)
    .populate('apprenticeId', 'name email documento')
    .populate('stageId', 'radicado estado')
    .populate('revisadoPor', 'name email')
    .sort({ semana: 1 });

  return bitacoras;
};

/**
 * Obtener bitacoras de una EP especifica.
 */
const getByStage = async (stageId) => {
  const bitacoras = await Bitacora.find({ stageId })
    .populate('apprenticeId', 'name email')
    .populate('revisadoPor', 'name email')
    .sort({ semana: 1 });

  return bitacoras;
};

/**
 * Revisar una bitacora (aprobar o rechazar).
 */
const revisar = async (bitacoraId, { estado, observaciones, revisadoPor }) => {
  if (!['APROBADA', 'RECHAZADA'].includes(estado)) {
    throw new Error('El estado de revision debe ser APROBADA o RECHAZADA.');
  }

  const bitacora = await Bitacora.findById(bitacoraId);
  if (!bitacora) {
    throw new Error('Bitacora no encontrada.');
  }

  bitacora.estado = estado;
  bitacora.observacionesInstructor = observaciones || '';
  bitacora.revisadoPor = revisadoPor;
  bitacora.fechaRevision = new Date();

  await bitacora.save();
  return bitacora;
};

module.exports = {
  crear,
  getAll,
  getByStage,
  revisar,
};
