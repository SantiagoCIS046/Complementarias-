// =============================================
// server.js - Arranque del servidor
// =============================================
const app = require('./app');
const { PORT } = require('./core/config/env');

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
