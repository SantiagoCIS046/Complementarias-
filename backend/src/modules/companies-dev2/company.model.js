const mongoose = require('mongoose');

/**
 * CompanySchema
 * Representa las empresas donde los aprendices realizan su etapa productiva.
 * Alineado con los requerimientos legales y de contacto de REPFORA.
 */
const CompanySchema = new mongoose.Schema({
  nit: {
    type: String,
    required: [true, 'El NIT es obligatorio'],
    unique: true,
    trim: true
  },
  razon_social: {
    type: String,
    required: [true, 'La razón social es obligatoria'],
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  municipio: {
    type: String,
    trim: true
  },
  sector_economico: {
    type: String,
    trim: true
  },
  datos_contacto: {
    telefono: {
      type: String,
      trim: true
    },
    correo_corporativo: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  jefe_inmediato: {
    nombre_completo: {
      type: String,
      trim: true
    },
    cargo: {
      type: String,
      trim: true
    },
    telefono: {
      type: String,
      trim: true
    },
    correo: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  documentacion: {
    rut_url: {
      type: String,
      trim: true
    },
    camara_comercio_url: {
      type: String,
      trim: true
    },
    fecha_subida: {
      type: Date,
      default: Date.now
    }
  },
  estado: {
    type: String,
    enum: ['EN_REVISION', 'HABILITADA', 'RECHAZADA'],
    default: 'EN_REVISION'
  },
  aprendiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  instructor_asignado_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Company', CompanySchema);
