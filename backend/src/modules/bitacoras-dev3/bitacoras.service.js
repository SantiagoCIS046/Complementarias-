// bitacoras.service.js   ?? DEV 3 | Bitacoras / Evidencias
// =============================================
// Logica de negocio para gestion de bitacoras
// semanales del aprendiz.
// =============================================

const Bitacora       = require('./bitacora.model');
const ProductiveStage = require('../productive-stages-dev2/productive-stage.model');
const User           = require('../users-dev1/user.model');

/**
 * Crear una nueva bitacora semanal.
 */
const crear = async ({ stageId, apprenticeId, semana, descripcion, horasReportadas, evidencias, file, esAdicional, motivo, fechaEspecial, responsable }) => {
  // Verificar que la EP existe y esta EN_CURSO
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }
  if (stage.estado !== 'EN_CURSO') {
    throw new Error('Solo se pueden registrar bitacoras cuando la EP esta EN_CURSO. Estado actual: ' + stage.estado);
  }

  const SystemConfig = require('../system-config-dev1/system-config.model');
  let maxBitacoras = 7;
  try {
    const config = await SystemConfig.findOne({ clave: 'MAX_BITACORAS' });
    if (config && typeof config.valor === 'number') {
      maxBitacoras = config.valor;
    }
  } catch (err) {
    console.error('Error fetching MAX_BITACORAS config:', err);
  }

  if (!esAdicional) {
    const count = await Bitacora.countDocuments({ stageId, esAdicional: { $ne: true } });
    if (count >= maxBitacoras) {
      throw new Error(`Se ha alcanzado el número máximo permitido de bitácoras (${maxBitacoras}).`);
    }

    if (semana !== undefined && semana !== null) {
      const existeBitacora = await Bitacora.findOne({ stageId, semana: Number(semana), esAdicional: { $ne: true } });
      if (existeBitacora) {
        throw new Error(`Ya existe una bitácora registrada para el mes ${semana}. Recuerda que la entrega de bitácoras es cada 30 días (mensual).`);
      }
    }
  }

  let finalEvidencias = evidencias || [];
  if (file) {
    const driveService = require('../documents-dev2/storage.service');
    const folderId = stage.driveFolders && stage.driveFolders.bitacoras ? stage.driveFolders.bitacoras : null;
    const uploadResult = await driveService.subirDocumentoEP(file.buffer, file.originalname, folderId);
    finalEvidencias = [{
      nombreArchivo: file.originalname,
      url: uploadResult.viewUrl,
      driveFileId: uploadResult.driveFileId
    }];
  }

  let bitacora;
  try {
    bitacora = await Bitacora.create({
      stageId,
      apprenticeId,
      semana,
      descripcion,
      horasReportadas,
      evidencias: finalEvidencias,
      esAdicional: esAdicional || false,
      motivo: esAdicional ? motivo : null,
      fechaEspecial: esAdicional ? fechaEspecial : null,
      responsable: responsable || null,
    });
  } catch (error) {
    if (error.code === 11000 || error.message.includes('E11000')) {
      throw new Error(`Ya existe una bitácora registrada para el mes ${semana}. Recuerda que la entrega de bitácoras es cada 30 días (mensual).`);
    }
    throw error;
  }

  // Actualizar horas completadas en la EP
  stage.horasCompletadas = (stage.horasCompletadas || 0) + horasReportadas;
  await stage.save();

  const populatedBitacora = await Bitacora.findById(bitacora._id)
    .populate('apprenticeId', 'name email documento')
    .populate('stageId', 'radicado estado')
    .populate('responsable', 'name email role');

  return populatedBitacora;
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
    .populate('responsable', 'name email role')
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
    .populate('responsable', 'name email role')
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

  // RF-INS-26: Solo el instructor de SEGUIMIENTO puede revisar bitácoras
  if (revisadoPor) {
    const revisor = await User.findById(revisadoPor).select('tipoInstructor role name');
    if (revisor && revisor.role === 'INSTRUCTOR' && revisor.tipoInstructor && revisor.tipoInstructor !== 'SEGUIMIENTO') {
      throw new Error(
        `Solo el instructor de Seguimiento puede revisar las bitácoras del aprendiz. ` +
        `Tu tipo de instructor es: ${revisor.tipoInstructor}.`
      );
    }
  }

  bitacora.estado = estado;
  bitacora.observacionesInstructor = observaciones || '';
  bitacora.revisadoPor = revisadoPor;
  bitacora.fechaRevision = new Date();

  await bitacora.save();
  return bitacora;
};


