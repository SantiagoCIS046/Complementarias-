// bitacoras.controller.js   ?? DEV 3 | Bitacoras / Evidencias
const service = require('./bitacoras.service');

const getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll };