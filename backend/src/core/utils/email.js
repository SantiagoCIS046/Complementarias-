const nodemailer = require('nodemailer');
const env = require('../config/env');

/**
 * Configuración del transportador de correos
 */
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT == 465, // true para 465, false para otros
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Función centralizada para enviar correos electrónicos
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log(`[EmailHelper] 📧 Correo enviado a ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[EmailHelper] ❌ Error al enviar correo:', error.message);
    // No lanzamos el error para no bloquear el flujo principal (ej: si falla el correo, la notificación interna debe quedar)
    return null;
  }
};

module.exports = { sendEmail };
