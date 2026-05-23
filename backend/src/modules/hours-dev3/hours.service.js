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
  if (filtros.isAdditionalHour !== undefined) {
    query.isAdditionalHour = filtros.isAdditionalHour === 'true' || filtros.isAdditionalHour === true;
  }

  const horas = await Hour.find(query)
    .populate('apprenticeId', 'name email documento')
    .populate('stageId', 'radicado estado')
    .populate('trackingId', 'numeroVisita fechaVisita esExtraordinario')
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

/**
 * Actualizar estado de las horas adicionales.
 * RF-INS-13: Si el registro ya está cerrado (pendiente===false), es inmutable.
 */
const actualizarEstado = async (id, { ejecutado, cobrado, pendiente }) => {
  const hour = await Hour.findById(id);
  if (!hour) {
    throw new Error('Registro de horas no encontrado.');
  }

  // RF-INS-13: Bloqueo de edición. Un registro cerrado (pendiente===false) no puede modificarse.
  if (hour.pendiente === false) {
    throw new Error('Este registro de horas ya está cerrado (Ejecutada/Cobrada) y no puede modificarse.');
  }

  if (ejecutado !== undefined) hour.ejecutado = ejecutado;
  if (cobrado !== undefined) hour.cobrado = cobrado;
  if (pendiente !== undefined) hour.pendiente = pendiente;

  await hour.save();
  return hour;
};

/**
 * Obtener histórico de pagos agrupado por mes (RF-INS-17).
 * Aplica aislamiento de seguridad para Instructores.
 */
const obtenerHistoricoPagos = async ({ userId, userRole, filtroInstructorId }) => {
  const query = { isAdditionalHour: true };

  // Aislamiento de seguridad: si es INSTRUCTOR, solo puede ver sus propias visitas
  if (userRole === 'INSTRUCTOR') {
    const Tracking = require('../trackings-dev3/tracking.model');
    const trackings = await Tracking.find({ instructorId: userId }, '_id');
    const trackingIds = trackings.map(t => t._id);
    query.trackingId = { $in: trackingIds };
  } else if (userRole === 'ADMIN' && filtroInstructorId) {
    const Tracking = require('../trackings-dev3/tracking.model');
    const trackings = await Tracking.find({ instructorId: filtroInstructorId }, '_id');
    const trackingIds = trackings.map(t => t._id);
    query.trackingId = { $in: trackingIds };
  }

  const horas = await Hour.find(query)
    .populate('apprenticeId', 'name email documento ficha')
    .populate('stageId', 'radicado estado')
    .populate('trackingId', 'numeroVisita fechaVisita esExtraordinario instructorId')
    .sort({ fecha: -1 });

  const mesesMap = {};
  let globalCobradasCount = 0;
  let globalPendientesCount = 0;

  horas.forEach(h => {
    const fechaObj = new Date(h.fecha);
    const year = fechaObj.getFullYear();
    const mes = fechaObj.getMonth();
    const key = `${year}-${mes}`;

    if (h.cobrado) {
      globalCobradasCount++;
    } else {
      globalPendientesCount++;
    }

    const mesNombreStr = fechaObj.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const mesNombre = mesNombreStr.charAt(0).toUpperCase() + mesNombreStr.slice(1);

    if (!mesesMap[key]) {
      mesesMap[key] = {
        mesNombre,
        year,
        mes,
        totalHorasCobradas: 0,
        totalHorasPendientes: 0,
        cobradasCount: 0,
        pendientesCount: 0,
        detalles: []
      };
    }

    if (h.cobrado) {
      mesesMap[key].cobradasCount++;
      mesesMap[key].totalHorasCobradas += 2;
    } else {
      mesesMap[key].pendientesCount++;
      mesesMap[key].totalHorasPendientes += 2;
    }

    mesesMap[key].detalles.push({
      hourId: h._id,
      fecha: h.fecha,
      apprentice: {
        name: h.apprenticeId?.name || 'Desconocido',
        documento: h.apprenticeId?.documento || 'S/D',
        ficha: h.apprenticeId?.ficha || (h.stageId?.radicado ? 'S/F' : '---')
      },
      visitaNumero: h.trackingId?.numeroVisita || 'E',
      ejecutado: h.ejecutado,
      cobrado: h.cobrado,
      pendiente: h.pendiente
    });
  });

  const mesesArreglo = Object.values(mesesMap).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.mes - a.mes;
  });

  const resumenGlobal = {
    totalCobrado: globalCobradasCount * 2,
    totalPendiente: globalPendientesCount * 2,
    visitasEjecutadas: globalCobradasCount + globalPendientesCount
  };

  return {
    resumenGlobal,
    meses: mesesArreglo
  };
};

module.exports = {
  registrar,
  getAll,
  getByStage,
  getResumen,
  actualizarEstado,
  obtenerHistoricoPagos,
};