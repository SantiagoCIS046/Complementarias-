// companies.service.js   DEV 2 | Gestion de Empresas
// =============================================
// Logica de negocio para el CRUD de empresas.
// =============================================

const Company = require('./company.model');

/**
 * Crear una nueva empresa.
 */
const crear = async (data) => {
  // Verificar que no exista otra empresa con el mismo NIT
  const existe = await Company.findOne({ nit: data.nit });
  if (existe) {
    throw new Error('Ya existe una empresa registrada con el NIT: ' + data.nit);
  }

  const empresa = await Company.create(data);
  return empresa;
};

/**
 * Listar todas las empresas activas.
 */
const getAll = async (filtros = {}) => {
  const query = { activa: true };
  if (filtros.busqueda) {
    query.$or = [
      { razonSocial: { $regex: filtros.busqueda, $options: 'i' } },
      { nit: { $regex: filtros.busqueda, $options: 'i' } },
    ];
  }

  const empresas = await Company.find(query).sort({ razonSocial: 1 });
  return empresas;
};

/**
 * Obtener empresa por ID.
 */
const getById = async (id) => {
  const empresa = await Company.findById(id);
  if (!empresa) {
    throw new Error('Empresa no encontrada.');
  }
  return empresa;
};

/**
 * Actualizar datos de una empresa.
 */
const actualizar = async (id, data) => {
  const empresa = await Company.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!empresa) {
    throw new Error('Empresa no encontrada.');
  }

  return empresa;
};

module.exports = {
  crear,
  getAll,
  getById,
  actualizar,
};