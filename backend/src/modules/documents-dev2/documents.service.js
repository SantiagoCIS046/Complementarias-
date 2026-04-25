// documents.service.js   DEV 2 | Documentos de EP
// =============================================
// Logica de negocio para gestion de documentos
// asociados a Etapas Productivas.
// Integrado con Google Drive (Modulo 3).
// =============================================

const Document = require('./document.model');
const ProductiveStage = require('../productive-stages-dev2/productive-stage.model');
const driveService = require('./drive.service');
const { ESTADO_DOCUMENTO, TIPO_DOCUMENTO } = require('../../core/utils/enums');

/**
 * Subir un documento a una EP (con integracion Google Drive).
 * 1. Verifica que la EP existe
 * 2. Si hay archivo (buffer), lo sube a Google Drive
 * 3. Guarda solo la URL de visualizacion en la BD
 */
const subir = async ({ stageId, tipoDocumento, nombreArchivo, url, userId, fileBuffer }) => {
  // Verificar que la EP existe
  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  // Verificar tipo de documento valido
  if (!Object.values(TIPO_DOCUMENTO).includes(tipoDocumento)) {
    throw new Error('Tipo de documento no valido: ' + tipoDocumento);
  }

  let finalUrl = url || '';
  let driveFileId = null;

  // Si hay un archivo fisico, subirlo a Google Drive
  if (fileBuffer) {
    // Obtener la carpeta de documentos de Drive (si existe en la EP)
    const folderId = stage.driveFolders && stage.driveFolders.documentos
      ? stage.driveFolders.documentos
      : null;

    const driveResult = await driveService.subirDocumentoEP(
      fileBuffer,
      nombreArchivo,
      folderId
    );

    finalUrl = driveResult.viewUrl;
    driveFileId = driveResult.driveFileId;
  }

  // Verificar si ya existe un documento de este tipo para esta EP
  const existente = await Document.findOne({ stageId, tipoDocumento });
  if (existente) {
    // Actualizar el existente en vez de crear uno nuevo
    existente.nombreArchivo = nombreArchivo;
    existente.url = finalUrl;
    existente.driveFileId = driveFileId || existente.driveFileId;
    existente.estado = ESTADO_DOCUMENTO.PENDIENTE; // Resetear a pendiente
    existente.subidoPor = userId;
    existente.revisadoPor = null;
    existente.fechaRevision = null;
    existente.observaciones = '';
    await existente.save();
    return existente;
  }

  // Crear nuevo documento
  const documento = await Document.create({
    stageId,
    tipoDocumento,
    nombreArchivo,
    url: finalUrl,
    driveFileId,
    subidoPor: userId,
  });

  return documento;
};

/**
 * Subir un archivo PDF directamente a la carpeta de un aprendiz en Drive.
 * Endpoint dedicado para subir archivos con multipart/form-data.
 */
const subirConArchivo = async ({ stageId, tipoDocumento, userId, file }) => {
  if (!file) {
    throw new Error('No se recibio ningun archivo.');
  }

  const stage = await ProductiveStage.findById(stageId);
  if (!stage) {
    throw new Error('Etapa Productiva no encontrada.');
  }

  // Verificar tipo de documento valido
  if (!Object.values(TIPO_DOCUMENTO).includes(tipoDocumento)) {
    throw new Error('Tipo de documento no valido: ' + tipoDocumento);
  }

  // Determinar carpeta de destino en Drive
  const folderId = stage.driveFolders && stage.driveFolders.documentos
    ? stage.driveFolders.documentos
    : null;

  // Subir a Drive
  const driveResult = await driveService.subirDocumentoEP(
    file.buffer,
    file.originalname,
    folderId
  );

  // Guardar o actualizar en BD
  return await subir({
    stageId,
    tipoDocumento,
    nombreArchivo: file.originalname,
    url: driveResult.viewUrl,
    userId,
    fileBuffer: null, // Ya se subio arriba
  });
};

/**
 * Obtener documentos de una EP.
 */
const getByStage = async (stageId) => {
  const documentos = await Document.find({ stageId })
    .populate('subidoPor', 'name email')
    .populate('revisadoPor', 'name email')
    .sort({ tipoDocumento: 1 });

  return documentos;
};

/**
 * Aprobar o rechazar un documento.
 * Solo ADMIN o INSTRUCTOR pueden hacer esto.
 */
const revisarDocumento = async (documentId, { estado, observaciones, revisadoPor }) => {
  if (![ESTADO_DOCUMENTO.APROBADO, ESTADO_DOCUMENTO.RECHAZADO].includes(estado)) {
    throw new Error('Estado de revision debe ser APROBADO o RECHAZADO.');
  }

  const documento = await Document.findById(documentId);
  if (!documento) {
    throw new Error('Documento no encontrado.');
  }

  documento.estado = estado;
  documento.observaciones = observaciones || '';
  documento.revisadoPor = revisadoPor;
  documento.fechaRevision = new Date();

  await documento.save();
  return documento;
};

/**
 * Listar todos los documentos (para admin).
 */
const getAll = async (filtros = {}) => {
  const query = {};
  if (filtros.estado) query.estado = filtros.estado;
  if (filtros.tipoDocumento) query.tipoDocumento = filtros.tipoDocumento;

  const documentos = await Document.find(query)
    .populate('stageId', 'radicado estado')
    .populate('subidoPor', 'name email')
    .sort({ createdAt: -1 });

  return documentos;
};

module.exports = {
  subir,
  subirConArchivo,
  getByStage,
  revisarDocumento,
  getAll,
};