// storage.service.js   DEV 2 | Gestor de Almacenamiento en la Nube
// ==========================================================
// Selecciona dinámicamente entre Google Drive y Microsoft
// OneDrive basándose en la configuración de la base de datos.
// ==========================================================

const SystemConfig = require('../system-config-dev1/system-config.model');
const driveService = require('./drive.service');
const onedriveService = require('./onedrive.service');

/**
 * Obtiene el proveedor de almacenamiento en la nube activo
 * @returns {Promise<string>} 'GOOGLE_DRIVE' o 'ONEDRIVE'
 */
const getActiveProvider = async () => {
  try {
    const config = await SystemConfig.findOne({ clave: 'CLOUD_STORAGE_PROVIDER' });
    if (config && (config.valor === 'GOOGLE_DRIVE' || config.valor === 'ONEDRIVE')) {
      return config.valor;
    }
  } catch (err) {
    console.error('Error fetching CLOUD_STORAGE_PROVIDER config:', err);
  }
  return 'GOOGLE_DRIVE'; // Por defecto
};

/**
 * Crea la estructura de carpetas en el proveedor activo
 */
const crearEstructuraCarpetas = async (params) => {
  const provider = await getActiveProvider();
  console.log(`[STORAGE] Usando proveedor: ${provider} para crear estructura de carpetas.`);
  
  if (provider === 'ONEDRIVE') {
    return onedriveService.crearEstructuraCarpetas(params);
  }
  return driveService.crearEstructuraCarpetas(params);
};

/**
 * Sube un archivo al proveedor activo
 */
const subirDocumentoEP = async (fileBuffer, fileName, folderId) => {
  const provider = await getActiveProvider();
  console.log(`[STORAGE] Usando proveedor: ${provider} para subir archivo: ${fileName}.`);
  
  if (provider === 'ONEDRIVE') {
    return onedriveService.subirDocumentoEP(fileBuffer, fileName, folderId);
  }
  return driveService.subirDocumentoEP(fileBuffer, fileName, folderId);
};

module.exports = {
  getActiveProvider,
  crearEstructuraCarpetas,
  subirDocumentoEP,
};
