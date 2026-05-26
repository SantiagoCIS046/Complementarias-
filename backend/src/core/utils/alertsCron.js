// alertsCron.js 🕐 Cron Job para alertas automáticas de seguimiento y bitácoras
// =============================================
// Escanea Trackings PROGRAMADOS y Bitácoras pendientes quincenales,
// genera alertas internas y envía correos premium a instructores,
// aprendices y coordinadores.
// Se ejecuta todos los días a las 7:00 AM.
// =============================================
const cron = require('node-cron');
const Tracking = require('../../modules/trackings-dev3/tracking.model');
const Notification = require('../../modules/system-config-dev1/Notification.model');
const User = require('../../modules/users-dev1/user.model');
const ProductiveStage = require('../../modules/productive-stages-dev2/productive-stage.model');
const Bitacora = require('../../modules/bitacoras-dev3/bitacora.model');
const { sendEmail } = require('./mailer');
const { ROLES } = require('./enums');

/**
 * Escanea Trackings PROGRAMADOS cuya fecha sea exactamente dentro de 5 días
 * y genera alertas + envía correos al instructor asignado.
 */
const ejecutarEscaneoTrackings = async () => {
  console.log('🔔 [CRON] Ejecutando escaneo de alertas de seguimiento (instructor)...');
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const dentroDe5Dias = new Date(hoy);
    dentroDe5Dias.setDate(dentroDe5Dias.getDate() + 5);

    const finDel5toDia = new Date(dentroDe5Dias);
    finDel5toDia.setHours(23, 59, 59, 999);

    const trackingsPendientes = await Tracking.find({
      estadoVisita: 'PROGRAMADO',
      alertaEnviada: false,
      fechaVisita: {
        $gte: dentroDe5Dias,
        $lte: finDel5toDia,
      },
    })
      .populate('instructorId', 'name email')
      .populate('apprenticeId', 'name email documento documento tipoDocumento ficha programa');

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

      const mensajeNoti = `📋 Recordatorio: el aprendiz ${aprendiz.name} tiene seguimiento programado el ${fechaFormateada}.`;

      await Notification.create({
        usuario: instructor._id,
        mensaje: mensajeNoti,
        tipo: 'SEGUIMIENTO',
        referencia: tracking._id,
        referenciaModelo: 'Tracking',
      });

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
              Le recordamos que tiene un <strong>seguimiento programado</strong> en los próximos 5 días:
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

      tracking.alertaEnviada = true;
      await tracking.save();

      alertasGeneradas++;
      console.log(`🔔 [CRON] Alerta enviada → Instructor: ${instructor.name} | Aprendiz: ${aprendiz.name}`);
    }

    console.log(`🔔 [CRON] Escaneo de trackings completado: ${alertasGeneradas} alertas generadas.`);
    return { alertasGeneradas };
  } catch (error) {
    console.error('❌ [CRON] Error en escaneo de trackings:', error);
    return { error: error.message };
  }
};

/**
 * Escanea bitácoras pendientes para etapas productivas EN_CURSO.
 * Genera alertas 4 días antes del vencimiento al aprendiz, y si es overdue
 * alerta automáticamente al coordinador (ADMIN).
 */
