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

  return await Batch.findByIdAndUpdate(
    batchId,
    {
      'instructor_asignado.instructor_id': instructorId,
      'instructor_asignado.nombre': instructor.name,
      estado: 'ACTIVA'
    },
    { new: true }
  );
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
  const existe = await Batch.findOne({ codigo_ficha: data.codigo_ficha });
  if (existe) throw new Error('Ya existe una ficha con el código: ' + data.codigo_ficha);
  
  return await Batch.create(data);
};

module.exports = {
  getAll,
  getById,
  asignarInstructor,
  getAprendices,
  crear
};
