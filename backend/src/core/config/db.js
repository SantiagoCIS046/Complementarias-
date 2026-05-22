const mongoose = require('mongoose');
require('dotenv').config();

// Cache de conexión para entorno serverless (Vercel)
let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  // Si ya hay una conexión activa, reutilizarla
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI).then((m) => {
      console.log(`-----------------------------------------`);
      console.log(`✅ CONEXIÓN EXITOSA: ${m.connection.host}`);
      console.log(`📂 Base de datos: REPFORA_DB`);
      console.log(`-----------------------------------------`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // Resetear para reintentar en la próxima invocación
    console.error(`❌ ERROR DE CONEXIÓN: ${error.message}`);
    throw error; // NO usar process.exit() en serverless
  }

  return cached.conn;
};

module.exports = connectDB;
