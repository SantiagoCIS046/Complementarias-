const mongoose = require('mongoose');
const User = require('../../modules/users-dev1/models/user.model');
const SystemConfig = require('../../modules/system-config-dev1/models/system-config.model');
const { MONGO_URI } = require('../config/env');

async function seed() {
  try {
    console.log('--- 🌱 Iniciando Script de Seed (Semilla) ---');
    console.log('Conectando a MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);

    // 1. Inicializar Parámetros de Configuración
    console.log('Configurando parámetros iniciales...');
    const defaultConfigs = [
      { key: 'MAX_LOGIN_ATTEMPTS', value: 5, description: 'Número máximo de intentos fallidos antes de bloquear la cuenta' },
      { key: 'LOCKOUT_TIME_MINUTES', value: 240, description: 'Tiempo de espera recomendado antes de contactar a soporte (en minutos)' }, // 4 horas por defecto
      { key: 'JWT_LIFETIME', value: '8h', description: 'Tiempo de vida de la sesión del usuario' }
    ];

    for (const cfg of defaultConfigs) {
      await SystemConfig.findOneAndUpdate(
        { key: cfg.key },
        cfg,
        { upsert: true, new: true }
      );
    }
    console.log('✅ Parámetros iniciales listos.');

    // 2. Inicializar Administrador Principal
    console.log('Verificando administrador principal...');
    const adminEmail = 'admin@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const admin = new User({
        nationalId: '1000000000',
        fullName: 'Administrador del Sistema',
        email: adminEmail,
        password: 'admin123456', // Mínimo 8 caracteres requerido
        role: 'admin',
        status: 'active',
        isFirstLogin: true
      });
      await admin.save();
      console.log(`✅ Administrador creado con éxito: ${adminEmail}`);
    } else {
      console.log('ℹ️ El administrador ya existe, no se realizaron cambios en su cuenta.');
    }

    console.log('\n--- ✨ Seed completado con éxito ---');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante el Seed:', error.message);
    process.exit(1);
  }
}

seed();
