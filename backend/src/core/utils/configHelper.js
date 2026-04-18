const SystemConfig = require('../../modules/system-config-dev1/models/system-config.model');

// Caché en memoria para evitar consultas excesivas a la base de datos
let configCache = {};

/**
 * Precarga todas las configuraciones en memoria al arrancar el servidor
 */
const preload = async () => {
  try {
    const configs = await SystemConfig.find();
    configs.forEach(cfg => {
      configCache[cfg.key] = cfg.value;
    });
    console.log(`[ConfigHelper] ✅ ${configs.length} parámetros cargados en caché.`);
  } catch (error) {
    console.error('[ConfigHelper] ❌ Error al precargar configuraciones:', error.message);
  }
};

/**
 * Obtiene un valor de configuración
 * @param {String} key - La clave del parámetro (ej: 'MAX_LOGIN_ATTEMPTS')
 * @param {Any} defaultValue - Valor a retornar si no existe en BD
 */
const get = async (key, defaultValue = null) => {
  const upperKey = key.toUpperCase();
  
  // 1. Buscar en caché
  if (configCache[upperKey] !== undefined) {
    return configCache[upperKey];
  }

  // 2. Si no está en caché (bloqueo preventivo), buscar en base de datos
  try {
    const config = await SystemConfig.findOne({ key: upperKey });
    if (config) {
      configCache[upperKey] = config.value;
      return config.value;
    }
  } catch (error) {
    console.error(`[ConfigHelper] Error al obtener ${key}:`, error.message);
  }

  return defaultValue;
};

/**
 * Limpia la caché (útil si un administrador actualiza valores manualmente)
 */
const clearCache = () => {
  configCache = {};
  console.log('[ConfigHelper] 🧹 Caché de configuración limpiada.');
};

module.exports = {
  preload,
  get,
  clearCache
};
