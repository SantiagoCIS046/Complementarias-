// auth.controller.js   🟢 DEV 1 | Autenticacion y seguridad
// =============================================
// Controladores para el manejo de sesiones.
// =============================================

const service = require('./auth.service');
const { sendEmail } = require('../../core/utils/mailer');

/**
 * POST /api/auth/register
 */
const registrar = async (req, res) => {
  try {
    const data = await service.registrar(req.body);
    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const data = await service.login(req.body);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    const status = error.message.includes('inválidas') ? 401 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/auth/profile
 */
const getPerfil = async (req, res) => {
  try {
    const data = await service.getPerfil(req.user._id);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registrar,
  login,
  getPerfil,
};