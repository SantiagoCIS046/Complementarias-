// clean-seed.js - DEV 1 | Limpieza y Carga Total
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

const User = require('./src/modules/auth-dev1/User.model');

async function main() {
  console.log('🧹 Limpiando base de datos...');
  await mongoose.connect(process.env.MONGO_URI);
  
  // Borrar usuarios anteriores para evitar choques de índices viejos
  await User.collection.drop().catch(e => console.log('Colección limpia'));

  const hashedPassword = await bcrypt.hash('admin123', 10);

  console.log('🌱 Creando usuarios nuevos...');
  
  // 1. Admin
  await User.create({
    documento: '12345678',
    email: 'admin@repfora.com',
    password: hashedPassword,
    name: 'Super Admin',
    role: 'ADMIN',
    status: 'ACTIVO',
    isFirstLogin: false
  });

  // 2. Santiago (Tú)
  await User.create({
    documento: '10203040',
    email: 'santiagocisneros046@gmail.com',
    password: hashedPassword,
    name: 'Santiago Cisneros',
    role: 'ADMIN',
    status: 'ACTIVO',
    isFirstLogin: false
  });

  console.log('✅ Base de datos lista y actualizada');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
