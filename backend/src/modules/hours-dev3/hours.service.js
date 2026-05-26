// hours.service.js   🟡 DEV 3 | Contabilidad de horas
// =============================================
// Lógica de negocio para el registro y consulta
// de horas diarias del aprendiz.
// =============================================

const Hour            = require('./hour.model');
const ProductiveStage = require('../productive-stages-dev2/productive-stage.model');

/**
 * Registrar horas de un día.
 */
const registrar = async ({ stageId, apprenticeId, fecha, horaEntrada, horaSalida, horasTrabajadas, actividades }) => {
  // Verificar que la EP existe y está EN_CURSO
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }
  if (stage.estado !== 'EN_CURSO') {
    throw new Error('Solo se pueden registrar horas cuando la EP está EN_CURSO. Estado actual: ' + stage.estado);
  }

  const hora = await Hour.create({
    stageId,
    apprenticeId,
    fecha: fecha || new Date(),
    horaEntrada,
    horaSalida,
    horasTrabajadas,
    actividades: actividades || '',
  });

  return hora;
};

/**
 * Listar todos los registros de horas (con filtros).
 */
const getAll = async (filtros = {}) => {
  const query = {};
  if (filtros.stageId)      query.stageId = filtros.stageId;
  if (filtros.apprenticeId) query.apprenticeId = filtros.apprenticeId;
  if (filtros.isAdditionalHour !== undefined) {
    query.isAdditionalHour = filtros.isAdditionalHour === 'true' || filtros.isAdditionalHour === true;
  }

  const horas = await Hour.find(query)
    .populate('apprenticeId', 'name email documento')
    .populate('stageId', 'radicado estado')
    .populate('trackingId', 'numeroVisita fechaVisita esExtraordinario')
    .sort({ fecha: -1 });

  return horas;
};

/**
 * Obtener horas de una EP específica.
 */
const getByStage = async (stageId) => {
  const horas = await Hour.find({ stageId })
    .populate('apprenticeId', 'name email')
    .sort({ fecha: -1 });

  return horas;
};

/**
 * Obtener resumen de horas de una EP.
 */
const getResumen = async (stageId) => {
  const horas = await Hour.find({ stageId });

  const totalHoras = horas.reduce((sum, h) => sum + h.horasTrabajadas, 0);
  const totalDias  = horas.length;

  const stage = await ProductiveStage.findById(stageId);

  return {
    totalHoras,
    totalDias,
    horasRequeridas:  stage ? stage.horasRequeridas : 0,
    horasCompletadas: stage ? stage.horasCompletadas : 0,
    porcentaje: stage && stage.horasRequeridas > 0
      ? Math.min(100, Math.round((totalHoras / stage.horasRequeridas) * 100))
      : 0,
  };
};

/**
 * Actualizar estado de las horas adicionales.
 * RF-INS-13: Si el registro ya está cerrado (pendiente===false), es inmutable.
 */
const actualizarEstado = async (id, { ejecutado, cobrado, pendiente }) => {
  const hour = await Hour.findById(id);
  if (!hour) {
    throw new Error('Registro de horas no encontrado.');
  }

  // RF-INS-13: Bloqueo de edición. Un registro cerrado (pendiente===false) no puede modificarse.
  if (hour.pendiente === false) {
    throw new Error('Este registro de horas ya está cerrado (Ejecutada/Cobrada) y no puede modificarse.');
  }

  // RF-INS-19: Validaciones de estado para prevenir doble cobro y calcular horas automáticamente
  if (cobrado === true) {
    // Validar que esté ejecutado antes de poder ser cobrado
    const isEjecutado = ejecutado !== undefined ? ejecutado : hour.ejecutado;
    if (!isEjecutado) {
      throw new Error('No se puede cobrar un registro de horas que no ha sido ejecutado.');
    }

    // Validar si ya está cobrado para evitar cobro duplicado (doble cobro)
    if (hour.cobrado) {
      throw new Error('Este registro de horas ya ha sido cobrado.');
    }

    hour.cobrado = true;
    hour.pendiente = false; // Se cierra automáticamente al cobrarse
    hour.horasTrabajadas = 2.0; // Se calcula automáticamente
  } else if (cobrado === false) {
    hour.cobrado = false;
  }

  if (ejecutado !== undefined) {
    hour.ejecutado = ejecutado;
    // Cálculo automático de horas al marcar check de tarea hecha
    hour.horasTrabajadas = ejecutado ? 2.0 : 0.0;
  }

  if (pendiente !== undefined) {
    hour.pendiente = pendiente;
  }

  await hour.save();
  return hour;
};

