// clean-productive-stages.js - Eliminar etapa productiva a todos los aprendices
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/modules/users-dev1/user.model');
const ProductiveStage = require('./src/modules/productive-stages-dev2/productive-stage.model');
const Document = require('./src/modules/documents-dev2/document.model');
const Hour = require('./src/modules/hours-dev3/hour.model');
const Novelty = require('./src/modules/novelties-dev3/novelty.model');
const Notification = require('./src/modules/system-config-dev1/Notification.model');

async function main() {
  console.log('🔄 Conectando a la base de datos...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Conexión establecida.');

  console.log('🗑️ Eliminando todas las Etapas Productivas...');
  const stageRes = await ProductiveStage.deleteMany({});
  console.log(`✅ ${stageRes.deletedCount} Etapas Productivas eliminadas.`);

  console.log('🗑️ Eliminando todos los documentos de EP...');
  const docRes = await Document.deleteMany({});
  console.log(`✅ ${docRes.deletedCount} documentos de EP eliminados.`);

  console.log('🗑️ Eliminando todos los registros de horas de EP...');
  const hourRes = await Hour.deleteMany({});
  console.log(`✅ ${hourRes.deletedCount} registros de horas eliminados.`);

  console.log('🗑️ Eliminando todas las novedades de EP...');
  const noveltyRes = await Novelty.deleteMany({});
  console.log(`✅ ${noveltyRes.deletedCount} novedades eliminadas.`);

  console.log('🗑️ Eliminando todas las notificaciones...');
  const notificationRes = await Notification.deleteMany({});
  console.log(`✅ ${notificationRes.deletedCount} notificaciones eliminadas.`);

  // Eliminar de forma dinámica las colecciones de seguimientos y bitácoras si están registradas
  try {
    const Tracking = mongoose.model('Tracking') || require('./src/modules/trackings-dev3/tracking.model');
    const trackRes = await Tracking.deleteMany({});
    console.log(`✅ ${trackRes.deletedCount} visitas de seguimiento eliminadas.`);
  } catch (e) {
    try {
      const trackRes = await mongoose.connection.db.collection('trackings').deleteMany({});
      console.log(`✅ ${trackRes.deletedCount} visitas de seguimiento eliminadas (vía colección directa).`);
    } catch (err) {
      console.log('⚠️ No se encontraron visitas de seguimiento para eliminar.');
    }
  }

  try {
    const Bitacora = mongoose.model('Bitacora') || require('./src/modules/bitacoras-dev3/bitacora.model');
    const bitRes = await Bitacora.deleteMany({});
    console.log(`✅ ${bitRes.deletedCount} bitácoras mensuales eliminadas.`);
  } catch (e) {
    try {
      const bitRes = await mongoose.connection.db.collection('bitacoras').deleteMany({});
      console.log(`✅ ${bitRes.deletedCount} bitácoras mensuales eliminadas (vía colección directa).`);
    } catch (err) {
      console.log('⚠️ No se encontraron bitácoras para eliminar.');
    }
  }

  console.log('🔄 Restableciendo campos de etapa productiva en los aprendices...');
  const userRes = await User.updateMany(
    { role: 'APRENDIZ' },
    {
      $set: {
        instructorAsignado: null,
        instructorTecnico: null,
        instructorProyecto: null,
        fechaAsignacionInstructor: null,
        historialInstructores: [],
        modalidades: [],
        tipoProyecto: null,
        onedriveFolderId: null,
        driveFolderId: null,
        status: 'ACTIVO'
      }
    }
  );
  console.log(`✅ ${userRes.modifiedCount} aprendices actualizados (campos de etapa productiva limpiados).`);

  console.log('🎉 Limpieza de Etapa Productiva completada con éxito.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error ejecutando la limpieza:', err);
  process.exit(1);
});
