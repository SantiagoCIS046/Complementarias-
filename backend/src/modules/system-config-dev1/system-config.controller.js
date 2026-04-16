// system-config.controller.js   ?? DEV 1 | Configuracion global del sistema
const service = require('./system-config.service');

const getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll };