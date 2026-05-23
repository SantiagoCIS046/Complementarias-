// notifications.js 🔔 DEV 1 | Utilidad Global de Notificaciones
const Notification = require('../../modules/system-config-dev1/Notification.model');

/**
 * Envía una notificación a un usuario específico
 */
const enviarNotificacion = async (usuarioId, mensaje, tipo = 'INFO') => {
  try {
    const nuevaNoti = new Notification({
      usuario: usuarioId,
      mensaje,
      tipo
    });
    await nuevaNoti.save();
    console.log(`🔔 Notificación enviada al usuario ${usuarioId}: ${mensaje}`);
    return nuevaNoti;
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    return null;
  }
};

/**
 * Envía correo y alerta interna con los datos completos del aprendiz y la empresa al ser asignado un instructor.
 */
const enviarNotificacionAsignacion = async (apprenticeId, instructorId, motivo = null) => {
  try {
    const User = require('../../modules/users-dev1/user.model');
    const ProductiveStage = require('../../modules/productive-stages-dev2/productive-stage.model');
    const Company = require('../../modules/companies-dev2/company.model');
    const { sendEmail } = require('./mailer');

    const apprentice = await User.findById(apprenticeId);
    const instructor = await User.findById(instructorId);

    if (!apprentice || !instructor) {
      console.log('⚠️ Aprendiz o Instructor no encontrado para la notificación de asignación');
      return;
    }

    // Buscar si el aprendiz tiene una etapa productiva activa
    const stage = await ProductiveStage.findOne({
      apprenticeId: apprentice._id,
      estado: { $nin: ['FINALIZADO', 'CERTIFICADO', 'RECHAZADO'] }
    }).populate('companyId');

    let companyData = null;
    if (stage) {
      if (stage.companySnapshot) {
        companyData = {
          nit: stage.companySnapshot.nit,
          razonSocial: stage.companySnapshot.razonSocial || stage.companySnapshot.razon_social,
          direccion: stage.companySnapshot.direccion,
          telefono: stage.companySnapshot.telefono,
          emailContacto: stage.companySnapshot.emailContacto || stage.companySnapshot.email_contacto,
          jefeInmediato: stage.companySnapshot.jefeInmediato || stage.companySnapshot.jefe_inmediato,
          telefonoJefe: stage.companySnapshot.telefonoJefe || stage.companySnapshot.telefono_jefe,
          emailJefe: stage.companySnapshot.emailJefe || stage.companySnapshot.email_jefe,
        };
      } else if (stage.companyId) {
        const company = stage.companyId;
        companyData = {
          nit: company.nit,
          razonSocial: company.razon_social || company.razonSocial,
          direccion: company.direccion,
          telefono: company.datos_contacto?.telefono || company.telefono,
          emailContacto: company.datos_contacto?.correo_corporativo || company.emailContacto,
          jefeInmediato: company.jefe_inmediato?.nombre_completo || company.jefeInmediato,
          telefonoJefe: company.jefe_inmediato?.telefono || company.telefonoJefe,
          emailJefe: company.jefe_inmediato?.correo || company.emailJefe,
        };
      }
    }

    // Si no hay etapa productiva, intentar buscar si el aprendiz está asociado a alguna empresa
    if (!companyData) {
      const company = await Company.findOne({ aprendiz_id: apprentice._id });
      if (company) {
        companyData = {
          nit: company.nit,
          razonSocial: company.razon_social || company.razonSocial,
          direccion: company.direccion,
          telefono: company.datos_contacto?.telefono || company.telefono,
          emailContacto: company.datos_contacto?.correo_corporativo || company.emailContacto,
          jefeInmediato: company.jefe_inmediato?.nombre_completo || company.jefeInmediato,
          telefonoJefe: company.jefe_inmediato?.telefono || company.telefonoJefe,
          emailJefe: company.jefe_inmediato?.correo || company.emailJefe,
        };
      }
    }

    const appNombre = apprentice.name;
    const appDoc = apprentice.documento || 'N/A';
    const appEmail = apprentice.email;
    const appTel = apprentice.telefono || 'N/A';
    const appFicha = apprentice.ficha || 'N/A';
    const appProg = apprentice.programa || 'N/A';

    const empNombre = companyData?.razonSocial || 'Sin empresa asignada aún';
    const empNit = companyData?.nit || 'N/A';
    const empDir = companyData?.direccion || 'N/A';
    const empTel = companyData?.telefono || 'N/A';
    const empEmail = companyData?.emailContacto || 'N/A';
    const empJefe = companyData?.jefeInmediato || 'N/A';
    const empJefeTel = companyData?.telefonoJefe || 'N/A';
    const empJefeEmail = companyData?.emailJefe || 'N/A';

    // 1. Alerta interna
    let mensajeAlerta = `👤 Se te ha asignado el aprendiz ${appNombre} (Ficha: ${appFicha}) de la empresa ${empNombre}.`;
    if (motivo) {
      mensajeAlerta += ` Motivo del cambio: ${motivo}`;
    }
    
    await Notification.create({
      usuario: instructor._id,
      mensaje: mensajeAlerta,
      tipo: 'INFO',
      referencia: stage ? stage._id : null,
      referenciaModelo: stage ? 'ProductiveStage' : null
    });

    console.log(`🔔 Alerta interna de asignación creada para el instructor ${instructor.name}`);

    // 2. Correo electrónico (diseño premium)
    const htmlCorreo = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
        <div style="background: #1b5e20; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 1.2rem;">👤 Asignación de Aprendiz</h1>
          <p style="color: #a5d6a7; margin: 4px 0 0; font-size: 0.85rem;">Plataforma REPFORA — SENA</p>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
            Estimado(a) instructor(a) <strong>${instructor.name}</strong>,
          </p>
          <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
            Se le ha asignado la tutoría y seguimiento del siguiente aprendiz para su Etapa Productiva:
          </p>
          
          ${motivo ? `
          <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="color: #c2410c; font-weight: 700; margin: 0 0 4px; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.5px;">⚠️ Motivo de la Reasignación</p>
            <p style="color: #7c2d12; margin: 0; font-size: 0.92rem; line-height: 1.5;">${motivo}</p>
          </div>
          ` : ''}
          
          <h3 style="color: #1b5e20; border-bottom: 2px solid #e2f0d9; padding-bottom: 6px; margin-top: 24px;">Datos del Aprendiz</h3>
          <table style="width: 100%; font-size: 0.9rem; color: #334155; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; font-weight: 700; width: 150px;">Nombre Completo:</td><td>${appNombre}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 700;">Documento:</td><td>${appDoc}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 700;">Correo:</td><td>${appEmail}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 700;">Teléfono:</td><td>${appTel}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 700;">Ficha:</td><td>${appFicha}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 700;">Programa:</td><td>${appProg}</td></tr>
          </table>

          <h3 style="color: #1b5e20; border-bottom: 2px solid #e2f0d9; padding-bottom: 6px; margin-top: 24px;">Datos de la Empresa Co-formadora</h3>
          <table style="width: 100%; font-size: 0.9rem; color: #334155; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; font-weight: 700; width: 150px;">Razón Social:</td><td>${empNombre}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 700;">NIT:</td><td>${empNit}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 700;">Dirección:</td><td>${empDir}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 700;">Teléfono Empresa:</td><td>${empTel}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 700;">Correo Empresa:</td><td>${empEmail}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 700;">Jefe Inmediato:</td><td>${empJefe}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 700;">Teléfono Jefe:</td><td>${empJefeTel}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 700;">Correo Jefe:</td><td>${empJefeEmail}</td></tr>
          </table>

          <p style="color: #64748b; font-size: 0.85rem; margin-top: 28px;">
            Por favor, inicie contacto con el aprendiz para coordinar las concertaciones y visitas reglamentarias.
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
      subject: `👤 Asignación de Aprendiz — ${appNombre} (Ficha: ${appFicha})`,
      html: htmlCorreo
    });

    console.log(`✉️ Correo de asignación enviado al instructor ${instructor.email}`);
  } catch (error) {
    console.error('❌ Error en enviarNotificacionAsignacion:', error);
  }
};

module.exports = { enviarNotificacion, enviarNotificacionAsignacion };
