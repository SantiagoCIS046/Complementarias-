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
 * Crear múltiples empresas (Bulk)
 * Ignora las empresas que ya existan por NIT.
 */
const bulkCrear = async (empresasData) => {
  if (!Array.isArray(empresasData) || empresasData.length === 0) {
    throw new Error('No se proporcionaron datos de empresas para carga masiva.');
  }

  const creadas = [];
  const omitidas = [];

  for (const data of empresasData) {
    if (!data.nit || !data.razon_social) {
      omitidas.push({ data, motivo: 'Faltan campos obligatorios (nit, razon_social)' });
      continue;
    }

    const existe = await Company.findOne({ nit: data.nit });
    if (existe) {
      omitidas.push({ nit: data.nit, motivo: 'El NIT ya existe' });
    } else {
      try {
        // Asignar estado por defecto si no viene
        if(!data.estado) data.estado = 'HABILITADA';
        const empresa = await Company.create(data);
        creadas.push(empresa);
      } catch (err) {
        omitidas.push({ nit: data.nit, motivo: err.message });
      }
    }
  }

  return { creadas, omitidas };
};


/**
 * Listar todas las empresas.
 */
const getAll = async (filtros = {}) => {
  const query = {}; // Eliminamos activa: true ya que ahora usamos 'estado'
  
  if (filtros.busqueda) {
    query.$or = [
      { razon_social: { $regex: filtros.busqueda, $options: 'i' } },
      { nit: { $regex: filtros.busqueda, $options: 'i' } },
    ];
  }

  if (filtros.estado) {
    query.estado = filtros.estado;
  }

  const empresas = await Company.find(query).sort({ razon_social: 1 });
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
  bulkCrear,
  getAll,
  getById,
  actualizar,
};