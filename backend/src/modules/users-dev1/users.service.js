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

/**
 * Reasignar aprendices de un instructor saliente a uno nuevo.
 * También actualiza las fichas (Batches) y los trackings programados/pendientes.
 */
const reassignApprentices = async (outgoingId, newInstructorId) => {
  // 1. Validar nuevo instructor
  const newInstructor = await User.findById(newInstructorId);
  if (!newInstructor || newInstructor.role !== 'INSTRUCTOR') {
    throw new Error('El instructor de destino seleccionado no es válido.');
  }

  // 2. Reasignar en modelo User (Aprendices)
  const apprenticesResult = await User.updateMany(
    { instructorAsignado: outgoingId, role: 'APRENDIZ' },
    { instructorAsignado: newInstructorId }
  );

  // 3. Reasignar en modelo Batch (Fichas)
  const Batch = require('../batches-dev1/batch.model');
  const batchesResult = await Batch.updateMany(
    { 'instructor_asignado.instructor_id': outgoingId },
    { 
      'instructor_asignado.instructor_id': newInstructorId,
      'instructor_asignado.nombre': newInstructor.name
    }
  );

  // 4. Reasignar en modelo Tracking (Seguimientos programados o pendientes)
  const Tracking = require('../trackings-dev3/tracking.model');
  const trackingsResult = await Tracking.updateMany(
    { instructorId: outgoingId, estadoVisita: { $in: ['PROGRAMADO', 'PENDIENTE'] } },
    { instructorId: newInstructorId }
  );

  return {
    apprenticesReassigned: apprenticesResult.modifiedCount || apprenticesResult.nModified || 0,
    batchesReassigned: batchesResult.modifiedCount || batchesResult.nModified || 0,
    trackingsReassigned: trackingsResult.modifiedCount || trackingsResult.nModified || 0,
  };
};

/**
 * Importar aprendices desde archivo de Excel (.xlsx, .xls)
 * @param {Buffer} fileBuffer 
 */
const importExcel = async (fileBuffer) => {
  const xlsx = require('xlsx');
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);

  let creados = 0;
  const errores = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Mapear campos de forma flexible
    const name = row['Nombre'] || row['Nombre Completo'] || row['Nombres'] || row['name'] || row['Name'];
    const email = row['Email'] || row['Correo'] || row['Correo Electrónico'] || row['email'] || row['Email '];
    let documento = row['Documento'] || row['Identificación'] || row['Identificacion'] || row['Cedula'] || row['Cédula'] || row['documento'];
    const telefono = row['Teléfono'] || row['Telefono'] || row['Celular'] || row['telefono'] || row['tel'];
    const ficha = row['Ficha'] || row['Código Ficha'] || row['Codigo Ficha'] || row['Ficha de Formación'] || row['ficha'];
    const programa = row['Programa'] || row['Programa de Formación'] || row['programa'];

    // Validaciones básicas de campos obligatorios
    if (!name || !email || !documento) {
      errores.push({
        error: `Campos obligatorios faltantes (Nombre, Email o Documento)`,
        fila: { name, email, documento }
      });
      continue;
    }

    // Convertir documento a string y limpiar espacios
    documento = String(documento).trim();

    // Validar formato de documento/longitud de contraseña
    if (documento.length < 6) {
      errores.push({
        error: `El documento debe tener al menos 6 caracteres`,
        fila: { name, email, documento }
      });
      continue;
    }

    try {
      // Verificar si el email ya existe
      const existeEmail = await User.findOne({ email: email.toLowerCase().trim() });
      if (existeEmail) {
        errores.push({
          error: `El email ya está registrado`,
          fila: { name, email, documento }
        });
        continue;
      }

      // Verificar si el documento ya existe
      const existeDoc = await User.findOne({ documento });
      if (existeDoc) {
        errores.push({
          error: `El documento ya está registrado`,
          fila: { name, email, documento }
        });
        continue;
      }

      // Crear aprendiz
      await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: documento, // Se hashea en el middleware pre-save
        role: 'APRENDIZ',
        documento,
        telefono: telefono ? String(telefono).trim() : undefined,
        ficha: ficha ? String(ficha).trim() : undefined,
        programa: programa ? String(programa).trim() : undefined,
        status: 'ACTIVO',
        isFirstLogin: true
      });

      creados++;
    } catch (err) {
      errores.push({
        error: err.message,
        fila: { name, email, documento }
      });
    }
  }

  return { creados, errores };
};

module.exports = {
  getAll,
  getById,
  actualizar,
  toggleStatus,
  getFichasSummary,
  reassignApprentices,
  importExcel,
};
