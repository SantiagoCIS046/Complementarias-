// templates.generator.js   🔵 DEV 2 | Generador de Plantillas Oficiales
// =============================================
// Servicio para generar dinámicamente plantillas
// oficiales en formatos PDF y Word (RTF).
// =============================================

const PDFDocument = require('pdfkit');

/**
 * Genera el documento PDF oficial SENA en alta fidelidad.
 * Retorna una Promesa que resuelve a un Buffer con el PDF.
 */
const generarPdf = async (type) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Colores institucionales SENA
      const senaGreen = '#39a900';
      const senaOrange = '#fc5c04';
      const senaDark = '#072146';
      const textGray = '#334155';
      const borderGray = '#cbd5e1';

      // --- Cabecera Común ---
      doc.rect(0, 0, 595, 15).fill(senaGreen); // Franja superior
      doc.moveDown(1.5);

      // Logo SENA Decorativo
      doc.circle(60, 45, 18).lineWidth(2).strokeColor(senaOrange).stroke();
      doc.fillColor(senaDark).font('Helvetica-Bold').fontSize(14).text('SENA', 85, 38);
      doc.fontSize(8).fillColor('#64748b').font('Helvetica').text('SERVICIO NACIONAL DE APRENDIZAJE', 85, 52);

      // Metadatos de Formato
      const isBitacora = type === 'bitacora';
      const code = isBitacora ? 'F-GFPI-023' : 'F-GFPI-024';
      const version = isBitacora ? 'Versión 03' : 'Versión 04';
      const title = isBitacora 
        ? 'PLANEACIÓN, SEGUIMIENTO Y EVALUACIÓN DE ETAPA PRODUCTIVA\nBITÁCORA DE ETAPA PRODUCTIVA'
        : 'FORMATO DE SEGUIMIENTO Y EVALUACIÓN DE LA ETAPA PRODUCTIVA';

      doc.rect(380, 28, 175, 35).strokeColor(borderGray).lineWidth(1).stroke();
      doc.fillColor(senaDark).font('Helvetica-Bold').fontSize(8.5);
      doc.text(`Código: ${code}`, 390, 34);
      doc.text(`${version}`, 390, 48);

      doc.moveTo(40, 75).lineTo(555, 75).strokeColor(borderGray).lineWidth(1.5).stroke();
      doc.moveDown(2);

      // Título Oficial del Formato
      doc.fontSize(12).fillColor(senaDark).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.moveDown(1.5);

      // --- Sección 1: Información General ---
      doc.fillColor(senaGreen).font('Helvetica-Bold').fontSize(9.5).text('1. INFORMACIÓN GENERAL DEL APRENDIZ Y LA ETAPA PRODUCTIVA');
      doc.moveDown(0.4);

      // Tabla de Datos
      const drawField = (label, placeholder, x, y, width) => {
        doc.rect(x, y, width, 25).strokeColor(borderGray).lineWidth(0.5).stroke();
        doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7.5).text(label, x + 5, y + 4);
        doc.fillColor(textGray).font('Helvetica').fontSize(8.5).text(placeholder, x + 5, y + 13, { width: width - 10 });
      };

      let startY = doc.y;
      drawField('Nombre del Aprendiz:', '[Escriba sus nombres y apellidos aquí]', 40, startY, 255);
      drawField('Documento de Identidad:', '[C.C. / T.I. N°]', 295, startY, 130);
      drawField('Ficha de Caracterización:', '[Número de Ficha]', 425, startY, 130);

      startY += 25;
      drawField('Programa de Formación:', '[Nombre del Programa de Tecnólogo / Técnico]', 40, startY, 255);
      drawField('Correo Electrónico:', '[usuario@sena.edu.co]', 295, startY, 130);
      drawField('Teléfono de Contacto:', '[Celular / Fijo]', 425, startY, 130);

      startY += 25;
      drawField('Nombre de la Empresa:', '[Razón Social de la Organización]', 40, startY, 255);
      drawField('Jefe Inmediato:', '[Nombre y Cargo del Supervisor]', 295, startY, 130);
      drawField('Instructor de Seguimiento:', '[Nombre del Instructor Asignado]', 425, startY, 130);

      doc.y = startY + 40;

      if (isBitacora) {
        // --- Contenido Específico: Bitácora ---
        doc.fillColor(senaGreen).font('Helvetica-Bold').fontSize(9.5).text('2. PLANEACIÓN Y REPORTE DE ACTIVIDADES DE ETAPA PRODUCTIVA (QUINCENAL)');
        doc.moveDown(0.4);

        // Tabla de Actividades Quincenales
        const tableY = doc.y;
        doc.rect(40, tableY, 515, 20).fill('#f1f5f9');
        doc.rect(40, tableY, 515, 20).strokeColor(borderGray).stroke();
        doc.fillColor(senaDark).font('Helvetica-Bold').fontSize(8.5);
        doc.text('N°', 45, tableY + 6);
        doc.text('Descripción de la Actividad Desarrollada', 70, tableY + 6);
        doc.text('Horas', 350, tableY + 6, { width: 40, align: 'center' });
        doc.text('Evidencia de Aprendizaje', 400, tableY + 6);

        let rowY = tableY + 20;
        const renderRow = (num, desc, hrs, ev) => {
          doc.rect(40, rowY, 515, 30).strokeColor(borderGray).lineWidth(0.5).stroke();
          doc.fillColor(textGray).font('Helvetica').fontSize(8);
          doc.text(num, 45, rowY + 10);
          doc.text(desc, 70, rowY + 6, { width: 270 });
          doc.text(hrs, 350, rowY + 10, { width: 40, align: 'center' });
          doc.text(ev, 400, rowY + 6, { width: 145 });
          rowY += 30;
        };

        renderRow('1', 'Desarrollo de actividades formativas y operativas según el área asignada en la empresa.', '40', 'Bitácora firmada, captura del sistema');
        renderRow('2', 'Apoyo en el control de inventarios, bases de datos y reportes de producción semanal.', '40', 'Base de datos Excel depurada');
        renderRow('3', 'Participación en comités técnicos de análisis de procesos operativos e implementaciones.', '40', 'Actas de reunión firmadas');

        doc.y = rowY + 20;

        doc.fillColor(senaGreen).font('Helvetica-Bold').fontSize(9.5).text('3. VALORACIÓN Y FIRMAS DE CONFORMIDAD');
        doc.moveDown(0.6);

        // Firmas
        const sigY = doc.y;
        doc.moveTo(40, sigY + 40).lineTo(180, sigY + 40).strokeColor(textGray).lineWidth(0.8).stroke();
        doc.fillColor(textGray).font('Helvetica-Bold').fontSize(7.5).text('Firma del Aprendiz', 40, sigY + 45, { align: 'center', width: 140 });

        doc.moveTo(225, sigY + 40).lineTo(365, sigY + 40).strokeColor(textGray).lineWidth(0.8).stroke();
        doc.text('Firma del Jefe Inmediato (Empresa)', 225, sigY + 45, { align: 'center', width: 140 });

        doc.moveTo(415, sigY + 40).lineTo(555, sigY + 40).strokeColor(textGray).lineWidth(0.8).stroke();
        doc.text('Firma Instructor de Seguimiento', 415, sigY + 45, { align: 'center', width: 140 });

      } else {
        // --- Contenido Específico: Seguimiento ---
        doc.fillColor(senaGreen).font('Helvetica-Bold').fontSize(9.5).text('2. EVALUACIÓN Y SEGUIMIENTO DE LA ETAPA PRODUCTIVA');
        doc.moveDown(0.4);

        const tableY = doc.y;
        doc.rect(40, tableY, 515, 20).fill('#f1f5f9');
        doc.rect(40, tableY, 515, 20).strokeColor(borderGray).stroke();
        doc.fillColor(senaDark).font('Helvetica-Bold').fontSize(8.5);
        doc.text('Factor / Aspecto a Evaluar', 48, tableY + 6);
        doc.text('Parcial 1', 320, tableY + 6, { width: 70, align: 'center' });
        doc.text('Parcial 2', 400, tableY + 6, { width: 70, align: 'center' });
        doc.text('Final', 480, tableY + 6, { width: 70, align: 'center' });

        let rowY = tableY + 20;
        const renderSegRow = (factor, desc) => {
          doc.rect(40, rowY, 515, 28).strokeColor(borderGray).lineWidth(0.5).stroke();
          doc.fillColor(senaDark).font('Helvetica-Bold').fontSize(8).text(factor, 48, rowY + 4);
          doc.fillColor(textGray).font('Helvetica').fontSize(7.5).text(desc, 48, rowY + 14, { width: 260 });
          
          doc.rect(320, rowY, 70, 28).strokeColor(borderGray).lineWidth(0.5).stroke();
          doc.rect(400, rowY, 70, 28).strokeColor(borderGray).lineWidth(0.5).stroke();
          doc.rect(480, rowY, 70, 28).strokeColor(borderGray).lineWidth(0.5).stroke();
          
          doc.fillColor('#64748b').font('Helvetica').fontSize(8);
          doc.text('Aprobado [ ]', 325, rowY + 10, { width: 60, align: 'center' });
          doc.text('Aprobado [ ]', 405, rowY + 10, { width: 60, align: 'center' });
          doc.text('Aprobado [ ]', 485, rowY + 10, { width: 60, align: 'center' });
          rowY += 28;
        };

        renderSegRow('Relaciones Interpersonales', 'Mantiene una comunicación asertiva con compañeros y superiores.');
        renderSegRow('Trabajo en Equipo', 'Coopera activamente en la consecución de objetivos comunes.');
        renderSegRow('Solución de Problemas', 'Propone alternativas viables para superar contratiempos.');
        renderSegRow('Cumplimiento y Puntualidad', 'Respeta los horarios de ingreso y entrega de labores asignadas.');

        doc.y = rowY + 20;

        doc.fillColor(senaGreen).font('Helvetica-Bold').fontSize(9.5).text('3. OBSERVACIONES Y CONCERTACIÓN DE COMPROMISOS');
        doc.moveDown(0.4);

        doc.rect(40, doc.y, 515, 45).strokeColor(borderGray).lineWidth(0.5).stroke();
        doc.fillColor('#94a3b8').font('Helvetica-Oblique').fontSize(8.5).text('  [Espacio para observaciones del Instructor y el Co-Formador de la empresa]', 45, doc.y + 6);

        doc.y += 65;

        // Firmas
        const sigY = doc.y;
        doc.moveTo(40, sigY + 30).lineTo(180, sigY + 30).strokeColor(textGray).lineWidth(0.8).stroke();
        doc.fillColor(textGray).font('Helvetica-Bold').fontSize(7.5).text('Firma del Aprendiz', 40, sigY + 35, { align: 'center', width: 140 });

        doc.moveTo(225, sigY + 30).lineTo(365, sigY + 30).strokeColor(textGray).lineWidth(0.8).stroke();
        doc.text('Firma del Jefe Inmediato (Empresa)', 225, sigY + 35, { align: 'center', width: 140 });

        doc.moveTo(415, sigY + 30).lineTo(555, sigY + 30).strokeColor(textGray).lineWidth(0.8).stroke();
        doc.text('Firma Instructor de Seguimiento', 415, sigY + 35, { align: 'center', width: 140 });
      }

      // Footer
      doc.fontSize(7).fillColor('#94a3b8').font('Helvetica');
      doc.text(
        `Servicio Nacional de Aprendizaje SENA - Dirección General - Formato ${code} - Documento oficial editable e institucional.`,
        40,
        810,
        { align: 'center', width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Genera un documento compatible con Word (.rtf) en texto enriquecido.
 * Microsoft Word abre este formato de forma nativa sin alertas de corrupción.
 */
const generarDoc = (type) => {
  const isBitacora = type === 'bitacora';
  const code = isBitacora ? 'F-GFPI-023' : 'F-GFPI-024';
  const title = isBitacora 
    ? 'BITACORA QUINCENAL DE ETAPA PRODUCTIVA (F-GFPI-023)'
    : 'PLANEACION, SEGUIMIENTO Y EVALUACION DE ETAPA PRODUCTIVA (F-GFPI-024)';

  // Plantilla en formato RTF (Rich Text Format)
  let rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}
{\\colortbl ;\\red57\\green169\\blue0;\\red7\\green33\\blue70;\\red148\\green163\\blue184;}
\\viewkind4\\uc1\\pard\\lang1033\\cf2\\b\\f0\\fs28 SERVICIO NACIONAL DE APRENDIZAJE - SENA\\b0\\par
\\cf1\\b\\fs24 SISTEMA DE GESTION DE ETAPA PRODUCTIVA - REPFORA\\b0\\par
\\cf3\\fs16 Documento Oficial de Formato Acad\'e9mico SENA ${code}\\cf0\\fs20\\par
\\pard\\keepn\\cf2\\b\\fs24\\par
=========================================================================\\par
${title}\\par
=========================================================================\\par
\\b0\\cf0\\par
\\b 1. DATOS GENERALES DEL APRENDIZ Y DEL PROCESO:\\b0\\par
\\par
- Nombre Completo del Aprendiz: _________________________________________\\par
- Documento de Identidad (C.C/T.I): _____________________________________\\par
- Numero de Ficha de Caracterizacion: __________________________________\\par
- Programa de Formacion Academica: _____________________________________\\par
- Nombre de la Empresa Co-Formadora: ___________________________________\\par
- Jefe Inmediato / Supervisor de la Empresa: ____________________________\\par
- Instructor de Seguimiento Asignado: ___________________________________\\par
\\par
=========================================================================\\par
\\b 2. REPORTE FORMATIVO Y EVALUACION:\\b0\\par
\\par
`;

  if (isBitacora) {
    rtf += `\\b INSTRUCCIONES PARA EL REGISTRO DE LA BITACORA:\\b0\\par
Por cada quincena laborada, el aprendiz debera detallar en la siguiente estructura las actividades realizadas y adjuntar los soportes necesarios.\\par
\\par
-------------------------------------------------------------------------\\par
\\b REGISTRO QUINCENAL N\'ba [ ___ ]\\b0\\par
-------------------------------------------------------------------------\\par
- Rango de Fechas del Periodo: Desde: [ DD/MM/AAAA ] Hasta: [ DD/MM/AAAA ]\\par
- Total de Horas Reportadas en esta Quincena: [ ______ ] horas.\\par
\\par
\\b Actividades Desarrolladas en la Empresa:\\b0\\par
[Detalle aqui las funciones formativas realizadas. Ej. Soporte en el area de desarrollo de software, creacion de manuales de usuario, pruebas de control de calidad, etc.]\\par
\\par
\\b Evidencias de Aprendizaje Generadas:\\b0\\par
[Detalle aqui las evidencias cargadas en soporte. Ej. Copia de informes semanales, manual de usuario PDF, capturas de pantalla del repositorio Git, etc.]\\par
\\par
`;
  } else {
    rtf += `\\b INSTRUCCIONES DE EVALUACION Y SEGUIMIENTO:\\b0\\par
El Instructor en conjunto con el Jefe Inmediato realizaran la revision de los factores academicos y actitudinales del aprendiz durante los tres momentos (Parcial 1, Parcial 2 y Evaluacion Final).\\par
\\par
-------------------------------------------------------------------------\\par
\\b FACTORES ACTITUDINALES Y COMPORTAMENTALES:\\b0\\par
-------------------------------------------------------------------------\\par
\\b A. RELACIONES INTERPERSONALES:\\b0\\par
- Estado Parcial 1: [  ] Aprobado  [  ] Por Mejorar  [  ] N/A\\par
- Estado Parcial 2: [  ] Aprobado  [  ] Por Mejorar  [  ] N/A\\par
- Estado Final:     [  ] Aprobado  [  ] Por Mejorar  [  ] N/A\\par
\\par
\\b B. TRABAJO EN EQUIPO Y COLABORACION:\\b0\\par
- Estado Parcial 1: [  ] Aprobado  [  ] Por Mejorar  [  ] N/A\\par
- Estado Parcial 2: [  ] Aprobado  [  ] Por Mejorar  [  ] N/A\\par
- Estado Final:     [  ] Aprobado  [  ] Por Mejorar  [  ] N/A\\par
\\par
\\b C. CUMPLIMIENTO, PUNTUALIDAD Y RESPONSABILIDAD:\\b0\\par
- Estado Parcial 1: [  ] Aprobado  [  ] Por Mejorar  [  ] N/A\\par
- Estado Parcial 2: [  ] Aprobado  [  ] Por Mejorar  [  ] N/A\\par
- Estado Final:     [  ] Aprobado  [  ] Por Mejorar  [  ] N/A\\par
\\par
`;
  }

  rtf += `=========================================================================\\par
\\b 3. COMPROMISOS Y FIRMAS DE CONFORMIDAD:\\b0\\par
\\par
Con la firma de este formato editable, las partes confirman la exactitud de los datos reportados y los compromisos adquiridos durante el seguimiento formativo de la Etapa Productiva.\\par
\\par
\\par
_________________________________               _________________________________\\par
\\b Firma del Aprendiz\\b0                          \\b Firma del Jefe Inmediato\\b0\\par
\\par
\\par
_________________________________\\par
\\b Firma Instructor de Seguimiento SENA\\b0\\par
\\par
=========================================================================\\par
\\cf3\\fs14 Generado por el Sistema REPFORA-SENA - Documento Oficial Oficial Estandarizado Editable.\\cf0\\fs20\\par
}`;

  return Buffer.from(rtf, 'utf-8');
};

module.exports = {
  generarPdf,
  generarDoc,
};
