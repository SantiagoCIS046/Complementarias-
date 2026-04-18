const User = require('../users-dev1/models/user.model');
const { generateToken } = require('../../core/utils/jwt');
const { logAction } = require('../../core/utils/logger');
const configHelper = require('../../core/utils/configHelper');

/**
 * Lógica de inicio de sesión
 * @param {String} email 
 * @param {String} password 
 * @param {Object} metadata - IP y UserAgent
 */
const login = async (email, password, metadata = {}) => {
  const { ipAddress, userAgent } = metadata;

  // 1. Obtener parámetros de configuración (ej: intentos permitidos)
  const maxAttempts = await configHelper.get('MAX_LOGIN_ATTEMPTS', 5);

  // 2. Buscar usuario
  const user = await User.findOne({ email });
  if (!user) {
    // Registrar intento fallido (usuario no existe)
    await logAction({
      action: 'LOGIN_FAILED',
      module: 'AUTH',
      details: { email, reason: 'CORREO_NO_REGISTRADO' },
      ipAddress,
      userAgent
    });
    throw new Error('CORREO_NO_REGISTRADO');
  }

  // 2. Verificar si está bloqueado
  if (user.status === 'blocked') {
    await logAction({
      user: user._id,
      action: 'LOGIN_FAILED',
      module: 'AUTH',
      details: { email, reason: 'CUENTA_BLOQUEADA' },
      ipAddress,
      userAgent
    });
    throw new Error('CUENTA_BLOQUEADA');
  }

  // 3. Verificar contraseña
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    // Incrementar intentos fallidos
    user.loginAttempts += 1;
    
    // Bloquear si llega al límite configurado (ej: 5 intentos)
    if (user.loginAttempts >= maxAttempts) {
      user.status = 'blocked';
      await user.save();
      
      await logAction({
        user: user._id,
        action: 'ACCOUNT_LOCKED',
        module: 'AUTH',
        details: { email, attempts: user.loginAttempts, limit: maxAttempts },
        ipAddress,
        userAgent
      });
      throw new Error('CUENTA_BLOQUEADA');
    }

    await user.save();

    await logAction({
      user: user._id,
      action: 'LOGIN_FAILED',
      module: 'AUTH',
      details: { email, attempts: user.loginAttempts },
      ipAddress,
      userAgent
    });
    throw new Error('CREDENCIALES_INVALIDAS');
  }

  // 4. Login exitoso: Resetear intentos y actualizar último acceso
  user.loginAttempts = 0;
  user.lastLogin = new Date();
  await user.save();

  // Registrar éxito
  await logAction({
    user: user._id,
    action: 'LOGIN_SUCCESS',
    module: 'AUTH',
    details: { email },
    ipAddress,
    userAgent
  });

  // 5. Generar Token
  const token = generateToken({
    id: user._id,
    role: user.role,
    email: user.email
  });

  // 6. Retornar datos (sin password)
  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isFirstLogin: user.isFirstLogin
    },
    token
  };
};

/**
 * Cambio de contraseña (especialmente para primer ingreso)
 * @param {String} userId 
 * @param {String} currentPassword 
 * @param {String} newPassword 
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('USUARIO_NO_ENCONTRADO');

  // Verificar contraseña actual
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new Error('CONTRASENA_ACTUAL_INCORRECTA');

  // Actualizar contraseña
  user.password = newPassword;
  user.isFirstLogin = false; // Marcar que ya entró y cambió su clave
  await user.save();

  // Registrar en bitácora
  await logAction({
    user: user._id,
    action: 'USER_UPDATED',
    module: 'AUTH',
    details: { action: 'PASSWORD_CHANGED' }
  });

  return { message: 'Contraseña actualizada correctamente' };
};

module.exports = {
  login,
  changePassword
};
