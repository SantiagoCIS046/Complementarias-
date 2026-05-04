// list-stages.js - Lista cruda de la colección productive-stages
const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collection = db.collection('productivestages'); // El nombre suele ser plural minúscula en Mongoose

  console.log('🔍 Buscando en colección:', collection.collectionName);
  const docs = await collection.find({}).toArray();
  console.log('📄 Documentos encontrados:', JSON.stringify(docs, null, 2));

  await mongoose.disconnect();
}

test();
