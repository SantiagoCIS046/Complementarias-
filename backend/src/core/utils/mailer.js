// mailer.js 🟢 DEV 1 | Utilidad para envío de correos reales
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Aquí va el código de 16 letras
  },
});

/**
 * Función global para enviar correos
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
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
