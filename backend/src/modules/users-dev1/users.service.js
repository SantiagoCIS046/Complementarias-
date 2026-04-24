// users.service.js 🟢 DEV 1 | CRUD Completo de Usuarios
const bcrypt = require('bcryptjs');
const User = require('../auth-dev1/User.model');
const xlsx = require('xlsx');

/**
 * Listar usuarios con paginación, filtro por rol y búsqueda
 */
const getAllUsers = async (query = {}) => {
  const { page = 1, limit = 10, role, search } = query;
  const filter = {};

  if (role && role !== 'TODOS') {
    filter.role = role;
  }

  if (search && search.trim() !== '') {
    const q = search.trim();
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { documento: { $regex: q, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password -resetPasswordToken -resetPasswordExpires -__v')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return {
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * Obtener un usuario por ID
 */
const getUserById = async (id) => {
  const user = await User.findById(id)
    .select('-password -resetPasswordToken -resetPasswordExpires -__v');
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};

/**
 * Actualizar un usuario
 */
const updateUser = async (id, data) => {
  // No permitir actualizar password por esta vía
  delete data.password;

  const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .select('-password -resetPasswordToken -resetPasswordExpires -__v');
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};

/**
 * Eliminar un usuario
 */
const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error('Usuario no encontrado');
  return { message: 'Usuario eliminado correctamente' };
};

/**
 * Importar usuarios desde archivo Excel/CSV
 */
const importarDesdeExcel = async (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const results = { creados: 0, errores: [] };

  for (const row of data) {
    try {
      if (!row.email || !row.documento) {
        results.errores.push({ fila: row, error: 'Campos incompletos' });
        continue;
      }
      const hashedPassword = await bcrypt.hash(row.documento.toString(), 10);
      await User.create({
        documento: row.documento.toString(),
        email: row.email.toLowerCase(),
        password: hashedPassword,
        name: row.nombre || 'Sin Nombre',
        role: row.rol || 'APRENDIZ',
        status: 'ELEGIBLE'
      });
      results.creados++;
    } catch (error) {
      results.errores.push({ fila: row, error: error.message });
    }
  }
  return results;
};

/**
 * Reasignación de aprendices por fin de contrato de instructor
 */
const { transferPermissions } = require('../../core/utils/googleDrive');
const { enviarNotificacion } = require('../../core/utils/notifications');

const reasignarAprendices = async (instructorViejo, instructorNuevo, aprendicesIds) => {
  try {
    for (const id of aprendicesIds) {
      const folderId = 'ID_DE_CARPETA_DE_PRUEBA';
      await transferPermissions(folderId, instructorViejo.email, instructorNuevo.email);
      await enviarNotificacion(id, `Tu instructor ha sido cambiado a ${instructorNuevo.name}`);
    }
    return { success: true, message: 'Reasignación y migración de Drive completada' };
  } catch (error) {
    console.error('❌ Error en reasignación:', error);
    throw error;
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, importarDesdeExcel, reasignarAprendices };
