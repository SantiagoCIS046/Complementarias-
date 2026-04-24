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
    enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
    default: 'INFO'
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
