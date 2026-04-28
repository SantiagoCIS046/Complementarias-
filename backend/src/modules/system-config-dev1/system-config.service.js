// system-config.service.js   🟢 DEV 1 | Configuracion global del sistema
// =============================================
// Lógica de negocio para el manejo de
// configuraciones clave-valor del sistema.
// =============================================

const SystemConfig = require('./system-config.model');

/**
 * Listar todas las configuraciones activas.
 */
const getAll = async () => {
  const configs = await SystemConfig.find({ activo: true }).sort({ clave: 1 });
  return configs;
};

/**
 * Obtener una configuración por su clave.
 */
const getByClave = async (clave) => {
  const config = await SystemConfig.findOne({ clave: clave.toUpperCase() });
  if (!config) {
    throw new Error('Configuración no encontrada: ' + clave);
  }
  return config;
};

/**
 * Crear o actualizar una configuración (upsert).
 */
const upsert = async ({ clave, valor, descripcion }) => {
  const config = await SystemConfig.findOneAndUpdate(
    { clave: clave.toUpperCase() },
    {
      clave: clave.toUpperCase(),
      valor,
      descripcion: descripcion || '',
      activo: true,
    },
    { new: true, upsert: true, runValidators: true }
  );

  return config;
};

/**
 * Eliminar (desactivar) una configuración.
 */
const eliminar = async (clave) => {
  const config = await SystemConfig.findOneAndUpdate(
    { clave: clave.toUpperCase() },
    { activo: false },
    { new: true }
  );

  if (!config) {
    throw new Error('Configuración no encontrada: ' + clave);
  }
  return config;
};

module.exports = {
  getAll,
  getByClave,
  upsert,
  eliminar,
};