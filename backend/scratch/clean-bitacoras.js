// clean-bitacoras.js - Temporary script to delete bitacoras and reset stage statistics
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Bitacora = require('../src/modules/bitacoras-dev3/bitacora.model');
const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');

async function clean() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI no definida en el archivo .env');
    process.exit(1);
  }

  console.log('📡 Conectando a MongoDB...');
  await mongoose.connect(MONGO_URI);

  console.log('🧹 Eliminando todas las bitácoras...');
  const bitacorasResult = await Bitacora.deleteMany({});
  console.log(`✅ Se eliminaron ${bitacorasResult.deletedCount} bitácoras.`);

  console.log('🔄 Reiniciando horas completadas y chat de observaciones en las etapas productivas...');
  const stageResult = await ProductiveStage.updateMany(
    {},
    {
      $set: {
        horasCompletadas: 0,
        chatObservaciones: []
      }
    }
  );
  console.log(`✅ Se actualizaron ${stageResult.modifiedCount} etapas productivas.`);

  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB.');
}

clean().catch(err => {
  console.error('❌ Error al ejecutar la limpieza:', err);
  process.exit(1);
});
