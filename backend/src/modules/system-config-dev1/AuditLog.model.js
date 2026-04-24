// AuditLog.model.js 🟢 DEV 1 | Registro de Auditorías
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  accion: { 
    type: String, 
    required: true 
  }, // EJ: LOGIN, DELETE_USER, UPDATE_CONFIG
  entidad: { 
    type: String 
  }, // EJ: User, ProductiveStage
  entidadId: { 
    type: String 
  },
  detalle: { 
    type: String 
  },
  ip: { 
    type: String 
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
