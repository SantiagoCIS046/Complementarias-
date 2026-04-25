// companies.controller.js   DEV 2 | Gestion de Empresas
// =============================================
// Controladores HTTP para el modulo de Empresas.
// =============================================

const service = require('./companies.service');

/**
 * POST /api/companies
 * Crear nueva empresa.
 */
const crear = async (req, res) => {
  try {
    const empresa = await service.crear(req.body);
    res.status(201).json({
      success: true,
      data: empresa,
    });
  } catch (error) {
    const status = error.message.includes('Ya existe') ? 409 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/companies
 * Listar empresas (con busqueda opcional via query ?busqueda=).
 */
const getAll = async (req, res) => {
  try {
    const filtros = {};
    if (req.query.busqueda) filtros.busqueda = req.query.busqueda;

    const empresas = await service.getAll(filtros);
    res.json({
      success: true,
      count: empresas.length,
      data: empresas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/companies/:id
 * Detalle de una empresa.
 */
const getById = async (req, res) => {
  try {
    const empresa = await service.getById(req.params.id);
    res.json({
      success: true,
      data: empresa,
    });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/companies/:id
 * Actualizar empresa.
 */
const actualizar = async (req, res) => {
  try {
    const empresa = await service.actualizar(req.params.id, req.body);
    res.json({
      success: true,
      data: empresa,
    });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  crear,
  getAll,
  getById,
  actualizar,
};