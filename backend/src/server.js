// =============================================
// server.js - Arranque del servidor
// =============================================
const app = require('./app');
const { PORT } = require('./core/config/env');
const { connectDB } = require('./core/config/db');
const configHelper = require('./core/utils/configHelper');

const startServer = async () => {
  try {
    // 1. Conectar a Base de Datos
    await connectDB();

    // 2. Precargar configuraciones
    await configHelper.preload();

    // 3. Iniciar Servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📋 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer();
