// mailer.js 🟢 DEV 1 | Utilidad para envío de correos reales
const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT) || 587,
  secure: env.SMTP_PORT === 465 || env.SMTP_PORT === '465', // true para 465, false para otros puertos
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS, // Código de 16 letras / contraseña de la app
  },
  tls: {
    rejectUnauthorized: false, // Permite conexiones locales/desarrollo sin fallos de certificado
  },
});

/**
 * Función global para enviar correos
 */
const sendEmail = async ({ to, subject, html, attachments }) => {
  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to,
      subject,
      html,
      attachments,
    });
    console.log('✅ Correo enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    // No lanzamos error para no detener el proceso si falla el correo
    return null;
  }
};

module.exports = { sendEmail };

