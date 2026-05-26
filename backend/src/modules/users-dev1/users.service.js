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

  // RF-ADM-15 Verificación de estado activo para instructores asignados
  const instructorFields = ['instructorAsignado', 'instructorTecnico', 'instructorProyecto'];

  // Mapeo de campo → tipoInstructor esperado (RF-INS-26)
  const tipoEsperadoPorCampo = {
    instructorAsignado: 'SEGUIMIENTO',
    instructorTecnico:  'TECNICO',
    instructorProyecto: 'PROYECTO',
  };

  for (const field of instructorFields) {
    if (data[field]) {
      const inst = await User.findById(data[field]);
      if (!inst) {
        throw new Error(`El instructor asignado en ${field} no existe.`);
      }
      if (inst.role !== 'INSTRUCTOR') {
        throw new Error(`El usuario asignado en ${field} debe tener el rol de INSTRUCTOR.`);
      }
      if (inst.activo === false || inst.status === 'INACTIVO') {
        throw new Error(`El instructor asignado en ${field} (${inst.name}) debe estar en estado activo.`);
      }
      // RF-INS-26: validar consistencia del tipo de instructor con el campo
      if (inst.tipoInstructor && inst.tipoInstructor !== tipoEsperadoPorCampo[field]) {
        throw new Error(
          `El instructor ${inst.name} es de tipo ${inst.tipoInstructor} y no puede ser asignado como ${tipoEsperadoPorCampo[field]} en ${field}.`
        );
      }
    }
  }


  const oldUser = await User.findById(id);
  if (!oldUser) {
    throw new Error('Usuario no encontrado.');
  }

  const nuevoInstructorId = data.instructorAsignado;
  const oldInstructorId = oldUser.instructorAsignado ? oldUser.instructorAsignado.toString() : null;

  if (nuevoInstructorId && nuevoInstructorId.toString() !== oldInstructorId) {
    data.fechaAsignacionInstructor = new Date();
    if (oldUser.instructorAsignado) {
      const oldInst = await User.findById(oldUser.instructorAsignado);
      const historial = oldUser.historialInstructores || [];
      historial.push({
        instructorId: oldUser.instructorAsignado,
        nombre: oldInst ? oldInst.name : 'Instructor Anterior',
        fechaAsignacion: oldUser.fechaAsignacionInstructor || oldUser.createdAt,
        fechaFin: new Date()
      });
      data.historialInstructores = historial;
    }
  }

  const usuario = await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado.');
  }

  // Si es un APRENDIZ y se le asigna un instructor (o cambia), enviar correo y alerta interna
  if (usuario.role === 'APRENDIZ' && nuevoInstructorId && nuevoInstructorId.toString() !== oldInstructorId) {
    const { enviarNotificacionAsignacion } = require('../../core/utils/notifications');
    const motivo = oldInstructorId 
      ? (data.motivoReasignacion || 'Cambio individual de instructor asignado por el Administrador')
      : null;
    enviarNotificacionAsignacion(usuario._id, nuevoInstructorId, motivo).catch(err => 
      console.error('Error al enviar notificación de asignación:', err)
    );
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
<<<<<<< Updated upstream
 * Reasignar aprendices de un instructor saliente a uno nuevo.
 * También actualiza las fichas (Batches) y los trackings programados/pendientes.
 */
const reassignApprentices = async (outgoingId, newInstructorId) => {
  // 1. Validar nuevo instructor y que esté activo (RF-ADM-16 / RF-ADM-15)
  const newInstructor = await User.findById(newInstructorId);
  if (!newInstructor || newInstructor.role !== 'INSTRUCTOR') {
    throw new Error('El instructor de destino seleccionado no es válido.');
  }
  if (newInstructor.activo === false || newInstructor.status === 'INACTIVO') {
    throw new Error('El instructor de destino seleccionado debe estar en estado activo.');
  }

  // Identificar los aprendices afectados antes de actualizarlos en la base de datos
  const affectedApprentices = await User.find({
    role: 'APRENDIZ',
    $or: [
      { instructorAsignado: outgoingId },
      { instructorTecnico: outgoingId },
      { instructorProyecto: outgoingId }
    ]
  });

  const storageService = require('../documents-dev2/storage.service');
  const ProductiveStage = require('../productive-stages-dev2/productive-stage.model');
  const provider = await storageService.getActiveProvider();

  // Iterar por los aprendices afectados para realizar la migración y la notificación
  for (const apprentice of affectedApprentices) {
    let rolesCambiados = [];
    const mainInstructorChanged = apprentice.instructorAsignado && apprentice.instructorAsignado.toString() === outgoingId.toString();

    if (mainInstructorChanged) {
      rolesCambiados.push('Seguimiento');
      const oldInst = await User.findById(outgoingId);
      apprentice.historialInstructores.push({
        instructorId: outgoingId,
        nombre: oldInst ? oldInst.name : 'Instructor Anterior',
        fechaAsignacion: apprentice.fechaAsignacionInstructor || apprentice.createdAt,
        fechaFin: new Date()
      });
      apprentice.instructorAsignado = newInstructorId;
      apprentice.fechaAsignacionInstructor = new Date();
    }
    if (apprentice.instructorTecnico && apprentice.instructorTecnico.toString() === outgoingId.toString()) {
      rolesCambiados.push('Técnico');
      apprentice.instructorTecnico = newInstructorId;
    }
    if (apprentice.instructorProyecto && apprentice.instructorProyecto.toString() === outgoingId.toString()) {
      rolesCambiados.push('Proyecto');
      apprentice.instructorProyecto = newInstructorId;
    }

    await apprentice.save();

    // Si cambia el instructor de seguimiento principal, migrar la carpeta física
    if (mainInstructorChanged) {
      try {
        const stage = await ProductiveStage.findOne({ apprenticeId: apprentice._id });
        if (stage && stage.driveFolders && stage.driveFolders.aprendiz) {
          // Asegurar que el instructor destino tenga una carpeta raíz de instructor
          let newInstructorFolderId = provider === 'ONEDRIVE' ? newInstructor.onedriveFolderId : newInstructor.driveFolderId;
          if (!newInstructorFolderId) {
            const nombreFolderInstructor = 'INSTRUCTOR_' + newInstructor.name.replace(/\s+/g, '_');
            const folderRes = await storageService.crearCarpeta(nombreFolderInstructor);
            newInstructorFolderId = folderRes.id;
            if (provider === 'ONEDRIVE') {
              newInstructor.onedriveFolderId = newInstructorFolderId;
            } else {
              newInstructor.driveFolderId = newInstructorFolderId;
            }
            await newInstructor.save();
          }

          // Obtener o crear la carpeta de la ficha bajo el nuevo instructor
          const nombreFicha = 'FICHA_' + (apprentice.ficha || 'SIN_FICHA');
          const fichaFolder = await storageService.obtenerOCrearCarpeta(nombreFicha, newInstructorFolderId);
          const newFichaFolderId = fichaFolder.id;

          // Mover la carpeta del aprendiz a la nueva ficha
          await storageService.moverCarpeta(stage.driveFolders.aprendiz, newFichaFolderId);
          console.log(`[STORAGE] Carpeta del aprendiz ${apprentice.name} migrada exitosamente al instructor ${newInstructor.name}`);
        }
      } catch (storageErr) {
        console.error(`[STORAGE ERROR] Falló la migración física del aprendiz ${apprentice.name}:`, storageErr.message || storageErr);
      }
    }

    // Enviar correo de notificación
    if (rolesCambiados.length > 0) {
      try {
        await sendEmail({
          to: apprentice.email,
          subject: 'Reasignación de Instructor asignado en RepFora',
          html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
              <div style="background: #1b5e20; padding: 24px 32px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 1.2rem;">📢 Reasignación de Instructor</h1>
                <p style="color: #a5d6a7; margin: 4px 0 0; font-size: 0.85rem;">Gestión de Etapas Productivas — SENA</p>
              </div>
              <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                  Hola <strong>${apprentice.name}</strong>,
                </p>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                  Te informamos que se ha realizado un cambio en tus instructores asignados para los siguientes roles: <strong>${rolesCambiados.join(', ')}</strong>.
                </p>
                <div style="background: #f8fafc; border-left: 4px solid #1b5e20; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 4px 0; font-size: 0.9rem; color: #334155;"><strong>Nuevo Instructor:</strong> ${newInstructor.name}</p>
                  <p style="margin: 4px 0; font-size: 0.9rem; color: #334155;"><strong>Correo de contacto:</strong> ${newInstructor.email}</p>
                </div>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                  Tus carpetas de evidencias y archivos en la nube han sido migrados de forma automática para que el nuevo instructor asignado pueda revisar tus documentos sin contratiempos.
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
        console.error(`[MAIL ERROR] Error enviando correo de reasignación a ${apprentice.email}:`, emailErr.message || emailErr);
      }
    }
  }

  // 2. Reasignar en modelo User (Aprendices) - Ya realizado individualmente arriba en el loop.
  const apprenticesResult = { modifiedCount: affectedApprentices.length };

  const technicalResult = await User.updateMany(
    { instructorTecnico: outgoingId, role: 'APRENDIZ' },
    { instructorTecnico: newInstructorId }
  );

  const projectResult = await User.updateMany(
    { instructorProyecto: outgoingId, role: 'APRENDIZ' },
    { instructorProyecto: newInstructorId }
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

  const totalApprenticesReassigned = affectedApprentices.length;

  return {
    apprenticesReassigned: totalApprenticesReassigned,
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

/**
 * Obtener control de horas para todos los instructores
 */
const getInstructorsHours = async () => {
  const SystemConfig = require('../system-config-dev1/system-config.model');
  const Tracking = require('../trackings-dev3/tracking.model');
  const Bitacora = require('../bitacoras-dev3/bitacora.model');
  const ProductiveStage = require('../productive-stages-dev2/productive-stage.model');

  // Obtener configuraciones de horas
  let valSeguimiento = 2;
  let valBitacoras = 1;
  let valCertificacion = 2;

  try {
    const configSeg = await SystemConfig.findOne({ clave: 'HORAS_SEGUIMIENTO' });
    if (configSeg) valSeguimiento = Number(configSeg.valor) || 2;

    const configBit = await SystemConfig.findOne({ clave: 'HORAS_REVISION_BITACORAS' });
    if (configBit) valBitacoras = Number(configBit.valor) || 1;

    const configCert = await SystemConfig.findOne({ clave: 'HORAS_CERTIFICACION' });
    if (configCert) valCertificacion = Number(configCert.valor) || 2;
  } catch (err) {
    console.error('Error fetching horas configs:', err);
  }

  const instructores = await User.find({ role: 'INSTRUCTOR' }).sort({ name: 1 });

  const result = [];
  for (const inst of instructores) {
    // 1. Visitas de seguimiento realizadas (REALIZADO)
    // Las visitas extraordinarias (esExtraordinario: true) solo cuentan si están aprobadas (APROBADO)
    const visitasCount = await Tracking.countDocuments({ 
      instructorId: inst._id, 
      estadoVisita: 'REALIZADO',
      $or: [
        { esExtraordinario: { $ne: true } },
        { esExtraordinario: true, estadoExtraordinario: 'APROBADO' }
      ]
    });

    // 2. Bitácoras revisadas (APROBADA o RECHAZADA)
    const bitacorasCount = await Bitacora.countDocuments({ 
      revisadoPor: inst._id, 
      estado: { $ne: 'PENDIENTE' } 
    });

    // 3. Certificaciones completas
    const apprentices = await User.find({
      role: 'APRENDIZ',
      $or: [
        { instructorAsignado: inst._id },
        { instructorTecnico: inst._id },
        { instructorProyecto: inst._id }
      ]
    }).select('_id');
    const apprenticeIds = apprentices.map(a => a._id);
    const certifiedCount = await ProductiveStage.countDocuments({
      apprenticeId: { $in: apprenticeIds },
      estado: 'CERTIFICADO'
    });

    const horasVisitas = visitasCount * valSeguimiento;
    const horasBitacoras = bitacorasCount * valBitacoras;
    const horasCertificacion = certifiedCount * valCertificacion;
    const totalHoras = horasVisitas + horasBitacoras + horasCertificacion;
    const horasPagadas = inst.horasPagadas || 0;
    const saldoHoras = totalHoras - horasPagadas;

    result.push({
      _id: inst._id,
      name: inst.name,
      email: inst.email,
      areaConocimiento: inst.areaConocimiento || 'General',
      activo: inst.activo !== false,
      visitasRealizadas: visitasCount,
      bitacorasRevisadas: bitacorasCount,
      certificacionesCompletas: certifiedCount,
      horasVisitas,
      horasBitacoras,
      horasCertificacion,
      totalHoras,
      horasPagadas,
      saldoHoras,
    });
  }

  return result;
};

/**
 * Registrar horas pagadas para un instructor
 */
const payInstructorsHours = async (instructorId, hoursPaid) => {
  const inst = await User.findById(instructorId);
  if (!inst || inst.role !== 'INSTRUCTOR') {
    throw new Error('El instructor no es válido o no existe.');
  }
  if (hoursPaid <= 0) {
    throw new Error('La cantidad de horas pagadas debe ser mayor a 0.');
  }

  inst.horasPagadas = (inst.horasPagadas || 0) + hoursPaid;
  await inst.save();
  return inst;
};

/**
 * Reasignación masiva de aprendices entre instructores (por fin de contrato)
 * e inicio de transferencia de permisos de Drive.
 */
const reassignInstructor = async (oldInstructorId, newInstructorId, motivo) => {
  const oldInstructor = await User.findById(oldInstructorId);
  const newInstructor = await User.findById(newInstructorId);

  if (!oldInstructor || oldInstructor.role !== 'INSTRUCTOR') {
    throw new Error('El instructor saliente no es válido.');
  }
  if (!newInstructor || newInstructor.role !== 'INSTRUCTOR') {
    throw new Error('El nuevo instructor no es válido.');
  }

  // 1. Obtener todos los aprendices del instructor saliente
  const apprentices = await User.find({ instructorAsignado: oldInstructorId, role: 'APRENDIZ' });
  if (apprentices.length === 0) {
    return { success: true, count: 0, message: 'El instructor saliente no tenía aprendices asignados.' };
  }

  // 2. Reasignar a cada aprendiz
  const ProductiveStage = require('../productive-stages-dev2/productive-stage.model');
  const driveService = require('../documents-dev2/drive.service');
  const { enviarNotificacionAsignacion } = require('../../core/utils/notifications');

  for (const apprentice of apprentices) {
    if (apprentice.instructorAsignado) {
      const oldInst = await User.findById(oldInstructorId);
      apprentice.historialInstructores.push({
        instructorId: oldInstructorId,
        nombre: oldInst ? oldInst.name : 'Instructor Anterior',
        fechaAsignacion: apprentice.fechaAsignacionInstructor || apprentice.createdAt,
        fechaFin: new Date()
      });
    }
    apprentice.instructorAsignado = newInstructorId;
    apprentice.fechaAsignacionInstructor = new Date();
    await apprentice.save();

    // 3. Buscar etapa productiva activa para migrar permisos de Drive
    const stage = await ProductiveStage.findOne({
      apprenticeId: apprentice._id,
      estado: { $nin: ['FINALIZADO', 'CERTIFICADO', 'RECHAZADO'] }
    });

    if (stage && stage.driveFolders && stage.driveFolders.aprendiz) {
      // Transferir permisos en Drive
      driveService.transferirPermisos(
        stage.driveFolders.aprendiz,
        oldInstructor.email,
        newInstructor.email
      ).catch(err => console.error(`Error migrando permisos de Drive para el aprendiz ${apprentice.name}:`, err.message));
    }

    // 4. Enviar notificación al nuevo instructor
    const finalMotivo = motivo || 'Reasignación masiva de aprendices por finalización de contrato del instructor anterior';
    enviarNotificacionAsignacion(apprentice._id, newInstructorId, finalMotivo).catch(err =>
      console.error(`Error enviando notificación al reasignar aprendiz ${apprentice.name}:`, err.message)
    );
  }

  return {
    success: true,
    count: apprentices.length,
    message: `Se reasignaron exitosamente ${apprentices.length} aprendices al instructor ${newInstructor.name}.`
  };
};

module.exports = {
  getAll,
  getById,
  actualizar,
  toggleStatus,
  getFichasSummary,
  reassignApprentices,
  reassignInstructor,
  importExcel,
  getMyLogs,
  getInstructorsHours,
  payInstructorsHours,
};
