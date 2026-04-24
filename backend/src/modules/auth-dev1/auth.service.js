// auth.service.js   🟢 DEV 1 | Seguridad con Seguimiento Total
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('./User.model');
const { registrarAuditoria } = require('../../core/utils/audit');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../core/config/env');

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 1000;

/**
 * Login con Seguimiento en Consola y DB
 */
const login = async (email, password, ip) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  
  // LOG DE INTENTO (Consola)
  console.log(`\n🔑 INTENTO DE LOGIN: [${email}] | Clave usada: [${password}]`);

  if (!user) {
    await registrarAuditoria({
      accion: 'LOGIN_FAILED',
      detalle: `Usuario no encontrado: ${email} | Intento con clave: ${password}`,
      ip
    });
    throw new Error('Credenciales inválidas');
  }

  if (user.isLocked) {
    throw new Error('Cuenta bloqueada temporalmente');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= MAX_ATTEMPTS) user.lockUntil = Date.now() + LOCK_TIME;
    await user.save();
    
    await registrarAuditoria({
      usuarioId: user._id,
      accion: 'LOGIN_FAILED',
      detalle: `Contraseña incorrecta para ${email} | Usó: ${password}`,
      ip
    });
    throw new Error('Credenciales inválidas');
  }

  // Éxito
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  await registrarAuditoria({
    usuarioId: user._id,
    accion: 'LOGIN_SUCCESS',
    detalle: `Ingreso exitoso al sistema: ${email}`,
    ip
  });

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { user, token };
};

/**
 * Recuperación con Seguimiento
 */
const generateResetToken = async (email, ip) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  
  await registrarAuditoria({
    accion: 'FORGOT_PASSWORD_REQUEST',
    detalle: `Solicitud de recuperación para: ${email}`,
    ip
  });

  if (!user) throw new Error('Enlace enviado si el correo existe');

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  return resetToken;
};

/**
 * Reset con Seguimiento de Nueva Clave
 */
const resetPassword = async (token, newPassword, ip) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) throw new Error('Token inválido');

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.isFirstLogin = false;
  await user.save();

  await registrarAuditoria({
    usuarioId: user._id,
    accion: 'PASSWORD_RESET_SUCCESS',
    detalle: `Cambio de contraseña exitoso para ${user.email} | Nueva clave: ${newPassword}`,
    ip
  });

  return { message: 'Contraseña actualizada' };
};

/**
 * Cambio de contraseña (Para primer ingreso o perfil)
 */
const updatePassword = async (userId, newPassword, ip) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');

  user.password = await bcrypt.hash(newPassword, 10);
  user.isFirstLogin = false; // Ya no es su primer ingreso
  await user.save();

  await registrarAuditoria({
    usuarioId: user._id,
    accion: 'PASSWORD_UPDATE',
    detalle: `El usuario ${user.email} cambió su contraseña manualmente.`,
    ip
  });

  return { message: 'Contraseña actualizada correctamente' };
};

module.exports = { login, generateResetToken, resetPassword, updatePassword };