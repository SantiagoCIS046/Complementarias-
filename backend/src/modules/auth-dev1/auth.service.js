// auth.service.js   🟢 DEV 1 | Autenticacion y seguridad
// =============================================
// Lógica de negocio para registro y login.
// Usa JWT para generar tokens de sesión.
// =============================================

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../users-dev1/user.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../core/config/env');
const { sendEmail } = require('../../core/utils/mailer');

/**
 * Registrar un nuevo usuario.
 */
const registrar = async ({ name, email, password, role, documento, telefono, ficha, programa }) => {
  // Verificar que no exista el email
  const existe = await User.findOne({ email });
  if (existe) {
    throw new Error('Ya existe un usuario registrado con el email: ' + email);
  }

  const usuario = await User.create({
    name,
    email,
    password,
    role: role || 'APRENDIZ',
    documento,
    telefono,
    ficha,
    programa,
  });

  // Generar token
  const token = generarToken(usuario);

  return {
    usuario: {
      _id:   usuario._id,
      name:  usuario.name,
      email: usuario.email,
      role:  usuario.role,
    },
    token,
  };
};

/**
 * Login de usuario.
 */
const login = async ({ email, password }) => {
  // Buscar usuario (incluyendo el campo password que tiene select: false)
  const usuario = await User.findOne({ email }).select('+password');
  if (!usuario) {
    throw new Error('Credenciales inválidas.');
  }

  // Verificar contraseña
  const passwordValido = await usuario.comparePassword(password);
  if (!passwordValido) {
    throw new Error('Credenciales inválidas.');
  }

  // Verificar que esté activo
  if (!usuario.activo) {
    throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
  }

  // Generar token
  const token = generarToken(usuario);

  return {
    usuario: {
      _id:   usuario._id,
      name:  usuario.name,
      email: usuario.email,
      role:  usuario.role,
    },
    token,
  };
};

/**
 * Obtener perfil del usuario autenticado.
 */
const getPerfil = async (userId) => {
  const usuario = await User.findById(userId);
  if (!usuario) {
    throw new Error('Usuario no encontrado.');
  }
  return usuario;
};

/**
 * Generar JWT.
 */
const generarToken = (usuario) => {
  return jwt.sign(
    {
      _id:   usuario._id,
      name:  usuario.name,
      email: usuario.email,
      role:  usuario.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Solicitar restablecimiento de contraseña.
 * Genera un token temporal y envía email al usuario.
 */
const forgotPassword = async ({ email }) => {
  const usuario = await User.findOne({ email });
  if (!usuario) {
    // Respondemos igual aunque no exista por seguridad (no revelar si el email existe)
    return { message: 'Si ese correo existe, recibirás un enlace para restablecer tu contraseña.' };
  }

  // Generar token aleatorio de 32 bytes
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // Expira en 1 hora

  // Guardar token hasheado en la BD
  usuario.resetPasswordToken   = crypto.createHash('sha256').update(token).digest('hex');
  usuario.resetPasswordExpires = expiry;
  await usuario.save({ validateBeforeSave: false });

  // Enviar email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail({
    to:      usuario.email,
    subject: 'Restablecer contraseña — RepFora',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#39A900">🔒 Restablecer contraseña</h2>
        <p>Hola <strong>${usuario.name}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña en RepFora.</p>
        <p>Haz clic en el botón para continuar. El enlace expira en <strong>1 hora</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#39A900;
                  color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
          Restablecer contraseña
        </a>
        <p style="color:#666;font-size:12px;">Si no solicitaste esto, ignora este correo.</p>
        <hr/>
        <p style="color:#999;font-size:11px;">RepFora · SENA</p>
      </div>
    `,
  });

  return { message: 'Si ese correo existe, recibirás un enlace para restablecer tu contraseña.' };
};

/**
 * Restablecer contraseña con el token del email.
 */
const resetPassword = async ({ token, newPassword }) => {
  if (!token || !newPassword) {
    throw new Error('Token y nueva contraseña son requeridos.');
  }

  if (newPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  // Hashear el token recibido para comparar con el de la BD
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const usuario = await User.findOne({
    resetPasswordToken:   tokenHash,
    resetPasswordExpires: { $gt: Date.now() }, // No expirado
  });

  if (!usuario) {
    throw new Error('El enlace de restablecimiento no es válido o ha expirado.');
  }

  // Actualizar contraseña y limpiar el token
  usuario.password             = newPassword;
  usuario.resetPasswordToken   = null;
  usuario.resetPasswordExpires = null;
  await usuario.save();

  return { message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
};

module.exports = {
  registrar,
  login,
  getPerfil,
  forgotPassword,
  resetPassword,
};