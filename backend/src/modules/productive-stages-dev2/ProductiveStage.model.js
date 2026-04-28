// ProductiveStage.model.js 🔵 DEV 2 | Esquema de Etapas Productivas (Mongoose)
const mongoose = require('mongoose');

const productiveStageSchema = new mongoose.Schema({
    aprendiz: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    empresa: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true 
    },
    modalidad: { 
        type: String, 
        enum: ['CONTRATO_APRENDIZAJE', 'PASANTIA', 'PROYECTO_PRODUCTIVO', 'MONITORIA', 'VINCULACION_LABORAL'],
        required: true 
    },
    fechaInicio: { 
        type: Date, 
        required: true 
    },
    fechaFin: { 
        type: Date, 
        required: true 
    },
    estado: { 
        type: String, 
        enum: ['EN_PROCESO', 'COMPLETADA', 'CANCELADA'], 
        default: 'EN_PROCESO' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('ProductiveStage', productiveStageSchema);
