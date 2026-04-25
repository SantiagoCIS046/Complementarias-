// bitacora.model.js   🟡 DEV 3 | Modelo de Bitácora / Evidencias
// =============================================
// Registra las bitácoras semanales que el aprendiz
// sube como evidencia de su Etapa Productiva.
// =============================================
const mongoose = require('mongoose');

const bitacoraSchema = new mongoose.Schema(
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
    semana: {
      type: Number,
      required: [true, 'El número de semana es obligatorio'],
      min: 1,
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción de actividades es obligatoria'],
      trim: true,
    },
    evidencias: [
      {
        nombreArchivo: { type: String, trim: true },
        url:           { type: String, trim: true },
        driveFileId:   { type: String, default: null },
      },
    ],
    horasReportadas: {
      type: Number,
      required: [true, 'Las horas reportadas son obligatorias'],
      min: 0,
    },
    estado: {
      type: String,
      enum: ['PENDIENTE', 'APROBADA', 'RECHAZADA'],
      default: 'PENDIENTE',
    },
    observacionesInstructor: {
      type: String,
      default: '',
    },
    revisadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fechaRevision: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Un aprendiz no puede tener dos bitácoras de la misma semana para la misma EP
bitacoraSchema.index({ stageId: 1, semana: 1 }, { unique: true });

module.exports = mongoose.model('Bitacora', bitacoraSchema);
