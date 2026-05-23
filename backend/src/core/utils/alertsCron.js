// alertsCron.js 🕐 Cron Job para alertas automáticas de seguimiento y notificaciones
// =============================================
// Escanea periódicamente para enviar recordatorios de registro, bitácoras,
// visitas programadas, corrección de bitácoras y requisitos de certificación.
// =============================================
const cron = require('node-cron');
const Tracking = require('../../modules/trackings-dev3/tracking.model');
const Notification = require('../../modules/system-config-dev1/Notification.model');
const User = require('../../modules/users-dev1/user.model');
const SystemConfig = require('../../modules/system-config-dev1/system-config.model');
const { sendEmail } = require('./mailer');

/**
 * 1. Escaneo de alertas de seguimiento programadas a 5 días
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

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const dentroDeNDias = new Date(hoy);
    dentroDeNDias.setDate(dentroDeNDias.getDate() + diasAnticipacion);

    const finDelNDia = new Date(dentroDeNDias);
    finDelNDia.setHours(23, 59, 59, 999);

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

      const mensajeNoti = `📋 Recordatorio: el aprendiz ${aprendiz.name} tiene seguimiento programado el ${fechaFormateada}.`;

      await Notification.create({
        usuario: instructor._id,
        mensaje: mensajeNoti,
        tipo: 'SEGUIMIENTO',
        referencia: tracking._id,
        referenciaModelo: 'Tracking',
      });

      // Enviar correo al instructor
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
          </div>
        </div>
      `;

      await sendEmail({
        to: instructor.email,
        subject: `📋 Recordatorio de seguimiento — ${aprendiz.name} (${fechaFormateada})`,
        html: htmlCorreo,
      });

      // Enviar correo al aprendiz (RF-APR-07)
      const htmlCorreoAprendiz = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
          <div style="background: #1b5e20; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 1.2rem;">📅 Programación de Visita de Seguimiento</h1>
            <p style="color: #a5d6a7; margin: 4px 0 0; font-size: 0.85rem;">Plataforma REPFORA — SENA</p>
          </div>
          <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
              Estimado(a) aprendiz <strong>${aprendiz.name}</strong>,
            </p>
            <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
              Te notificamos que se ha programado una visita de seguimiento para tu Etapa Productiva:
            </p>
            <div style="background: #f0fdf4; border-left: 4px solid #1b5e20; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; font-size: 0.9rem; color: #334155;">
                <tr><td style="padding: 4px 0; font-weight: 700; width: 140px;">Instructor:</td><td>${instructor.name}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: 700;">Fecha y Hora:</td><td style="color: #1b5e20; font-weight: 800;">${fechaFormateada}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: 700;">Visita N°:</td><td>${tracking.numeroVisita}</td></tr>
              </table>
            </div>
            <p style="color: #64748b; font-size: 0.85rem; margin-top: 24px;">
              Asegúrate de estar disponible en la fecha programada.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: aprendiz.email,
        subject: `📅 Visita de Seguimiento Programada — ${fechaFormateada}`,
        html: htmlCorreoAprendiz,
      });

      tracking.alertaEnviada = true;
      await tracking.save();

      alertasGeneradas++;
    }

    return { alertasGeneradas };
  } catch (error) {
    console.error('❌ [CRON] Error en escaneo de alertas:', error);
    return { error: error.message };
  }
};

/**
 * 2. Recordatorios de registro de EP mensuales / alertas prioritarias (RF-APR-02)
 */
