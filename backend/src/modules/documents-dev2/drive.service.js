// drive.service.js   DEV 2 | Integracion Google Drive (Modulo 3)
// =============================================
// Servicio de conexion con Google Drive.
// Usa credenciales de cuenta de servicio (Service Account)
// para crear carpetas y subir archivos.
//
// Estructura de carpetas en Drive:
// CARPETA_RAIZ/
//   INSTRUCTOR_NombreInstructor/
//     FICHA_123456/
//       APRENDIZ_DocAprendiz_NombreAprendiz/
//         BITACORAS/
//         DOCUMENTOS/
//
// La base de datos solo guarda la URL de visualizacion,
// NO el archivo en si (MongoDB no es para PDFs pesados).
// =============================================

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

// Ruta al archivo de credenciales de la cuenta de servicio
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH
  || path.join(__dirname, '..', '..', '..', 'credentials', 'google-service-account.json');

// ID de la carpeta raiz del proyecto en Google Drive
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

/**
 * Crea una instancia autenticada de Google Drive API.
 * Usa credenciales de cuenta de servicio (Service Account).
 * @returns {Object} Instancia de drive (google.drive v3)
 */
const getDriveClient = () => {
  let auth;

  // Intentar cargar credenciales desde variable de entorno (JSON string)
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
  }
  // Intentar cargar desde archivo
  else if (fs.existsSync(CREDENTIALS_PATH)) {
    auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
  }
  // Modo desarrollo: retornar null (se usaran URLs simuladas)
  else {
    return null;
  }

  return google.drive({ version: 'v3', auth });
};

/**
 * Crea una carpeta en Google Drive.
 * @param {string} nombre   - Nombre de la carpeta
 * @param {string} parentId - ID de la carpeta padre
 * @returns {Object} { id, name, webViewLink }
 */
const crearCarpeta = async (nombre, parentId) => {
  const drive = getDriveClient();

  // Modo desarrollo: simular si no hay credenciales
  if (!drive) {
    const fakeId = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    console.log('[DRIVE-DEV] Carpeta simulada: ' + nombre + ' (parent: ' + parentId + ')');
    return {
      id: fakeId,
      name: nombre,
      webViewLink: 'https://drive.google.com/drive/folders/' + fakeId,
    };
  }

  const fileMetadata = {
    name: nombre,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : [],
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    fields: 'id, name, webViewLink',
  });

  // Hacer la carpeta accesible por enlace
  await drive.permissions.create({
    fileId: response.data.id,
    resource: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return response.data;
};

/**
 * Sube un archivo a Google Drive.
 * @param {Buffer|Stream} fileContent  - Contenido del archivo
 * @param {string}        fileName     - Nombre del archivo
 * @param {string}        mimeType     - Tipo MIME (ej: application/pdf)
 * @param {string}        folderId     - ID de la carpeta destino
 * @returns {Object} { id, name, webViewLink, webContentLink }
 */
const subirArchivo = async (fileContent, fileName, mimeType, folderId) => {
  const drive = getDriveClient();

  // Modo desarrollo: simular si no hay credenciales
  if (!drive) {
    const fakeId = 'dev_file_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    console.log('[DRIVE-DEV] Archivo simulado: ' + fileName + ' -> carpeta ' + folderId);
    return {
      id: fakeId,
      name: fileName,
      webViewLink: 'https://drive.google.com/file/d/' + fakeId + '/view',
      webContentLink: 'https://drive.google.com/uc?id=' + fakeId,
    };
  }

  // Convertir Buffer a Stream si es necesario
  let body;
  if (Buffer.isBuffer(fileContent)) {
    body = Readable.from(fileContent);
  } else {
    body = fileContent;
  }

  const fileMetadata = {
    name: fileName,
    parents: folderId ? [folderId] : [],
  };

  const media = {
    mimeType: mimeType,
    body: body,
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, webContentLink',
  });

  // Hacer el archivo accesible por enlace
  await drive.permissions.create({
    fileId: response.data.id,
    resource: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return response.data;
};

/**
 * Crea la estructura completa de carpetas para un aprendiz.
 * Estructura: CARPETA_RAIZ / INSTRUCTOR / FICHA / APRENDIZ / {BITACORAS, DOCUMENTOS}
 *
 * @param {Object} datos
 * @param {string} datos.instructorNombre  - Nombre del instructor
 * @param {string} datos.fichaNumero       - Numero de ficha
 * @param {string} datos.aprendizDocumento - Documento del aprendiz
 * @param {string} datos.aprendizNombre    - Nombre del aprendiz
 * @returns {Object} IDs de todas las carpetas creadas
 */
const crearEstructuraCarpetas = async ({ instructorNombre, fichaNumero, aprendizDocumento, aprendizNombre }) => {
  const rootId = ROOT_FOLDER_ID;

  // 1. Carpeta del instructor: INSTRUCTOR_NombreInstructor
  const nombreInstructor = 'INSTRUCTOR_' + instructorNombre.replace(/\s+/g, '_');
  const carpetaInstructor = await crearCarpeta(nombreInstructor, rootId);

  // 2. Carpeta de la ficha: FICHA_123456
  const nombreFicha = 'FICHA_' + fichaNumero;
  const carpetaFicha = await crearCarpeta(nombreFicha, carpetaInstructor.id);

  // 3. Carpeta del aprendiz: DocAprendiz_NombreAprendiz
  const nombreAprendiz = aprendizDocumento + '_' + aprendizNombre.replace(/\s+/g, '_');
  const carpetaAprendiz = await crearCarpeta(nombreAprendiz, carpetaFicha.id);

  // 4. Subcarpetas dentro del aprendiz
  const carpetaBitacoras = await crearCarpeta('BITACORAS', carpetaAprendiz.id);
  const carpetaDocumentos = await crearCarpeta('DOCUMENTOS', carpetaAprendiz.id);

  return {
    instructor: carpetaInstructor,
    ficha: carpetaFicha,
    aprendiz: carpetaAprendiz,
    bitacoras: carpetaBitacoras,
    documentos: carpetaDocumentos,
  };
};

/**
 * Sube un documento PDF a la carpeta DOCUMENTOS del aprendiz en Drive
 * y retorna la URL de visualizacion para guardar en la BD.
 *
 * @param {Buffer}  fileBuffer  - Contenido del archivo PDF
 * @param {string}  fileName    - Nombre del archivo
 * @param {string}  folderId    - ID de la carpeta DOCUMENTOS en Drive
 * @returns {Object} { driveFileId, viewUrl, downloadUrl, fileName }
 */
const subirDocumentoEP = async (fileBuffer, fileName, folderId) => {
  const resultado = await subirArchivo(
    fileBuffer,
    fileName,
    'application/pdf',
    folderId
  );

  return {
    driveFileId:  resultado.id,
    viewUrl:      resultado.webViewLink,
    downloadUrl:  resultado.webContentLink || resultado.webViewLink,
    fileName:     resultado.name,
  };
};

module.exports = {
  getDriveClient,
  crearCarpeta,
  subirArchivo,
  crearEstructuraCarpetas,
  subirDocumentoEP,
};