/**
 * Obtener histórico de pagos agrupado por mes (RF-INS-17).
 * Aplica aislamiento de seguridad para Instructores.
 */
const obtenerHistoricoPagos = async ({ userId, userRole, filtroInstructorId }) => {
  const query = { isAdditionalHour: true };

  // Aislamiento de seguridad: si es INSTRUCTOR, solo puede ver sus propias visitas
  if (userRole === 'INSTRUCTOR') {
    const Tracking = require('../trackings-dev3/tracking.model');
    const trackings = await Tracking.find({ instructorId: userId }, '_id');
    const trackingIds = trackings.map(t => t._id);
    query.trackingId = { $in: trackingIds };
  } else if (userRole === 'ADMIN' && filtroInstructorId) {
    const Tracking = require('../trackings-dev3/tracking.model');
    const trackings = await Tracking.find({ instructorId: filtroInstructorId }, '_id');
    const trackingIds = trackings.map(t => t._id);
    query.trackingId = { $in: trackingIds };
  }

  const horas = await Hour.find(query)
    .populate('apprenticeId', 'name email documento ficha')
    .populate('stageId', 'radicado estado')
    .populate('trackingId', 'numeroVisita fechaVisita esExtraordinario instructorId')
    .sort({ fecha: -1 });

  const mesesMap = {};
  let globalCobradasCount = 0;
  let globalPendientesCount = 0;

  horas.forEach(h => {
    const fechaObj = new Date(h.fecha);
    const year = fechaObj.getFullYear();
    const mes = fechaObj.getMonth();
    const key = `${year}-${mes}`;

    if (h.cobrado) {
      globalCobradasCount++;
    } else {
      globalPendientesCount++;
    }

    const mesNombreStr = fechaObj.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const mesNombre = mesNombreStr.charAt(0).toUpperCase() + mesNombreStr.slice(1);

    if (!mesesMap[key]) {
      mesesMap[key] = {
        mesNombre,
        year,
        mes,
        totalHorasCobradas: 0,
        totalHorasPendientes: 0,
        cobradasCount: 0,
        pendientesCount: 0,
        detalles: []
      };
    }

    if (h.cobrado) {
      mesesMap[key].cobradasCount++;
      mesesMap[key].totalHorasCobradas += 2;
    } else {
      mesesMap[key].pendientesCount++;
      mesesMap[key].totalHorasPendientes += 2;
    }

    mesesMap[key].detalles.push({
      hourId: h._id,
      fecha: h.fecha,
      apprentice: {
        name: h.apprenticeId?.name || 'Desconocido',
        documento: h.apprenticeId?.documento || 'S/D',
        ficha: h.apprenticeId?.ficha || (h.stageId?.radicado ? 'S/F' : '---')
      },
      visitaNumero: h.trackingId?.numeroVisita || 'E',
      ejecutado: h.ejecutado,
      cobrado: h.cobrado,
      pendiente: h.pendiente
    });
  });

  const mesesArreglo = Object.values(mesesMap).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.mes - a.mes;
  });

  const resumenGlobal = {
    totalCobrado: globalCobradasCount * 2,
    totalPendiente: globalPendientesCount * 2,
    visitasEjecutadas: globalCobradasCount + globalPendientesCount
  };

  return {
    resumenGlobal,
    meses: mesesArreglo
  };
};

/**
 * Compila las horas del mes y año indicados agrupadas por red de conocimiento.
 * RF-INS-24: Compilación automática mensual de reporte.
 */
