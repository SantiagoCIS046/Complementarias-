// documents.controller.js   DEV 2 | Documentos de EP
// =============================================
// Controladores HTTP para el modulo de Documentos.
// Integrado con Google Drive (Modulo 3).
// =============================================

const service = require('./documents.service');

/**
 * POST /api/documents
 * Subir un documento a una EP (JSON con URL).
 * Body: { stageId, tipoDocumento, nombreArchivo, url }
 */
const subir = async (req, res) => {
  try {
    const { stageId, tipoDocumento, nombreArchivo, url } = req.body;

    if (!stageId || !tipoDocumento || !nombreArchivo || !url) {
      return res.status(400).json({
        success: false,
        message: 'Campos obligatorios: stageId, tipoDocumento, nombreArchivo, url.',
      });
    }

    const documento = await service.subir({
      stageId,
      tipoDocumento,
      nombreArchivo,
      url,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: documento,
    });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/documents/upload
 * Subir un archivo PDF directamente (multipart/form-data).
 * Form fields: stageId, tipoDocumento
 * File field: archivo (PDF)
 *
 * El archivo se envia a Google Drive y solo la URL
 * de visualizacion se guarda en la BD.
 */
const uploadToDrive = async (req, res) => {
  try {
    const { stageId, tipoDocumento } = req.body;

    if (!stageId || !tipoDocumento) {
      return res.status(400).json({
        success: false,
        message: 'Campos obligatorios: stageId, tipoDocumento.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Debe adjuntar un archivo PDF en el campo "archivo".',
      });
    }

    const documento = await service.subirConArchivo({
      stageId,
      tipoDocumento,
      userId: req.user._id,
      file: req.file,
    });

    res.status(201).json({
      success: true,
      data: documento,
      mensaje: 'Archivo subido a Google Drive y registrado en la BD.',
    });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/documents/stage/:stageId
 * Documentos de una EP especifica.
 */
const getByStage = async (req, res) => {
  try {
    const documentos = await service.getByStage(req.params.stageId);
    res.json({
      success: true,
      count: documentos.length,
      data: documentos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PATCH /api/documents/:id/review
 * Aprobar o rechazar un documento.
 * Body: { estado, observaciones? }
 */
const revisar = async (req, res) => {
  try {
    const { estado, observaciones } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El campo "estado" es obligatorio (APROBADO o RECHAZADO).',
      });
    }

    const documento = await service.revisarDocumento(req.params.id, {
      estado,
      observaciones,
      revisadoPor: req.user._id,
    });

    res.json({
      success: true,
      data: documento,
    });
  } catch (error) {
    const status = error.message.includes('no encontrado') ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/documents
 * Listar todos los documentos (admin).
 */
const getAll = async (req, res) => {
  try {
    const filtros = {};
    if (req.query.estado) filtros.estado = req.query.estado;
    if (req.query.tipoDocumento) filtros.tipoDocumento = req.query.tipoDocumento;

    const documentos = await service.getAll(filtros);
    res.json({
      success: true,
      count: documentos.length,
      data: documentos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const templateGenerator = require('./templates.generator');

/**
 * GET /api/documents/templates/download/:type/:format
 * Descarga las plantillas oficiales (bitácora o seguimiento) en PDF o DOCX.
 */
const downloadOfficialTemplate = async (req, res) => {
  try {
    const { type, format } = req.params;

    if (!['bitacora', 'seguimiento'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de plantilla debe ser "bitacora" o "seguimiento".',
      });
    }

    if (!['pdf', 'docx'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'El formato debe ser "pdf" o "docx".',
      });
    }

    const filename = type === 'bitacora' 
      ? `F-GFPI-023_Plantilla_Bitacora.${format}`
      : `F-GFPI-024_Plantilla_Seguimiento_Evaluacion.${format}`;

    if (format === 'pdf') {
      const buffer = await templateGenerator.generarPdf(type);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.send(buffer);
    } else {
      const buffer = templateGenerator.generarDoc(type);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.send(buffer);
    }
  } catch (error) {
    console.error('[downloadOfficialTemplate]', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar la plantilla oficial: ' + error.message,
    });
  }
};

/**
 * Genera un PDF de simulación interactivo en desarrollo
 */
const generateMockPdf = (res, filename) => {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="documento_simulado.pdf"');
  doc.pipe(res);
  
  // Encabezado
  doc.fillColor('#1A4D2E').fontSize(24).text('REPFORA - SENA', { align: 'center' });
  doc.moveDown(0.5);
  doc.fillColor('#333333').fontSize(14).text('MODO DESARROLLO / SIMULACIÓN', { align: 'center' });
  doc.moveDown(1.5);
  
  // Contenido
  doc.fontSize(12).fillColor('#000000').text('Este es un documento PDF simulado en modo desarrollo para representar el archivo:', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#2563EB').text(filename, { align: 'center', underline: true });
  doc.moveDown(1.5);
  
  doc.fillColor('#333333').fontSize(10).text(
    'Debido a que el servidor de desarrollo está ejecutándose sin credenciales reales de almacenamiento en la nube (Google Drive / OneDrive), los archivos cargados se simulan localmente.\n\n' +
    'Si este archivo fue subido antes de implementar el almacenamiento local, se muestra esta simulación en su lugar para permitir probar la experiencia del visor y la validación.',
    { align: 'justify', lineGap: 4 }
  );
  
  // Pie de página / Firma
  doc.moveDown(3);
  doc.rect(50, doc.y, 500, 80).fillOpacity(0.05).fill('#1A4D2E');
  doc.fillOpacity(1).fillColor('#1A4D2E').fontSize(10).text('VERIFICACIÓN DEL SISTEMA', 60, doc.y + 10, { bold: true });
  doc.fillColor('#555555').fontSize(9).text('Estado: SIMULADO OK\nFecha de generación: ' + new Date().toLocaleString(), 60, doc.y + 25);
  
  doc.end();
};

/**
 * GET /api/documents/view/:filename
 * Permite visualizar el documento en el visor PDF embebido (iframe)
 */
const viewFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const path = require('path');
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');

    // Decodificar dos veces para manejar codificación simple (%20) y doble (%2520)
    let decodedFilename = filename;
    try {
      decodedFilename = decodeURIComponent(decodeURIComponent(filename));
    } catch (e) {
      try {
        decodedFilename = decodeURIComponent(filename);
      } catch (err) {
        console.error('Error al decodificar nombre de archivo:', err);
      }
    }

    const filePath = path.join(uploadsDir, decodedFilename);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      return res.sendFile(filePath);
    }

    // Retrocompatibilidad: Generar un PDF simulado si no existe en disco
    generateMockPdf(res, decodedFilename);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al visualizar el archivo: ' + error.message,
    });
  }
};

/**
 * GET /api/documents/download/:filename
 * Descarga el documento
 */
const downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const path = require('path');
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');

    // Decodificar dos veces para manejar codificación simple (%20) y doble (%2520)
    let decodedFilename = filename;
    try {
      decodedFilename = decodeURIComponent(decodeURIComponent(filename));
    } catch (e) {
      try {
        decodedFilename = decodeURIComponent(filename);
      } catch (err) {
        console.error('Error al decodificar nombre de archivo en descarga:', err);
      }
    }

    const filePath = path.join(uploadsDir, decodedFilename);

    let originalName = decodedFilename;
    const match = decodedFilename.match(/^dev_(?:od_)?file_\d+_[a-z0-9]+_(.+)$/);
    if (match && match[1]) {
      originalName = match[1];
    }

    if (fs.existsSync(filePath)) {
      return res.download(filePath, originalName);
    }

    // Retrocompatibilidad: Generar PDF de descarga simulado
    generateMockPdf(res, originalName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al descargar el archivo: ' + error.message,
    });
  }
};

module.exports = {
  subir,
  uploadToDrive,
  getByStage,
  revisar,
  getAll,
  downloadOfficialTemplate,
  viewFile,
  downloadFile,
};