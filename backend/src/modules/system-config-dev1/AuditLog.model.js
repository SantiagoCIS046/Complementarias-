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

// Impedir modificaciones o eliminaciones para garantizar inalterabilidad (RNF-08)
const bloquearAlteracion = function(next) {
  next(new Error('Los logs de auditoría son inalterables y no pueden ser modificados o eliminados.'));
};

auditLogSchema.pre('updateOne', bloquearAlteracion);
auditLogSchema.pre('findOneAndUpdate', bloquearAlteracion);
auditLogSchema.pre('updateMany', bloquearAlteracion);
auditLogSchema.pre('remove', bloquearAlteracion);
auditLogSchema.pre('deleteOne', bloquearAlteracion);
auditLogSchema.pre('deleteMany', bloquearAlteracion);

module.exports = mongoose.model('AuditLog', auditLogSchema);
