// productive-stages.controller.js   ?? DEV 2 | Etapas Productivas
const service = require('./productive-stages.service');

const getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll };