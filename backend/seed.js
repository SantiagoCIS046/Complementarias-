// seed.js - Crear datos iniciales en la base de datos (Mongoose)
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

// Definir el schema inline para no tener dependencias circulares
const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name:     String,
  role:     { type: String, default: 'APRENDIZ' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function main() {
  console.log('🌱 Iniciando seed...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Conectado a MongoDB');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await User.findOneAndUpdate(
    { email: 'admin@repfora.com' },
    {
      email: 'admin@repfora.com',
      password: hashedPassword,
      name: 'Administrador RepFora',
      role: 'ADMIN'
    },
    { upsert: true, new: true }
  );

  console.log('✅ Usuario Administrador creado/actualizado:', admin.email);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('❌ Error en el seed:', e);
  process.exit(1);
});