/**
 * Actualizar una bitacora (solo si no esta aprobada).
 */
const actualizar = async (bitacoraId, data) => {
  const bitacora = await Bitacora.findById(bitacoraId);
  if (!bitacora) {
    throw new Error('Bitacora no encontrada.');
  }

  if (bitacora.estado === 'APROBADA') {
    throw new Error('No se puede editar una bitacora que ya fue aprobada.');
  }

  // Si se subió un nuevo archivo de evidencia
  if (data.file) {
    const stage = await ProductiveStage.findById(bitacora.stageId);
    if (stage) {
      const driveService = require('../documents-dev2/storage.service');
      const folderId = stage.driveFolders && stage.driveFolders.bitacoras ? stage.driveFolders.bitacoras : null;
      const uploadResult = await driveService.subirDocumentoEP(data.file.buffer, data.file.originalname, folderId);
      bitacora.evidencias = [{
        nombreArchivo: data.file.originalname,
        url: uploadResult.viewUrl,
        driveFileId: uploadResult.driveFileId
      }];
    }
  }

  // Si cambian las horas, actualizar la EP
  if (data.horasReportadas !== undefined && !isNaN(data.horasReportadas) && data.horasReportadas !== bitacora.horasReportadas) {
    const stage = await ProductiveStage.findById(bitacora.stageId);
    if (stage) {
      stage.horasCompletadas = (stage.horasCompletadas || 0) - bitacora.horasReportadas + data.horasReportadas;
      await stage.save();
    }
    bitacora.horasReportadas = data.horasReportadas;
  }

  if (data.semana !== undefined && !isNaN(data.semana)) {
    const targetSemana = Number(data.semana);
    const finalEsAdicional = data.esAdicional !== undefined ? (data.esAdicional === true || data.esAdicional === 'true') : bitacora.esAdicional;
    if (!finalEsAdicional && targetSemana !== bitacora.semana) {
      const existeBitacora = await Bitacora.findOne({
        stageId: bitacora.stageId,
        semana: targetSemana,
        esAdicional: { $ne: true },
        _id: { $ne: bitacoraId }
      });
      if (existeBitacora) {
        throw new Error(`Ya existe una bitácora registrada para el mes ${targetSemana}. Recuerda que la entrega de bitácoras es cada 30 días (mensual).`);
      }
    }
    bitacora.semana = data.semana;
  }
  if (data.descripcion !== undefined) bitacora.descripcion = data.descripcion;
  if (data.esAdicional !== undefined) bitacora.esAdicional = data.esAdicional;
  if (data.motivo !== undefined) bitacora.motivo = data.motivo;
  if (data.fechaEspecial !== undefined) bitacora.fechaEspecial = data.fechaEspecial;
  if (data.responsable !== undefined) bitacora.responsable = data.responsable;

  try {
    await bitacora.save();
  } catch (error) {
    if (error.code === 11000 || error.message.includes('E11000')) {
      throw new Error(`Ya existe una bitácora registrada para el mes ${bitacora.semana}. Recuerda que la entrega de bitácoras es cada 30 días (mensual).`);
    }
    throw error;
  }
  
  const populated = await Bitacora.findById(bitacora._id)
    .populate('apprenticeId', 'name email')
    .populate('revisadoPor', 'name email')
    .populate('responsable', 'name email role');
  
  return populated;
};

module.exports = {
  crear,
  getAll,
  getByStage,
  revisar,
  actualizar,
};