const compilarDatosMensuales = async (mes, anio) => {
  const parsedMes = parseInt(mes, 10);
  const parsedAnio = parseInt(anio, 10);
  if (isNaN(parsedMes) || parsedMes < 1 || parsedMes > 12) {
    throw new Error('El mes debe ser un número entre 1 y 12.');
  }
  if (isNaN(parsedAnio) || parsedAnio < 2000) {
    throw new Error('El año proporcionado no es válido.');
  }

  const start = new Date(parsedAnio, parsedMes - 1, 1);
  const end = new Date(parsedAnio, parsedMes, 1);

  const Hour = require('./hour.model');
  const horas = await Hour.find({
    fecha: { $gte: start, $lt: end }
  })
    .populate('apprenticeId', 'name email documento ficha programa areaConocimiento')
    .populate({
      path: 'stageId',
      populate: { path: 'instructorId', select: 'name email areaConocimiento' }
    });

  const redMap = {};

  horas.forEach(h => {
    const apprentice = h.apprenticeId;
    if (!apprentice) return;

    // Obtener red de conocimiento (areaConocimiento) con fallbacks
    const area = apprentice.areaConocimiento?.trim() || 
                 h.stageId?.instructorId?.areaConocimiento?.trim() || 
                 apprentice.programa?.trim() || 
                 'General';

    if (!redMap[area]) {
      redMap[area] = {
        areaNombre: area,
        aprendicesMap: {},
        totalEjecutadas: 0,
        totalCobradas: 0
      };
    }

    const appKey = apprentice._id.toString();
    if (!redMap[area].aprendicesMap[appKey]) {
      redMap[area].aprendicesMap[appKey] = {
        name: apprentice.name || 'Desconocido',
        documento: apprentice.documento || 'S/D',
        ficha: apprentice.ficha || 'S/F',
        programa: apprentice.programa || 'General',
        horasEjecutadas: 0,
        horasCobradas: 0
      };
    }

    const hasExecuted = h.ejecutado === true || h.isAdditionalHour !== true;
    const hasCharged = h.cobrado === true;

    if (hasExecuted) {
      redMap[area].aprendicesMap[appKey].horasEjecutadas += h.horasTrabajadas;
      redMap[area].totalEjecutadas += h.horasTrabajadas;
    }
    if (hasCharged) {
      redMap[area].aprendicesMap[appKey].horasCobradas += h.horasTrabajadas;
      redMap[area].totalCobradas += h.horasTrabajadas;
    }
  });

  const redList = Object.values(redMap).map(red => {
    const aprendices = Object.values(red.aprendicesMap);
    return {
      areaNombre: red.areaNombre,
      aprendices,
      totalEjecutadas: red.totalEjecutadas,
      totalCobradas: red.totalCobradas,
      numAprendices: aprendices.length
    };
  });

  return redList;
};

/**
 * Genera el documento PDF con horas ejecutadas y cobradas agrupadas por red de conocimiento.
 * Retorna una Promesa que resuelve a un Buffer con el PDF.
 */
