// documents.controller.js   ?? DEV 2 | Documentos finales
const service = require('./documents.service');

const getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll };