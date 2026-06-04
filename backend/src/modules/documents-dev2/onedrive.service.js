// onedrive.service.js   DEV 2 | Integración Microsoft OneDrive (Módulo 3)
// ==========================================================
// Servicio de conexión con Microsoft OneDrive.
// Usa credenciales de Azure Active Directory (MS Graph API)
// para crear carpetas y subir archivos.
//
// Estructura de carpetas en OneDrive:
// CARPETA_RAIZ/
//   INSTRUCTOR_NombreInstructor/
//     FICHA_123456/
//       APRENDIZ_DocAprendiz_NombreAprendiz/
//         BITACORAS/
//         DOCUMENTOS/
//
// Modo desarrollo: Si no hay credenciales, simula la creación
// de carpetas y el cargue de archivos retornando enlaces de prueba.
// ==========================================================

const https = require('https');
const { Readable } = require('stream');
const path = require('path');
const fs = require('fs');

const TENANT_ID = process.env.ONEDRIVE_TENANT_ID || '';
const CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.ONEDRIVE_CLIENT_SECRET || '';
const ROOT_FOLDER_ID = process.env.ONEDRIVE_ROOT_FOLDER_ID || 'root';

/**
 * Helper para realizar solicitudes HTTP con promesas usando la librería nativa https
 */
const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          // Ignorar si no es JSON
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          reject({
            statusCode: res.statusCode,
            error: parsed,
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

/**
 * Obtiene el token de acceso de MS Graph usando el flujo de credenciales de cliente
 */
const getAccessToken = async () => {
  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    return null; // Modo Desarrollo
  }

  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const postData = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope: 'https://graph.microsoft.com/.default',
  }).toString();

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const parsedUrl = new URL(tokenUrl);
  const reqOptions = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname,
    ...options,
  };

  const response = await makeRequest(reqOptions, postData);
  return response.access_token;
};

/**
 * Crea una carpeta en OneDrive
 * @param {string} nombre - Nombre de la carpeta
 * @param {string} parentId - ID de la carpeta padre (defecto root)
 * @returns {Object} { id, name, webViewLink }
 */
const crearCarpeta = async (nombre, parentId = null) => {
  const token = await getAccessToken();
  const parent = parentId || ROOT_FOLDER_ID;

  if (!token) {
    // Modo desarrollo: simular
    const fakeId = 'dev_od_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    console.log('[ONEDRIVE-DEV] Carpeta simulada: ' + nombre + ' (parent: ' + parent + ')');
    return {
      id: fakeId,
      name: nombre,
      webViewLink: 'https://onedrive.live.com/?id=' + fakeId,
    };
  }

  const pathUrl = `/v1.0/me/drive/items/${parent}/children`;
  const postData = JSON.stringify({
    name: nombre,
    folder: {},
    '@microsoft.graph.conflictBehavior': 'rename',
  });

  const options = {
    hostname: 'graph.microsoft.com',
    path: pathUrl,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const response = await makeRequest(options, postData);
  return {
    id: response.id,
    name: response.name,
    webViewLink: response.webUrl,
  };
};

/**
 * Sube un archivo a OneDrive
 * @param {Buffer} fileBuffer - Búfer de datos
 * @param {string} fileName - Nombre del archivo
 * @param {string} folderId - ID de la carpeta destino
 * @returns {Object} { id, name, webViewLink }
 */
const subirArchivo = async (fileBuffer, fileName, folderId) => {
  const token = await getAccessToken();
  const parent = folderId || ROOT_FOLDER_ID;

  if (!token) {
    // Modo desarrollo: simular
    const fakeId = 'dev_od_file_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    console.log('[ONEDRIVE-DEV] Archivo simulado: ' + fileName + ' -> carpeta ' + parent);
    
    try {
      const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, `${fakeId}_${fileName}`);
      fs.writeFileSync(filePath, fileBuffer);
      console.log(`[ONEDRIVE-DEV] Archivo guardado localmente en: ${filePath}`);
    } catch (err) {
      console.error('[ONEDRIVE-DEV] Error guardando archivo localmente:', err);
    }

    return {
      id: fakeId,
      name: fileName,
      webViewLink: `/api/documents/view/${fakeId}_${fileName}`,
    };
  }

  const encodedFileName = encodeURIComponent(fileName);
  const pathUrl = `/v1.0/me/drive/items/${parent}:/${encodedFileName}:/content`;

  const options = {
    hostname: 'graph.microsoft.com',
    path: pathUrl,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileBuffer.length,
    },
  };

  const response = await makeRequest(options, fileBuffer);
  return {
    id: response.id,
    name: response.name,
    webViewLink: response.webUrl,
  };
};

