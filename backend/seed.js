// seed.js - DEV 1 | Agregando usuario de prueba personal
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

const User = require('./src/modules/users-dev1/user.model');
const SystemConfig = require('./src/modules/system-config-dev1/SystemConfig.model');

async function main() {
  console.log('🌱 Actualizando usuarios...');
  await mongoose.connect(process.env.MONGO_URI);

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. Super Admin original
  await User.findOneAndUpdate(
    { email: 'admin@repfora.com' },
    { documento: '00000001', password: hashedPassword, name: 'Super Admin', role: 'ADMIN', status: 'ACTIVO', isFirstLogin: false },
    { upsert: true }
  );

  // 2. TU USUARIO PARA PRUEBAS (SANTIAGO)
  await User.findOneAndUpdate(
    { email: 'santiagocisneros046@gmail.com' },
    { documento: '1100976876', password: hashedPassword, name: 'Santiago Cisneros', role: 'ADMIN', status: 'ACTIVO', isFirstLogin: false },
    { upsert: true }
  );

  // 3. NUEVO INSTRUCTOR
  const instructorPass = await bcrypt.hash('mancilla123', 10);
  await User.findOneAndUpdate(
    { email: 'mancilla@gmail.com' },
    { documento: '88888888', password: instructorPass, name: 'Instructor Mancilla', role: 'INSTRUCTOR', status: 'ACTIVO' },
    { upsert: true }
  );

  // 4. NUEVO APRENDIZ
  const aprendizPass = await bcrypt.hash('martin123', 10);
  await User.findOneAndUpdate(
    { email: 'martin@gmail.com' },
    { documento: '99999999', password: aprendizPass, name: 'Aprendiz Martin', role: 'APRENDIZ', status: 'ACTIVO' },
    { upsert: true }
  );

  console.log('✅ Usuarios listos para pruebas');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
