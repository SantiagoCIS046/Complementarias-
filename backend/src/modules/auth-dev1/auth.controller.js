// auth.controller.js   ?? DEV 1 | Autenticacion y seguridad
const service = require('./auth.service');

const getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll };