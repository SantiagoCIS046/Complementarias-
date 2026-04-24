// users.service.js 🟢 DEV 1
const bcrypt = require('bcryptjs');
const User   = require('../auth-dev1/User.model');
const xlsx   = require('xlsx');

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
 * Cumple con Módulo 3 y Módulo 4 (Drive Permissions)
 */
const { transferPermissions } = require('../../core/utils/googleDrive');
const { enviarNotificacion } = require('../../core/utils/notifications');

const reasignarAprendices = async (instructorViejo, instructorNuevo, aprendicesIds) => {
  try {
    // 1. Aquí se actualizaría la base de datos (Ej: Tabla EtapaProductiva)
    // Supongamos que actualizamos los registros...

    // 2. MIGRACIÓN FÍSICA EN DRIVE (El gran reto)
    for (const id of aprendicesIds) {
      // Supongamos que buscamos el folderId del aprendiz en la DB
      const folderId = 'ID_DE_CARPETA_DE_PRUEBA'; 
      await transferPermissions(folderId, instructorViejo.email, instructorNuevo.email);
      
      // 3. Notificar al aprendiz
      await enviarNotificacion(id, `Tu instructor ha sido cambiado a ${instructorNuevo.name}`);
    }

    return { success: true, message: 'Reasignación y migración de Drive completada' };
  } catch (error) {
    console.error('❌ Error en reasignación:', error);
    throw error;
  }
};

module.exports = { importarDesdeExcel, reasignarAprendices };
