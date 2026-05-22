// =============================================
// app.js - Inicialización de Express
// =============================================
const express = require('express');
const cors = require('cors');
const app = express();

// --- Middlewares globales ---
const allowedOrigins = [
  'https://complementarias-seven.vercel.app', // Frontend en producción (Vercel)
  process.env.FRONTEND_URL,                   // Variable de entorno (opcional)
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
].filter(Boolean); // Elimina valores undefined/null

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (ej: Postman, apps móviles, same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Origen bloqueado: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// --- Rutas de módulos ---
app.use('/api/auth', require('./modules/auth-dev1/auth.routes'));
app.use('/api/users', require('./modules/users-dev1/users.routes'));
app.use('/api/system-config', require('./modules/system-config-dev1/system-config.routes'));
app.use('/api/productive-stages', require('./modules/productive-stages-dev2/productive-stages.routes'));
app.use('/api/companies', require('./modules/companies-dev2/companies.routes'));
app.use('/api/documents', require('./modules/documents-dev2/documents.routes'));
app.use('/api/bitacoras', require('./modules/bitacoras-dev3/bitacoras.routes'));
app.use('/api/trackings', require('./modules/trackings-dev3/trackings.routes'));
app.use('/api/hours', require('./modules/hours-dev3/hours.routes'));
app.use('/api/novelties', require('./modules/novelties-dev3/novelties.routes'));
app.use('/api/fichas', require('./modules/batches-dev1/batches.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/test-email', require('./modules/notifications/test-email.routes')); // ⚠️ TEMPORAL

// --- Ruta de salud ---
app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

module.exports = app;
