// register-ep.js - Registra una EP para un aprendiz
const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../src/modules/users-dev1/user.model');
  const ProductiveStage = require('../src/modules/productive-stages-dev2/productive-stage.model');

  const apprentice = await User.findOne({ role: 'APRENDIZ' });
  if (!apprentice) {
    console.log('❌ No hay aprendices en la DB');
    return await mongoose.disconnect();
  }

  console.log('👤 Registrando EP para:', apprentice.email);

  try {
    const ep = await ProductiveStage.create({
      apprenticeId: apprentice._id,
      estado: 'SOLICITUD',
      modalidad: 'CONTRATO_APRENDIZAJE',
      horasCompletadas: 0,
      horasRequeridas: 880,
      cronogramaConfigurado: false
    });
    console.log('✅ EP Creada:', ep.radicado || ep._id);
  } catch (err) {
    console.error('❌ Error al crear EP:', err);
  }

  await mongoose.disconnect();
}

test();