const ejecutarEscaneoBitacoras = async () => {
  console.log('🔔 [CRON] Ejecutando escaneo de alertas por bitácoras pendientes (aprendiz y coordinador)...');
  
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const stages = await ProductiveStage.find({
      estado: 'EN_CURSO',
      fechaInicio: { $ne: null }
    }).populate('apprenticeId');

    let alertasVencimientoEnviadas = 0;
    let alertasRetrasoEnviadas = 0;

    const coordinadores = await User.find({ role: ROLES.ADMIN, activo: true });

    for (const stage of stages) {
      const aprendiz = stage.apprenticeId;
      if (!aprendiz) continue;

      const fechaInicio = new Date(stage.fechaInicio);
      fechaInicio.setHours(0, 0, 0, 0);

      for (let i = 1; i <= 12; i++) {
        const fechaVencimiento = new Date(fechaInicio);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 14));
        fechaVencimiento.setHours(0, 0, 0, 0);

        const bitacoraEntregada = await Bitacora.findOne({
          stageId: stage._id,
          semana: i,
          estado: { $in: ['APROBADA', 'PENDIENTE'] }
        });

        if (bitacoraEntregada) continue;

        const diffTime = fechaVencimiento - hoy;
        const diasParaVencer = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diasParaVencer === 4) {
          const alertaEnviada = await Notification.findOne({
            usuario: aprendiz._id,
            mensaje: new RegExp(`Bitácora Quincenal ${i}.*vence en 4 días`, 'i')
          });

          if (!alertaEnviada) {
            const fechaVencFormateada = fechaVencimiento.toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            const mensaje = `⚠️ Recordatorio: Tu Bitácora Quincenal ${i} vence el ${fechaVencFormateada} (en 4 días). Por favor, realiza la entrega a tiempo.`;

            await Notification.create({
              usuario: aprendiz._id,
              mensaje,
              tipo: 'ALERTA_BITACORA',
              referencia: stage._id,
              referenciaModelo: 'ProductiveStage'
            });

            const htmlCorreo = `
              <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
                <div style="background: #e65100; padding: 24px 32px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 1.2rem;">⚠️ Recordatorio de Bitácora</h1>
                  <p style="color: #ffe0b2; margin: 4px 0 0; font-size: 0.85rem;">Plataforma REPFORA — SENA</p>
                </div>
                <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
                  <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                    Estimado(a) aprendiz <strong>${aprendiz.name}</strong>,
                  </p>
                  <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                    Te recordamos que tu <strong>Bitácora Quincenal ${i}</strong> tiene su fecha límite de entrega en los próximos 4 días:
                  </p>
                  <div style="background: #fff8e1; border-left: 4px solid #e65100; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                    <table style="width: 100%; font-size: 0.9rem; color: #334155;">
                      <tr><td style="padding: 4px 0; font-weight: 700; width: 150px;">Entrega:</td><td>Bitácora Quincenal ${i}</td></tr>
                      <tr><td style="padding: 4px 0; font-weight: 700;">Fecha Límite:</td><td style="color: #e65100; font-weight: 800;">${fechaVencFormateada}</td></tr>
                    </table>
                  </div>
                  <p style="color: #64748b; font-size: 0.85rem; margin-top: 24px;">
                    Por favor accede a la plataforma, completa tu bitácora de actividades y realiza la entrega antes del vencimiento.
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
              to: aprendiz.email,
              subject: `⚠️ Recordatorio: Entrega de Bitácora Quincenal ${i} — Límite en 4 días`,
              html: htmlCorreo
            });

            alertasVencimientoEnviadas++;
            console.log(`🔔 [CRON] Alerta de vencimiento quincena ${i} enviada al aprendiz ${aprendiz.name}`);
          }
        }

        if (diasParaVencer < 0) {
          const alertaRetrasoEnviada = await Notification.findOne({
            mensaje: new RegExp(`no ha entregado la Bitácora Quincenal ${i} a tiempo`, 'i'),
            referencia: stage._id
          });

          if (!alertaRetrasoEnviada) {
            for (const coordinador of coordinadores) {
              const mensajeCoordinador = `🚨 Alerta de Retraso: El aprendiz ${aprendiz.name} (Ficha: ${aprendiz.ficha || 'S/N'}) no ha entregado la Bitácora Quincenal ${i} a tiempo (Venció el ${fechaVencimiento.toLocaleDateString('es-CO')}).`;

              await Notification.create({
                usuario: coordinador._id,
                mensaje: mensajeCoordinador,
                tipo: 'ALERTA_BITACORA',
                referencia: stage._id,
                referenciaModelo: 'ProductiveStage'
              });

              const htmlCorreoCoordinador = `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
                  <div style="background: #b71c1c; padding: 24px 32px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 1.2rem;">🚨 Alerta de Retraso de Bitácora</h1>
                    <p style="color: #ffcdd2; margin: 4px 0 0; font-size: 0.85rem;">Plataforma REPFORA — SENA</p>
                  </div>
                  <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                      Estimado(a) Coordinador(a) <strong>${coordinador.name}</strong>,
                    </p>
                    <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                      Le informamos que un aprendiz ha **incumplido con la entrega reglamentaria** de su bitácora de etapa productiva:
                    </p>
                    <div style="background: #ffebee; border-left: 4px solid #b71c1c; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                      <table style="width: 100%; font-size: 0.9rem; color: #334155;">
                        <tr><td style="padding: 4px 0; font-weight: 700; width: 150px;">Aprendiz:</td><td>${aprendiz.name}</td></tr>
                        <tr><td style="padding: 4px 0; font-weight: 700;">Ficha:</td><td>${aprendiz.ficha || 'N/A'}</td></tr>
                        <tr><td style="padding: 4px 0; font-weight: 700;">Documento:</td><td>${aprendiz.documento || 'N/A'}</td></tr>
                        <tr><td style="padding: 4px 0; font-weight: 700;">Entrega Incumplida:</td><td style="color: #b71c1c; font-weight: 800;">Bitácora Quincenal ${i}</td></tr>
                        <tr><td style="padding: 4px 0; font-weight: 700;">Fecha de Vencimiento:</td><td>${fechaVencimiento.toLocaleDateString('es-CO')}</td></tr>
                      </table>
                    </div>
                    <p style="color: #64748b; font-size: 0.85rem; margin-top: 24px;">
                      Se requiere intervención o contacto con el instructor tutor de la etapa para validar el estado o aplicar las medidas correspondientes.
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
                to: coordinador.email,
                subject: `🚨 Alerta de Retraso: Aprendiz ${aprendiz.name} — Bitácora Quincenal ${i} Incumplida`,
                html: htmlCorreoCoordinador
              });
            }

            alertasRetrasoEnviadas++;
            console.log(`🚨 [CRON] Alerta de retraso para quincena ${i} enviada a los coordinadores para el aprendiz ${aprendiz.name}`);
          }
        }
      }
    }

    console.log(`🔔 [CRON] Escaneo de bitácoras completado: ${alertasVencimientoEnviadas} alertas de vencimiento y ${alertasRetrasoEnviadas} de retraso generadas.`);
    return { alertasVencimientoEnviadas, alertasRetrasoEnviadas };
  } catch (error) {
    console.error('❌ [CRON] Error en escaneo de alertas de bitácoras:', error);
    return { error: error.message };
  }
};

