const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`-----------------------------------------`);
    console.log(`✅ CONEXIÓN EXITOSA: ${conn.connection.host}`);
    console.log(`📂 Base de datos: REPFORA_DB`);
    console.log(`-----------------------------------------`);
  } catch (error) {
    console.error(`❌ ERROR DE CONEXIÓN: ${error.message}`);
    process.exit(1); 
  }
};

module.exports = connectDB;
