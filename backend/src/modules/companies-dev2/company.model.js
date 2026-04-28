// Company.model.js 🔵 DEV 2 | Esquema de Empresas (Mongoose)
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    nit: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    razonSocial: { 
        type: String, 
        required: true, 
        trim: true 
    },
    direccion: { 
        type: String, 
        trim: true 
    },
    telefono: { 
        type: String 
    },
    emailContacto: { 
        type: String, 
        lowercase: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Company', companySchema);
