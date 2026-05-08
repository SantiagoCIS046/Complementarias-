const mongoose = require('mongoose');

/**
 * BatchSchema (Ficha)
 * Representa un grupo de formación (Ficha) en el SENA.
 * Centraliza la relación entre el instructor y sus aprendices.
 */
const BatchSchema = new mongoose.Schema({
  codigo_ficha: {
    type: String,
    required: [true, 'El código de la ficha es obligatorio'],
    unique: true,
    trim: true
  },
  programa: {
    type: String,
    required: [true, 'El programa de formación es obligatorio'],
    trim: true
  },
  nivel_formacion: {
    type: String,
    enum: ['Técnico', 'Tecnólogo', 'Especialización Tecnológica', 'Operario', 'Auxiliar'],
    default: 'Tecnólogo'
  },
  fecha_inicio_ep: {
    type: Date,
    required: [true, 'La fecha de inicio de etapa productiva es obligatoria']
  },
  fecha_fin_ep: {
    type: Date,
    required: [true, 'La fecha de fin de etapa productiva es obligatoria']
  },
  instructor_asignado: {
    instructor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    nombre: {
      type: String,
      trim: true
    }
  },
  centro_formacion: {
    type: String,
    default: 'Centro Agroturístico - San Gil',
    trim: true
  },
  estado: {
    type: String,
    enum: ['ACTIVA', 'PENDIENTE_INSTRUCTOR', 'TERMINADA'],
    default: 'PENDIENTE_INSTRUCTOR'
  },
  aprendices_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Batch', BatchSchema);
