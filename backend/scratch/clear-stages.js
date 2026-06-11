const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function clear() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGO_URI no encontrada en el archivo .env.');
    process.exit(1);
  }

  console.log('📡 Conectando a MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ Conectado.');

  console.log('🧹 Limpiando colecciones de Etapas Productivas, Documentos, Seguimientos y Bitácoras...');
  
  await mongoose.connection.collection('productivestages').drop()
    .then(() => console.log('🗑️  Colección "productivestages" eliminada.'))
    .catch(() => console.log('💡 Colección "productivestages" ya estaba limpia o no existía.'));

  await mongoose.connection.collection('documents').drop()
    .then(() => console.log('🗑️  Colección "documents" eliminada.'))
    .catch(() => console.log('💡 Colección "documents" ya estaba limpia o no existía.'));

  await mongoose.connection.collection('trackings').drop()
    .then(() => console.log('🗑️  Colección "trackings" eliminada.'))
    .catch(() => console.log('💡 Colección "trackings" ya estaba limpia o no existía.'));

  await mongoose.connection.collection('bitacoras').drop()
    .then(() => console.log('🗑️  Colección "bitacoras" eliminada.'))
    .catch(() => console.log('💡 Colección "bitacoras" ya estaba limpia o no existía.'));

  console.log('✅ Base de datos limpia de vinculaciones de empresas y etapas productivas.');
  await mongoose.disconnect();
}

clear().catch(err => {
  console.error('❌ Error durante la limpieza:', err);
  process.exit(1);
});
