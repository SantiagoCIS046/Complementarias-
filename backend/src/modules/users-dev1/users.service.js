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
  if (filtros.activo !== undefined) query.activo = filtros.activo;
  if (filtros.busqueda) {
    query.$or = [
      { name:  { $regex: filtros.busqueda, $options: 'i' } },
      { email: { $regex: filtros.busqueda, $options: 'i' } },
      { documento: { $regex: filtros.busqueda, $options: 'i' } },
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
 * Eliminar permanentemente un usuario (Hard delete).
 */
const desactivar = async (id) => {
  const usuario = await User.findByIdAndDelete(id);

  if (!usuario) {
    throw new Error('Usuario no encontrado.');
  }
  return usuario;
};

module.exports = {
  getAll,
  getById,
  actualizar,
  desactivar,
};
