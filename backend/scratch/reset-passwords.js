const connectDB = require('../src/core/config/db');
const User = require('../src/modules/users-dev1/user.model');
const bcrypt = require('bcryptjs');

(async () => {
  await connectDB();

  const NEW_PASSWORD = 'sena2024';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);

  const emails = [
    'mancilla@gmail.com',
    'martin@gmail.com',
    'santiagocisneros046@gmail.com',
    'elena@gmail.com',
    'dpalacio@soy.sena.edu.co'
  ];

  for (const email of emails) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`❌ No encontrado: ${email}`);
      continue;
    }

    // Verificar si la contraseña actual ya es sena2024
    const match = await bcrypt.compare(NEW_PASSWORD, user.password || '');
    if (match) {
      console.log(`✅ Contraseña ya correcta: ${email}`);
    } else {
      // Actualizar directamente en la BD (sin pasar por el pre-save hook que hashearía dos veces)
      await User.updateOne({ email }, { $set: { password: hashedPassword, loginAttempts: 0, lockUntil: null } });
      console.log(`🔑 Contraseña reseteada a 'sena2024': ${email}`);
    }
  }

  // Verificar que el login funciona
  const testUser = await User.findOne({ email: 'mancilla@gmail.com' }).select('+password');
  const ok = await bcrypt.compare(NEW_PASSWORD, testUser.password);
  console.log(`\n🧪 Verificación login mancilla@gmail.com: ${ok ? '✅ OK' : '❌ FALLO'}`);

  process.exit(0);
})();
