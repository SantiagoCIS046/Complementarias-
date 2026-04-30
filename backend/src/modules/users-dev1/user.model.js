// user.model.js   🟢 DEV 1 | Modelo de Usuario
// =============================================
// Esquema Mongoose para usuarios del sistema.
// Referenciado por: auth, productive-stages, documents, bitacoras.
// =============================================
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { ROLES } = require('../../core/utils/enums');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // No se devuelve por defecto en las consultas
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.APRENDIZ,
    },
    documento: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Permite nulls
    },
    telefono: {
      type: String,
      trim: true,
    },
    ficha: {
      type: String,
      trim: true,
    },
    programa: {
      type: String,
      trim: true,
    },
    fechaFinLectiva: {
      type: Date,
      default: null, // Fecha fin etapa lectiva (para elegibilidad EP)
    },
    instructorAsignado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    // --- Seguridad y Bloqueos (DEV 1) ---
    status: {
      type: String,
      enum: ['ACTIVO', 'INACTIVO', 'ELEGIBLE', 'CONTRACT_ENDED', 'CONTRATO_TERMINADO', 'EN CURSO', 'FINALIZADA', 'RENOVACION'],
      default: 'ACTIVO',
    },
    loginAttempts: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    lockUntil: { 
      type: Date 
    },
    isFirstLogin: { 
      type: Boolean, 
      default: true 
    },
    // Recuperación de Contraseña
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// --- Virtual para saber si el usuario está bloqueado ---
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// --- Middleware: hashear contraseña antes de guardar ---
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// --- Método: comparar contraseña ---
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
