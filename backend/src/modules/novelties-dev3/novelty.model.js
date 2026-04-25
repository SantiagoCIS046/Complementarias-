// novelty.model.js   🟡 DEV 3 | Modelo de Novedad / Incidente
// =============================================
// Registra novedades como incapacidades, calamidades,
// permisos u otros eventos durante la EP.
// =============================================
const mongoose = require('mongoose');
const { TIPO_NOVEDAD } = require('../../core/utils/enums');

const noveltySchema = new mongoose.Schema(
  {
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductiveStage',
      required: [true, 'El ID de la Etapa Productiva es obligatorio'],
    },
    apprenticeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del aprendiz es obligatorio'],
    },
    tipo: {
      type: String,
      enum: Object.values(TIPO_NOVEDAD),
      required: [true, 'El tipo de novedad es obligatorio'],
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción de la novedad es obligatoria'],
      trim: true,
    },
    fechaInicio: {
      type: Date,
      required: [true, 'La fecha de inicio es obligatoria'],
    },
    fechaFin: {
      type: Date,
      default: null,
    },
    diasAfectados: {
      type: Number,
      default: 0,
      min: 0,
    },
    soporteUrl: {
      type: String,
      trim: true,
      default: '', // URL del soporte/evidencia
    },
    estado: {
      type: String,
      enum: ['PENDIENTE', 'APROBADA', 'RECHAZADA'],
      default: 'PENDIENTE',
    },
    revisadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    observaciones: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Novelty', noveltySchema);
