// company.model.js 🔵 DEV 2 | Modelo de Empresa
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    nit: {
      type: String,
      required: [true, 'El NIT es obligatorio'],
      unique: true,
      trim: true,
    },
    razonSocial: {
      type: String,
      required: [true, 'La razón social es obligatoria'],
      trim: true,
    },
    direccion: {
      type: String,
      trim: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    emailContacto: {
      type: String,
      trim: true,
      lowercase: true,
    },
    jefeInmediato: {
      type: String,
      trim: true,
    },
    telefonoJefe: {
      type: String,
      trim: true,
    },
    emailJefe: {
      type: String,
      trim: true,
      lowercase: true,
    },
    activa: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Company', companySchema);