const enviarRecordatoriosRegistro = async () => {
  console.log('🔔 [CRON] Buscando aprendices sin registro de EP para enviar recordatorios...');
  try {
    const hoy = new Date();
    const aprendices = await User.find({
      role: 'APRENDIZ',
      activo: true,
      status: 'ACTIVO',
      $or: [
        { lastRegistrationReminderSent: null },
        { lastRegistrationReminderSent: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      ]
    });

    const ProductiveStage = require('../../modules/productive-stages-dev2/productive-stage.model');
    let recordatoriosEnviados = 0;

    for (const aprendiz of aprendices) {
      const tieneEP = await ProductiveStage.findOne({ apprenticeId: aprendiz._id });
      if (tieneEP) continue;

      let esPrioritario = false;
      let diasRestantes = null;

      if (aprendiz.fechaFinLectiva) {
        const fechaFin = new Date(aprendiz.fechaFinLectiva);
        const diffMs = hoy - fechaFin;
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const fechaLimiteNuevaNorma = new Date('2024-11-05T00:00:00');
        const esPostNov2024 = fechaFin >= fechaLimiteNuevaNorma;
        const plazoMaximo = esPostNov2024 ? 30 : 730;

        diasRestantes = plazoMaximo - diffDias;
        if (diasRestantes <= 30) {
          esPrioritario = true;
        }
      }

      const subject = esPrioritario 
        ? '⚠️ ¡ALERTA PRIORITARIA! Plazo próximo a vencer para registro de Etapa Productiva' 
        : '📋 Recordatorio mensual: Registra tu Etapa Productiva';

      const mensaje = esPrioritario
        ? `Te queda poco tiempo de plazo reglamentario (${diasRestantes} días) para registrar tu etapa práctica.`
        : `Recuerda realizar el registro de tu etapa práctica en la plataforma para formalizar tu proceso SENA.`;

      await sendEmail({
        to: aprendiz.email,
        subject,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
            <div style="background: ${esPrioritario ? '#b91c1c' : '#1b5e20'}; padding: 24px 32px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 1.2rem;">${esPrioritario ? '⚠️ ALERTA PRIORITARIA' : '📋 Recordatorio de Registro'}</h1>
              <p style="color: #f3f4f6; margin: 4px 0 0; font-size: 0.85rem;">Plataforma REPFORA — SENA</p>
            </div>
            <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                Hola <strong>${aprendiz.name}</strong>,
              </p>
              <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                ${mensaje}
              </p>
              ${diasRestantes !== null ? `
              <div style="background: #f8fafc; border-left: 4px solid ${esPrioritario ? '#b91c1c' : '#1b5e20'}; padding: 16px; margin: 20px 0; font-size: 0.9rem;">
                <strong>Días restantes de plazo reglamentario:</strong> ${diasRestantes} días.
              </div>` : ''}
            </div>
          </div>
        `
      });

      aprendiz.lastRegistrationReminderSent = hoy;
      await aprendiz.save();
      recordatoriosEnviados++;
    }

    return { recordatoriosEnviados };
  } catch (err) {
    console.error('Error en enviarRecordatoriosRegistro:', err);
    return { error: err.message };
  }
};

/**
 * 3. Recordatorios de bitácoras quincenales (Días 15 y 30) (RF-APR-07)
 */
const enviarRecordatoriosBitacoras = async () => {
  const hoy = new Date();
  const dia = hoy.getDate();
  if (dia !== 15 && dia !== 30) {
    console.log('🔔 [CRON] Hoy no es día 15 ni 30, se omite recordatorio de bitácoras.');
    return { recordatoriosEnviados: 0 };
  }

  console.log('🔔 [CRON] Ejecutando recordatorios de bitácoras (Día 15/30)...');
  try {
    const ProductiveStage = require('../../modules/productive-stages-dev2/productive-stage.model');
    const activeStages = await ProductiveStage.find({ estado: 'EN_CURSO' })
      .populate('apprenticeId', 'name email');

    let recordatoriosEnviados = 0;

    for (const stage of activeStages) {
      const apprentice = stage.apprenticeId;
      if (!apprentice) continue;

      await sendEmail({
        to: apprentice.email,
        subject: '⏰ Recordatorio: Fecha límite de entrega de Bitácora Quincenal',
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
            <div style="background: #1a4d2e; padding: 24px 32px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 1.2rem;">⏰ Entrega de Bitácora</h1>
              <p style="color: #a5d6a7; margin: 4px 0 0; font-size: 0.85rem;">Plataforma REPFORA — SENA</p>
            </div>
            <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                Hola <strong>${apprentice.name}</strong>,
              </p>
              <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                Te recordamos que hoy es <strong>fecha de corte quincenal</strong> (día ${dia} del mes) y debes subir tu bitácora de seguimiento quincenal firmada por tu jefe inmediato en la plataforma.
              </p>
            </div>
          </div>
        `
      });
      recordatoriosEnviados++;
    }

    return { recordatoriosEnviados };
  } catch (err) {
    console.error('Error en enviarRecordatoriosBitacoras:', err);
    return { error: err.message };
  }
};

/**
 * 4. Escáner de bitácoras rechazadas sin corregir en 4 días (RF-APR-08)
 */
const escanearBitacorasRechazadasSinCorregir = async () => {
  console.log('🔔 [CRON] Escaneando bitácoras rechazadas sin corregir en los últimos 4 días...');
  try {
    const hace4Dias = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const Bitacora = require('../../modules/bitacoras-dev3/bitacora.model');
    
    const bitacorasRechazadas = await Bitacora.find({
      estado: 'RECHAZADA',
      fechaRevision: { $lt: hace4Dias }
    }).populate('apprenticeId', 'name email documento')
      .populate('revisadoPor', 'name email');

    let alertasCoordinador = 0;

    for (const bitacora of bitacorasRechazadas) {
      const apprentice = bitacora.apprenticeId;
      const instructor = bitacora.revisadoPor;
      if (!apprentice) continue;

      const toEmail = instructor ? instructor.email : 'coordinacion@sena.edu.co';
      await sendEmail({
        to: toEmail,
        subject: '⚠️ Alerta: Plazo de corrección de Bitácora Vencido',
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
            <div style="background: #ea580c; padding: 24px 32px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 1.2rem;">⚠️ Alerta de Corrección Expirada</h1>
              <p style="color: #ffedd5; margin: 4px 0 0; font-size: 0.85rem;">Plataforma REPFORA — SENA</p>
            </div>
            <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                El aprendiz <strong>${apprentice.name}</strong> (Documento: ${apprentice.documento}) no ha corregido la <strong>Bitácora de la Semana ${bitacora.semana}</strong>, la cual fue rechazada hace más de 4 días.
              </p>
              <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 16px; margin: 20px 0; font-size: 0.9rem;">
                <p style="margin: 0;"><strong>Fecha de rechazo:</strong> ${new Date(bitacora.fechaRevision).toLocaleDateString()}</p>
                <p style="margin: 4px 0 0 0;"><strong>Comentarios del rechazo:</strong> ${bitacora.observacionesInstructor || 'Ninguno'}</p>
              </div>
            </div>
          </div>
        `
      });
      alertasCoordinador++;
    }

    return { alertasCoordinador };
  } catch (err) {
    console.error('Error en escanearBitacorasRechazadasSinCorregir:', err);
    return { error: err.message };
  }
};

/**
 * 5. Escáner de 2 meses previos a la finalización para listado de requisitos (RF-APR-11)
 */
const enviarAdvertenciasCertificacionDosMeses = async () => {
  console.log('🔔 [CRON] Buscando aprendices a 2 meses de finalizar para enviar lista de requisitos...');
  try {
    const ProductiveStage = require('../../modules/productive-stages-dev2/productive-stage.model');
    const User = require('../../modules/users-dev1/user.model');
    
    const stages = await ProductiveStage.find({ estado: 'EN_CURSO' })
      .populate('apprenticeId');

    const hoy = new Date();
    const dosMesesMs = 60 * 24 * 60 * 60 * 1000;
    let advertenciasEnviadas = 0;

    for (const st of stages) {
      const apprentice = st.apprenticeId;
      if (!apprentice) continue;

      if (st.fechaProyectadaFin) {
        const diffMs = new Date(st.fechaProyectadaFin) - hoy;
        
        if (diffMs > 0 && diffMs <= dosMesesMs && !apprentice.lastCronVisitReminderSent) {
          await sendEmail({
            to: apprentice.email,
            subject: '📋 Requisitos obligatorios para la Certificación Final',
            html: `
              <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
                <div style="background: #1b5e20; padding: 24px 32px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 1.2rem;">📋 Lista de Chequeo de Certificación</h1>
                  <p style="color: #a5d6a7; margin: 4px 0 0; font-size: 0.85rem;">Plataforma REPFORA — SENA</p>
                </div>
                <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
                  <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                    Hola <strong>${apprentice.name}</strong>,
                  </p>
                  <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                    Estás a aproximadamente <strong>2 meses de finalizar</strong> tu Etapa Productiva (Fecha proyectada: ${new Date(st.fechaProyectadaFin).toLocaleDateString()}).
                  </p>
                  <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
                    Para obtener tu certificación sin demoras, asegúrate de tener preparados los siguientes documentos finales:
                  </p>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <ul style="margin: 0; padding-left: 20px; font-size: 0.9rem; color: #334155; line-height: 1.6;">
                      <li><strong>Acta de Inicio:</strong> Firmada y cargada en el sistema.</li>
                      <li><strong>Evaluación de Desempeño (Final):</strong> Firmada por tu jefe/co-formador y cargada.</li>
                      <li><strong>Certificación de la Empresa:</strong> Emitida y cargada.</li>
                      <li><strong>Soportes Finales:</strong> PDF compilado que incluye Cédula de Ciudadanía al 150%, pruebas TyT presentadas y Paz y Salvo académico.</li>
                    </ul>
                  </div>
                </div>
              </div>
            `
          });

          apprentice.lastCronVisitReminderSent = hoy;
          await apprentice.save();
          advertenciasEnviadas++;
        }
      }
    }

    return { advertenciasEnviadas };
  } catch (err) {
    console.error('Error en enviarAdvertenciasCertificacionDosMeses:', err);
    return { error: err.message };
  }
};

// ── Programar el cron global diario a las 7:00 AM ──
cron.schedule('0 7 * * *', () => {
  ejecutarEscaneoAlertas();
  enviarRecordatoriosRegistro();
  enviarRecordatoriosBitacoras();
  escanearBitacorasRechazadasSinCorregir();
  enviarAdvertenciasCertificacionDosMeses();
});

console.log('🕐 [CRON] Jobs de alertas automáticas RepFora registrados correctamente.');

module.exports = {
  ejecutarEscaneoAlertas,
  enviarRecordatoriosRegistro,
  enviarRecordatoriosBitacoras,
  escanearBitacorasRechazadasSinCorregir,
  enviarAdvertenciasCertificacionDosMeses,
};
