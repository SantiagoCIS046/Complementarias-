// tracking.model.js   🟡 DEV 3 | Modelo de Visita de Seguimiento
// =============================================
// Registra las visitas de seguimiento que el
// instructor realiza al aprendiz en la empresa.
// =============================================
const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema(
  {
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductiveStage',
      required: [true, 'El ID de la Etapa Productiva es obligatorio'],
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del instructor es obligatorio'],
    },
    apprenticeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del aprendiz es obligatorio'],
    },
    numeroVisita: {
      type: Number,
      required: [true, 'El número de visita es obligatorio'],
      min: 1,
    },
    fechaVisita: {
      type: Date,
      required: [true, 'La fecha de visita es obligatoria'],
    },
    lugarVisita: {
      type: String,
      trim: true,
      default: '',
    },
    observaciones: {
      type: String,
      required: [true, 'Las observaciones son obligatorias'],
      trim: true,
    },
    compromisos: {
      type: String,
      trim: true,
      default: '',
    },
    calificacion: {
      type: String,
      enum: ['EXCELENTE', 'BUENO', 'ACEPTABLE', 'DEFICIENTE', null],
      default: null,
    },
    evidenciaUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

trackingSchema.index({ stageId: 1, numeroVisita: 1 }, { unique: true });

module.exports = mongoose.model('Tracking', trackingSchema);
