// User.model.js  🟢 DEV 1 | Modelo de Usuario Completo (Mongoose)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    documento: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    name: { 
      type: String, 
      trim: true 
    },
    role: { 
      type: String, 
      enum: ['ADMIN', 'INSTRUCTOR', 'APRENDIZ', 'EMPRESA'], 
      default: 'APRENDIZ' 
    },
    status: {
      type: String,
      enum: ['ACTIVO', 'INACTIVO', 'ELEGIBLE', 'CONTRATO_TERMINADO'],
      default: 'ACTIVO'
    },
    // Seguridad y Bloqueos
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
    resetPasswordToken:   { type: String },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true }
);

// Método virtual para saber si el usuario está bloqueado
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

module.exports = mongoose.model('User', userSchema);