const generarPdfReporteMensual = async (mes, anio) => {
  const datos = await compilarDatosMensuales(mes, anio);
  const nombreMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const nombreMes = nombreMeses[parseInt(mes, 10) - 1];

  const PDFDocument = require('pdfkit');

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- DISEÑO ESTÉTICO PREMIUM ---
      // Cabecera Institucional
      doc.rect(0, 0, 595, 20).fill('#1b5e20'); // Franja superior verde SENA
      doc.moveDown(1.5);

      doc.fontSize(22).fillColor('#1b5e20').font('Helvetica-Bold').text('REPFORA — SENA', { align: 'center' });
      doc.fontSize(14).fillColor('#475569').font('Helvetica').text('Reporte Mensual de Horas por Red de Conocimiento', { align: 'center' });
      doc.fontSize(10).fillColor('#64748b').text(`Período: ${nombreMes} de ${anio}`, { align: 'center' });
      doc.moveDown(1);

      // Línea divisora decorativa
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(1.5).stroke();
      doc.moveDown(1);

      // Calcular KPIs Globales
      let totalRedes = datos.length;
      let totalAprendices = 0;
      let globalEjecutadas = 0;
      let globalCobradas = 0;

      datos.forEach(r => {
        totalAprendices += r.numAprendices;
        globalEjecutadas += r.totalEjecutadas;
        globalCobradas += r.totalCobradas;
      });

      // Caja de KPIs Globales Premium
      const kpiY = doc.y;
      doc.rect(40, kpiY, 515, 65).fill('#f0fdf4');
      doc.rect(40, kpiY, 515, 65).strokeColor('#1b5e20').lineWidth(1).stroke();

      doc.fillColor('#1b5e20').font('Helvetica-Bold').fontSize(10);
      doc.text('CONSOLIDADO GLOBAL MENSUAL', 55, kpiY + 8);

      doc.fillColor('#334155').font('Helvetica').fontSize(9);
      doc.text(`Total Redes de Conocimiento: ${totalRedes}`, 55, kpiY + 24);
      doc.text(`Total Aprendices Reportados: ${totalAprendices}`, 55, kpiY + 38);

      doc.text(`Total Horas Ejecutadas: ${globalEjecutadas.toFixed(1)} hrs`, 320, kpiY + 24);
      doc.text(`Total Horas Cobradas: ${globalCobradas.toFixed(1)} hrs`, 320, kpiY + 38);

      doc.y = kpiY + 65;
      doc.moveDown(1.5);

      // Tabla Consolidada General por Red de Conocimiento
      doc.fillColor('#1b5e20').font('Helvetica-Bold').fontSize(12).text('Consolidado por Redes de Conocimiento', 40);
      doc.moveDown(0.5);

      const tableHeaderY = doc.y;
      doc.rect(40, tableHeaderY, 515, 20).fill('#f8fafc');
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9);
      doc.text('Red de Conocimiento', 48, tableHeaderY + 6, { width: 220 });
      doc.text('Aprendices', 270, tableHeaderY + 6, { width: 80, align: 'center' });
      doc.text('H. Ejecutadas', 350, tableHeaderY + 6, { width: 100, align: 'center' });
      doc.text('H. Cobradas', 450, tableHeaderY + 6, { width: 100, align: 'center' });

      let currentY = tableHeaderY + 20;

      if (datos.length === 0) {
        doc.rect(40, currentY, 515, 25).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#64748b').font('Helvetica').fontSize(9);
        doc.text('No hay registros de horas en este período.', 48, currentY + 8, { align: 'center', width: 500 });
        currentY += 25;
      } else {
        datos.forEach(r => {
          doc.rect(40, currentY, 515, 20).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
          doc.fillColor('#334155').font('Helvetica').fontSize(9);
          doc.text(r.areaNombre, 48, currentY + 6, { width: 220 });
          doc.text(r.numAprendices.toString(), 270, currentY + 6, { width: 80, align: 'center' });
          doc.text(r.totalEjecutadas.toFixed(1), 350, currentY + 6, { width: 100, align: 'center' });
          doc.text(r.totalCobradas.toFixed(1), 450, currentY + 6, { width: 100, align: 'center' });
          currentY += 20;
        });
      }

      doc.y = currentY;
      doc.moveDown(2);

      // Desglose Detallado por Red de Conocimiento
      datos.forEach(r => {
        // Nueva página para cada Red de Conocimiento si no cabe
        if (doc.y > 500) {
          doc.addPage();
          // Franja superior verde SENA en páginas subsiguientes
          doc.rect(0, 0, 595, 15).fill('#1b5e20');
          doc.moveDown(1);
        }

        doc.fillColor('#1b5e20').font('Helvetica-Bold').fontSize(12).text(`Detalle: ${r.areaNombre}`, 40);
        doc.moveDown(0.4);

        const subHeaderY = doc.y;
        doc.rect(40, subHeaderY, 515, 18).fill('#f0fdf4');
        doc.fillColor('#1b5e20').font('Helvetica-Bold').fontSize(8.5);
        doc.text('Aprendiz', 48, subHeaderY + 5, { width: 180 });
        doc.text('Documento', 230, subHeaderY + 5, { width: 80 });
        doc.text('Ficha', 310, subHeaderY + 5, { width: 70 });
        doc.text('H. Ejecutadas', 380, subHeaderY + 5, { width: 80, align: 'center' });
        doc.text('H. Cobradas', 460, subHeaderY + 5, { width: 80, align: 'center' });

        let appY = subHeaderY + 18;

        r.aprendices.forEach(app => {
          if (doc.y > 720) {
            doc.addPage();
            doc.rect(0, 0, 595, 15).fill('#1b5e20');
            doc.moveDown(1);
            appY = doc.y + 15;
          }

          doc.rect(40, appY, 515, 18).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
          doc.fillColor('#475569').font('Helvetica').fontSize(8);
          doc.text(app.name, 48, appY + 5, { width: 180 });
          doc.text(app.documento, 230, appY + 5, { width: 80 });
          doc.text(app.ficha, 310, appY + 5, { width: 70 });
          doc.text(app.horasEjecutadas.toFixed(1), 380, appY + 5, { width: 80, align: 'center' });
          doc.text(app.horasCobradas.toFixed(1), 460, appY + 5, { width: 80, align: 'center' });

          appY += 18;
          doc.y = appY;
        });

        // Totales de la sección
        doc.rect(40, appY, 515, 18).fill('#f8fafc');
        doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8);
        doc.text('TOTAL RED DE CONOCIMIENTO', 48, appY + 5, { width: 250 });
        doc.text(r.totalEjecutadas.toFixed(1), 380, appY + 5, { width: 80, align: 'center' });
        doc.text(r.totalCobradas.toFixed(1), 460, appY + 5, { width: 80, align: 'center' });

        doc.y = appY + 25;
        doc.moveDown(1.5);
      });

      // Pie de Página
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#94a3b8').font('Helvetica');
        doc.text(
          `Generado automáticamente por REPFORA el ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')} | Página ${i + 1} de ${pages.count}`,
          40,
          800,
          { align: 'center', width: 515 }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  registrar,
  getAll,
  getByStage,
  getResumen,
  actualizarEstado,
  obtenerHistoricoPagos,
  compilarDatosMensuales,
  generarPdfReporteMensual,
};