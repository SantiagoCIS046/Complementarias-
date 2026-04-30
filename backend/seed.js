// seed.js - DEV 1 | Agregando usuario de prueba personal
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/modules/users-dev1/user.model');
const SystemConfig = require('./src/modules/system-config-dev1/SystemConfig.model');

async function main() {
  console.log('🌱 Limpiando y actualizando usuarios...');
  await mongoose.connect(process.env.MONGO_URI);

  // Limpiar usuarios existentes para evitar conflictos de duplicados
  await User.deleteMany({});

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. LOS 3 ADMINS SOLICITADOS
  await User.findOneAndUpdate(
    { email: 'santiago@repfora.com' },
    { documento: '1100976876', password: hashedPassword, name: 'Santiago Cisneros', role: 'ADMIN', status: 'ACTIVO', isFirstLogin: false },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'admin2@sena.edu.co' },
    { documento: '00000002', password: hashedPassword, name: 'Admin de Pruebas', role: 'ADMIN', status: 'ACTIVO', isFirstLogin: false },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'coordinador@sena.edu.co' },
    { documento: '00000003', password: hashedPassword, name: 'Coordinador Sistema', role: 'ADMIN', status: 'ACTIVO', isFirstLogin: false },
    { upsert: true }
  );

  // 2. TU USUARIO PERSONAL (Documento distinto para evitar conflicto)
  await User.findOneAndUpdate(
    { email: 'santiagocisneros046@gmail.com' },
    { documento: '1100976877', password: hashedPassword, name: 'Santiago Personal', role: 'ADMIN', status: 'ACTIVO' },
    { upsert: true }
  );

  // 3. INSTRUCTORES Y APRENDICES
  await User.findOneAndUpdate(
    { email: 'mancilla@gmail.com' },
    { documento: '88888888', password: await bcrypt.hash('mancilla123', 10), name: 'Instructor Mancilla', role: 'INSTRUCTOR', status: 'ACTIVO' },
    { upsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'martin@gmail.com' },
    { documento: '99999999', password: await bcrypt.hash('martin123', 10), name: 'Aprendiz Martin', role: 'APRENDIZ', status: 'ACTIVO' },
    { upsert: true }
  );

  console.log('✅ Base de datos poblada con éxito');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
