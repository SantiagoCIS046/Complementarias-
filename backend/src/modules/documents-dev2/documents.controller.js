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

module.exports = {
  subir,
  uploadToDrive,
  getByStage,
  revisar,
  getAll,
};