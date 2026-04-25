// novelties.service.js   🟡 DEV 3 | Novedades / Incidentes
// =============================================
// Lógica de negocio para gestión de novedades
// (incapacidades, calamidades, permisos, etc.)
// =============================================

const Novelty         = require('./novelty.model');
const ProductiveStage = require('../productive-stages-dev2/productive-stage.model');
const { TIPO_NOVEDAD } = require('../../core/utils/enums');

/**
 * Reportar una nueva novedad.
 */
const crear = async ({ stageId, apprenticeId, tipo, descripcion, fechaInicio, fechaFin, diasAfectados, soporteUrl }) => {
  // Verificar que la EP existe
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  // Verificar tipo válido
  if (!Object.values(TIPO_NOVEDAD).includes(tipo)) {
    throw new Error('Tipo de novedad no válido: ' + tipo);
  }

  const novedad = await Novelty.create({
    stageId,
    apprenticeId,
    tipo,
    descripcion,
    fechaInicio,
    fechaFin: fechaFin || null,
    diasAfectados: diasAfectados || 0,
    soporteUrl: soporteUrl || '',
  });

  return novedad;
};

/**
 * Listar todas las novedades (con filtros).
 */
const getAll = async (filtros = {}) => {
  const query = {};
  if (filtros.stageId)      query.stageId = filtros.stageId;
  if (filtros.apprenticeId) query.apprenticeId = filtros.apprenticeId;
  if (filtros.tipo)         query.tipo = filtros.tipo;
  if (filtros.estado)       query.estado = filtros.estado;

  const novedades = await Novelty.find(query)
    .populate('apprenticeId', 'name email documento')
    .populate('stageId', 'radicado estado')
    .populate('revisadoPor', 'name email')
    .sort({ createdAt: -1 });

  return novedades;
};

/**
 * Obtener novedades de una EP específica.
 */
const getByStage = async (stageId) => {
  const novedades = await Novelty.find({ stageId })
    .populate('apprenticeId', 'name email')
    .populate('revisadoPor', 'name email')
    .sort({ fechaInicio: -1 });

  return novedades;
};

/**
 * Revisar una novedad (aprobar o rechazar).
 */
const revisar = async (novedadId, { estado, observaciones, revisadoPor }) => {
  if (!['APROBADA', 'RECHAZADA'].includes(estado)) {
    throw new Error('El estado de revisión debe ser APROBADA o RECHAZADA.');
  }

  const novedad = await Novelty.findById(novedadId);
  if (!novedad) {
    throw new Error('Novedad no encontrada.');
  }

  novedad.estado = estado;
  novedad.observaciones = observaciones || '';
  novedad.revisadoPor = revisadoPor;

  await novedad.save();
  return novedad;
};

module.exports = {
  crear,
  getAll,
  getByStage,
  revisar,
};