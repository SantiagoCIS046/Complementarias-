// googleDrive.js 📂 DEV 1 | Integración con la Nube
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Configuración de la cuenta de servicio
// NOTA: Debes poner tu archivo 'credentials.json' en backend/src/core/config/
const KEYFILE_PATH = path.join(__dirname, '../config/credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Crea una carpeta en Google Drive
 * @param {string} folderName Nombre de la carpeta (ej: el nombre del aprendiz)
 * @param {string} parentId ID de la carpeta padre (opcional)
 */
const createFolder = async (folderName, parentId = null) => {
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });

    console.log(`✅ Carpeta creada en Drive: ${folderName} (ID: ${folder.data.id})`);
    return folder.data.id;
  } catch (error) {
    console.error('❌ Error creando carpeta en Drive:', error.message);
    return null;
  }
};

/**
 * Sube un archivo a una carpeta específica
 */
const uploadFile = async (fileName, filePath, folderId) => {
  try {
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };
    const media = {
      mimeType: 'application/pdf', // O el tipo que necesites
      body: fs.createReadStream(filePath),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    return file.data.id;
  } catch (error) {
    console.error('❌ Error subiendo archivo a Drive:', error.message);
    return null;
  }
};

/**
 * Transfiere permisos de visualización entre usuarios
 * @param {string} fileId ID de la carpeta o archivo
 * @param {string} oldEmail Email del instructor que sale
 * @param {string} newEmail Email del instructor que entra
 */
const transferPermissions = async (fileId, oldEmail, newEmail) => {
  try {
    // 1. Dar permiso al nuevo
    await drive.permissions.create({
      fileId: fileId,
      resource: {
        role: 'reader', // o 'writer' si debe calificar
        type: 'user',
        emailAddress: newEmail,
      },
    });

    // 2. Buscar permiso del viejo para eliminarlo
    const res = await drive.permissions.list({ fileId: fileId });
    const permission = res.data.permissions.find(p => p.emailAddress === oldEmail);
    
    if (permission) {
      await drive.permissions.delete({
        fileId: fileId,
        permissionId: permission.id,
      });
    }

    console.log(`✅ Permisos transferidos: ${oldEmail} -> ${newEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error transfiriendo permisos:', error.message);
    return false;
  }
};

module.exports = { createFolder, uploadFile, transferPermissions };
