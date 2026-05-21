// users.service.js   DEV 1 | Instructores y Aprendices
// =============================================
// Logica de negocio para gestion de usuarios.
// =============================================

const User = require('./user.model');

/**
 * Listar todos los usuarios (con filtros opcionales).
 */
const getAll = async (filtros = {}) => {
  const query = {};

  if (filtros.role)     query.role = filtros.role;
  if (filtros.status)   query.status = filtros.status;
  if (filtros.programa) query.programa = filtros.programa;
  if (filtros.busqueda) {
    query.$or = [
      { name:  { $regex: filtros.busqueda, $options: 'i' } },
      { email: { $regex: filtros.busqueda, $options: 'i' } },
      { documento: { $regex: filtros.busqueda, $options: 'i' } },
      { telefono: { $regex: filtros.busqueda, $options: 'i' } },
      { areaConocimiento: { $regex: filtros.busqueda, $options: 'i' } },
    ];
  }

  const usuarios = await User.find(query).sort({ name: 1 });
  return usuarios;
};

/**
 * Obtener un usuario por su ID.
 */
const getById = async (id) => {
  const usuario = await User.findById(id);
  if (!usuario) {
    throw new Error('Usuario no encontrado.');
  }
  return usuario;
};

/**
 * Actualizar datos de un usuario.
 */
const actualizar = async (id, data) => {
  // No permitir cambiar el password por esta via
  delete data.password;

  const usuario = await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado.');
  }
  return usuario;
};

/**
 * Activar o desactivar un usuario (Soft toggle — nunca se elimina de la BD).
 * Cambia activo entre true/false y ajusta el status a ACTIVO/INACTIVO.
 */
const toggleStatus = async (id) => {
  const usuario = await User.findById(id);
  if (!usuario) throw new Error('Usuario no encontrado.');

  const nuevoActivo = !usuario.activo;
  const nuevoStatus = nuevoActivo ? 'ACTIVO' : 'INACTIVO';

  usuario.activo = nuevoActivo;
  usuario.status = nuevoStatus;
  await usuario.save();

  return usuario;
};

/**
 * Obtener lista de fichas únicas con estadísticas básicas.
 */
const getFichasSummary = async () => {
  // Obtenemos todos los valores únicos del campo 'ficha'
  const fichas = await User.distinct('ficha', { ficha: { $ne: null, $exists: true } });
  
  const results = await Promise.all(fichas.map(async (f) => {
    // Para cada ficha, buscamos el primer usuario para obtener el programa
    const sampleUser = await User.findOne({ ficha: f });
    const count = await User.countDocuments({ ficha: f });
    
    // Intentamos encontrar un instructor asignado a algún aprendiz de esta ficha
    const userWithInstructor = await User.findOne({ ficha: f, instructorAsignado: { $ne: null } })
      .populate('instructorAsignado');
    
    return {
      codigo: f,
      programa: sampleUser ? sampleUser.programa || 'Programa no definido' : 'Sin programa',
      aprendices: count,
      instructor: userWithInstructor?.instructorAsignado?.name || 'Por asignar',
      jornada: 'Diurna', // Valor por defecto ya que no está en el modelo original
      estado: 'LECTIVA'
    };
  }));
  
  return results;
};

module.exports = {
  getAll,
  getById,
  actualizar,
  toggleStatus,
  getFichasSummary,
};
