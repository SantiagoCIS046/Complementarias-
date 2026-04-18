const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, ESTADO_USUARIO, ESTADO_CONTRATO } = require('../../../core/utils/enums');

const userSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: [true, 'El número de identificación es obligatorio'],
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: [true, 'El nombre completo es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: 8
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.APRENDIZ
  },
  status: {
    type: String,
    enum: Object.values(ESTADO_USUARIO),
    default: ESTADO_USUARIO.ACTIVO
  },
  // Relaciones y campos específicos del SENA
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  program: {
    type: String, // ej: 'ADSO', 'COCINA', 'RECURSOS HUMANOS'
    trim: true,
    uppercase: true
  },
  ficha: {
    type: String,
    trim: true
  },
  contractStatus: {
    type: String,
    enum: Object.values(ESTADO_CONTRATO),
    default: ESTADO_CONTRATO.ACTIVO
  },
  // Seguimiento de seguridad
  loginAttempts: {
    type: Number,
    default: 0
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Middleware para cifrar la contraseña antes de guardar
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
