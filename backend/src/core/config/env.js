// =============================================
// env.js - Variables de entorno centralizadas
// =============================================
require('dotenv').config();

module.exports = {
  // --- Servidor ---
  PORT:     process.env.PORT     || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // --- Base de datos (MongoDB) ---
  MONGO_URI: process.env.MONGO_URI,

  // --- Autenticacion (DEV 1) ---
  JWT_SECRET:     process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',

  // --- Correo / SMTP (DEV 1 - Recuperacion de contrasena) ---
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '',

  // --- Google Drive (DEV 2 - Modulo de Documentos) ---
  GOOGLE_DRIVE_FOLDER_ID:   process.env.GOOGLE_DRIVE_FOLDER_ID   || '',
  GOOGLE_CREDENTIALS_PATH:  process.env.GOOGLE_CREDENTIALS_PATH  || '',
  GOOGLE_CREDENTIALS_JSON:  process.env.GOOGLE_CREDENTIALS_JSON  || '',

  // --- Frontend ---
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};
