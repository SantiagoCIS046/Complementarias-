const xlsx = require('xlsx');
const User = require('./models/user.model');
const { ROLES, ESTADO_USUARIO, ESTADO_CONTRATO } = require('../../core/utils/enums');
const { logAction } = require('../../core/utils/logger');

/**
 * Importación masiva de aprendices desde un buffer de Excel
 * @param {Buffer} buffer - Contenido del archivo Excel
 * @returns {Object} - Resumen de la operación
 */
const bulkImport = async (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const results = {
    total: data.length,
    created: 0,
    updated: 0,
    errors: []
  };

  for (const row of data) {
    try {
      // Normalizar campos (asumiendo nombres de columnas: Cedula, nombre, Correo, Programa, Ficha, Instructor_Cedula)
      const nationalId = row.Cedula || row.documento;
      const fullName = row.nombre || row.nombre_completo;
      const email = row.Correo || row.email;
      const program = row.Programa || row.programa || row.especialidad;
      const ficha = row.Ficha || row.ficha;
      const instructorCedula = row['instructor asignado'] || row.Instructor_Cedula;

      if (!nationalId || !fullName || !email) {
        results.errors.push({ row, error: 'Campos obligatorios faltantes (Cedula, nombre o Correo)' });
        continue;
      }

      // Buscar instructor si se proporcionó su cédula
      let instructorId = null;
      if (instructorCedula) {
        const inst = await User.findOne({ nationalId: instructorCedula, role: ROLES.INSTRUCTOR });
        if (inst) instructorId = inst._id;
      }

      const userData = {
        nationalId: String(nationalId),
        fullName,
        email,
        program: program ? program.toUpperCase() : null,
        ficha: String(ficha || ''),
        instructor: instructorId,
        role: ROLES.APRENDIZ,
        status: ESTADO_USUARIO.ACTIVO,
        isFirstLogin: true
      };

      // Si el usuario no existe, la contraseña por defecto es su cédula
      const existingUser = await User.findOne({ nationalId: String(nationalId) });
      
      if (!existingUser) {
        userData.password = String(nationalId);
        await User.create(userData);
        results.created++;
      } else {
        // Actualizar datos existentes (Upsert manual)
        Object.assign(existingUser, userData);
        await existingUser.save();
        results.updated++;
      }

    } catch (error) {
      results.errors.push({ row, error: error.message });
    }
  }

  return results;
};

/**
 * Sugiere un instructor de reemplazo basado en programa y carga de trabajo
 * @param {String} oldInstructorId - ID del instructor que sale
 * @returns {Array} - Lista de candidatos ordenados por menor carga
 */
const suggestReplacement = async (oldInstructorId) => {
  const instructor = await User.findById(oldInstructorId);
  if (!instructor || instructor.role !== ROLES.INSTRUCTOR) {
    throw new Error('Instructor no encontrado o rol inválido');
  }

  // Buscar todos los instructores activos del mismo programa que no sean el actual
  const candidates = await User.find({
    role: ROLES.INSTRUCTOR,
    program: instructor.program,
    status: ESTADO_USUARIO.ACTIVO,
    _id: { $ne: oldInstructorId }
  });

  // Calcular carga para cada candidato
  const candidatesWithLoad = await Promise.all(candidates.map(async (cand) => {
    const apprenticeCount = await User.countDocuments({ instructor: cand._id, role: ROLES.APRENDIZ });
    return {
      id: cand._id,
      fullName: cand.fullName,
      email: cand.email,
      program: cand.program,
      apprenticeCount
    };
  }));

  // Ordenar por menor carga (ascendente)
  return candidatesWithLoad.sort((a, b) => a.apprenticeCount - b.apprenticeCount);
};

/**
 * Reasignación masiva de aprendices y terminación de contrato del instructor
 * @param {String} oldInstructorId 
 * @param {String} newInstructorId 
 */
const reassignApprentices = async (oldInstructorId, newInstructorId, adminId) => {
  // 1. Verificar nuevo instructor
  const newInst = await User.findOne({ _id: newInstructorId, role: ROLES.INSTRUCTOR });
  if (!newInst) throw new Error('El instructor de destino no es válido');

  // 2. Reasignar aprendices tras terminar contrato
  const updateResult = await User.updateMany(
    { instructor: oldInstructorId, role: ROLES.APRENDIZ },
    { instructor: newInstructorId }
  );

  // 3. Marcar instructor antiguo como TERMINADO_CONTRATO
  await User.findByIdAndUpdate(oldInstructorId, { contractStatus: ESTADO_CONTRATO.TERMINADO_CONTRATO });

  // 4. Logear acción
  await logAction({
    user: adminId,
    action: 'INSTRUCTOR_REASSIGNED',
    module: 'USERS',
    details: {
      oldInstructor: oldInstructorId,
      newInstructor: newInstructorId,
      apprenticesMoved: updateResult.modifiedCount
    }
  });

  return {
    success: true,
    apprenticesMoved: updateResult.modifiedCount
  };
};

module.exports = {
  bulkImport,
  suggestReplacement,
  reassignApprentices
};
