// trackings.service.js   ?? DEV 3 | Visitas de seguimiento
// =============================================
// Logica de negocio para gestion de visitas de
// seguimiento del instructor al aprendiz.
// =============================================

const Tracking        = require('./tracking.model');
const ProductiveStage = require('../productive-stages-dev2/productive-stage.model');

/**
 * Crear una nueva visita de seguimiento.
 */
const crear = async ({ stageId, instructorId, apprenticeId, numeroVisita, fechaVisita, lugarVisita, observaciones, compromisos, calificacion }) => {
  // Verificar que la EP existe
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

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
  });

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
 * Actualizar una visita de seguimiento.
 */
const actualizar = async (id, data) => {
  const tracking = await Tracking.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!tracking) {
    throw new Error('Visita de seguimiento no encontrada.');
  }
  return tracking;
};

module.exports = {
  crear,
  getAll,
  getByStage,
  getById,
  actualizar,
};
