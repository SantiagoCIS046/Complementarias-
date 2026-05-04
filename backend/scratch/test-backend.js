// test-backend.js - Prueba directa del service para depurar el 500
const mongoose = require('mongoose');
const service = require('../src/modules/productive-stages-dev2/productive-stages.service');
require('dotenv').config();

async function test() {
  console.log('🧪 Iniciando prueba de depuración...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a la DB');

    // Simular un aprendiz
    const mockAprendiz = {
      _id: new mongoose.Types.ObjectId(), // Un ID aleatorio para probar
      role: 'APRENDIZ'
    };

    console.log('🔍 Llamando a service.getAll for APRENDIZ...');
    const stages = await service.getAll({ apprenticeId: mockAprendiz._id });
    console.log('✅ Éxito! Stages encontrados:', stages.length);

    console.log('🔍 Llamando a service.getAll for ADMIN...');
    const allStages = await service.getAll({});
    console.log('✅ Éxito! Total stages:', allStages.length);

  } catch (err) {
    console.error('❌ ERROR DETECTADO:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🏁 Prueba finalizada');
  }
}

test();
