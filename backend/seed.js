// seed.js - DEV 1 | Agregando usuario de prueba personal
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

const User = require('./src/modules/auth-dev1/User.model');
const SystemConfig = require('./src/modules/system-config-dev1/SystemConfig.model');

async function main() {
  console.log('🌱 Actualizando usuarios...');
  await mongoose.connect(process.env.MONGO_URI);

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. Super Admin original
  await User.findOneAndUpdate(
    { email: 'admin@repfora.com' },
    { documento: '12345678', password: hashedPassword, name: 'Super Admin', role: 'ADMIN', status: 'ACTIVO', isFirstLogin: false },
    { upsert: true }
  );

  // 2. TU USUARIO PARA PRUEBAS (SANTIAGO)
  await User.findOneAndUpdate(
    { email: 'santiagocisneros046@gmail.com' },
    { 
      documento: '1100976876', 
      password: hashedPassword, 
      name: 'Santiago Cisneros', 
      role: 'ADMIN', 
      status: 'ACTIVO',
      isFirstLogin: false 
    },
    { upsert: true }
  );

  console.log('✅ Usuarios listos para pruebas');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
