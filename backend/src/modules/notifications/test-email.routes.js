// test-email.routes.js 📧 Endpoints TEMPORALES de prueba
// =============================================
// Estos endpoints son para validar que el sistema
// de correos y alertas funciona correctamente.
// ELIMINAR EN PRODUCCIÓN.
// =============================================
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const { sendEmail } = require('../../core/utils/mailer');
const { ejecutarEscaneoAlertas } = require('../../core/utils/alertsCron');
const notificationsService = require('./notifications.service');
require('dotenv').config();

router.use(verifyToken);

/**
 * POST /api/test-email — Enviar correo de prueba al email configurado.
 * ⚠️ TEMPORAL — Eliminar en producción
 */
router.post('/', async (req, res) => {
  try {
    // El correo destino se puede sobreescribir con el body o usar el de .env
    const destinatario = req.body.to || process.env.TEST_EMAIL_TO || req.user.email;

    console.log(`📧 [TEST] Enviando correo de prueba a: ${destinatario}`);

    const result = await sendEmail({
      to: destinatario,
      subject: '✅ Prueba REPFORA — Sistema de Alertas Funcionando',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1b5e20, #2e7d32); padding: 28px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 1.3rem;">✅ Correo de Prueba</h1>
            <p style="color: #a5d6a7; margin: 8px 0 0; font-size: 0.85rem;">Sistema de alertas REPFORA</p>
          </div>
          <div style="background: white; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #334155; line-height: 1.6;">
              ¡Hola! Este correo confirma que el sistema de envío de emails de REPFORA 
              está <strong style="color: #1b5e20;">funcionando correctamente</strong>.
            </p>
            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
              <p style="margin: 0; font-size: 0.85rem; color: #15803d; font-weight: 700;">
                📧 Enviado por: ${req.user.name || 'Usuario REPFORA'}<br>
                🕐 Fecha: ${new Date().toLocaleString('es-CO')}
              </p>
            </div>
            <p style="color: #94a3b8; font-size: 0.75rem; text-align: center; margin-top: 20px;">
              Este es un correo de prueba automático. No requiere respuesta.
            </p>
          </div>
        </div>
      `,
    });

    if (result) {
      // También crear una notificación interna de éxito
      await notificationsService.crear({
        usuario: req.user._id,
        mensaje: `📧 Correo de prueba enviado exitosamente a ${destinatario}`,
        tipo: 'SUCCESS',
      });

      res.json({
        success: true,
        message: `Correo de prueba enviado a ${destinatario}`,
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'El correo no pudo ser enviado. Verifica las credenciales SMTP en .env',
      });
    }
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/test-email/trigger-alerts — Ejecutar manualmente el escaneo de alertas.
 * ⚠️ TEMPORAL — Eliminar en producción
 */
router.post('/trigger-alerts', async (req, res) => {
  try {
    console.log('🔔 [TEST] Ejecutando escaneo manual de alertas...');
    const resultado = await ejecutarEscaneoAlertas();
    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
