// document.model.js   🔵 DEV 2 | Modelo de Documento
const mongoose = require('mongoose');
const {
  TIPO_DOCUMENTO,
  ESTADO_DOCUMENTO,
} = require('../../core/utils/enums');

const documentSchema = new mongoose.Schema(
  {
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductiveStage',
      required: [true, 'El ID de la Etapa Productiva es obligatorio'],
    },
    tipoDocumento: {
      type: String,
      enum: Object.values(TIPO_DOCUMENTO),
      required: [true, 'El tipo de documento es obligatorio'],
    },
    nombreArchivo: {
      type: String,
      required: [true, 'El nombre del archivo es obligatorio'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'La URL del archivo es obligatoria'],
      trim: true,
    },
    driveFileId: {
      type: String,
      default: null, // ID del archivo en Google Drive
    },
    estado: {
      type: String,
      enum: Object.values(ESTADO_DOCUMENTO),
      default: ESTADO_DOCUMENTO.PENDIENTE,
    },
    observaciones: {
      type: String,
      default: '',
    },
    subidoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Un solo documento de cada tipo por EP
documentSchema.index({ stageId: 1, tipoDocumento: 1 }, { unique: true });

module.exports = mongoose.model('Document', documentSchema);
