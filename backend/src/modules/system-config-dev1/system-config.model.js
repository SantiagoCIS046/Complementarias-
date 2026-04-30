// system-config.model.js  DEV 1 | Modelo de Configuración del Sistema
const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema(
  {
    clave: {
      type: String,
      required: [true, 'La clave es obligatoria'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    valor: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'El valor es obligatorio'],
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
