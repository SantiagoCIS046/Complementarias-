// =============================================
// app.js - Inicialización de Express
// =============================================
const express = require('express');
const cors    = require('cors');
const app     = express();

// --- Middlewares globales ---
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// --- Rutas de módulos ---
app.use('/api/auth',              require('./modules/auth-dev1/auth.routes'));
app.use('/api/users',             require('./modules/users-dev1/users.routes'));
/*
app.use('/api/system-config',     require('./modules/system-config-dev1/system-config.routes'));
app.use('/api/productive-stages', require('./modules/productive-stages-dev2/productive-stages.routes'));
app.use('/api/companies',         require('./modules/companies-dev2/companies.routes'));
app.use('/api/documents',         require('./modules/documents-dev2/documents.routes'));
app.use('/api/bitacoras',         require('./modules/bitacoras-dev3/bitacoras.routes'));
app.use('/api/trackings',         require('./modules/trackings-dev3/trackings.routes'));
app.use('/api/hours',             require('./modules/hours-dev3/hours.routes'));
app.use('/api/novelties',         require('./modules/novelties-dev3/novelties.routes'));
*/

// --- Ruta de salud ---
app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

module.exports = app;
