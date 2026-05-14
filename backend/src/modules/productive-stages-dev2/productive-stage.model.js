// productive-stage.model.js   🔵 DEV 2 | Modelo de Etapa Productiva
const mongoose = require('mongoose');
const {
  ESTADO_EP,
  TIPO_FORMACION,
  MODALIDAD_EP,
  JORNADA,
} = require('../../core/utils/enums');

// Sub-schema para el snapshot de empresa (denormalización histórica)
const companySnapshotSchema = new mongoose.Schema(
  {
    nit:            { type: String },
    razonSocial:    { type: String },
    direccion:      { type: String },
    telefono:       { type: String },
    emailContacto:  { type: String },
    jefeInmediato:  { type: String },
    telefonoJefe:   { type: String },
    emailJefe:      { type: String },
  },
  { _id: false }
);

const productiveStageSchema = new mongoose.Schema(
  {
    // --- Relaciones ---
    apprenticeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del aprendiz es obligatorio'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'El ID de la empresa es obligatorio'],
    },

    // --- Snapshot de empresa al momento del registro ---
    companySnapshot: {
      type: companySnapshotSchema,
      default: null,
    },

    // --- Datos de la EP ---
    radicado: {
      type: String,
      unique: true,
      sparse: true, // Permite nulls múltiples antes de asignarlo
    },
    tipoFormacion: {
      type: String,
      enum: Object.values(TIPO_FORMACION),
      required: [true, 'El tipo de formación es obligatorio'],
    },
    modalidad: {
      type: String,
      enum: Object.values(MODALIDAD_EP),
      required: [true, 'La modalidad es obligatoria'],
    },

    // --- Máquina de estados ---
    estado: {
      type: String,
      enum: Object.values(ESTADO_EP),
      default: ESTADO_EP.SOLICITUD,
    },

    // --- Cronograma (Modulo 2 - Motor de Cronogramas) ---
    jornada: {
      type: String,
      enum: Object.values(JORNADA),
      default: null, // Se configura despues del registro
    },
    cronogramaConfigurado: {
      type: Boolean,
      default: false,
    },
    horasRequeridas: {
      type: Number,
      default: 0,
    },
    horasCompletadas: {
      type: Number,
      default: 0,
    },

    // --- Fechas ---
    fechaInicio:       { type: Date, default: null },
    fechaFin:          { type: Date, default: null },
    fechaProyectadaFin:{ type: Date, default: null }, // Calculada por el motor de cronogramas

    // --- Historial de transiciones ---
    historialEstados: [
      {
        estadoAnterior: { type: String },
        estadoNuevo:    { type: String },
        fecha:          { type: Date, default: Date.now },
        motivo:         { type: String, default: '' },
        realizadoPor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],

    // --- Google Drive (Modulo 3) ---
    driveFolders: {
      aprendiz:   { type: String, default: null }, // ID carpeta del aprendiz en Drive
      bitacoras:  { type: String, default: null }, // ID carpeta BITACORAS
      documentos: { type: String, default: null }, // ID carpeta DOCUMENTOS
    },

    // --- Observaciones ---
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

// Índice compuesto para evitar que un aprendiz tenga múltiples EPs activas
productiveStageSchema.index(
  { apprenticeId: 1, estado: 1 },
  { 
    unique: true,
    partialFilterExpression: {
      estado: { $nin: ['FINALIZADO', 'CERTIFICADO', 'RECHAZADO'] }
    }
  }
);

module.exports = mongoose.model('ProductiveStage', productiveStageSchema);
