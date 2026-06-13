// clean-productive-stages.js - Eliminar etapa productiva a todos los aprendices
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/modules/users-dev1/user.model');
const ProductiveStage = require('./src/modules/productive-stages-dev2/productive-stage.model');
const Document = require('./src/modules/documents-dev2/document.model');

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
        modalidades: []
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
