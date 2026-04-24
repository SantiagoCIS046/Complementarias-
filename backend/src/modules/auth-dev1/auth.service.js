// auth.service.js   🟢 DEV 1 | Autenticacion y seguridad (Mongoose)
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('./User.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../core/config/env');

/**
 * Autentica un usuario y genera un token JWT.
 */
const login = async (email, password) => {
  // 1. Buscar usuario
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error('Credenciales inválidas');

  // 2. Verificar contraseña
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Credenciales inválidas');

  // 3. Generar Token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // 4. Retornar datos (sin la contraseña)
  const { password: _, ...userObj } = user.toObject();
  return { user: userObj, token };
};

/**
 * Registra un nuevo usuario con contraseña encriptada.
 */
const register = async (userData) => {
  const { email, password, name, role } = userData;

  // 1. Verificar si ya existe
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new Error('El usuario ya existe');

  // 2. Encriptar contraseña y crear
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    name,
    role: role || 'APRENDIZ'
  });

  const { password: _, ...userObj } = newUser.toObject();
  return userObj;
};

module.exports = { login, register };