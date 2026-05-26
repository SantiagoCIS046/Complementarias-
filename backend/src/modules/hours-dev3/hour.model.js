// hour.model.js   🟡 DEV 3 | Modelo de Registro de Horas
// =============================================
// Registra las horas diarias que el aprendiz
// reporta durante su Etapa Productiva.
// =============================================
const mongoose = require('mongoose');

const hourSchema = new mongoose.Schema(
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
    fecha: {
      type: Date,
      required: [true, 'La fecha es obligatoria'],
    },
    horaEntrada: {
      type: String,
      required: [function() { return !this.isAdditionalHour; }, 'La hora de entrada es obligatoria'],
      trim: true, // Formato: "08:00"
    },
    horaSalida: {
      type: String,
      required: [function() { return !this.isAdditionalHour; }, 'La hora de salida es obligatoria'],
      trim: true, // Formato: "17:00"
    },
    horasTrabajadas: {
      type: Number,
      required: [function() { return !this.isAdditionalHour; }, 'Las horas trabajadas son obligatorias'],
      min: 0,
      max: 24,
      default: 0,
    },
    actividades: {
      type: String,
      trim: true,
      default: '',
    },
    observaciones: {
      type: String,
      trim: true,
      default: '',
    },
    validado: {
      type: Boolean,
      default: false,
    },
    isAdditionalHour: {
      type: Boolean,
      default: false,
    },
    trackingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tracking',
      default: null,
    },
    ejecutado: {
      type: Boolean,
      default: false,
    },
    cobrado: {
      type: Boolean,
      default: false,
    },
    pendiente: {
      type: Boolean,
      default: true,
    },
    tipo: {
      type: String,
      enum: ['REGULAR', 'PASANTIA', 'BRIGADA', 'PROYECTO'],
      default: 'REGULAR',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Un aprendiz no puede registrar dos veces el mismo día para la misma EP
hourSchema.index(
  { stageId: 1, apprenticeId: 1, fecha: 1 },
  { 
    unique: true, 
    partialFilterExpression: { isAdditionalHour: { $ne: true } } 
  }
);

module.exports = mongoose.model('Hour', hourSchema);
