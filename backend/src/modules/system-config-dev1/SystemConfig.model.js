// SystemConfig.model.js 🟢 DEV 1 | Parámetros del Sistema
const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  maxLoginAttempts: { type: Number, default: 5 },
  lockTimeMins:     { type: Number, default: 2 },
  sessionDurationHours: { type: Number, default: 8 },
  resetTokenExpiresMins: { type: Number, default: 15 },
  radicadoPrefix:   { type: String, default: 'REP-' },
  lastRadicadoNum:  { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