/**
 * Escanea Trackings PROGRAMADOS o PENDIENTES que estén retrasados por exactamente 4 días
 * y genera alertas/correos. Si es el último seguimiento, envía también alerta crítica al aprendiz.
 */
const ejecutarEscaneoRetrasoTrackings = async () => {
  console.log('🔔 [CRON] Ejecutando escaneo de retrasos en visitas de seguimiento...');
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Buscar trackings no realizados ni cancelados
    const trackingsRetrasados = await Tracking.find({
      estadoVisita: { $in: ['PROGRAMADO', 'PENDIENTE'] }
    })
      .populate('instructorId', 'name email')
      .populate('apprenticeId', 'name email documento ficha')
      .populate('stageId');

    if (trackingsRetrasados.length === 0) {
      console.log('🔔 [CRON] No hay visitas de seguimiento retrasadas.');
      return { alertasRetrasoGeneradas: 0 };
    }

    let alertasRetrasoGeneradas = 0;

    for (const tracking of trackingsRetrasados) {
      const instructor = tracking.instructorId;
      const aprendiz = tracking.apprenticeId;
      if (!instructor || !aprendiz) continue;

      const fechaVisita = new Date(tracking.fechaVisita);
      fechaVisita.setHours(0, 0, 0, 0);

      const diffTime = hoy - fechaVisita;
      const diasRetraso = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Solo alertar si el retraso es exactamente de 4 días
      if (diasRetraso !== 4) continue;

      // Determinar si es el último seguimiento consultando el cupo
      let maxSeguimientos = 3;
      let nivelFormacion = 'Tecnólogo';
      try {
        const trackingService = require('../../modules/trackings-dev3/trackings.service');
        const cupo = await trackingService.obtenerCupoSeguimientos(tracking.stageId);
        maxSeguimientos = cupo.maxSeguimientos;
        nivelFormacion = cupo.nivelFormacion;
      } catch (err) {
        console.error('Error calculando cupo en escaneo de retrasos:', err);
      }

      const esUltimoSeguimiento = tracking.numeroVisita === maxSeguimientos;
      const fechaFormateada = new Date(tracking.fechaVisita).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // 1. Notificar al Instructor
      const mensajeInstructor = `🚨 Retraso de Seguimiento: La visita #${tracking.numeroVisita} con el aprendiz ${aprendiz.name} (programada para el ${fechaFormateada}) lleva 4 días de retraso sin reportar acta.`;

      // Evitar duplicados
      const existNotiInst = await Notification.findOne({
        usuario: instructor._id,
        referencia: tracking._id,
        mensaje: new RegExp('lleva 4 días de retraso', 'i')
      });

      if (!existNotiInst) {
        await Notification.create({
          usuario: instructor._id,
          mensaje: mensajeInstructor,
          tipo: 'SEGUIMIENTO',
          referencia: tracking._id,
          referenciaModelo: 'Tracking',
        });

        // Correo al instructor
        const htmlInstructor = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
            <div style="background: #b71c1c; padding: 24px 32px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 1.2rem;">🚨 Alerta de Retraso de Seguimiento</h1>
              <p style="color: #ffcdd2; margin: 4px 0 0; font-size: 0.85rem;">Plataforma REPFORA — SENA</p>
            </div>
            <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                Estimado(a) instructor(a) <strong>${instructor.name}</strong>,
              </p>
              <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                Le informamos que la <strong>visita de seguimiento #${tracking.numeroVisita}</strong> programada para el <strong>${fechaFormateada}</strong> presenta un retraso de <strong>4 días</strong> en el cargue del acta obligatoria en PDF.
              </p>
              <div style="background: #ffebee; border-left: 4px solid #b71c1c; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; font-size: 0.9rem; color: #334155;">
                  <tr><td style="padding: 4px 0; font-weight: 700; width: 140px;">Aprendiz:</td><td>${aprendiz.name}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: 700;">Fecha Programada:</td><td>${fechaFormateada}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: 700;">Visita N°:</td><td>${tracking.numeroVisita} / ${maxSeguimientos}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: 700;">Retraso:</td><td style="color: #b71c1c; font-weight: 800;">4 días</td></tr>
                </table>
              </div>
              <p style="color: #64748b; font-size: 0.85rem; margin-top: 24px;">
                Por favor, realice la visita o suba el acta PDF correspondiente en la plataforma a la brevedad para regularizar el estado.
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p style="color: #94a3b8; font-size: 0.75rem; text-align: center;">
                Este correo fue generado automáticamente por el sistema REPFORA.<br>No responda a este mensaje.
              </p>
            </div>
          </div>
        `;

        await sendEmail({
          to: instructor.email,
          subject: `🚨 RETRASO: Seguimiento #${tracking.numeroVisita} con ${aprendiz.name} vencido por 4 días`,
          html: htmlInstructor,
        });
      }

      // 2. Si es el último seguimiento, notificar también al aprendiz (Alerta Crítica)
      if (esUltimoSeguimiento) {
        const mensajeAprendiz = `⚠️ ALERTA CRÍTICA: Tu visita de seguimiento final (#${tracking.numeroVisita}) programada para el ${fechaFormateada} tiene 4 días de retraso sin acta firmada registrada. Tu proceso de certificación podría verse afectado.`;

        const existNotiAp = await Notification.findOne({
          usuario: aprendiz._id,
          referencia: tracking._id,
          mensaje: new RegExp('ALERTA CRÍTICA: Tu visita de seguimiento final', 'i')
        });

        if (!existNotiAp) {
          await Notification.create({
            usuario: aprendiz._id,
            mensaje: mensajeAprendiz,
            tipo: 'SEGUIMIENTO',
            referencia: tracking._id,
            referenciaModelo: 'Tracking',
          });

          // Correo crítico al aprendiz
          const htmlAprendiz = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
              <div style="background: #d32f2f; padding: 24px 32px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 1.2rem;">⚠️ ALERTA CRÍTICA DE SEGUIMIENTO FINAL</h1>
                <p style="color: #ffcdd2; margin: 4px 0 0; font-size: 0.85rem;">Plataforma REPFORA — SENA</p>
              </div>
              <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                  Estimado(a) aprendiz <strong>${aprendiz.name}</strong>,
                </p>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6; font-weight: 700;">
                  Se ha generado una alerta crítica en tu Etapa Productiva.
                </p>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                  Tu <strong>visita de seguimiento final (#${tracking.numeroVisita})</strong> programada para el <strong>${fechaFormateada}</strong> presenta un retraso de <strong>4 días</strong> en el registro y firma del acta oficial. 
                </p>
                <div style="background: #ffebee; border-left: 4px solid #d32f2f; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #c62828; font-size: 0.85rem; margin: 0 0 8px 0; font-weight: bold;">
                    ⚠️ Importancia de esta Alerta:
                  </p>
                  <p style="color: #555; font-size: 0.8rem; margin: 0; line-height: 1.5;">
                    El acta de seguimiento final es un requisito indispensable para completar tu etapa productiva. El retraso continuado en la entrega de este documento puede retrasar o afectar tu proceso de certificación de nivel <strong>${nivelFormacion}</strong>.
                  </p>
                </div>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                  Por favor, ponte en contacto inmediato con tu instructor asignado <strong>${instructor.name}</strong> (${instructor.email}) para coordinar la firma y la carga del documento en la plataforma.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="color: #94a3b8; font-size: 0.75rem; text-align: center;">
                  Este correo fue generado automáticamente por el sistema REPFORA.<br>No responda a este mensaje.
                </p>
              </div>
            </div>
          `;

          await sendEmail({
            to: aprendiz.email,
            subject: `⚠️ ALERTA CRÍTICA: Acta de Seguimiento Final #${tracking.numeroVisita} con 4 días de retraso`,
            html: htmlAprendiz,
          });
        }
      }

      alertasRetrasoGeneradas++;
    }

    console.log(`🔔 [CRON] Escaneo de retrasos de seguimiento completado: ${alertasRetrasoGeneradas} alertas de retraso generadas.`);
    return { alertasRetrasoGeneradas };
  } catch (error) {
    console.error('❌ [CRON] Error en escaneo de retrasos de trackings:', error);
    return { error: error.message };
  }
};

