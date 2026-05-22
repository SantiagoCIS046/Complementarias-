// alertsCron.js 🕐 Cron Job para alertas automáticas de seguimiento
// =============================================
// Escanea Trackings PROGRAMADOS cuya fecha sea exactamente
// dentro de 5 días y genera alertas + envía correos al instructor.
// Se ejecuta todos los días a las 7:00 AM.
// =============================================
const cron = require('node-cron');
const Tracking = require('../../modules/trackings-dev3/tracking.model');
const Notification = require('../../modules/system-config-dev1/Notification.model');
const User = require('../../modules/users-dev1/user.model');
const SystemConfig = require('../../modules/system-config-dev1/system-config.model');
const { sendEmail } = require('./mailer');

/**
 * Lógica principal del escaneo de alertas.
 * Exportada para poder ejecutarla manualmente desde el endpoint de prueba.
 */
const ejecutarEscaneoAlertas = async () => {
  console.log('🔔 [CRON] Ejecutando escaneo de alertas de seguimiento...');

  try {
    let diasAnticipacion = 5;
    try {
      const config = await SystemConfig.findOne({ clave: 'DIAS_ANTICIPACION_ALERTA_SEGUIMIENTO' });
      if (config && typeof config.valor === 'number') {
        diasAnticipacion = config.valor;
      }
    } catch (err) {
      console.error('Error fetching DIAS_ANTICIPACION_ALERTA_SEGUIMIENTO config:', err);
    }

    // Calcular el rango de días en el futuro
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const dentroDeNDias = new Date(hoy);
    dentroDeNDias.setDate(dentroDeNDias.getDate() + diasAnticipacion);

    const finDelNDia = new Date(dentroDeNDias);
    finDelNDia.setHours(23, 59, 59, 999);

    // Buscar trackings programados para ese día que NO hayan sido alertados
    const trackingsPendientes = await Tracking.find({
      estadoVisita: 'PROGRAMADO',
      alertaEnviada: false,
      fechaVisita: {
        $gte: dentroDeNDias,
        $lte: finDelNDia,
      },
    })
      .populate('instructorId', 'name email')
      .populate('apprenticeId', 'name email documento ficha programa');

    if (trackingsPendientes.length === 0) {
      console.log('🔔 [CRON] No hay seguimientos para alertar hoy.');
      return { alertasGeneradas: 0 };
    }

    let alertasGeneradas = 0;

    for (const tracking of trackingsPendientes) {
      const instructor = tracking.instructorId;
      const aprendiz = tracking.apprenticeId;

      if (!instructor || !aprendiz) continue;

      const fechaFormateada = new Date(tracking.fechaVisita).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // 1. Crear notificación interna
      const mensajeNoti = `📋 Recordatorio: el aprendiz ${aprendiz.name} tiene seguimiento programado el ${fechaFormateada}.`;

      await Notification.create({
        usuario: instructor._id,
        mensaje: mensajeNoti,
        tipo: 'SEGUIMIENTO',
        referencia: tracking._id,
        referenciaModelo: 'Tracking',
      });

      // 2. Enviar correo al instructor
      const htmlCorreo = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
          <div style="background: #1b5e20; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 1.2rem;">🔔 Recordatorio de Seguimiento</h1>
            <p style="color: #a5d6a7; margin: 4px 0 0; font-size: 0.85rem;">Plataforma REPFORA — SENA</p>
          </div>
          <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
              Estimado(a) <strong>${instructor.name}</strong>,
            </p>
            <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
              Le recordamos que tiene un <strong>seguimiento programado</strong> en los próximos ${diasAnticipacion} días:
            </p>
            <div style="background: #f0fdf4; border-left: 4px solid #1b5e20; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; font-size: 0.9rem; color: #334155;">
                <tr><td style="padding: 4px 0; font-weight: 700; width: 140px;">Aprendiz:</td><td>${aprendiz.name}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: 700;">Documento:</td><td>${aprendiz.documento || 'N/A'}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: 700;">Programa:</td><td>${aprendiz.programa || 'N/A'}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: 700;">Ficha:</td><td>${aprendiz.ficha || 'N/A'}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: 700;">Fecha:</td><td style="color: #1b5e20; font-weight: 800;">${fechaFormateada}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: 700;">Visita N°:</td><td>${tracking.numeroVisita}</td></tr>
              </table>
            </div>
            <p style="color: #64748b; font-size: 0.85rem; margin-top: 24px;">
              Por favor prepare la documentación necesaria y coordine con el aprendiz.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 0.75rem; text-align: center;">
              Este correo fue generado automáticamente por el sistema REPFORA.<br>
              No responda a este mensaje.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: instructor.email,
        subject: `📋 Recordatorio de seguimiento — ${aprendiz.name} (${fechaFormateada})`,
        html: htmlCorreo,
      });

      // 3. Marcar el tracking como alertado
      tracking.alertaEnviada = true;
      await tracking.save();

      alertasGeneradas++;
      console.log(`🔔 [CRON] Alerta enviada → Instructor: ${instructor.name} | Aprendiz: ${aprendiz.name}`);
    }

    console.log(`🔔 [CRON] Escaneo completado: ${alertasGeneradas} alertas generadas.`);
    return { alertasGeneradas };
  } catch (error) {
    console.error('❌ [CRON] Error en escaneo de alertas:', error);
    return { error: error.message };
  }
};

// ── Programar el cron: todos los días a las 7:00 AM ──
cron.schedule('0 7 * * *', () => {
  ejecutarEscaneoAlertas();
});

console.log('🕐 [CRON] Job de alertas de seguimiento registrado (diario a las 7:00 AM).');

module.exports = { ejecutarEscaneoAlertas };
