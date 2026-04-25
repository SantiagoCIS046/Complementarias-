// companies.service.js   🔵 DEV 2 | Gestion de Empresas
const Company = require('./Company.model');

/**
 * Listar todas las empresas
 */
const getAll = async () => {
  return await Company.find().sort({ razonSocial: 1 });
};

module.exports = { getAll };