const connectDB = require('../src/core/config/db');
const User = require('../src/modules/users-dev1/user.model');

(async () => {
  await connectDB();

  // Desbloquear todos los usuarios con intentos fallidos
  const result = await User.updateMany(
    { loginAttempts: { $gt: 0 } },
    { $set: { loginAttempts: 0, lockUntil: null } }
  );
  console.log('✅ Usuarios desbloqueados:', result.modifiedCount);

  // Verificar estado de usuarios principales
  const users = await User.find({
    email: { $in: ['mancilla@gmail.com', 'martin@gmail.com', 'santiagocisneros046@gmail.com', 'elena@gmail.com'] }
  }).select('name email loginAttempts lockUntil status');

  users.forEach(u => {
    console.log(`${u.email} | intentos: ${u.loginAttempts} | lockUntil: ${u.lockUntil} | status: ${u.status}`);
  });

  process.exit(0);
})();
