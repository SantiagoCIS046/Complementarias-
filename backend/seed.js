// seed.js - Script de Sembrado Real para RepFora E.P.
// Usa los modelos REALES del backend para evitar conflictos de esquema
const mongoose = require('mongoose');
const path = require('path');

// Cargar variables de entorno del backend
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Importar el modelo REAL del backend (con el middleware de hashing)
const User = require('./src/modules/users-dev1/user.model');
const Company = require('./src/modules/companies-dev2/company.model');
const ProductiveStage = require('./src/modules/productive-stages-dev2/productive-stage.model');

// Usa la MISMA conexión que el backend (MongoDB Atlas)
const MONGO_URI = process.env.MONGO_URI;
console.log('📡 Base de datos destino:', MONGO_URI ? 'MongoDB Atlas (Nube)' : '❌ MONGO_URI no encontrada');

async function runSeed() {
  try {
    console.log('🚀 Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    // Limpieza
    await User.deleteMany({});
    await Company.deleteMany({});
    await ProductiveStage.deleteMany({});
    console.log('🗑️  Colecciones limpiadas.');

    // CONTRASEÑA EN TEXTO PLANO - el modelo real la hashea automáticamente
    const PASSWORD = 'sena2024';

    // 1. ADMINISTRADOR
    const admin = await User.create({
      name: 'Administrador del Sistema Santiago Cisneros',
      email: 'santiagocisneros046@gmail.com',
      password: PASSWORD,
      role: 'ADMIN',
      documento: '1037658690'
    });
    console.log('✅ Admin creado:', admin.email);

    // 2. INSTRUCTOR
    const instructor = await User.create({
      name: 'Martin',
      email: 'martin@gmail.com',
      password: PASSWORD,
      role: 'INSTRUCTOR',
      documento: '123475869'
    });
    console.log('✅ Instructor creado:', instructor.email);

    // 3. APRENDICES (vinculados al instructor)
    const a1 = await User.create({
      name: 'Juan Mancilla',
      email: 'mancilla@gmail.com',
      password: PASSWORD,
      role: 'APRENDIZ',
      documento: '1037000111',
      instructorAsignado: instructor._id
    });

    const a2 = await User.create({
      name: 'Daniela Palacio',
      email: 'dpalacio@soy.sena.edu.co',
      password: PASSWORD,
      role: 'APRENDIZ',
      documento: '1037000333',
      instructorAsignado: instructor._id
    });
    console.log('✅ Aprendices creados: Juan Mancilla, Daniela Palacio');

    // 4. EMPRESAS
    const co1 = await Company.create({ razonSocial: 'Bancolombia S.A.', nit: '890.903.938-8' });
    const co2 = await Company.create({ razonSocial: 'Software Innovación S.A.S', nit: '900.123.456-7' });
    console.log('✅ Empresas creadas: Bancolombia, Software Innovación');

    // 5. ETAPAS PRODUCTIVAS (valores del enum real: enums.js)
    await ProductiveStage.create({
      apprenticeId: a1._id,
      instructorId: instructor._id,
      companyId: co1._id,
      ficha: '2670687',
      estado: 'REGISTRO',
      tipoFormacion: 'PRESENCIAL',
      modalidad: 'CONTRATO_APRENDIZAJE',
      horasCompletadas: 320,
      horasRequeridas: 864
    });

    await ProductiveStage.create({
      apprenticeId: a2._id,
      instructorId: instructor._id,
      companyId: co2._id,
      ficha: '2558342',
      estado: 'REGISTRO',
      tipoFormacion: 'PRESENCIAL',
      modalidad: 'VINCULACION_LABORAL',
      horasCompletadas: 864,
      horasRequeridas: 864
    });
    console.log('✅ Etapas productivas vinculadas.');

    console.log('\n--- ✅ SINCRONIZACIÓN EXITOSA ---');
    console.log('🔑 ADMIN:      santiagocisneros046@gmail.com / sena2024');
    console.log('🔑 INSTRUCTOR: martin@gmail.com / sena2024');
    console.log('🔑 APRENDIZ:   mancilla@gmail.com / sena2024');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en el seed:', err.message);
    process.exit(1);
  }
}

runSeed();
