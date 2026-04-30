const mongoose = require('mongoose');
const User = require('./modules/users-dev1/user.model');
const connectDB = require('./core/config/db');
const { ROLES } = require('./core/utils/enums');

const seedUsers = async () => {
  try {
    await connectDB();

    // Limpiar usuarios existentes por email o documento
    await User.deleteMany({ 
      $or: [
        { email: { $in: ['admin@sena.edu.co', 'aprendiz@sena.edu.co'] } },
        { documento: { $in: ['12345678', '87654321'] } }
      ]
    });

    const users = [
      {
        name: 'Administrador Sistema',
        email: 'admin@sena.edu.co',
        password: 'admin123',
        role: ROLES.ADMIN,
        documento: '12345678',
        activo: true,
        status: 'ACTIVO',
        isFirstLogin: false
      },
      {
        name: 'Aprendiz Prueba',
        email: 'aprendiz@sena.edu.co',
        password: 'aprendiz123',
        role: ROLES.APRENDIZ,
        documento: '87654321',
        activo: true,
        status: 'ACTIVO',
        isFirstLogin: false,
        ficha: '2560664',
        programa: 'ADSO'
      }
    ];

    for (const u of users) {
      const newUser = new User(u);
      await newUser.save();
      console.log(`👤 Usuario creado: ${u.email} (${u.role})`);
    }

    console.log('✅ Seeding completado con éxito.');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error en el seeding: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();
