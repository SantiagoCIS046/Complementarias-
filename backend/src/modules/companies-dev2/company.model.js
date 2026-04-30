const mongoose = require('mongoose');

/**
 * CompanySchema
 * Representa las empresas donde los aprendices realizan su etapa productiva.
 */
const CompanySchema = new mongoose.Schema({
  razonSocial: {
    type: String,
    required: [true, 'La razón social es obligatoria'],
    trim: true
  },
  nit: {
    type: String,
    required: [true, 'El NIT es obligatorio'],
    unique: true,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  emailContacto: {
    type: String,
    trim: true,
    lowercase: true
  },
  telefonoContacto: {
    type: String,
    trim: true
  },
  jefeInmediato: {
    type: String,
    trim: true
  },
  cargoJefe: {
    type: String,
    trim: true
  },
  sector: {
    type: String,
    enum: ['PÚBLICO', 'PRIVADO', 'MIXTO'],
    default: 'PRIVADO'
  },
  status: {
    type: String,
    enum: ['ACTIVO', 'INACTIVO'],
    default: 'ACTIVO'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Company', CompanySchema);
