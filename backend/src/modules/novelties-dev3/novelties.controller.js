// novelties.controller.js   ?? DEV 3 | Novedades / Incidentes
const service = require('./novelties.service');

const getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll };