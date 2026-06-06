// Notification.model.js 🔔 DEV 1 | Sistema de Alertas Globales
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  mensaje: { 
    type: String, 
    required: true 
  },
  leido: { 
    type: Boolean, 
    default: false 
  },
  tipo: { 
    type: String, 
    enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SEGUIMIENTO', 'ALERTA_BITACORA'],
    default: 'INFO'
  },
  resuelta: {
    type: Boolean,
    default: false
  },
  referencia: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  referenciaModelo: {
    type: String,
    enum: ['Tracking', 'ProductiveStage', null],
    default: null
  }
}, { timestamps: true });

// Índice para consultas rápidas por usuario + no leídas
notificationSchema.index({ usuario: 1, leido: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