/**
 * Crea la estructura de carpetas en OneDrive
 */
const crearEstructuraCarpetas = async ({ instructorNombre, instructorFolderId, fichaNumero, aprendizDocumento, aprendizNombre }) => {
  let carpetaInstructor = null;
  let instructorId = instructorFolderId;

  if (instructorId) {
    // Si viene la carpeta pre-creada, usamos ese ID
    carpetaInstructor = {
      id: instructorId,
      name: 'INSTRUCTOR_' + instructorNombre.replace(/\s+/g, '_'),
      webViewLink: 'https://onedrive.live.com/?id=' + instructorId,
    };
  } else {
    // 1. Carpeta del instructor
    const nombreInstructor = 'INSTRUCTOR_' + instructorNombre.replace(/\s+/g, '_');
    carpetaInstructor = await crearCarpeta(nombreInstructor);
    instructorId = carpetaInstructor.id;
  }

  // 2. Carpeta de la ficha
  const nombreFicha = 'FICHA_' + fichaNumero;
  const carpetaFicha = await crearCarpeta(nombreFicha, instructorId);

  // 3. Carpeta del aprendiz
  const nombreAprendiz = aprendizDocumento + '_' + aprendizNombre.replace(/\s+/g, '_');
  const carpetaAprendiz = await crearCarpeta(nombreAprendiz, carpetaFicha.id);

  // 4. Subcarpetas
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
 * Sube un documento de certificación a OneDrive
 */
const subirDocumentoEP = async (fileBuffer, fileName, folderId) => {
  const resultado = await subirArchivo(fileBuffer, fileName, folderId);
  return {
    driveFileId: resultado.id,
    viewUrl: resultado.webViewLink,
    downloadUrl: resultado.webViewLink,
    fileName: resultado.name,
  };
};

/**
 * Mueve una carpeta a un nuevo directorio padre
 */
const moverCarpeta = async (itemId, newParentId) => {
  const token = await getAccessToken();
  if (!token) {
    console.log(`[ONEDRIVE-DEV] Carpeta movida: ${itemId} -> padre ${newParentId}`);
    return { id: itemId, parentId: newParentId };
  }

  const pathUrl = `/v1.0/me/drive/items/${itemId}`;
  const postData = JSON.stringify({
    parentReference: {
      id: newParentId
    }
  });

  const options = {
    hostname: 'graph.microsoft.com',
    path: pathUrl,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return await makeRequest(options, postData);
};

/**
 * Busca una carpeta por su nombre bajo un parentId en Microsoft OneDrive
 */
const buscarCarpetaPorNombre = async (nombre, parentId) => {
  const token = await getAccessToken();
  if (!token) {
    console.log(`[ONEDRIVE-DEV] Buscando carpeta simulada por nombre: ${nombre} bajo parentId: ${parentId}`);
    return null;
  }

  const parent = parentId || ROOT_FOLDER_ID;
  const encodedName = encodeURIComponent(nombre);
  const pathUrl = `/v1.0/me/drive/items/${parent}/children?$filter=name eq '${encodedName}'`;

  const options = {
    hostname: 'graph.microsoft.com',
    path: pathUrl,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };

  try {
    const response = await makeRequest(options);
    if (response.value && response.value.length > 0) {
      return {
        id: response.value[0].id,
        name: response.value[0].name,
        webViewLink: response.value[0].webUrl,
      };
    }
  } catch (err) {
    console.error('[ONEDRIVE SEARCH ERROR]', err);
  }
  return null;
};

module.exports = {
  crearCarpeta,
  subirArchivo,
  crearEstructuraCarpetas,
  subirDocumentoEP,
  moverCarpeta,
  buscarCarpetaPorNombre,
};
