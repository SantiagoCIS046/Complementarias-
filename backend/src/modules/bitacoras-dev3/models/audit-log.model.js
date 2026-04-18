const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Puede ser null para errores de login con correos no registrados
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN_SUCCESS', 
      'LOGIN_FAILED', 
      'ACCOUNT_LOCKED', 
      'LOGOUT', 
      'USER_CREATED', 
      'USER_UPDATED', 
      'CONFIG_CHANGED',
      'INSTRUCTOR_REASSIGNED',
      'NOTIFICATION_VIEWED',
      'SERVER_ERROR'
    ],
    trim: true
  },
  module: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Para guardar IP, navegador, o cualquier otra info
    required: false
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Solo necesitamos saber cuándo se creó
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