/**
 * Lógica principal del escaneo de alertas global.
 * Llama de forma secuencial a los escaneos de trackings y bitácoras.
 */
const ejecutarEscaneoAlertas = async () => {
  console.log('🔔 [CRON] Iniciando escaneo global de alertas de la plataforma...');
  let resTrackings = { alertasGeneradas: 0 };
  let resBitacoras = { alertasVencimientoEnviadas: 0, alertasRetrasoEnviadas: 0 };
  let resRetrasosTrackings = { alertasRetrasoGeneradas: 0 };

  try {
    resTrackings = await ejecutarEscaneoTrackings();
  } catch (err) {
    console.error('❌ [CRON] Error escaneando trackings:', err);
  }

  try {
    resBitacoras = await ejecutarEscaneoBitacoras();
  } catch (err) {
    console.error('❌ [CRON] Error escaneando bitácoras:', err);
  }

  try {
    resRetrasosTrackings = await ejecutarEscaneoRetrasoTrackings();
  } catch (err) {
    console.error('❌ [CRON] Error escaneando retrasos de trackings:', err);
  }

  return {
    trackings: resTrackings,
    bitacoras: resBitacoras,
    retrasosTrackings: resRetrasosTrackings
  };
};

// ── Programar el cron: todos los días a las 7:00 AM ──
cron.schedule('0 7 * * *', () => {
  ejecutarEscaneoAlertas();
});

console.log('🕐 [CRON] Job de alertas global registrado (diario a las 7:00 AM).');

module.exports = {
  ejecutarEscaneoAlertas,
  ejecutarEscaneoBitacoras,
  ejecutarEscaneoRetrasoTrackings,
};
