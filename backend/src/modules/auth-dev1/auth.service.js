// auth.service.js   🟢 DEV 1 | Autenticacion y seguridad
// =============================================
// Lógica de negocio para registro y login.
// Usa JWT para generar tokens de sesión.
// =============================================

const jwt  = require('jsonwebtoken');
const User = require('../users-dev1/user.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../core/config/env');

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

module.exports = {
  registrar,
  login,
  getPerfil,
};