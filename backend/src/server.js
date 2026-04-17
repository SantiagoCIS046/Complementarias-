// =============================================
// server.js - Arranque del servidor
// =============================================
const app = require('./app');
const { PORT } = require('./core/config/env');
const connectDB = require('./core/config/db');

// Conectar a la base de datos
connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Servidor REPFORA activo en puerto ${PORT}`);
});
