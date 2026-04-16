// users.controller.js   ?? DEV 1 | Instructores y Aprendices
const service = require('./users.service');

const getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll };