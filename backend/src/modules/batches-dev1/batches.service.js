const Batch = require('./batch.model');
const User = require('../users-dev1/user.model');

/**
 * Obtener todas las fichas con filtros y población del instructor.
 */
const getAll = async (filtros = {}) => {
  const query = {};
  if (filtros.estado) query.estado = filtros.estado;
  if (filtros.programa) query.programa = { $regex: filtros.programa, $options: 'i' };
  if (filtros.codigo_ficha) query.codigo_ficha = filtros.codigo_ficha;

  return await Batch.find(query)
    .populate('instructor_asignado.instructor_id', 'name email documento')
    .sort({ createdAt: -1 });
};

/**
 * Obtener una ficha por ID.
 */
const getById = async (id) => {
  const batch = await Batch.findById(id).populate('instructor_asignado.instructor_id', 'name email');
  if (!batch) throw new Error('Ficha no encontrada');
  return batch;
};

/**
 * Asignar un instructor a una ficha.
 */
const asignarInstructor = async (batchId, instructorId) => {
  const instructor = await User.findById(instructorId);
  if (!instructor || instructor.role !== 'INSTRUCTOR') {
    throw new Error('El usuario seleccionado debe tener el rol de INSTRUCTOR');
  }

  const batch = await Batch.findById(batchId);
  if (!batch) throw new Error('Ficha no encontrada');

  const updatedBatch = await Batch.findByIdAndUpdate(
    batchId,
    {
      'instructor_asignado.instructor_id': instructorId,
      'instructor_asignado.nombre': instructor.name,
      'instructor_asignado.fecha_asignacion': new Date(),
      estado: 'ACTIVA'
    },
    { new: true }
  );

  // Actualizar la relación instructorAsignado en todos los aprendices vinculados a esta ficha
  if (batch.aprendices_ids && batch.aprendices_ids.length > 0) {
    await User.updateMany(
      { _id: { $in: batch.aprendices_ids } },
      { 
        instructorAsignado: instructorId,
        fechaAsignacionInstructor: new Date()
      }
    );

    // Enviar notificación y correo por cada aprendiz asignado
    const { enviarNotificacionAsignacion } = require('../../core/utils/notifications');
    for (const apprenticeId of batch.aprendices_ids) {
      enviarNotificacionAsignacion(apprenticeId, instructorId).catch(err =>
        console.error(`Error enviando notificación al asignar instructor a ficha para el aprendiz ${apprenticeId}:`, err.message)
      );
    }
  }

  return updatedBatch;
};

/**
 * Obtener aprendices vinculados a una ficha.
 */
const getAprendices = async (batchId) => {
  const batch = await Batch.findById(batchId).populate({
    path: 'aprendices_ids',
    select: 'name email documento status'
  });
  
  if (!batch) throw new Error('Ficha no encontrada');
  return batch.aprendices_ids;
};

/**
 * Crear una nueva ficha.
 */
const crear = async (data) => {
  // Validar código de ficha duplicado
  if (data.codigo_ficha) {
    const existeFicha = await Batch.findOne({ codigo_ficha: data.codigo_ficha });
    if (existeFicha) {
      throw new Error('Ya existe una ficha registrada con el código: ' + data.codigo_ficha);
    }
  }

  // Validar nombre de programa duplicado (insensible a mayúsculas/minúsculas)
  if (data.programa) {
    const existePrograma = await Batch.findOne({
      programa: { $regex: new RegExp('^' + data.programa.trim() + '$', 'i') }
    });
    if (existePrograma) {
      throw new Error('Ya existe un programa de formación registrado con el nombre: ' + data.programa);
    }
  }
  
  return await Batch.create(data);
};

module.exports = {
  getAll,
  getById,
  asignarInstructor,
  getAprendices,
  crear
};
