// hours.service.js   🟡 DEV 3 | Contabilidad de horas
// =============================================
// Lógica de negocio para el registro y consulta
// de horas diarias del aprendiz.
// =============================================

const Hour            = require('./hour.model');
const ProductiveStage = require('../productive-stages-dev2/productive-stage.model');

/**
 * Registrar horas de un día.
 */
const registrar = async ({ stageId, apprenticeId, fecha, horaEntrada, horaSalida, horasTrabajadas, actividades }) => {
  // Verificar que la EP existe y está EN_CURSO
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }
  if (stage.estado !== 'EN_CURSO') {
    throw new Error('Solo se pueden registrar horas cuando la EP está EN_CURSO. Estado actual: ' + stage.estado);
  }

  const hora = await Hour.create({
    stageId,
    apprenticeId,
    fecha: fecha || new Date(),
    horaEntrada,
    horaSalida,
    horasTrabajadas,
    actividades: actividades || '',
  });

  return hora;
};

/**
 * Listar todos los registros de horas (con filtros).
 */
const getAll = async (filtros = {}) => {
  const query = {};
  if (filtros.stageId)      query.stageId = filtros.stageId;
  if (filtros.apprenticeId) query.apprenticeId = filtros.apprenticeId;

  const horas = await Hour.find(query)
    .populate('apprenticeId', 'name email documento')
    .populate('stageId', 'radicado estado')
    .sort({ fecha: -1 });

  return horas;
};

/**
 * Obtener horas de una EP específica.
 */
const getByStage = async (stageId) => {
  const horas = await Hour.find({ stageId })
    .populate('apprenticeId', 'name email')
    .sort({ fecha: -1 });

  return horas;
};

/**
 * Obtener resumen de horas de una EP.
 */
const getResumen = async (stageId) => {
  const horas = await Hour.find({ stageId });

  const totalHoras = horas.reduce((sum, h) => sum + h.horasTrabajadas, 0);
  const totalDias  = horas.length;

  const stage = await ProductiveStage.findById(stageId);

  return {
    totalHoras,
    totalDias,
    horasRequeridas:  stage ? stage.horasRequeridas : 0,
    horasCompletadas: stage ? stage.horasCompletadas : 0,
    porcentaje: stage && stage.horasRequeridas > 0
      ? Math.min(100, Math.round((totalHoras / stage.horasRequeridas) * 100))
      : 0,
  };
};

module.exports = {
  registrar,
  getAll,
  getByStage,
  getResumen,
};