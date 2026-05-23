// users.service.js   DEV 1 | Instructores y Aprendices
// =============================================
// Logica de negocio para gestion de usuarios.
// =============================================

const User = require('./user.model');
const { sendEmail } = require('../../core/utils/mailer');
const AuditLog = require('../system-config-dev1/AuditLog.model');

const parseExcelDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    return new Date((value - 25569) * 86400 * 1000);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const match = trimmed.match(dmyRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
    const ymdRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
    const matchYmd = trimmed.match(ymdRegex);
    if (matchYmd) {
      const year = parseInt(matchYmd[1], 10);
      const month = parseInt(matchYmd[2], 10) - 1;
      const day = parseInt(matchYmd[3], 10);
      return new Date(year, month, day);
    }
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
  }
  return null;
};

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
    
    // Mapear campos de forma flexible (incluyendo columnas típicas de SOFÍA Plus y formatos planos)
    let name = row['Nombre'] || row['Nombre Completo'] || row['Nombres'] || row['name'] || row['Name'] || row['NOMBRES'] || row['Nombre Aprendiz'] || row['Nombre(s)'];
    
    // Si viene separado en Nombre y Apellidos (común en SOFÍA Plus)
    if (!name) {
      const primerNombre = row['Primer Nombre'] || row['Nombre 1'] || row['Nombres'] || '';
      const segundoNombre = row['Segundo Nombre'] || row['Nombre 2'] || '';
      const primerApellido = row['Primer Apellido'] || row['Apellido 1'] || row['Apellidos'] || '';
      const segundoApellido = row['Segundo Apellido'] || row['Apellido 2'] || '';
      const nombreCompleto = `${primerNombre} ${segundoNombre} ${primerApellido} ${segundoApellido}`.replace(/\s+/g, ' ').trim();
      if (nombreCompleto) {
        name = nombreCompleto;
      }
    }

    const email = row['Email'] || row['Correo'] || row['Correo Electrónico'] || row['email'] || row['Email '] || row['CORREO'] || row['Correo Electronico'];
    let documento = row['Documento'] || row['Identificación'] || row['Identificacion'] || row['Cedula'] || row['Cédula'] || row['documento'] || row['Número de Documento'] || row['Numero de Documento'] || row['NUMERO_DOCUMENTO'] || row['Número Documento'] || row['No. Documento'] || row['Documento Identidad'];
    const telefono = row['Teléfono'] || row['Telefono'] || row['Celular'] || row['telefono'] || row['tel'] || row['CELULAR'] || row['Contacto'];
    const ficha = row['Ficha'] || row['Código Ficha'] || row['Codigo Ficha'] || row['Ficha de Formación'] || row['ficha'] || row['Ficha de Caracterización'] || row['FICHA'] || row['Ficha Formacion'];
    const programa = row['Programa'] || row['Programa de Formación'] || row['programa'] || row['PROGRAMA'] || row['Programa Formacion'];
    const fechaFinLectivaRaw = row['Fecha Fin Lectiva'] || row['Fecha Fin Etapa Lectiva'] || row['Fecha Vencimiento'] || row['Fecha de Vencimiento'] || row['Vencimiento'] || row['vencimiento'] || row['FECHA_FIN_LECTIVA'] || row['Fin Lectiva'];
    const fechaFinLectiva = parseExcelDate(fechaFinLectivaRaw);

    // Validaciones básicas de campos obligatorios
    if (!name || !email || !documento) {
      errores.push({
        error: `Campos obligatorios faltantes (Nombre: ${name ? 'Sí' : 'No'}, Email: ${email ? 'Sí' : 'No'}, Documento: ${documento ? 'Sí' : 'No'})`,
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
        fechaFinLectiva: fechaFinLectiva || null,
        status: 'ACTIVO',
        isFirstLogin: true
      });

      // Enviar correo de habilitación (RF-APR-01)
      try {
        await sendEmail({
          to: email.toLowerCase().trim(),
          subject: '¡Habilitación de cuenta en RepFora! Credenciales de acceso',
          html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
              <div style="background: #1b5e20; padding: 24px 32px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 1.2rem;">🎉 ¡Bienvenido a RepFora!</h1>
                <p style="color: #a5d6a7; margin: 4px 0 0; font-size: 0.85rem;">Gestión de Etapas Productivas — SENA</p>
              </div>
              <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                  Hola <strong>${name.trim()}</strong>,
                </p>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                  Tu cuenta ha sido habilitada en la plataforma RepFora para que gestiones tu Etapa Productiva.
                </p>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                  A continuación, tus credenciales iniciales de acceso:
                </p>
                <div style="background: #f8fafc; border-left: 4px solid #1b5e20; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 4px 0; font-size: 0.9rem; color: #334155;"><strong>Usuario:</strong> ${email.toLowerCase().trim()}</p>
                  <p style="margin: 4px 0; font-size: 0.9rem; color: #334155;"><strong>Contraseña:</strong> ${documento}</p>
                </div>
                <p style="color: #ea580c; font-size: 0.85rem; font-weight: 700; margin-top: 16px;">
                  ⚠️ Por motivos de seguridad, el sistema te obligará a cambiar esta contraseña en tu primer ingreso.
                </p>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6; margin-top: 20px;">
                  Puedes acceder a la plataforma haciendo clic en el siguiente enlace:
                </p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login"
                   style="display:inline-block;padding:12px 24px;background:#1b5e20;
                          color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;font-weight:700;">
                  Ingresar a la Plataforma
                </a>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="color: #94a3b8; font-size: 0.75rem; text-align: center;">
                  Este correo fue generado automáticamente por el sistema REPFORA.<br>
                  No responda a este mensaje.
                </p>
              </div>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Error enviando correo de habilitacion:', emailErr.message);
      }

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

/**
 * Obtener logs de auditoría de un usuario específico (RF-APR-19).
 */
const getMyLogs = async (userId) => {
  return await AuditLog.find({ usuario: userId }).sort({ createdAt: -1 });
};

module.exports = {
  getAll,
  getById,
  actualizar,
  toggleStatus,
  getFichasSummary,
  reassignApprentices,
  importExcel,
  getMyLogs,
};
